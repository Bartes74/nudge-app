import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@nudge/core/types/db'
import { createClient } from '@/lib/supabase/server'
import {
  DAY_ORDER,
  isDayLabel,
  normalizeGuidedSteps,
  trainingStreakWarning,
} from '@/lib/training/weekPlan'

const reorderSchema = z.object({
  assignments: z
    .array(
      z.object({
        dayLabel: z.string(),
        workoutId: z.string().uuid().nullable(),
      }),
    )
    .length(DAY_ORDER.length),
})

type StepRecord = {
  step_type: Database['public']['Enums']['guided_step_type']
  order_num: number
  title: string
  duration_min: number | null
  exercise_id: string | null
  instruction_text: string
  setup_instructions: string | null
  execution_steps: string[]
  tempo_hint: string | null
  breathing_hint: string | null
  safety_notes: string | null
  common_mistakes: string | null
  stop_conditions: string[]
  machine_settings: string | null
  substitution_policy: Database['public']['Tables']['plan_workout_steps']['Row']['substitution_policy']
  starting_load_guidance: string | null
  is_new_skill: boolean
}

type ExerciseRecord = {
  exercise_id: string | null
  order_num: number
  sets: number | null
  reps_min: number | null
  reps_max: number | null
  rir_target: number | null
  rest_seconds: number | null
  technique_notes: string | null
  substitute_exercise_ids: string[] | null
}

type WorkoutRecord = {
  id: string
  day_label: string | null
  order_in_week: number
  name: string | null
  duration_min_estimated: number | null
  warmup_notes: string | null
  cooldown_notes: string | null
  confidence_goal: string | null
  steps: StepRecord[] | null
  exercises: ExerciseRecord[] | null
}

