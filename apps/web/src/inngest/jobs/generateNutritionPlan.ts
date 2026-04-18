import { createClient } from '@supabase/supabase-js'
import { inngest } from '../client'
import { env } from '@/lib/env'
import { evaluateGuardrails, hasBlockingGuardrail } from '@nudge/core/rules/guardrails'
import { calculateNutritionTargets } from '@nudge/core/planners/nutrition/calculateNutritionTargets'
import { generateNutritionPlan } from '@nudge/core/planners/nutrition/generateNutritionPlan'
import { logLlmCall } from '@nudge/core/llm/client'
import { finalizeAiTaskAfterFailure } from './utils/finalizeAiTaskAfterFailure'
import type { NutritionPlannerProfile } from '@nudge/core/planners/nutrition/types'
import type { GuardrailProfile, GuardrailContext } from '@nudge/core/rules/guardrails'
import type { ActivityLevel } from '@nudge/core/domain/profile'

function serviceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

function daysPerWeekToActivityLevel(days: number | null): ActivityLevel {
  if (days == null || days <= 1) return 'sedentary'
  if (days <= 2) return 'light'
  if (days <= 4) return 'moderate'
  if (days <= 6) return 'active'
  return 'very_active'
}

export const generateNutritionPlanJob = inngest.createFunction(
  {
    id: 'generate-nutrition-plan',
    name: 'Generate Nutrition Plan',
    triggers: [{ event: 'nudge/plan.nutrition.generate' }],
    retries: 0,
    onFailure: async ({ event, error }: { event: { data: { event: { data: Record<string, unknown> } } }; error: Error }) => {
      const { task_id } = event.data.event.data as { task_id: string }
      if (!task_id) return
      console.error('[generate-nutrition-plan] job failed', error)
      await finalizeAiTaskAfterFailure({
        taskId: task_id,
        userFacingError: 'Nie udało się wygenerować planu żywieniowego. Spróbuj ponownie.',
        planVersionTable: 'nutrition_plan_versions',
        outputPayloadKey: 'nutrition_plan_version_id',
      })
    },
  },
  async ({ event, step }: { event: { data: Record<string, unknown> }; step: any }) => {
    const { task_id, user_id } = event.data as { task_id: string; user_id: string }

    const supabase = serviceClient()

    await step.run('mark-running', async () => {
      await supabase
        .from('ai_tasks')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', task_id)
    })

    const { profile, preferences } = await step.run('load-profile', async () => {
      const [profileRes, prefRes] = await Promise.all([
        supabase.from('user_profile').select('*').eq('user_id', user_id).single(),
        supabase
          .from('user_training_preferences')
          .select('days_per_week')
          .eq('user_id', user_id)
          .maybeSingle(),
      ])

      if (profileRes.error || !profileRes.data) {
        throw new Error(`Failed to load profile for user ${user_id}: ${profileRes.error?.message}`)
      }

      return { profile: profileRes.data, preferences: prefRes.data }
    })

    const birthYear = profile.birth_date
      ? new Date(profile.birth_date as string).getFullYear()
      : null
    const age = birthYear ? new Date().getFullYear() - birthYear : null
    const activityLevel = daysPerWeekToActivityLevel(preferences?.days_per_week ?? null)

    const guardrailResult = await step.run('evaluate-guardrails', async () => {
      const guardrailProfile: GuardrailProfile = {
        age,
        gender: profile.gender as GuardrailProfile['gender'],
        weight_kg: profile.current_weight_kg ? Number(profile.current_weight_kg) : null,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        is_pregnant: null,
      }

      const plannerProfile: NutritionPlannerProfile = {
        user_id,
        gender: profile.gender as NutritionPlannerProfile['gender'],
        age,
        weight_kg: profile.current_weight_kg ? Number(profile.current_weight_kg) : null,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        activity_level: activityLevel,
        primary_goal: profile.primary_goal as NutritionPlannerProfile['primary_goal'],
        nutrition_mode: (profile.nutrition_mode ?? 'simple') as NutritionPlannerProfile['nutrition_mode'],
        dietary_constraints: (profile.dietary_constraints as string[] | null) ?? [],
        life_context: (profile.life_context as string[] | null) ?? [],
        experience_level: profile.experience_level as NutritionPlannerProfile['experience_level'],
      }

      const targets = calculateNutritionTargets(plannerProfile)

      const guardrailContext: GuardrailContext = {
        planned_calories: targets?.calories_target ?? null,
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
        return { blocked: true, reasons, plannerProfile, targets }
      }

      return { blocked: false, reasons: [], plannerProfile, targets }
    })

    if (guardrailResult.blocked || !guardrailResult.targets) {
      return { success: false, blocked: true, reasons: guardrailResult.reasons }
    }

    const promptData = await step.run('load-prompt', async () => {
      const { data } = await supabase
        .from('prompts')
        .select('id, system_template, user_template')
        .eq('slug', 'nutrition_plan_fill')
        .eq('version', 1)
        .eq('deprecated', false)
        .single()
      return data
    })

    if (!promptData?.system_template || !promptData?.user_template) {
      throw new Error('nutrition_plan_fill prompt not found in DB')
    }

    const { planOutput, llmCallId } = await step.run('generate-llm', async () => {
      const result = await generateNutritionPlan({
        apiKey: env.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
        systemTemplate: promptData.system_template!,
        userTemplate: promptData.user_template!,
        profile: guardrailResult.plannerProfile,
        targets: guardrailResult.targets!,
        promptId: promptData.id,
      })

      const llmCallId = await logLlmCall({
        supabase,
        userId: user_id,
        meta: result.meta,
        aiTaskId: task_id,
        promptId: promptData.id,
        promptVersion: 1,
      })

      return { planOutput: result.plan, llmCallId }
    })

    const planVersionId = await step.run('save-plan', async () => {
      await supabase
        .from('nutrition_plans')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('is_active', true)

      const { data: plan, error: planError } = await supabase
        .from('nutrition_plans')
        .insert({ user_id, is_active: true, started_at: new Date().toISOString() })
        .select('id')
        .single()

      if (planError || !plan) {
        throw new Error(`Failed to create nutrition_plan: ${planError?.message}`)
      }

      const { data: version, error: versionError } = await supabase
        .from('nutrition_plan_versions')
        .insert({
          plan_id: plan.id,
          version_number: 1,
          created_by_ai_task_id: task_id,
          change_reason: 'Wygenerowano nowy plan na podstawie profilu.',
          mode: guardrailResult.plannerProfile.nutrition_mode,
          calories_target: planOutput.calories_target,
          protein_g_target: planOutput.protein_g,
          fat_g_target: planOutput.fat_g,
          carbs_g_target: planOutput.carbs_g,
          fiber_g_target: planOutput.fiber_g,
          water_ml_target: planOutput.water_ml,
          meal_distribution: planOutput.meal_distribution,
          strategy_notes: planOutput.strategy_notes,
          practical_guidelines: planOutput.practical_guidelines,
          supplement_recommendations: planOutput.supplement_recommendations,
          emergency_plan: planOutput.emergency_plan,
          llm_call_id: llmCallId,
        })
        .select('id')
        .single()

      if (versionError || !version) {
        throw new Error(`Failed to create nutrition_plan_version: ${versionError?.message}`)
      }

      await supabase
        .from('nutrition_plans')
        .update({ current_version_id: version.id })
        .eq('id', plan.id)

      return version.id
    })

    await step.run('complete-task', async () => {
      await supabase
        .from('ai_tasks')
        .update({
          status: 'completed',
          output_payload: { nutrition_plan_version_id: planVersionId },
          completed_at: new Date().toISOString(),
        })
        .eq('id', task_id)
    })

    return { success: true, nutrition_plan_version_id: planVersionId }
  },
)
