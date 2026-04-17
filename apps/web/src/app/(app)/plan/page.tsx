import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Dumbbell, ChevronRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GeneratePlanButton } from './GeneratePlanButton'

export const metadata: Metadata = { title: 'Plan' }

const DAY_LABELS: Record<string, string> = {
  mon: 'Poniedziałek',
  tue: 'Wtorek',
  wed: 'Środa',
  thu: 'Czwartek',
  fri: 'Piątek',
  sat: 'Sobota',
  sun: 'Niedziela',
}

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plan } = await supabase
    .from('training_plans')
    .select(`
      id, name,
      current_version:training_plan_versions!training_plans_current_version_fk (
        id, week_structure, progression_rules, additional_notes,
        workouts:plan_workouts (
          id, day_label, order_in_week, name, duration_min_estimated,
          exercises:plan_exercises ( id )
        )
      )
    `)
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const version = plan?.current_version as {
    id: string
    week_structure: Record<string, string>
    progression_rules: { method: string; add_weight_kg: number; when: string } | null
    additional_notes: string | null
    workouts: Array<{
      id: string
      day_label: string
      order_in_week: number
      name: string
      duration_min_estimated: number
      exercises: Array<{ id: string }>
    }>
  } | null

  const sortedDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

  if (!version) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <h1 className="text-2xl font-semibold">Plan treningowy</h1>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
          <Dumbbell className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze planu. Wróć do zakładki &ldquo;Dziś&rdquo; i wygeneruj go.
          </p>
          <GeneratePlanButton />
        </div>
      </div>
    )
  }

  const workoutsByDay = Object.fromEntries(
    version.workouts.map((w) => [w.day_label, w]),
  )

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plan treningowy</h1>
        <Link href="/app/plan/history" className="text-xs text-muted-foreground underline underline-offset-2">
          Historia
        </Link>
      </div>

      {/* Week grid */}
      <div className="flex flex-col gap-2">
        {sortedDays.map((day) => {
          const workout = workoutsByDay[day]
          return (
            <div key={day}>
              {workout ? (
                <Link
                  href={`/app/plan/workout/${workout.id}`}
                  className="flex items-center justify-between rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">{DAY_LABELS[day] ?? day}</p>
                    <p className="font-semibold">{workout.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {workout.exercises.length} ćwiczeń
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {workout.duration_min_estimated} min
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ) : (
                <div className="flex items-center rounded-xl border border-dashed bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">{DAY_LABELS[day] ?? day}</p>
                  <p className="ml-4 text-sm text-muted-foreground/60">Odpoczynek</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progression rules */}
      {version.progression_rules && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Progresja</p>
          <p className="mt-1 text-sm">{version.progression_rules.when}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Metoda: {version.progression_rules.method} · +{version.progression_rules.add_weight_kg} kg
          </p>
        </div>
      )}

      {version.additional_notes && (
        <p className="text-sm text-muted-foreground">{version.additional_notes}</p>
      )}
    </div>
  )
}
