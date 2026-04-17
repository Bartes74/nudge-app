import { createClient } from '@supabase/supabase-js'
import { inngest } from '../client'
import { env } from '@/lib/env'
import { analyzeMealPhoto } from '@nudge/core/vision/analyzeMealPhoto'

const MONTHLY_COST_ALERT_USD = 5

function serviceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

export const analyzeMealPhotoJob = inngest.createFunction(
  {
    id: 'analyze-meal-photo',
    name: 'Analyze Meal Photo',
    triggers: [{ event: 'nudge/meal.photo.analyze' }],
    retries: 1,
  },
  async ({
    event,
    step,
  }: {
    event: { data: Record<string, unknown> }
    step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> }
  }) => {
    const { meal_log_id, user_id, storage_path, note } = event.data as {
      meal_log_id: string
      user_id: string
      storage_path: string
      note: string | null
    }

    const supabase = serviceClient()

    const imageUrl = await step.run('get-signed-url', async () => {
      const { data, error } = await supabase.storage
        .from('meal_photos')
        .createSignedUrl(storage_path, 300)

      if (error || !data?.signedUrl) {
        throw new Error(`Failed to create signed URL: ${error?.message}`)
      }

      return data.signedUrl
    })

    const promptData = await step.run('load-prompt', async () => {
      const { data } = await supabase
        .from('prompts')
        .select('id')
        .eq('slug', 'meal_vision_analysis')
        .eq('version', 1)
        .eq('deprecated', false)
        .maybeSingle()
      return data
    })

    const { analysis, llmCallId } = await step.run('call-llm', async () => {
      const result = await analyzeMealPhoto({
        apiKey: env.OPENAI_API_KEY,
        imageUrl,
        note: note ?? undefined,
      })

      const { data: llmCall } = await supabase
        .from('llm_calls')
        .insert({
          user_id,
          provider: result.meta.provider,
          model: result.meta.model,
          prompt_id: promptData?.id ?? null,
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

      return { analysis: result.output, llmCallId: llmCall?.id ?? null }
    })

    await step.run('save-results', async () => {
      await supabase
        .from('meal_logs')
        .update({
          status: 'analyzed',
          meal_type: analysis.meal_type_guess,
          kcal_estimate_min: Math.round(analysis.kcal_estimate_min),
          kcal_estimate_max: Math.round(analysis.kcal_estimate_max),
          protein_g_min: analysis.protein_g_min,
          protein_g_max: analysis.protein_g_max,
          carbs_g_min: analysis.carbs_g_min,
          carbs_g_max: analysis.carbs_g_max,
          fat_g_min: analysis.fat_g_min,
          fat_g_max: analysis.fat_g_max,
          confidence_score: analysis.confidence_score,
          user_warnings: analysis.user_warnings,
          llm_call_id: llmCallId,
        })
        .eq('id', meal_log_id)

      if (analysis.ingredients_detected.length > 0) {
        await supabase.from('meal_log_items').insert(
          analysis.ingredients_detected.map((ing) => ({
            meal_log_id,
            user_id,
            label: ing.label,
            portion_estimate: ing.portion_estimate,
            grams_estimate: ing.grams_estimate,
            kcal_estimate: Math.round(ing.kcal_estimate),
            protein_g: ing.protein_g,
            carbs_g: ing.carbs_g,
            fat_g: ing.fat_g,
          })),
        )
      }
    })

    // Budget alert — log if monthly spend exceeds threshold
    await step.run('budget-check', async () => {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('llm_calls')
        .select('cost_usd')
        .eq('user_id', user_id)
        .gte('created_at', startOfMonth.toISOString())

      const totalCost = (data ?? []).reduce((sum, r) => sum + (r.cost_usd ?? 0), 0)

      if (totalCost > MONTHLY_COST_ALERT_USD) {
        console.warn(
          `[budget-alert] user=${user_id} monthly_cost=$${totalCost.toFixed(4)} exceeds $${MONTHLY_COST_ALERT_USD} threshold`,
        )
      }
    })

    return { success: true, meal_log_id }
  },
)
