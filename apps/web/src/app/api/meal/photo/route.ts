import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { inngest } from '@/inngest/client'
import { env } from '@/lib/env'

const RATE_LIMIT_PER_DAY = 6

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)

  // Rate limit check
  const { count } = await supabase
    .from('meal_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('source', 'photo')
    .eq('logged_at', today)

  if ((count ?? 0) >= RATE_LIMIT_PER_DAY) {
    return NextResponse.json(
      {
        error: 'Dzienny limit zdjęć osiągnięty',
        message: `Możesz dodać maksymalnie ${RATE_LIMIT_PER_DAY} zdjęć dziennie. Skorzystaj z opcji ręcznego wpisu.`,
      },
      { status: 429 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const file = formData.get('photo')
  const note = formData.get('note')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Field "photo" (File) is required' }, { status: 400 })
  }

  const noteText = typeof note === 'string' && note.trim() ? note.trim() : null

  // Upload to Supabase Storage (service role to bypass size policy quirks)
  const service = createServiceClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${user.id}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await service.storage
    .from('meal_photos')
    .upload(storagePath, bytes, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  // Create meal_log row (status: pending_analysis)
  const { data: mealLog, error: logError } = await supabase
    .from('meal_logs')
    .insert({
      user_id: user.id,
      logged_at: today,
      source: 'photo',
      status: 'pending_analysis',
      note: noteText,
    })
    .select('id')
    .single()

  if (logError || !mealLog) {
    return NextResponse.json(
      { error: `Failed to create meal log: ${logError?.message}` },
      { status: 500 },
    )
  }

  // Create meal_image row
  await supabase.from('meal_images').insert({
    meal_log_id: mealLog.id,
    user_id: user.id,
    storage_path: storagePath,
  })

  // Enqueue Inngest job
  await inngest.send({
    name: 'nudge/meal.photo.analyze',
    data: {
      meal_log_id: mealLog.id,
      user_id: user.id,
      storage_path: storagePath,
      note: noteText,
    },
  })

  return NextResponse.json({ meal_log_id: mealLog.id }, { status: 202 })
}
