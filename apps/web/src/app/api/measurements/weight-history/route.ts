import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  computeRollingAverage,
  computeTrend,
  type WeightDataPoint,
  type WeightTrend,
} from '@/app/(app)/progress/weightUtils'

export type { WeightDataPoint, WeightTrend }

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('body_measurements')
    .select('measured_at, weight_kg')
    .eq('user_id', user.id)
    .not('weight_kg', 'is', null)
    .order('measured_at', { ascending: true })
    .limit(365)

  if (error) {
    return NextResponse.json({ error: 'Failed to load measurements' }, { status: 500 })
  }

  const points = (rows ?? []).map((r) => ({
    date: r.measured_at as string,
    weight_kg: Number(r.weight_kg),
  }))

  const dataWithRolling = computeRollingAverage(points, 7)
  const trend = computeTrend(dataWithRolling)

  return NextResponse.json({ data: dataWithRolling, trend })
}
