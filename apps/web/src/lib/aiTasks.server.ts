import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database, Enums } from '@nudge/core/types/db'
import { env } from '@/lib/env'
import { dispatchInngestEvent } from '@/lib/inngest/dispatchEvent'

type AppSupabaseClient = SupabaseClient<Database>
type AiTaskType = Enums<'ai_task_type'>
type AiTaskStatus = Enums<'ai_task_status'>

interface QueueAiTaskOptions {
  userId: string
  taskType: Extract<AiTaskType, 'generate_training_plan'>
  taskFailureMessage: string
}

interface DispatchAiTaskOptions {
  taskId: string
  userId: string
  eventName: string
  eventData?: Record<string, unknown>
  taskFailureMessage: string
}

function serviceClient(): AppSupabaseClient {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

export async function cancelTrainingPlanTasks({
  userId,
  statuses = ['queued'],
  reason = 'Anulowano poprzednie generowanie planu treningowego.',
}: {
  userId: string
  statuses?: Array<Extract<AiTaskStatus, 'queued' | 'running'>>
  reason?: string
}): Promise<void> {
  const supabase = serviceClient()
  const { error } = await supabase
    .from('ai_tasks')
    .update({
      status: 'cancelled',
      error: reason,
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('task_type', 'generate_training_plan')
    .in('status', statuses)

  if (error) {
    throw new Error(error.message)
  }
}

export async function createQueuedAiTask({
  userId,
  taskType,
}: Omit<QueueAiTaskOptions, 'taskFailureMessage'>): Promise<{ taskId: string }> {
  const supabase = serviceClient()

  await cancelTrainingPlanTasks({
    userId,
    statuses: ['queued'],
    reason: 'Zastąpiono nowszym generowaniem planu treningowego.',
  })

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

  return { taskId: task.id }
}

export async function dispatchQueuedAiTask({
  taskId,
  userId,
  eventName,
  eventData = {},
  taskFailureMessage,
}: DispatchAiTaskOptions): Promise<void> {
  const supabase = serviceClient()

  try {
    await dispatchInngestEvent({
      name: eventName,
      data: {
        task_id: taskId,
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
      .eq('id', taskId)

    throw error
  }
}

export async function queueAiTask({
  userId,
  taskType,
  taskFailureMessage,
  eventName,
  eventData = {},
}: QueueAiTaskOptions & {
  eventName: string
  eventData?: Record<string, unknown>
}): Promise<{ taskId: string }> {
  const { taskId } = await createQueuedAiTask({
    userId,
    taskType,
  })

  await dispatchQueuedAiTask({
    taskId,
    userId,
    eventName,
    eventData,
    taskFailureMessage,
  })

  return { taskId }
}
