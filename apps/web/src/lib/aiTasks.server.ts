import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Enums } from '@nudge/core/types/db'
import { dispatchInngestEvent } from '@/lib/inngest/dispatchEvent'

type AppSupabaseClient = SupabaseClient<Database>
type AiTaskType = Enums<'ai_task_type'>

interface QueueAiTaskOptions {
  supabase: AppSupabaseClient
  userId: string
  taskType: Extract<AiTaskType, 'generate_training_plan' | 'generate_nutrition_plan'>
  eventName: string
  eventData?: Record<string, unknown>
  taskFailureMessage: string
}

export async function queueAiTask({
  supabase,
  userId,
  taskType,
  eventName,
  eventData = {},
  taskFailureMessage,
}: QueueAiTaskOptions): Promise<{ taskId: string }> {
  await supabase
    .from('ai_tasks')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('task_type', taskType)
    .eq('status', 'queued')

  const { data: task, error: taskError } = await supabase
    .from('ai_tasks')
    .insert({
      user_id: userId,
      task_type: taskType,
      status: 'queued',
    })
    .select('id')
    .single()

  if (taskError || !task) {
    throw new Error(taskError?.message ?? 'Failed to create AI task.')
  }

  try {
    await dispatchInngestEvent({
      name: eventName,
      data: {
        task_id: task.id,
        user_id: userId,
        ...eventData,
      },
    })
  } catch (error) {
    await supabase
      .from('ai_tasks')
      .update({
        status: 'failed',
        error: taskFailureMessage,
      })
      .eq('id', task.id)

    throw error
  }

  return { taskId: task.id }
}
