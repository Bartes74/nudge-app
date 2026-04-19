import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, ChevronRight, PenLine, Scale, UtensilsCrossed } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { buildWeightPointInputs } from '@/app/app/progress/weightUtils'

export const metadata: Metadata = { title: 'Jedzenie' }

interface DailyTotals {
  kcal_total: number
  protein_g_total: number
  carbs_g_total: number
  fat_g_total: number
  meal_count: number
}

interface MealRow {
  id: string
  meal_type: string | null
  status: 'pending_analysis' | 'analyzed' | 'failed' | 'manual'
  note: string | null
  kcal_estimate_min: number | null
  kcal_estimate_max: number | null
  created_at: string
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Śniadanie',
  lunch: 'Obiad',
  dinner: 'Kolacja',
  snack: 'Przekąska',
  drink: 'Napój',
  dessert: 'Deser',
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

function formatKcalRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Brak estymacji'
  if (min != null && max != null) {
    if (Math.round(min) === Math.round(max)) return `${Math.round(min)} kcal`
    return `${Math.round(min)}-${Math.round(max)} kcal`
  }

  const value = min ?? max
  return value == null ? 'Brak estymacji' : `${Math.round(value)} kcal`
}

function statusLabel(status: MealRow['status']): string {
  if (status === 'pending_analysis') return 'Analiza'
  if (status === 'failed') return 'Błąd'
  if (status === 'manual') return 'Ręcznie'
  return 'Gotowe'
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
  const meals = (mealsResult.data ?? []) as MealRow[]
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <header className="flex flex-col gap-3">
        <p className="text-label uppercase text-muted-foreground">Jedzenie</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Twoje</span>
          <br />
          <span className="font-sans font-semibold">logi i waga.</span>
        </h1>
        <p className="max-w-xl text-body-m text-muted-foreground">
          Tu zapisujesz posiłki, sprawdzasz dzienne podsumowanie i śledzisz masę ciała.
        </p>
      </header>

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

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-label uppercase text-muted-foreground">Dzisiejsze wpisy</p>
            <h2 className="mt-1 text-display-s font-display tracking-tight text-foreground">
              Ostatnie posiłki
            </h2>
          </div>
          <Link
            href="/app/nutrition/log"
            className="text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
          >
            Dodaj
          </Link>
        </div>

        {meals.length === 0 ? (
          <Card variant="recessed" padding="md" className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-muted text-brand">
                <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-body-m font-semibold tracking-tight text-foreground">
                  Dzisiaj jeszcze nic nie zapisano
                </p>
                <p className="text-body-s text-muted-foreground">
                  Możesz dodać zdjęcie posiłku albo wpisać składniki ręcznie.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link href="/app/nutrition/log/photo" className="group">
                <Card
                  variant="default"
                  padding="sm"
                  className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
                >
                  <span className="text-body-m font-semibold tracking-tight">Dodaj zdjęcie</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
                </Card>
              </Link>
              <Link href="/app/nutrition/log/manual" className="group">
                <Card
                  variant="default"
                  padding="sm"
                  className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
                >
                  <span className="text-body-m font-semibold tracking-tight">Wpisz ręcznie</span>
                  <PenLine className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
                </Card>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {meals.map((meal) => (
              <Link key={meal.id} href={`/app/nutrition/log/${meal.id}`} className="group">
                <Card
                  variant="default"
                  padding="sm"
                  className="flex items-center gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body-m font-semibold tracking-tight text-foreground">
                        {meal.meal_type ? (MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type) : 'Posiłek'}
                      </span>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {statusLabel(meal.status)}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-body-s tabular-nums text-muted-foreground">
                      {new Date(meal.created_at).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      <span className="mx-1.5 opacity-40">·</span>
                      {formatKcalRange(meal.kcal_estimate_min, meal.kcal_estimate_max)}
                    </p>
                    {meal.note && (
                      <p className="mt-1 truncate text-body-s text-muted-foreground">{meal.note}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

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
