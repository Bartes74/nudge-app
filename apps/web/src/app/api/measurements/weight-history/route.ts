import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildInterpolatedWeightSeries,
  buildWeightPointInputs,
  computeRollingAverage,
  computeTrend,
  type WeightDataPoint,
  type WeightTrend,
} from '@/app/app/progress/weightUtils'

export type { WeightDataPoint, WeightTrend }

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [rowsResult, profileResult] = await Promise.all([
    supabase
      .from('body_measurements')
      .select('measured_at, weight_kg')
      .eq('user_id', user.id)
      .not('weight_kg', 'is', null)
      .order('measured_at', { ascending: true })
      .limit(365),
    supabase
      .from('user_profile')
      .select('current_weight_kg, updated_at, onboarding_completed_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (rowsResult.error) {
    return NextResponse.json({ error: 'Failed to load measurements' }, { status: 500 })
  }

  const points = buildWeightPointInputs(rowsResult.data ?? [], profileResult.data)
  const dataWithRolling = computeRollingAverage(buildInterpolatedWeightSeries(points), 7)
  const trend = computeTrend(dataWithRolling)

  return NextResponse.json({ data: dataWithRolling, trend })
}
