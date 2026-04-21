import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Scale } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { PageHero } from '@/components/layout/PageHero'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { buildWeightPointInputs } from '@/app/app/progress/weightUtils'
import { RecentMealsSection, type RecentMealRow } from '@/app/app/nutrition/RecentMealsSection'

export const metadata: Metadata = { title: 'Jedzenie' }

interface DailyTotals {
  kcal_total: number
  protein_g_total: number
  carbs_g_total: number
  fat_g_total: number
  meal_count: number
}

function MetricTile({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface-2 px-3 py-3">
      <span className="text-label uppercase text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-display-m tabular-nums tracking-tight text-foreground">
          {Math.round(value)}
        </span>
        <span className="text-body-s text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

export default async function NutritionPage() {
  const user = await getUser()
  if (!user) redirect('/signin')

  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const todayFormatted = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const [totalsResult, mealsResult, measurementsResult, profileResult] = await Promise.all([
    supabase
      .from('nutrition_daily_totals')
      .select('kcal_total, protein_g_total, carbs_g_total, fat_g_total, meal_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('meal_logs')
      .select('id, meal_type, status, note, kcal_estimate_min, kcal_estimate_max, created_at')
      .eq('user_id', user.id)
      .eq('logged_at', today)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('body_measurements')
      .select('weight_kg, measured_at')
      .eq('user_id', user.id)
      .not('weight_kg', 'is', null)
      .order('measured_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_profile')
      .select('current_weight_kg, updated_at, onboarding_completed_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const totals = totalsResult.data as DailyTotals | null
  const meals = (mealsResult.data ?? []) as RecentMealRow[]
  const weightPoints = buildWeightPointInputs(
    measurementsResult.data ? [measurementsResult.data] : [],
    profileResult.data,
  )
  const latestWeight = weightPoints.length > 0 ? weightPoints[weightPoints.length - 1]!.weight_kg : null
  const latestWeightDate = weightPoints.length > 0 ? weightPoints[weightPoints.length - 1]!.date : null
  const mealCount = totals?.meal_count ?? meals.length
  const mealCountLabel =
    mealCount === 1 ? 'posiłek' : mealCount > 1 && mealCount < 5 ? 'posiłki' : 'posiłków'

  return (
    <div className="flex flex-col gap-12">
      <PageHero
        eyebrow="Jedzenie"
        titleEmphasis="Twoje"
        titleMain="posiłki i waga."
        lede="Tu zapisujesz posiłki, sprawdzasz dzienne podsumowanie i śledzisz masę ciała."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button asChild size="hero" className="gap-2">
          <Link href="/app/nutrition/log">
            Dodaj posiłek
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="hero" variant="outline" className="gap-2">
          <Link href="/app/nutrition/log-weight">
            Zapisz wagę
            <Scale className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card variant="default" padding="md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardEyebrow>Dzisiaj</CardEyebrow>
            <p className="mt-2 text-body-s text-muted-foreground">
              <span className="capitalize">{todayFormatted}</span>
            </p>
          </div>
          <div className="rounded-full bg-surface-2 px-3 py-1 font-mono text-body-s tabular-nums text-foreground">
            {mealCount} {mealCountLabel}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MetricTile label="kcal" value={Number(totals?.kcal_total ?? 0)} unit="kcal" />
          <MetricTile label="Białko" value={Number(totals?.protein_g_total ?? 0)} unit="g" />
          <MetricTile label="Węgle" value={Number(totals?.carbs_g_total ?? 0)} unit="g" />
          <MetricTile label="Tłuszcze" value={Number(totals?.fat_g_total ?? 0)} unit="g" />
        </div>
        {mealCount === 0 && (
          <p className="mt-4 text-body-s text-muted-foreground">
            Nie masz jeszcze wpisów na dziś. Zacznij od zdjęcia albo ręcznego logu.
          </p>
        )}
      </Card>

      <RecentMealsSection initialMeals={meals} />

      <Card variant="default" padding="md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardEyebrow>Masa ciała</CardEyebrow>
            <h2 className="mt-2 text-display-s font-display tracking-tight text-foreground">
              Ostatni pomiar
            </h2>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/app/progress/weight">Trend</Link>
          </Button>
        </div>
        {latestWeight != null ? (
          <div className="mt-4 flex items-end gap-2">
            <span className="font-mono text-display-l tabular-nums tracking-tight text-foreground">
              {latestWeight.toFixed(1)}
            </span>
            <span className="pb-1 text-body-s text-muted-foreground">kg</span>
            <span className="ml-auto pb-1 font-mono text-body-s tabular-nums text-muted-foreground">
              {latestWeightDate
                ? new Date(`${latestWeightDate}T00:00:00`).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                  })
                : null}
            </span>
          </div>
        ) : (
          <p className="mt-4 text-body-s text-muted-foreground">
            Nie masz jeszcze zapisanego pomiaru. Dodaj wagę, żeby zacząć śledzić trend.
          </p>
        )}
      </Card>
    </div>
  )
}
