import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  color,
}: {
  label: string
  value: number
  target: number | null
  unit: string
  color: string
}) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const pct = target ? Math.min(value / target, 1) : 0
  const dash = pct * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span className="text-base font-bold tabular-nums leading-none">{Math.round(value)}</span>
      <span className="text-[11px] text-muted-foreground">{unit}</span>
      <span className="text-[11px] font-medium">{label}</span>
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
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dzisiaj</h1>
          <p className="text-sm capitalize text-muted-foreground">{todayFormatted}</p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/app/nutrition/log">
            <Plus className="h-4 w-4" />
            Dodaj
          </Link>
        </Button>
      </div>

      {/* Progress rings */}
      <section className="rounded-xl border bg-card p-5">
        <div className="grid grid-cols-4 gap-2">
          <ProgressRing
            label="kcal"
            value={kcal}
            target={targets?.calories_target ?? null}
            unit="kcal"
            color="hsl(var(--primary))"
          />
          <ProgressRing
            label="Białko"
            value={protein}
            target={targets?.protein_g_target ?? null}
            unit="g"
            color="#3b82f6"
          />
          <ProgressRing
            label="Węgle"
            value={carbs}
            target={targets?.carbs_g_target ?? null}
            unit="g"
            color="#f59e0b"
          />
          <ProgressRing
            label="Tłuszcze"
            value={fat}
            target={targets?.fat_g_target ?? null}
            unit="g"
            color="#ef4444"
          />
        </div>
        {targets?.calories_target && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Cel: {targets.calories_target} kcal / {targets.protein_g_target}g B /{' '}
            {targets.carbs_g_target}g W / {targets.fat_g_target}g T
          </p>
        )}
      </section>

      {/* Meal list */}
      <section>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Posiłki ({meals.length})
        </p>
        {meals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Brak posiłków dzisiaj. Dodaj pierwszy!
            </p>
            <Button asChild size="sm">
              <Link href="/app/nutrition/log">Dodaj posiłek</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {meals.map((meal) => (
              <Link
                key={meal.id}
                href={`/app/nutrition/log/${meal.id}`}
                className="flex items-center justify-between rounded-xl border bg-card p-3.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {meal.meal_type
                        ? (MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type)
                        : 'Posiłek'}
                    </span>
                    {meal.status === 'pending_analysis' && (
                      <Badge variant="secondary" className="text-xs">
                        Analizuję…
                      </Badge>
                    )}
                  </div>
                  {meal.kcal_estimate_min != null && meal.kcal_estimate_max != null && (
                    <p className="text-xs text-muted-foreground">
                      {Math.round(meal.kcal_estimate_min)}–
                      {Math.round(meal.kcal_estimate_max)} kcal
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
