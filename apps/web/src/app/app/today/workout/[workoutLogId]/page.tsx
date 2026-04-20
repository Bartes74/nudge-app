import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkoutLogger } from '@/components/workout/WorkoutLogger'
import { GuidedWorkoutView } from '@/components/workout/GuidedWorkoutView'
import { normalizeGuidedSteps } from '@/lib/training/weekPlan'

type PlanExercise = {
  id: string
  order_num: number
  sets: number
  reps_min: number
  reps_max: number
  rir_target: number | null
  rest_seconds: number | null
  technique_notes: string | null
  exercise: {
    id: string
    slug: string
    name_pl: string
    primary_muscles: string[]
    secondary_muscles: string[]
    equipment_required: string[]
    alternatives_slugs: string[]
    technique_notes: string | null
  } | null
}

export default async function WorkoutLoggerPage({
  params,
}: {
  params: Promise<{ workoutLogId: string }>
}) {
  const { workoutLogId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Load the workout log + verify ownership
  const { data: log } = await supabase
    .from('workout_logs')
    .select('id, plan_workout_id, started_at, pre_mood, pre_energy')
    .eq('id', workoutLogId)
    .eq('user_id', user.id)
    .is('ended_at', null)
    .single()

  if (!log) notFound()

  if (!log.plan_workout_id) {
    // Ad-hoc workout — no plan exercises, show empty logger
    return (
      <WorkoutLogger
        workoutLogId={workoutLogId}
        planWorkoutId=""
        workoutName="Trening"
        planExercises={[]}
        exerciseCatalog={{}}
        previousPerformance={[]}
      />
    )
  }

  // Load plan workout + exercises
  const { data: planWorkout } = await supabase
    .from('plan_workouts')
    .select(`
      id, name, order_in_week, confidence_goal,
      plan_version:training_plan_versions!plan_workouts_plan_version_id_fkey (
        view_mode, adaptation_phase
      ),
      steps:plan_workout_steps (
        id, order_num, step_type, title, duration_min, instruction_text,
        setup_instructions, execution_steps, tempo_hint, breathing_hint,
        safety_notes, common_mistakes, starting_load_guidance, stop_conditions,
        machine_settings, substitution_policy,
        exercise:exercises!plan_workout_steps_exercise_id_fkey (
          id, slug, name_pl, plain_language_name
        )
      ),
      exercises:plan_exercises (
        id, order_num, sets, reps_min, reps_max, rir_target, rest_seconds, technique_notes,
        exercise:exercises!plan_exercises_exercise_id_fkey (
          id, slug, name_pl, primary_muscles, secondary_muscles,
          equipment_required, alternatives_slugs, technique_notes
        )
      )
    `)
    .eq('id', log.plan_workout_id)
    .single()

  if (!planWorkout) notFound()

  const viewMode =
    (planWorkout.plan_version as { view_mode?: string | null } | null)?.view_mode ?? null
  const guidedSteps = normalizeGuidedSteps(
    (planWorkout.steps as Parameters<typeof GuidedWorkoutView>[0]['steps'] | null) ?? [],
    planWorkout.order_in_week ?? 1,
  )

  if (viewMode === 'guided_beginner_view' || guidedSteps.length > 0) {
    return (
      <GuidedWorkoutView
        workoutLogId={workoutLogId}
        workoutName={planWorkout.name ?? 'Dzisiejszy spokojny trening'}
        steps={guidedSteps}
        preMood={log.pre_mood as 'bad' | 'ok' | 'good' | 'great' | null}
        preEnergy={log.pre_energy as 'low' | 'moderate' | 'high' | 'variable' | null}
      />
    )
  }

  const planExercises = (planWorkout.exercises as PlanExercise[]).sort(
    (a, b) => a.order_num - b.order_num,
  )

  // Load previous performance for each exercise (last session max weight + reps)
  const exerciseIds = planExercises
    .map((pe) => pe.exercise?.id)
    .filter((id): id is string => id != null)

  const { data: prevLogs } = exerciseIds.length > 0
    ? await supabase
        .from('workout_log_exercises')
        .select(`
          exercise_id,
          sets:workout_log_sets ( weight_kg, reps )
        `)
        .in('exercise_id', exerciseIds)
        .not('workout_log_id', 'eq', workoutLogId)
        .order('id', { ascending: false })
        .limit(exerciseIds.length * 5)
    : { data: [] }

  // Build previous performance map (most recent session per exercise)
  type PrevLog = { exercise_id: string; sets: Array<{ weight_kg: number | null; reps: number | null }> }
  const seenExercises = new Set<string>()
  const previousPerformance = (prevLogs as PrevLog[] ?? [])
    .filter((pl) => {
      if (seenExercises.has(pl.exercise_id)) return false
      seenExercises.add(pl.exercise_id)
      return true
    })
    .map((pl) => ({
      exerciseId: pl.exercise_id,
      maxWeight: pl.sets.reduce(
        (max, s) => (s.weight_kg != null && s.weight_kg > max ? s.weight_kg : max),
        0,
      ) || null,
      lastReps: pl.sets[pl.sets.length - 1]?.reps ?? null,
    }))

  // Build exercise catalog map (id → exercise)
  const exerciseCatalog = Object.fromEntries(
    planExercises
      .map((pe) => pe.exercise)
      .filter((e): e is NonNullable<typeof e> => e != null)
      .map((e) => [e.id, e]),
  )

  // Also load alternatives for all exercises (they're in alternatives_slugs)
  const altSlugs = planExercises
    .flatMap((pe) => pe.exercise?.alternatives_slugs ?? [])

  if (altSlugs.length > 0) {
    const { data: altExercises } = await supabase
      .from('exercises')
      .select('id, slug, name_pl, primary_muscles, secondary_muscles, equipment_required, alternatives_slugs, technique_notes')
      .in('slug', altSlugs)
      .eq('deprecated', false)

    for (const ex of altExercises ?? []) {
      exerciseCatalog[ex.id] = ex as typeof exerciseCatalog[string]
    }
  }

  return (
    <WorkoutLogger
      workoutLogId={workoutLogId}
      planWorkoutId={log.plan_workout_id}
      workoutName={planWorkout.name ?? 'Trening'}
      planExercises={planExercises}
      exerciseCatalog={exerciseCatalog}
      previousPerformance={previousPerformance}
    />
  )
}
