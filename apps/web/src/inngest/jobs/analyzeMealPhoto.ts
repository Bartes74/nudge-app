import { inngest } from '../client'
import {
  analyzeMealPhotoWithLlm,
  checkMealPhotoBudget,
  createMealPhotoSignedUrl,
  loadMealPhotoPromptId,
  markMealPhotoAnalysisFailed,
  mealPhotoServiceClient,
  saveMealPhotoAnalysis,
} from '@/lib/nutrition/analyzeMealPhotoTask'

export const analyzeMealPhotoJob = inngest.createFunction(
  {
    id: 'analyze-meal-photo',
    name: 'Analyze Meal Photo',
    triggers: [{ event: 'nudge/meal.photo.analyze' }],
    retries: 1,
    onFailure: async ({ event, error }: { event: { data: { event: { data: Record<string, unknown> } } }; error: Error }) => {
      const { meal_log_id } = event.data.event.data as { meal_log_id: string }
      if (!meal_log_id) return
      const supabase = mealPhotoServiceClient()
      await markMealPhotoAnalysisFailed({
        supabase,
        mealLogId: meal_log_id,
        message: error.message ?? 'Analiza posiłku nie powiodła się.',
      })
    },
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

    const supabase = mealPhotoServiceClient()

    const imageUrl = await step.run('get-signed-url', async () => {
      return createMealPhotoSignedUrl({
        supabase,
        storagePath: storage_path,
      })
    })

    const promptId = await step.run('load-prompt', async () => loadMealPhotoPromptId({ supabase }))

    const { analysis, llmCallId } = await step.run('call-llm', async () => {
      return analyzeMealPhotoWithLlm({
        supabase,
        userId: user_id,
        imageUrl,
        note: note ?? null,
        promptId,
      })
    })

    await step.run('save-results', async () => {
      await saveMealPhotoAnalysis({
        supabase,
        mealLogId: meal_log_id,
        userId: user_id,
        analysis,
        llmCallId,
      })
    })

    // Budget alert — log if monthly spend exceeds threshold
    await step.run('budget-check', async () => checkMealPhotoBudget({ supabase, userId: user_id }))

    return { success: true, meal_log_id }
  },
)
