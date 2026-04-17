import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: plan, error } = await supabase
    .from('nutrition_plans')
    .select(`
      id, started_at,
      current_version:nutrition_plan_versions!nutrition_plans_current_version_fk (
        id, version_number, mode,
        calories_target, protein_g_target, fat_g_target, carbs_g_target,
        fiber_g_target, water_ml_target,
        meal_distribution, strategy_notes, practical_guidelines,
        supplement_recommendations, emergency_plan,
        change_reason, created_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ plan: null })
    return NextResponse.json({ error: 'Failed to load plan' }, { status: 500 })
  }

  return NextResponse.json({ plan })
}
