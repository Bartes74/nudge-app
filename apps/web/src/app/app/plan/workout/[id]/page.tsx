import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ArrowRight, ChevronRight, Clock, Dumbbell } from 'lucide-react'
import { PageHero, SectionHeader } from '@/components/layout/PageHero'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { normalizeGuidedSteps, workoutDisplayDuration } from '@/lib/training/weekPlan'

export const metadata: Metadata = { title: 'Trening' }

function guidedWorkoutDisplayName(name: string): string {
  if (/^spokojny trening wprowadzający/i.test(name)) {
    return 'Trening wprowadzający - przegląd'
  }

  return name
}

function guidedWorkoutGoal(goal: string | null): string {
  if (!goal) {
    return 'Celem tego treningu jest spokojnie zapoznać się z planem i zrobić pierwszy trening bez pośpiechu.'
  }

  if (goal.includes('miejscem') || goal.includes('tempem wizyty')) {
    return 'Celem tego treningu jest spokojnie wejść w plan, oswoić pierwszą wizytę i wiedzieć, co robić po kolei.'
  }

  return goal
}

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: workout } = await supabase
    .from('plan_workouts')
    .select(`
      id, name, day_label, order_in_week, duration_min_estimated, warmup_notes, cooldown_notes, confidence_goal,
      plan_version:training_plan_versions!plan_workouts_plan_version_id_fkey (
        view_mode
      ),
      steps:plan_workout_steps (
        id, order_num, step_type, title, duration_min, instruction_text
      ),
      exercises:plan_exercises (
        id, order_num, sets, reps_min, reps_max, rir_target, rest_seconds, technique_notes,
        exercise:exercises!plan_exercises_exercise_id_fkey (
          id, slug, name_pl, category, primary_muscles, is_compound, difficulty
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!workout) notFound()

  const { data: ownership } = await supabase
    .from('plan_workouts')
    .select(`
      plan_version:training_plan_versions!plan_workouts_plan_version_id_fkey (
        plan:training_plans!training_plan_versions_plan_id_fkey ( user_id )
      )
    `)
    .eq('id', id)
    .single()

  const ownerId = (ownership?.plan_version as { plan: { user_id: string } | null } | null)?.plan?.user_id
  if (ownerId !== user?.id) notFound()

  type PlanExercise = {
    id: string
    order_num: number
    sets: number
    reps_min: number
    reps_max: number
    rir_target: number
    rest_seconds: number
    technique_notes: string | null
    exercise: {
      id: string
      slug: string
      name_pl: string
      category: string
      primary_muscles: string[]
      is_compound: boolean
      difficulty: string
    } | null
  }

  const exercises = (workout.exercises as PlanExercise[]).sort((a, b) => a.order_num - b.order_num)
  const viewMode =
    (workout.plan_version as { view_mode?: string | null } | null)?.view_mode ?? null
  const guidedSteps =
    normalizeGuidedSteps(
      (((workout.steps as Array<{
        id: string
        order_num: number
        step_type: string
        title: string
        duration_min: number | null
        instruction_text: string
      }> | null) ?? [])
        .sort((a, b) => a.order_num - b.order_num)),
      workout.order_in_week ?? 1,
    )
      .map((step, index) => ({ ...step, order_num: index + 1 }))
  const guidedDuration = workoutDisplayDuration({
    order_in_week: workout.order_in_week ?? 1,
    duration_min_estimated: workout.duration_min_estimated ?? 0,
    steps: guidedSteps,
  })

  if (viewMode === 'guided_beginner_view') {
    return (
      <div className="flex flex-col gap-12">
        <Link
          href="/app/plan"
          className="inline-flex w-fit items-center gap-1.5 ds-label transition-colors hover:text-[var(--fg-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Plan
        </Link>

        <PageHero
          eyebrow="Dzisiejszy trening"
          titleMain={guidedWorkoutDisplayName(workout.name ?? 'Trening wprowadzający - przegląd')}
          lede="Poprowadzę Cię krok po kroku."
          meta={[{ label: 'Czas', value: `${guidedDuration} min` }]}
        />

        {(workout.confidence_goal || viewMode === 'guided_beginner_view') && (
          <Card variant="recessed" padding="lg">
            <CardEyebrow>Cel tego treningu</CardEyebrow>
            <p className="mt-3 text-body-l leading-relaxed text-balance text-foreground">
              {guidedWorkoutGoal(workout.confidence_goal)}
            </p>
          </Card>
        )}

        <section className="ds-section flex flex-col gap-3">
          <SectionHeader number="01 — Kroki" title="Przegląd treningu" />
          {guidedSteps.map((step, index) => (
            <Card key={step.id} variant="default" padding="md">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <span className="font-mono text-body-s font-semibold tabular-nums">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-body-m font-semibold tracking-tight">{step.title}</p>
                  <p className="mt-1 text-body-m text-muted-foreground leading-relaxed">
                    {step.instruction_text}
                  </p>
                  {step.duration_min != null && (
                    <p className="mt-2 text-label uppercase text-muted-foreground">
                      <span className="font-mono tabular-nums">około {step.duration_min}</span> min
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </section>

        <Button asChild size="hero" className="w-full gap-2">
          <Link href={`/app/plan/workout/${id}/start`}>
            <Dumbbell className="h-4 w-4" />
            Otwórz dzisiejszy trening
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12">
      <Link
        href="/app/plan"
        className="inline-flex w-fit items-center gap-1.5 ds-label transition-colors hover:text-[var(--fg-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Plan
      </Link>

      <PageHero
        eyebrow="Trening"
        titleMain={workout.name}
        meta={[
          { label: 'Czas', value: `${workout.duration_min_estimated} min` },
          { label: 'Ćwiczenia', value: exercises.length },
        ]}
      />

      {workout.warmup_notes && (
        <Card variant="recessed" padding="md">
          <CardEyebrow>Rozgrzewka</CardEyebrow>
          <p className="mt-2 text-body-m leading-relaxed text-foreground">
            {workout.warmup_notes}
          </p>
        </Card>
      )}

      <section className="ds-section flex flex-col gap-2.5">
        <SectionHeader number="01 — Ćwiczenia" title="Plan ćwiczeń" />
        {exercises.map((ex, idx) => (
          <Link
            key={ex.id}
            href={`/app/plan/exercise/${ex.exercise?.slug ?? ex.id}`}
            className="group"
          >
            <Card
              variant="default"
              padding="sm"
              className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                  <span className="font-mono text-body-s font-semibold tabular-nums text-muted-foreground">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-m font-semibold tracking-tight">
                    {ex.exercise?.name_pl ?? '—'}
                  </p>
                  <p className="mt-0.5 font-mono text-body-s tabular-nums text-muted-foreground">
                    {ex.sets}
                    <span className="mx-1 opacity-40">×</span>
                    {ex.reps_min}–{ex.reps_max}
                    <span className="mx-1.5 opacity-40">·</span>
                    RIR {ex.rir_target}
                    <span className="mx-1.5 opacity-40">·</span>
                    {ex.rest_seconds}s
                  </p>
                  {ex.technique_notes && (
                    <p className="mt-1 line-clamp-1 text-body-s text-muted-foreground/80">
                      {ex.technique_notes}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
            </Card>
          </Link>
        ))}
      </section>

      {workout.cooldown_notes && (
        <Card variant="recessed" padding="md">
          <CardEyebrow>Schłodzenie</CardEyebrow>
          <p className="mt-2 text-body-m leading-relaxed text-foreground">
            {workout.cooldown_notes}
          </p>
        </Card>
      )}

      <Button asChild size="hero" className="w-full gap-2">
        <Link href={`/app/plan/workout/${id}/start`}>
          <Dumbbell className="h-4 w-4" />
          Zacznij trening
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
