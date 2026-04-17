import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
): Promise<NextResponse> {
  const { date } = await params

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totalsResult, mealsResult] = await Promise.all([
    supabase
      .from('nutrition_daily_totals')
      .select('kcal_total, protein_g_total, carbs_g_total, fat_g_total, meal_count, updated_at')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle(),
    supabase
      .from('meal_logs')
      .select(
        'id, meal_type, status, note, kcal_estimate_min, kcal_estimate_max, confidence_score, created_at',
      )
      .eq('user_id', user.id)
      .eq('logged_at', date)
      .in('status', ['analyzed', 'manual', 'pending_analysis'])
      .order('created_at', { ascending: true }),
  ])

  return NextResponse.json({
    date,
    totals: totalsResult.data ?? null,
    meals: mealsResult.data ?? [],
  })
}
