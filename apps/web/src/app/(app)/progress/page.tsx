import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Scale, ChevronRight } from 'lucide-react'
import { computeRollingAverage, computeTrend } from './weightUtils'

export const metadata: Metadata = { title: 'Postępy' }

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('body_measurements')
    .select('measured_at, weight_kg')
    .eq('user_id', user!.id)
    .not('weight_kg', 'is', null)
    .order('measured_at', { ascending: true })
    .limit(30)

  const points = (rows ?? []).map((r) => ({
    date: r.measured_at as string,
    weight_kg: Number(r.weight_kg),
  }))

  const dataWithRolling = computeRollingAverage(points, 7)
  const trend = computeTrend(dataWithRolling)
  const latestWeight = points.length > 0 ? points[points.length - 1]!.weight_kg : null

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Postępy</h1>

      <Link
        href="/app/progress/weight"
        className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Waga ciała</p>
            {latestWeight != null ? (
              <p className="text-sm text-muted-foreground">
                {latestWeight.toFixed(1)} kg
                {trend && (
                  <span className="ml-2">
                    {trend.direction === 'down' && '↓'}
                    {trend.direction === 'up' && '↑'}
                    {trend.direction === 'stable' && '→'}{' '}
                    {Math.abs(trend.delta_kg).toFixed(1)} kg / 7 dni
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Brak pomiarów</p>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <Link
        href="/app/plan/history"
        className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Historia treningów</p>
            <p className="text-sm text-muted-foreground">Logi i siłowe rekordy</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  )
}
