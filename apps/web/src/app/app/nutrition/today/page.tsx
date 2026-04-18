import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardEyebrow } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Dzisiaj — jedzenie' }

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
  status: string
  note: string | null
  kcal_estimate_min: number | null
  kcal_estimate_max: number | null
  confidence_score: number | null
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

function ProgressRing({
  label,
  value,
  target,
  unit,
  tint,
}: {
  label: string
  value: number
  target: number | null
  unit: string
  tint: string
}) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const pct = target ? Math.min(value / target, 1) : 0
  const dash = pct * circumference

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
          <circle
            cx="38"
            cy="38"
            r={radius}
            fill="none"
            stroke="hsl(var(--surface-2))"
            strokeWidth="6"
          />
          <circle
            cx="38"
            cy="38"
            r={radius}
            fill="none"
            stroke={tint}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-body-m font-semibold tabular-nums leading-none text-foreground">
            {Math.round(value)}
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            {unit}
          </span>
        </div>
      </div>
      <span className="text-label uppercase text-muted-foreground">{label}</span>
    </div>
  )
}

export default async function NutritionTodayPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date().toISOString().slice(0, 10)

  const [totalsResult, mealsResult, planResult] = await Promise.all([
    supabase
      .from('nutrition_daily_totals')
      .select('kcal_total, protein_g_total, carbs_g_total, fat_g_total, meal_count')
      .eq('user_id', user!.id)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('meal_logs')
      .select(
        'id, meal_type, status, note, kcal_estimate_min, kcal_estimate_max, confidence_score, created_at',
      )
      .eq('user_id', user!.id)
      .eq('logged_at', today)
      .order('created_at', { ascending: true }),
    supabase
      .from('nutrition_plans')
      .select(
        `current_version:nutrition_plan_versions!nutrition_plans_current_version_fk (
          calories_target, protein_g_target, carbs_g_target, fat_g_target
        )`,
      )
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
  ])

  const totals = totalsResult.data as DailyTotals | null
  const meals = (mealsResult.data ?? []) as MealRow[]
  const targets = planResult.data?.current_version as {
    calories_target: number | null
    protein_g_target: number | null
    carbs_g_target: number | null
    fat_g_target: number | null
  } | null

  const kcal = totals?.kcal_total ?? 0
  const protein = Number(totals?.protein_g_total ?? 0)
  const carbs = Number(totals?.carbs_g_total ?? 0)
  const fat = Number(totals?.fat_g_total ?? 0)

  const todayFormatted = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">
            <span className="tabular-nums">{todayFormatted}</span>
          </p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-display italic text-muted-foreground">Dzisiaj —</span>
            <br />
            <span className="font-sans font-semibold">jedzenie.</span>
          </h1>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/app/nutrition/log">
            <Plus className="h-4 w-4" />
            Dodaj
          </Link>
        </Button>
      </header>

      <Card variant="default" padding="md">
        <CardEyebrow>Dzienne makro</CardEyebrow>
        <div className="mt-5 grid grid-cols-4 gap-2">
          <ProgressRing
            label="kcal"
            value={kcal}
            target={targets?.calories_target ?? null}
            unit="kcal"
            tint="hsl(var(--brand))"
          />
          <ProgressRing
            label="Białko"
            value={protein}
            target={targets?.protein_g_target ?? null}
            unit="g"
            tint="hsl(var(--success))"
          />
          <ProgressRing
            label="Węgle"
            value={carbs}
            target={targets?.carbs_g_target ?? null}
            unit="g"
            tint="hsl(var(--warning))"
          />
          <ProgressRing
            label="Tłuszcze"
            value={fat}
            target={targets?.fat_g_target ?? null}
            unit="g"
            tint="hsl(var(--foreground))"
          />
        </div>
        {targets?.calories_target && (
          <div className="mt-4 border-t border-border/60 pt-3">
            <p className="text-center font-mono text-body-s tabular-nums text-muted-foreground">
              Cel{' '}
              <span className="text-foreground">{targets.calories_target}</span> kcal
              <span className="mx-1.5 opacity-40">·</span>
              <span className="text-foreground">{targets.protein_g_target}</span>g B
              <span className="mx-1.5 opacity-40">·</span>
              <span className="text-foreground">{targets.carbs_g_target}</span>g W
              <span className="mx-1.5 opacity-40">·</span>
              <span className="text-foreground">{targets.fat_g_target}</span>g T
            </p>
          </div>
        )}
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="text-label uppercase text-muted-foreground">
            Posiłki <span className="font-mono tabular-nums text-foreground">{meals.length}</span>
          </p>
        </div>

        {meals.length === 0 ? (
          <Card variant="outline" padding="xl" className="flex flex-col items-center gap-4 text-center">
            <p className="text-body-m text-muted-foreground">
              Brak posiłków dzisiaj. Dodaj pierwszy.
            </p>
            <Button asChild size="sm">
              <Link href="/app/nutrition/log">Dodaj posiłek</Link>
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {meals.map((meal) => (
              <Link key={meal.id} href={`/app/nutrition/log/${meal.id}`} className="group">
                <Card
                  variant="default"
                  padding="sm"
                  className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-body-m font-semibold tracking-tight">
                        {meal.meal_type
                          ? (MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type)
                          : 'Posiłek'}
                      </span>
                      {meal.status === 'pending_analysis' && (
                        <Badge variant="label" className="px-2">
                          Analizuję…
                        </Badge>
                      )}
                    </div>
                    {meal.kcal_estimate_min != null && meal.kcal_estimate_max != null && (
                      <p className="mt-0.5 font-mono text-body-s tabular-nums text-muted-foreground">
                        {Math.round(meal.kcal_estimate_min)}–{Math.round(meal.kcal_estimate_max)} kcal
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
