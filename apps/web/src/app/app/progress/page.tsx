import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Scale, ChevronRight, ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Card, CardEyebrow } from '@/components/ui/card'
import { buildInterpolatedWeightSeries, buildWeightPointInputs, computeRollingAverage, computeTrend } from './weightUtils'

export const metadata: Metadata = { title: 'Postępy' }

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [rowsResult, profileResult] = await Promise.all([
    supabase
      .from('body_measurements')
      .select('measured_at, weight_kg')
      .eq('user_id', user!.id)
      .not('weight_kg', 'is', null)
      .order('measured_at', { ascending: true })
      .limit(30),
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
      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Przegląd</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Twoje</span>
          <br />
          <span className="font-sans font-semibold">postępy.</span>
        </h1>
      </header>

      <div className="flex flex-col gap-2.5">
        <Link href="/app/progress/weight" className="group">
          <Card
            variant="default"
            padding="md"
            className="flex items-center gap-4 transition-[border-color,background-color,transform] duration-200 ease-premium hover:border-foreground/30 hover:bg-surface-2/60 active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <CardEyebrow>Waga ciała</CardEyebrow>
              {latestWeight != null ? (
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-display-m tabular-nums tracking-tight text-foreground">
                    {latestWeight.toFixed(1)}
                  </span>
                  <span className="text-body-s text-muted-foreground">kg</span>
                  {trend && (
                    <span className="ml-1 inline-flex items-center gap-1 font-mono text-body-s tabular-nums text-muted-foreground">
                      {trend.direction === 'down' && <ArrowDown className="h-3 w-3" />}
                      {trend.direction === 'up' && <ArrowUp className="h-3 w-3" />}
                      {trend.direction === 'stable' && <Minus className="h-3 w-3" />}
                      {Math.abs(trend.delta_kg).toFixed(1)} kg · 7 dni
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-body-m text-muted-foreground">Brak pomiarów</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
          </Card>
        </Link>

        <Link href="/app/plan/history" className="group">
          <Card
            variant="default"
            padding="md"
            className="flex items-center gap-4 transition-[border-color,background-color,transform] duration-200 ease-premium hover:border-foreground/30 hover:bg-surface-2/60 active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <CardEyebrow>Historia treningów</CardEyebrow>
              <p className="mt-1 text-body-m font-medium tracking-tight">Logi i siłowe rekordy</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
          </Card>
        </Link>
      </div>
    </div>
  )
}
