import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, ChevronRight, Clock, Dumbbell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Trening' }

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
      id, name, day_label, duration_min_estimated, warmup_notes, cooldown_notes, confidence_goal,
      plan_version:training_plan_versions!plan_workouts_plan_version_id_fkey (
        view_mode
      ),
      steps:plan_workout_steps (
        id, order_num, title, duration_min, instruction_text
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

  // Verify ownership via training_plan chain
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
    ((workout.steps as Array<{ id: string; order_num: number; title: string; duration_min: number | null; instruction_text: string }> | null) ?? [])
      .sort((a, b) => a.order_num - b.order_num)

  if (viewMode === 'guided_beginner_view') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Link href="/app" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Dziś
          </Link>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{workout.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Spokojny trening prowadzony krok po kroku</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {workout.duration_min_estimated} min
          </Badge>
        </div>

        {workout.confidence_goal && (
          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            <span className="font-medium">Cel tej sesji: </span>
            {workout.confidence_goal}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {guidedSteps.map((step, index) => (
            <div key={step.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.instruction_text}</p>
                  {step.duration_min != null && (
                    <p className="mt-2 text-xs text-muted-foreground">około {step.duration_min} min</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link
          href={`/app/plan/workout/${id}/start`}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Dumbbell className="h-4 w-4" />
          Otwórz dzisiejszy spokojny trening
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Link href="/app/plan" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Plan
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{workout.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{exercises.length} ćwiczeń</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          {workout.duration_min_estimated} min
        </Badge>
      </div>

      {workout.warmup_notes && (
        <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          <span className="font-medium">Rozgrzewka: </span>{workout.warmup_notes}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {exercises.map((ex, idx) => (
          <Link
            key={ex.id}
            href={`/app/plan/exercise/${ex.exercise?.slug ?? ex.id}`}
            className="flex items-center justify-between rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {idx + 1}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{ex.exercise?.name_pl ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {ex.sets} serie · {ex.reps_min}–{ex.reps_max} reps · {ex.rest_seconds}s przerwy
                </p>
                {ex.technique_notes && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{ex.technique_notes}</p>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {workout.cooldown_notes && (
        <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          <span className="font-medium">Schłodzenie: </span>{workout.cooldown_notes}
        </div>
      )}

      <Link
        href={`/app/plan/workout/${id}/start`}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Dumbbell className="h-4 w-4" />
        Zacznij trening
      </Link>
    </div>
  )
}
