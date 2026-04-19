import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ArrowUp, ArrowDown, Minus, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { WeightChart } from '../WeightChart'
import { buildInterpolatedWeightSeries, buildWeightPointInputs, computeRollingAverage, computeTrend } from '../weightUtils'

export const metadata: Metadata = { title: 'Historia wagi' }

export default async function WeightProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [rowsResult, profileResult] = await Promise.all([
    supabase
      .from('body_measurements')
      .select('measured_at, weight_kg')
      .eq('user_id', user!.id)
      .not('weight_kg', 'is', null)
      .order('measured_at', { ascending: true })
      .limit(365),
    supabase
      .from('user_profile')
      .select('current_weight_kg, updated_at, onboarding_completed_at')
      .eq('user_id', user!.id)
      .maybeSingle(),
  ])

  const points = buildWeightPointInputs(rowsResult.data ?? [], profileResult.data)
  const dataWithRolling = computeRollingAverage(buildInterpolatedWeightSeries(points), 7)
  const trend = computeTrend(dataWithRolling)
  const latestWeight = points.length > 0 ? points[points.length - 1]!.weight_kg : null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app/progress"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Postępy
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Waga</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Trend</span>
          <br />
          <span className="font-sans font-semibold">masy ciała.</span>
        </h1>
      </header>

      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-label uppercase text-muted-foreground">Aktualna</span>
          {latestWeight != null ? (
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-data-xl tabular-nums tracking-tight text-foreground">
                {latestWeight.toFixed(1)}
              </span>
              <span className="text-body-m text-muted-foreground">kg</span>
            </div>
          ) : (
            <span className="font-mono text-data-xl tabular-nums text-muted-foreground">—</span>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 ring-1 ring-inset ring-border/70">
            {trend.direction === 'up' && <ArrowUp className="h-3.5 w-3.5 text-warning" />}
            {trend.direction === 'down' && <ArrowDown className="h-3.5 w-3.5 text-success" />}
            {trend.direction === 'stable' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="font-mono text-body-s tabular-nums font-medium">
              {trend.delta_kg > 0 ? '+' : ''}
              {trend.delta_kg.toFixed(1)} kg
            </span>
            <span className="text-label uppercase text-muted-foreground">7 dni</span>
          </div>
        )}
      </div>

      <Card variant="default" padding="md">
        <WeightChart data={dataWithRolling} />
      </Card>

      {points.length === 0 && (
        <Card variant="outline" padding="lg" className="flex flex-col items-center gap-3 text-center">
          <Scale className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-body-m font-semibold tracking-tight">Brak pomiarów</p>
          <p className="text-body-s text-muted-foreground">
            Pierwsze zważenie pojawi się tutaj.
          </p>
        </Card>
      )}

      <Button asChild size="lg" variant="outline" className="gap-2">
        <Link href="/app/nutrition/log-weight">
          <Scale className="h-4 w-4" />
          Zapisz wagę
        </Link>
      </Button>
    </div>
  )
}
