import { createClient } from '@supabase/supabase-js'
import { inngest } from '../client'
import { env } from '@/lib/env'
import { evaluateGuardrails, hasBlockingGuardrail } from '@nudge/core/rules/guardrails'
import { selectTemplate } from '@nudge/core/planners/training/selectTemplate'
import { fillTemplate } from '@nudge/core/planners/training/fillTemplate'
import type { PlannerProfile } from '@nudge/core/planners/training/types'
import type { ExerciseCatalogEntry } from '@nudge/core/planners/training/types'
import type { GuardrailProfile, GuardrailContext } from '@nudge/core/rules/guardrails'

function serviceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

export const generateTrainingPlanJob = inngest.createFunction(
  {
    id: 'generate-training-plan',
    name: 'Generate Training Plan',
    triggers: [{ event: 'nudge/plan.training.generate' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: { data: Record<string, unknown> }; step: any }) => {
    const { task_id, user_id } = event.data as { task_id: string; user_id: string }

    const supabase = serviceClient()

    // Mark task as running
    await step.run('mark-running', async () => {
      await supabase
        .from('ai_tasks')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', task_id)
    })

    // Load profile + equipment + health
    const { profile, equipment, health, goal } = await step.run('load-profile', async () => {
      const [profileRes, equipmentRes, healthRes, goalRes] = await Promise.all([
        supabase.from('user_profile').select('*').eq('user_id', user_id).single(),
        supabase.from('user_equipment').select('*').eq('user_id', user_id).maybeSingle(),
        supabase.from('user_health').select('*').eq('user_id', user_id).maybeSingle(),
        supabase.from('user_goals').select('*').eq('user_id', user_id).eq('is_current', true).maybeSingle(),
      ])

      if (profileRes.error || !profileRes.data) {
        throw new Error(`Failed to load profile for user ${user_id}: ${profileRes.error?.message}`)
      }

      return {
        profile: profileRes.data,
        equipment: equipmentRes.data,
        health: healthRes.data,
        goal: goalRes.data,
      }
    })

    // Evaluate guardrails
    const guardrailResult = await step.run('evaluate-guardrails', async () => {
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
        const reasons = results.filter((r) => r.severity === 'critical').map((r) => r.flag)
        await supabase
          .from('ai_tasks')
          .update({
            status: 'failed',
            error: `Blocked by guardrails: ${reasons.join(', ')}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', task_id)
        return { blocked: true, reasons }
      }

      const warnings = results.filter((r) => r.severity === 'warning').map((r) => r.flag)
      return { blocked: false, reasons: [], warnings }
    })

    if (guardrailResult.blocked) {
      return { success: false, blocked: true, reasons: guardrailResult.reasons }
    }

    // Build planner profile
    const plannerProfile: PlannerProfile = {
      user_id,
      experience_level: profile.experience_level as PlannerProfile['experience_level'],
      primary_goal: (goal?.goal_type ?? profile.primary_goal) as PlannerProfile['primary_goal'],
      days_per_week: null, // loaded from facts/preferences below
      equipment_location: equipment?.location_type as PlannerProfile['equipment_location'] ?? 'gym',
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

    // Load training preferences (days_per_week, session_duration_min, avoid_exercises)
    const preferences = await step.run('load-preferences', async () => {
      const { data } = await supabase
        .from('user_training_preferences')
        .select('days_per_week, session_duration_min, avoid_exercises')
        .eq('user_id', user_id)
        .maybeSingle()
      return data
    })

    plannerProfile.days_per_week = preferences?.days_per_week ?? 3
    plannerProfile.session_duration_min = preferences?.session_duration_min ?? null
    plannerProfile.avoid_exercises = (preferences?.avoid_exercises as string[] | null) ?? []

    // Apply warning modifiers (e.g. bmi_extreme warning → low volume)
    const lowVolume = guardrailResult.warnings.includes('bmi_extreme')

    // Select template (deterministic)
    const template = await step.run('select-template', async () => {
      const t = selectTemplate(plannerProfile)
      if (lowVolume) {
        // Reduce duration and focus on compound-only
        return {
          ...t,
          workouts: t.workouts.map((w) => ({
            ...w,
            duration_min_estimated: Math.min(w.duration_min_estimated, 40),
          })),
          notes_for_llm: t.notes_for_llm + ' LOW VOLUME modifier active: 2-3 sets per exercise max, compound movements only.',
        }
      }
      return t
    })

    // Load exercise catalog (filtered to available equipment)
    const catalog = await step.run('load-catalog', async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, slug, name_pl, category, primary_muscles, equipment_required, difficulty, is_compound, alternatives_slugs')
        .eq('deprecated', false)

      if (error || !data) throw new Error('Failed to load exercise catalog')

      // Filter to exercises the user can actually do
      const availableEquipment = new Set([
        ...(plannerProfile.has_barbell ? ['barbell'] : []),
        ...(plannerProfile.has_dumbbells ? ['dumbbells'] : []),
        ...(plannerProfile.has_machines ? ['machines'] : []),
        ...(plannerProfile.has_cables ? ['cables'] : []),
        ...(plannerProfile.has_pullup_bar ? ['pullup_bar'] : []),
        ...(plannerProfile.has_bench ? ['bench'] : []),
      ])

      // For gym users, assume all equipment available
      const isGym = plannerProfile.equipment_location === 'gym'

      return (data as ExerciseCatalogEntry[]).filter((e) => {
        if (plannerProfile.avoid_exercises.includes(e.slug)) return false
        if (isGym) return true
        return e.equipment_required.length === 0 || e.equipment_required.every((eq) => availableEquipment.has(eq))
      })
    })

    // Load prompt from DB
    const promptData = await step.run('load-prompt', async () => {
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

    // Call LLM
    const { planOutput, llmCallId } = await step.run('fill-template-llm', async () => {
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

      // Save LLM call record
      const { data: llmCall } = await supabase
        .from('llm_calls')
        .insert({
          user_id,
          ai_task_id: task_id,
          provider: result.meta.provider,
          model: result.meta.model,
          prompt_id: promptData.id,
          prompt_version: 1,
          tokens_in: result.meta.tokens_in,
          tokens_out: result.meta.tokens_out,
          cost_usd: result.meta.cost_usd,
          latency_ms: result.meta.latency_ms,
          used_structured_output: true,
          output_valid: true,
        })
        .select('id')
        .single()

      return { planOutput: result.plan, llmCallId: llmCall?.id ?? null }
    })

    // Persist plan to DB
    const planVersionId = await step.run('save-plan', async () => {
      // Deactivate existing plans
      await supabase
        .from('training_plans')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('is_active', true)

      // Create new plan container
      const { data: plan, error: planError } = await supabase
        .from('training_plans')
        .insert({
          user_id,
          name: `Plan ${new Date().toLocaleDateString('pl-PL')}`,
          is_active: true,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (planError || !plan) throw new Error(`Failed to create training_plan: ${planError?.message}`)

      // Create version
      const { data: version, error: versionError } = await supabase
        .from('training_plan_versions')
        .insert({
          plan_id: plan.id,
          version_number: 1,
          created_by_ai_task_id: task_id,
          change_reason: 'Wygenerowano nowy plan na podstawie profilu.',
          goal_snapshot: goal ? { goal_type: goal.goal_type } : null,
          progression_rules: planOutput.progression_rules,
          week_structure: planOutput.week_structure,
          additional_notes: planOutput.additional_notes,
          llm_call_id: llmCallId,
        })
        .select('id')
        .single()

      if (versionError || !version) throw new Error(`Failed to create plan version: ${versionError?.message}`)

      // Set current_version_id on plan
      await supabase
        .from('training_plans')
        .update({ current_version_id: version.id })
        .eq('id', plan.id)

      // Insert workouts and exercises
      for (const workout of planOutput.workouts) {
        const { data: pw, error: pwError } = await supabase
          .from('plan_workouts')
          .insert({
            plan_version_id: version.id,
            day_label: workout.day_label,
            order_in_week: workout.order_in_week,
            name: workout.name,
            duration_min_estimated: workout.duration_min_estimated,
          })
          .select('id')
          .single()

        if (pwError || !pw) throw new Error(`Failed to create plan_workout: ${pwError?.message}`)

        for (const ex of workout.exercises) {
          // Look up exercise id from slug
          const catalogEntry = catalog.find((c: ExerciseCatalogEntry) => c.slug === ex.exercise_slug)
          if (!catalogEntry) continue

          // Resolve substitute exercise ids
          const subIds: string[] = []
          for (const subSlug of ex.substitute_exercise_slugs) {
            const sub = catalog.find((c: ExerciseCatalogEntry) => c.slug === subSlug)
            if (sub) subIds.push(sub.id)
          }

          await supabase.from('plan_exercises').insert({
            plan_workout_id: pw.id,
            exercise_id: catalogEntry.id,
            order_num: ex.order_num,
            sets: ex.sets,
            reps_min: ex.reps_min,
            reps_max: ex.reps_max,
            rir_target: ex.rir_target,
            rest_seconds: ex.rest_seconds,
            technique_notes: ex.technique_notes,
            substitute_exercise_ids: subIds,
          })
        }
      }

      return version.id
    })

    // Update ai_task as completed
    await step.run('complete-task', async () => {
      await supabase
        .from('ai_tasks')
        .update({
          status: 'completed',
          output_payload: { plan_version_id: planVersionId },
          completed_at: new Date().toISOString(),
        })
        .eq('id', task_id)

      // Update last_plan_generated_at on profile
      await supabase
        .from('user_profile')
        .update({ last_plan_generated_at: new Date().toISOString() })
        .eq('user_id', user_id)
    })

    return { success: true, plan_version_id: planVersionId }
  },
)
