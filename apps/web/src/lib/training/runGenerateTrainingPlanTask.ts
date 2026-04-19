import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { evaluateGuardrails, hasBlockingGuardrail } from '@nudge/core/rules/guardrails'
import { selectTemplate } from '@nudge/core/planners/training/selectTemplate'
import { fillTemplate } from '@nudge/core/planners/training/fillTemplate'
import { generateGuidedBeginnerPlan } from '@nudge/core/planners/training/generateGuidedBeginnerPlan'
import { logLlmCall } from '@nudge/core/llm/client'
import type { PlannerProfile, ExerciseCatalogEntry, GuidedTrainingPlanOutput, TrainingPlanOutput } from '@nudge/core/planners/training/types'
import type { GuardrailProfile, GuardrailContext } from '@nudge/core/rules/guardrails'

function serviceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

type StepRunner = <T>(name: string, fn: () => Promise<T>) => Promise<T>

const runImmediately: StepRunner = async (_name, fn) => fn()

type RunGenerateTrainingPlanTaskInput = {
  taskId: string
  userId: string
  runStep?: StepRunner
}

export async function runGenerateTrainingPlanTask({
  taskId,
  userId,
  runStep = runImmediately,
}: RunGenerateTrainingPlanTaskInput): Promise<{ success: boolean; plan_version_id?: string; blocked?: boolean; reasons?: string[] }> {
  const supabase = serviceClient()

  await runStep('mark-running', async () => {
    await supabase
      .from('ai_tasks')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', taskId)
  })

  const { profile, equipment, health, goal } = await runStep('load-profile', async () => {
    const [profileRes, equipmentRes, healthRes, goalRes] = await Promise.all([
      supabase.from('user_profile').select('*').eq('user_id', userId).single(),
      supabase.from('user_equipment').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_health').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_goals').select('*').eq('user_id', userId).eq('is_current', true).maybeSingle(),
    ])

    if (profileRes.error || !profileRes.data) {
      throw new Error(`Failed to load profile for user ${userId}: ${profileRes.error?.message}`)
    }

    return {
      profile: profileRes.data,
      equipment: equipmentRes.data,
      health: healthRes.data,
      goal: goalRes.data,
    }
  })

  const guardrailResult = await runStep('evaluate-guardrails', async () => {
    const birthYear = profile.birth_date
      ? new Date(profile.birth_date as string).getFullYear()
      : null
    const age = birthYear ? new Date().getFullYear() - birthYear : null

    const guardrailProfile: GuardrailProfile = {
      age,
      gender: profile.gender as GuardrailProfile['gender'],
      weight_kg: profile.current_weight_kg ? Number(profile.current_weight_kg) : null,
      height_cm: profile.height_cm ? Number(profile.height_cm) : null,
      is_pregnant: null,
    }

    const guardrailContext: GuardrailContext = {
      planned_calories: null,
      recent_weights: null,
    }

    const results = evaluateGuardrails(guardrailProfile, guardrailContext)

    if (hasBlockingGuardrail(results)) {
      const reasons = results.filter((result) => result.severity === 'critical').map((result) => result.flag)
      await supabase
        .from('ai_tasks')
        .update({
          status: 'failed',
          error: `Blocked by guardrails: ${reasons.join(', ')}`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
      return { blocked: true, reasons }
    }

    const warnings = results.filter((result) => result.severity === 'warning').map((result) => result.flag)
    return { blocked: false, reasons: [], warnings }
  })

  if (guardrailResult.blocked) {
    return { success: false, blocked: true, reasons: guardrailResult.reasons }
  }

  const plannerProfile: PlannerProfile = {
    user_id: userId,
    experience_level: profile.experience_level as PlannerProfile['experience_level'],
    primary_goal: (goal?.goal_type ?? profile.primary_goal) as PlannerProfile['primary_goal'],
    days_per_week: null,
    equipment_location: equipment?.location_type as PlannerProfile['equipment_location'] ?? 'gym',
    entry_path: profile.entry_path as PlannerProfile['entry_path'] ?? 'standard_training',
    adaptation_phase: profile.adaptation_phase as PlannerProfile['adaptation_phase'] ?? null,
    needs_guided_mode: profile.needs_guided_mode ?? false,
    clarity_score: null,
    confidence_score: null,
    trainer_consultation_completed_at:
      (profile.trainer_consultation_completed_at as string | null) ?? null,
    has_barbell: equipment?.has_barbell ?? false,
    has_dumbbells: equipment?.has_dumbbells ?? false,
    has_machines: equipment?.has_machines ?? false,
    has_cables: equipment?.has_cables ?? false,
    has_pullup_bar: equipment?.has_pullup_bar ?? false,
    has_bench: equipment?.has_bench ?? false,
    session_duration_min: null,
    avoid_exercises: [],
    injuries: (health?.injuries as string[] | null) ?? [],
  }

  const preferences = await runStep('load-preferences', async () => {
    const { data } = await supabase
      .from('user_training_preferences')
      .select('days_per_week, session_duration_min, avoid_exercises')
      .eq('user_id', userId)
      .maybeSingle()
    return data
  })

  plannerProfile.days_per_week = preferences?.days_per_week ?? 3
  plannerProfile.session_duration_min = preferences?.session_duration_min ?? null
  plannerProfile.avoid_exercises = (preferences?.avoid_exercises as string[] | null) ?? []

  const warnings: string[] = guardrailResult.blocked ? [] : (guardrailResult.warnings ?? [])
  const lowVolume = warnings.includes('bmi_extreme')

  const template = await runStep('select-template', async () => {
    const selectedTemplate = selectTemplate(plannerProfile)
    if (lowVolume) {
      return {
        ...selectedTemplate,
        workouts: selectedTemplate.workouts.map((workout) => ({
          ...workout,
          duration_min_estimated: Math.min(workout.duration_min_estimated, 40),
        })),
        notes_for_llm:
          selectedTemplate.notes_for_llm +
          ' LOW VOLUME modifier active: 2-3 sets per exercise max, compound movements only.',
      }
    }
    return selectedTemplate
  })

  const catalog = await runStep('load-catalog', async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, slug, name_pl, plain_language_name, simple_goal_description, category, primary_muscles, equipment_required, difficulty, is_compound, alternatives_slugs, setup_instructions, execution_steps, tempo_hint, breathing_hint, safety_notes, common_mistakes, easy_substitution_slugs, machine_busy_substitution_slugs, stop_conditions, starting_load_guidance')
      .eq('deprecated', false)

    if (error || !data) throw new Error('Failed to load exercise catalog')

    const availableEquipment = new Set([
      ...(plannerProfile.has_barbell ? ['barbell'] : []),
      ...(plannerProfile.has_dumbbells ? ['dumbbells'] : []),
      ...(plannerProfile.has_machines ? ['machines'] : []),
      ...(plannerProfile.has_cables ? ['cables'] : []),
      ...(plannerProfile.has_pullup_bar ? ['pullup_bar'] : []),
      ...(plannerProfile.has_bench ? ['bench'] : []),
    ])

    const isGym = plannerProfile.equipment_location === 'gym'

    return (data as ExerciseCatalogEntry[]).filter((exercise) => {
      if (plannerProfile.avoid_exercises.includes(exercise.slug)) return false
      if (isGym) return true
      return (
        exercise.equipment_required.length === 0 ||
        exercise.equipment_required.every((equipmentName) => availableEquipment.has(equipmentName))
      )
    })
  })

  const isGuidedBeginner =
    plannerProfile.entry_path === 'guided_beginner' ||
    plannerProfile.experience_level === 'beginner_zero'

  let planOutput: TrainingPlanOutput | GuidedTrainingPlanOutput
  let llmCallId: string | null = null

  if (isGuidedBeginner) {
    planOutput = await runStep('generate-guided-beginner-plan', async () =>
      generateGuidedBeginnerPlan({
        profile: {
          ...plannerProfile,
          adaptation_phase: plannerProfile.adaptation_phase ?? 'phase_0_familiarization',
        },
        catalog,
      }),
    )
  } else {
    const promptData = await runStep('load-prompt', async () => {
      const { data } = await supabase
        .from('prompts')
        .select('id, system_template, user_template')
        .eq('slug', 'training_plan_fill')
        .eq('version', 1)
        .eq('deprecated', false)
        .single()
      return data
    })

    if (!promptData?.system_template || !promptData?.user_template) {
      throw new Error('training_plan_fill prompt not found in DB')
    }

    const llmResult = await runStep('fill-template-llm', async () => {
      const result = await fillTemplate({
        apiKey: env.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
        systemTemplate: promptData.system_template!,
        userTemplate: promptData.user_template!,
        template,
        profile: plannerProfile,
        catalog,
        promptId: promptData.id,
      })

      const createdLlmCallId = await logLlmCall({
        supabase,
        userId,
        meta: result.meta,
        aiTaskId: taskId,
        promptId: promptData.id,
        promptVersion: 1,
      })

      return { planOutput: result.plan, llmCallId: createdLlmCallId }
    })

    planOutput = llmResult.planOutput
    llmCallId = llmResult.llmCallId
  }

  const planVersionId = await runStep('save-plan', async () => {
    await supabase
      .from('training_plans')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true)

    const { data: plan, error: planError } = await supabase
      .from('training_plans')
      .insert({
        user_id: userId,
        name: `Plan ${new Date().toLocaleDateString('pl-PL')}`,
        is_active: true,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (planError || !plan) {
      throw new Error(`Failed to create training_plan: ${planError?.message}`)
    }

    const { data: version, error: versionError } = await supabase
      .from('training_plan_versions')
      .insert({
        plan_id: plan.id,
        version_number: 1,
        created_by_ai_task_id: taskId,
        change_reason: 'Wygenerowano nowy plan na podstawie profilu.',
        goal_snapshot: goal ? { goal_type: goal.goal_type } : null,
        progression_rules: planOutput.progression_rules,
        week_structure: planOutput.week_structure,
        additional_notes: planOutput.additional_notes,
        llm_call_id: llmCallId,
        guided_mode: 'guided_mode' in planOutput ? planOutput.guided_mode : false,
        adaptation_phase:
          'adaptation_phase' in planOutput ? planOutput.adaptation_phase : null,
        view_mode:
          'view_mode' in planOutput ? planOutput.view_mode : 'standard_training_view',
      })
      .select('id')
      .single()

    if (versionError || !version) {
      throw new Error(`Failed to create plan version: ${versionError?.message}`)
    }

    await supabase
      .from('training_plans')
      .update({ current_version_id: version.id })
      .eq('id', plan.id)

    for (const workout of planOutput.workouts) {
      const { data: planWorkout, error: planWorkoutError } = await supabase
        .from('plan_workouts')
        .insert({
          plan_version_id: version.id,
          day_label: workout.day_label,
          order_in_week: workout.order_in_week,
          name: workout.name,
          duration_min_estimated: workout.duration_min_estimated,
          confidence_goal: 'confidence_goal' in workout ? workout.confidence_goal : null,
        })
        .select('id')
        .single()

      if (planWorkoutError || !planWorkout) {
        throw new Error(`Failed to create plan_workout: ${planWorkoutError?.message}`)
      }

      if ('steps' in workout) {
        for (const stepItem of workout.steps) {
          const catalogEntry = stepItem.exercise_slug
            ? catalog.find((catalogExercise) => catalogExercise.slug === stepItem.exercise_slug)
            : null

          await supabase.from('plan_workout_steps').insert({
            plan_workout_id: planWorkout.id,
            step_type: stepItem.step_type,
            order_num: stepItem.order_num,
            title: stepItem.title,
            duration_min: stepItem.duration_min,
            exercise_id: catalogEntry?.id ?? null,
            instruction_text: stepItem.instruction_text,
            setup_instructions: stepItem.setup_instructions,
            execution_steps: stepItem.execution_steps,
            tempo_hint: stepItem.tempo_hint,
            breathing_hint: stepItem.breathing_hint,
            safety_notes: stepItem.safety_notes,
            common_mistakes: stepItem.common_mistakes,
            stop_conditions: stepItem.stop_conditions,
            machine_settings: stepItem.machine_settings,
            substitution_policy:
              stepItem.substitution_policy ?? {
                easy: stepItem.easy_substitution_slug,
                machine_busy: stepItem.machine_busy_substitution_slug,
              },
            starting_load_guidance: stepItem.starting_load_guidance,
            is_new_skill: stepItem.is_new_skill,
          })
        }
      } else {
        for (const exercise of workout.exercises) {
          const catalogEntry = catalog.find((catalogExercise) => catalogExercise.slug === exercise.exercise_slug)
          if (!catalogEntry) continue

          const substituteIds: string[] = []
          for (const substituteSlug of exercise.substitute_exercise_slugs) {
            const substituteExercise = catalog.find((catalogExercise) => catalogExercise.slug === substituteSlug)
            if (substituteExercise) substituteIds.push(substituteExercise.id)
          }

          await supabase.from('plan_exercises').insert({
            plan_workout_id: planWorkout.id,
            exercise_id: catalogEntry.id,
            order_num: exercise.order_num,
            sets: exercise.sets,
            reps_min: exercise.reps_min,
            reps_max: exercise.reps_max,
            rir_target: exercise.rir_target,
            rest_seconds: exercise.rest_seconds,
            technique_notes: exercise.technique_notes,
            substitute_exercise_ids: substituteIds,
          })
        }
      }
    }

    return version.id
  })

  await runStep('complete-task', async () => {
    await supabase
      .from('ai_tasks')
      .update({
        status: 'completed',
        output_payload: { plan_version_id: planVersionId },
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    await supabase
      .from('user_profile')
      .update({ last_plan_generated_at: new Date().toISOString() })
      .eq('user_id', userId)
  })

  return { success: true, plan_version_id: planVersionId }
}
