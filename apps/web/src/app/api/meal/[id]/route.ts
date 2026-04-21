import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: mealLog, error } = await supabase
    .from('meal_logs')
    .select(`
      id, logged_at, meal_type, source, status, note,
      kcal_estimate_min, kcal_estimate_max,
      protein_g_min, protein_g_max,
      carbs_g_min, carbs_g_max,
      fat_g_min, fat_g_max,
      confidence_score, user_warnings, created_at,
      meal_log_items (
        id, label, portion_estimate, grams_estimate,
        kcal_estimate, protein_g, carbs_g, fat_g, is_user_corrected
      ),
      meal_images ( id, storage_path, uploaded_at )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !mealLog) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ mealLog })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: mealLog, error: mealLogError } = await supabase
    .from('meal_logs')
    .select(`
      id,
      meal_images (
        storage_path
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (mealLogError || !mealLog) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const mealImages = ((mealLog as {
    meal_images?: { storage_path: string }[] | null
  }).meal_images ?? [])
  const storagePaths = mealImages
    .map((image) => image.storage_path)
    .filter((path): path is string => typeof path === 'string' && path.length > 0)

  if (storagePaths.length > 0) {
    const service = createServiceClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const { error: storageError } = await service.storage
      .from('meal_photos')
      .remove(storagePaths)

    if (storageError) {
      return NextResponse.json(
        { error: 'Nie udało się usunąć zdjęcia posiłku.' },
        { status: 500 },
      )
    }
  }

  const { error: deleteError } = await supabase
    .from('meal_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json(
      { error: 'Nie udało się usunąć posiłku.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
