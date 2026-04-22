import { createClient } from '@supabase/supabase-js'
import { analyzeMealPhoto } from '@nudge/core/vision/analyzeMealPhoto'
import { logAndRecordLlmUsage } from '@nudge/core/billing'
import { env } from '@/lib/env'

const MONTHLY_COST_ALERT_USD = 5

export function mealPhotoServiceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function createMealPhotoSignedUrl(args: {
  supabase: ReturnType<typeof mealPhotoServiceClient>
  storagePath: string
}) {
  const { data, error } = await args.supabase.storage
    .from('meal_photos')
    .createSignedUrl(args.storagePath, 300)

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`)
  }

  return data.signedUrl
}

export async function loadMealPhotoPromptId(args: {
  supabase: ReturnType<typeof mealPhotoServiceClient>
}) {
  const { data } = await args.supabase
    .from('prompts')
    .select('id')
    .eq('slug', 'meal_vision_analysis')
    .eq('version', 1)
    .eq('deprecated', false)
    .maybeSingle()

  return data?.id ?? null
}

export async function analyzeMealPhotoWithLlm(args: {
  supabase: ReturnType<typeof mealPhotoServiceClient>
  userId: string
  imageUrl: string
  note: string | null
  promptId: string | null
}) {
  const result = await analyzeMealPhoto({
    apiKey: env.OPENAI_API_KEY,
    imageUrl: args.imageUrl,
    note: args.note ?? undefined,
  })

  const llmCallId = await logAndRecordLlmUsage({
    supabase: args.supabase,
    userId: args.userId,
    meta: result.meta,
    promptId: args.promptId,
    promptVersion: 1,
    isPhotoAnalysis: true,
  })

  return { analysis: result.output, llmCallId }
}

export async function saveMealPhotoAnalysis(args: {
  supabase: ReturnType<typeof mealPhotoServiceClient>
  mealLogId: string
  userId: string
  analysis: Awaited<ReturnType<typeof analyzeMealPhotoWithLlm>>['analysis']
  llmCallId: string | null
}) {
  await args.supabase
    .from('meal_logs')
    .update({
      status: 'analyzed',
      meal_type: args.analysis.meal_type_guess,
      kcal_estimate_min: Math.round(args.analysis.kcal_estimate_min),
      kcal_estimate_max: Math.round(args.analysis.kcal_estimate_max),
      protein_g_min: args.analysis.protein_g_min,
      protein_g_max: args.analysis.protein_g_max,
      carbs_g_min: args.analysis.carbs_g_min,
      carbs_g_max: args.analysis.carbs_g_max,
      fat_g_min: args.analysis.fat_g_min,
      fat_g_max: args.analysis.fat_g_max,
      confidence_score: args.analysis.confidence_score,
      user_warnings: args.analysis.user_warnings,
      llm_call_id: args.llmCallId,
    })
    .eq('id', args.mealLogId)

  await args.supabase.from('meal_log_items').delete().eq('meal_log_id', args.mealLogId)

  if (args.analysis.ingredients_detected.length === 0) return

  await args.supabase.from('meal_log_items').insert(
    args.analysis.ingredients_detected.map((ing) => ({
      meal_log_id: args.mealLogId,
      user_id: args.userId,
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

export async function checkMealPhotoBudget(args: {
  supabase: ReturnType<typeof mealPhotoServiceClient>
  userId: string
}) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data } = await args.supabase
    .from('llm_calls')
    .select('cost_usd')
    .eq('user_id', args.userId)
    .gte('created_at', startOfMonth.toISOString())

  const totalCost = (data ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0)

  if (totalCost > MONTHLY_COST_ALERT_USD) {
    console.warn(
      `[budget-alert] user=${args.userId} monthly_cost=$${totalCost.toFixed(4)} exceeds $${MONTHLY_COST_ALERT_USD} threshold`,
    )
  }
}

export async function markMealPhotoAnalysisFailed(args: {
  supabase: ReturnType<typeof mealPhotoServiceClient>
  mealLogId: string
  message: string
}) {
  await args.supabase
    .from('meal_logs')
    .update({
      status: 'failed',
      user_warnings: [args.message],
    })
    .eq('id', args.mealLogId)
}

export async function runMealPhotoAnalysis(args: {
  mealLogId: string
  userId: string
  storagePath: string
  note: string | null
  supabase?: ReturnType<typeof mealPhotoServiceClient>
}) {
  const supabase = args.supabase ?? mealPhotoServiceClient()
  const imageUrl = await createMealPhotoSignedUrl({
    supabase,
    storagePath: args.storagePath,
  })
  const promptId = await loadMealPhotoPromptId({ supabase })
  const { analysis, llmCallId } = await analyzeMealPhotoWithLlm({
    supabase,
    userId: args.userId,
    imageUrl,
    note: args.note,
    promptId,
  })

  await saveMealPhotoAnalysis({
    supabase,
    mealLogId: args.mealLogId,
    userId: args.userId,
    analysis,
    llmCallId,
  })

  await checkMealPhotoBudget({
    supabase,
    userId: args.userId,
  })

  return { success: true, meal_log_id: args.mealLogId }
}
