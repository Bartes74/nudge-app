import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WeightChart } from '../WeightChart'
import { computeRollingAverage, computeTrend } from '../weightUtils'

export const metadata: Metadata = { title: 'Historia wagi' }

export default async function WeightProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('body_measurements')
    .select('measured_at, weight_kg')
    .eq('user_id', user!.id)
    .not('weight_kg', 'is', null)
    .order('measured_at', { ascending: true })
    .limit(365)

  const points = (rows ?? []).map((r) => ({
    date: r.measured_at as string,
    weight_kg: Number(r.weight_kg),
  }))

  const dataWithRolling = computeRollingAverage(points, 7)
  const trend = computeTrend(dataWithRolling)
  const latestWeight = points.length > 0 ? points[points.length - 1]!.weight_kg : null

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/app/progress" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">Historia wagi</h1>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Aktualna waga</p>
          {latestWeight != null ? (
            <p className="text-3xl font-bold tabular-nums">
              {latestWeight.toFixed(1)}{' '}
              <span className="text-base font-normal text-muted-foreground">kg</span>
            </p>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
            {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-amber-500" />}
            {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
            {trend.direction === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm font-medium tabular-nums">
              {trend.delta_kg > 0 ? '+' : ''}
              {trend.delta_kg.toFixed(1)} kg
            </span>
            <span className="text-xs text-muted-foreground">7 dni</span>
          </div>
        )}
      </div>

      <section className="rounded-xl border bg-card p-4">
        <WeightChart data={dataWithRolling} />
      </section>

      {points.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
          <Scale className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium">Brak pomiarów wagi</p>
          <p className="text-xs text-muted-foreground">
            Pierwsze zważenie pojawi się tutaj.
          </p>
        </div>
      )}

      <Button asChild variant="outline" className="gap-2">
        <Link href="/app/nutrition/log-weight">
          <Scale className="h-4 w-4" />
          Zaloguj wagę
        </Link>
      </Button>
    </div>
  )
}
