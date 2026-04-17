import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
