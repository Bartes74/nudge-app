import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Dumbbell, ChevronRight, Clock, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardEyebrow } from '@/components/ui/card'
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

const DAY_SHORT: Record<string, string> = {
  mon: 'Pon',
  tue: 'Wt',
  wed: 'Śr',
  thu: 'Czw',
  fri: 'Pt',
  sat: 'Sb',
  sun: 'Nd',
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
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
        <header className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">Plan</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-sans font-semibold">Twój plan treningowy</span>
          </h1>
        </header>

        <Card variant="hero" padding="xl" className="animate-rise-in">
          <div className="flex flex-col items-start gap-5">
            <Dumbbell className="h-8 w-8 text-brand" aria-hidden="true" />
            <div className="flex flex-col gap-2">
              <p className="text-label uppercase text-muted-foreground">Brak aktywnego planu</p>
              <p className="text-display-m font-display text-balance">
                <span className="font-sans font-semibold">Jeszcze nie masz planu.</span>
              </p>
              <p className="text-body-m text-muted-foreground">
                Wróć do zakładki <span className="font-medium text-foreground">Dziś</span> i wygeneruj go
                — dopasujemy ćwiczenia do Twojego celu.
              </p>
            </div>
            <GeneratePlanButton />
          </div>
        </Card>
      </div>
    )
  }

  const workoutsByDay = Object.fromEntries(
    version.workouts.map((w) => [w.day_label, w]),
  )

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">Plan</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-display italic text-muted-foreground">Tydzień</span>
            <br />
            <span className="font-sans font-semibold">treningowy.</span>
          </h1>
        </div>
        <Link
          href="/app/plan/history"
          className="inline-flex shrink-0 items-center gap-1 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
        >
          Historia
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <section className="flex flex-col gap-2.5">
        {sortedDays.map((day) => {
          const workout = workoutsByDay[day]
          if (workout) {
            return (
              <Link
                key={day}
                href={`/app/plan/workout/${workout.id}`}
                className="group"
              >
                <Card
                  variant="default"
                  padding="sm"
                  className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-2 text-center">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {DAY_SHORT[day] ?? day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-m font-semibold tracking-tight">
                        {workout.name}
                      </p>
                      <p className="mt-0.5 text-body-s text-muted-foreground">
                        <span className="font-mono tabular-nums">{workout.exercises.length}</span> ćwiczeń
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline-warm" className="gap-1 font-mono tabular-nums">
                      <Clock className="h-3 w-3" />
                      {workout.duration_min_estimated} min
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
                  </div>
                </Card>
              </Link>
            )
          }
          return (
            <div
              key={day}
              className="flex items-center gap-4 rounded-xl border border-dashed border-border/60 px-4 py-3"
            >
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {DAY_SHORT[day] ?? day}
                </span>
              </div>
              <p className="text-body-s text-muted-foreground/70">Odpoczynek</p>
            </div>
          )
        })}
      </section>

      {version.progression_rules && (
        <Card variant="recessed" padding="md">
          <CardEyebrow>Progresja</CardEyebrow>
          <p className="mt-2 text-body-m leading-relaxed text-foreground">
            {version.progression_rules.when}
          </p>
          <p className="mt-1 text-body-s text-muted-foreground">
            <span className="font-mono tabular-nums">{version.progression_rules.method}</span>
            <span className="mx-1.5 opacity-40">·</span>
            <span className="font-mono tabular-nums">+{version.progression_rules.add_weight_kg} kg</span>
          </p>
        </Card>
      )}

      {version.additional_notes && (
        <p className="text-body-m text-muted-foreground leading-relaxed">
          {version.additional_notes}
        </p>
      )}
    </div>
  )
}
