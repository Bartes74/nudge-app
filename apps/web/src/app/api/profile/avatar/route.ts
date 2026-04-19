import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AVATAR_BUCKET = 'profile_avatars'
const MAX_AVATAR_SIZE_BYTES = 15 * 1024 * 1024
const MAX_AVATAR_SIZE_MB = 15
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

function getFileExtension(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension && extension.length <= 5) return extension
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/heic') return 'heic'
  if (file.type === 'image/heif') return 'heif'
  return 'jpg'
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Nie udało się odczytać pliku.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Wybierz zdjęcie.' }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Obsługujemy tylko pliki JPG, PNG, WEBP, HEIC i HEIF.' },
      { status: 400 },
    )
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Zdjęcie jest za duże. Maksymalny rozmiar to ${MAX_AVATAR_SIZE_MB} MB.` },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const extension = getFileExtension(file)
  const storagePath = `${user.id}/${Date.now()}.${extension}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    const isSizeLimitError = uploadError.message.includes('maximum allowed size')
    return NextResponse.json(
      {
        error: isSizeLimitError
          ? `Zdjęcie jest za duże. Maksymalny rozmiar to ${MAX_AVATAR_SIZE_MB} MB.`
          : 'Nie udało się zapisać zdjęcia profilowego.',
      },
      { status: isSizeLimitError ? 400 : 500 },
    )
  }

  const previousAvatarPath =
    typeof user.user_metadata?.['avatar_path'] === 'string'
      ? user.user_metadata['avatar_path']
      : null

  const {
    data: { publicUrl },
  } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath)

  const { data: updatedUser, error: metadataError } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      avatar_url: publicUrl,
      avatar_path: storagePath,
    },
  })

  if (metadataError) {
    await admin.storage.from(AVATAR_BUCKET).remove([storagePath])
    return NextResponse.json(
      { error: 'Nie udało się zapisać zdjęcia profilowego.' },
      { status: 500 },
    )
  }

  if (previousAvatarPath) {
    await admin.storage.from(AVATAR_BUCKET).remove([previousAvatarPath])
  }

  revalidatePath('/app', 'layout')
  revalidatePath('/app/profile')

  return NextResponse.json({
    avatar_url: updatedUser.user.user_metadata?.['avatar_url'] ?? publicUrl,
  })
}