type VersionRecord = {
  id: string
  version_number: number
  goal_snapshot: unknown
  assumptions_snapshot: unknown
  progression_rules: unknown
  additional_notes: string | null
  guided_mode: boolean
  adaptation_phase: Database['public']['Enums']['adaptation_phase'] | null
  view_mode: Database['public']['Enums']['plan_view_mode']
  workouts: WorkoutRecord[]
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = reorderSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowe dane układu tygodnia.' }, { status: 400 })
  }

  const assignments = parsed.data.assignments

  const hasExpectedDayOrder = assignments.every(
    (assignment, index) => isDayLabel(assignment.dayLabel) && assignment.dayLabel === DAY_ORDER[index],
  )

  if (!hasExpectedDayOrder) {
    return NextResponse.json({ error: 'Nieprawidłowa kolejność dni tygodnia.' }, { status: 400 })
  }

  const { data: plan, error: planError } = await supabase
    .from('training_plans')
    .select(`
      id,
      current_version:training_plan_versions!training_plans_current_version_fk (
        id, version_number, goal_snapshot, assumptions_snapshot, progression_rules,
        additional_notes, guided_mode, adaptation_phase, view_mode,
        workouts:plan_workouts (
          id, day_label, order_in_week, name, duration_min_estimated,
          warmup_notes, cooldown_notes, confidence_goal,
          steps:plan_workout_steps (
            step_type, order_num, title, duration_min, exercise_id,
            instruction_text, setup_instructions, execution_steps, tempo_hint,
            breathing_hint, safety_notes, common_mistakes, stop_conditions,
            machine_settings, substitution_policy, starting_load_guidance, is_new_skill
          ),
          exercises:plan_exercises (
            exercise_id, order_num, sets, reps_min, reps_max, rir_target,
            rest_seconds, technique_notes, substitute_exercise_ids
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (planError || !plan?.current_version) {
    return NextResponse.json({ error: 'Nie udało się odczytać aktywnego planu.' }, { status: 500 })
  }

  const currentVersion = plan.current_version as VersionRecord
  const currentWorkoutIds = currentVersion.workouts.map((workout) => workout.id)
  const assignedWorkoutIds = assignments
    .map((assignment) => assignment.workoutId)
    .filter((workoutId): workoutId is string => workoutId != null)

  if (new Set(assignedWorkoutIds).size !== assignedWorkoutIds.length) {
    return NextResponse.json({ error: 'Ten sam trening został przypisany więcej niż raz.' }, { status: 400 })
  }

  const allWorkoutsAssigned =
    assignedWorkoutIds.length === currentWorkoutIds.length &&
    currentWorkoutIds.every((workoutId) => assignedWorkoutIds.includes(workoutId))

  if (!allWorkoutsAssigned) {
    return NextResponse.json({ error: 'Każdy trening musi pozostać przypisany do jednego dnia.' }, { status: 400 })
  }

  const weekChanged = assignments.some((assignment) => {
    const workout = currentVersion.workouts.find((item) => item.id === assignment.workoutId)
    return (workout?.day_label ?? null) !== assignment.dayLabel && assignment.workoutId != null
  })

  if (!weekChanged) {
    return NextResponse.json({ ok: true, warning: trainingStreakWarning(assignments) })
  }

  const workoutById = new Map(currentVersion.workouts.map((workout) => [workout.id, workout]))
  const weekStructure = Object.fromEntries(
    assignments.flatMap((assignment) => {
      if (!assignment.workoutId) return []
      const workout = workoutById.get(assignment.workoutId)
      if (!workout) return []
      return [[assignment.dayLabel, `session_${workout.order_in_week}`]]
    }),
  )

  const nextVersion: Database['public']['Tables']['training_plan_versions']['Insert'] = {
    plan_id: plan.id,
    version_number: currentVersion.version_number + 1,
    change_reason: 'Przeniesiono treningi między dniami tygodnia.',
    goal_snapshot: currentVersion.goal_snapshot as Database['public']['Tables']['training_plan_versions']['Insert']['goal_snapshot'],
    assumptions_snapshot:
      currentVersion.assumptions_snapshot as Database['public']['Tables']['training_plan_versions']['Insert']['assumptions_snapshot'],
    progression_rules:
      currentVersion.progression_rules as Database['public']['Tables']['training_plan_versions']['Insert']['progression_rules'],
    week_structure: weekStructure,
    additional_notes: currentVersion.additional_notes,
    guided_mode: currentVersion.guided_mode,
    adaptation_phase: currentVersion.adaptation_phase,
    view_mode: currentVersion.view_mode,
  }

  const { data: insertedVersion, error: versionError } = await supabase
    .from('training_plan_versions')
    .insert(nextVersion)
    .select('id')
    .single()

  if (versionError || !insertedVersion) {
    return NextResponse.json({ error: 'Nie udało się zapisać nowej wersji planu.' }, { status: 500 })
  }

  for (const assignment of assignments) {
    if (!assignment.workoutId) continue

    const workout = workoutById.get(assignment.workoutId)
    if (!workout) continue

    const { data: insertedWorkout, error: workoutError } = await supabase
      .from('plan_workouts')
      .insert({
        plan_version_id: insertedVersion.id,
        day_label: assignment.dayLabel,
        order_in_week: workout.order_in_week,
        name: workout.name,
        duration_min_estimated: workout.duration_min_estimated,
        warmup_notes: workout.warmup_notes,
        cooldown_notes: workout.cooldown_notes,
        confidence_goal: workout.confidence_goal,
      })
      .select('id')
      .single()

    if (workoutError || !insertedWorkout) {
      return NextResponse.json({ error: 'Nie udało się przepisać treningów do nowej wersji.' }, { status: 500 })
    }

    const normalizedSteps = normalizeGuidedSteps(workout.steps, workout.order_in_week)

    if (normalizedSteps.length > 0) {
      const stepRows: Database['public']['Tables']['plan_workout_steps']['Insert'][] = normalizedSteps.map((step, index) => ({
        plan_workout_id: insertedWorkout.id,
        step_type: step.step_type,
        order_num: index + 1,
        title: step.title,
        duration_min: step.duration_min,
        exercise_id: step.exercise_id,
        instruction_text: step.instruction_text,
        setup_instructions: step.setup_instructions,
        execution_steps: step.execution_steps,
        tempo_hint: step.tempo_hint,
        breathing_hint: step.breathing_hint,
        safety_notes: step.safety_notes,
        common_mistakes: step.common_mistakes,
        stop_conditions: step.stop_conditions,
        machine_settings: step.machine_settings,
        substitution_policy: step.substitution_policy,
        starting_load_guidance: step.starting_load_guidance,
        is_new_skill: step.is_new_skill,
      }))

      const { error: stepsError } = await supabase.from('plan_workout_steps').insert(stepRows)
      if (stepsError) {
        return NextResponse.json({ error: 'Nie udało się przepisać kroków treningu.' }, { status: 500 })
      }
    }

    const exerciseRows: Database['public']['Tables']['plan_exercises']['Insert'][] =
      workout.exercises?.map((exercise) => ({
        plan_workout_id: insertedWorkout.id,
        exercise_id: exercise.exercise_id,
        order_num: exercise.order_num,
        sets: exercise.sets,
        reps_min: exercise.reps_min,
        reps_max: exercise.reps_max,
        rir_target: exercise.rir_target,
        rest_seconds: exercise.rest_seconds,
        technique_notes: exercise.technique_notes,
        substitute_exercise_ids: exercise.substitute_exercise_ids ?? [],
      })) ?? []

    if (exerciseRows.length > 0) {
      const { error: exercisesError } = await supabase.from('plan_exercises').insert(exerciseRows)
      if (exercisesError) {
        return NextResponse.json({ error: 'Nie udało się przepisać ćwiczeń.' }, { status: 500 })
      }
    }
  }

  const { error: planUpdateError } = await supabase
    .from('training_plans')
    .update({ current_version_id: insertedVersion.id })
    .eq('id', plan.id)

  if (planUpdateError) {
    return NextResponse.json({ error: 'Nie udało się ustawić nowej wersji jako aktualnej.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    warning: trainingStreakWarning(assignments),
  })
}
