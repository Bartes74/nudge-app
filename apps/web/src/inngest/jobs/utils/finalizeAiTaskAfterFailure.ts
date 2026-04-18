import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

type RecoveryConfig = {
  taskId: string
  userFacingError: string
  planVersionTable: 'training_plan_versions' | 'nutrition_plan_versions'
  outputPayloadKey: 'plan_version_id' | 'nutrition_plan_version_id'
  userIdForProfileSync?: string
}

function serviceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function finalizeAiTaskAfterFailure({
  taskId,
  userFacingError,
  planVersionTable,
  outputPayloadKey,
  userIdForProfileSync,
}: RecoveryConfig): Promise<void> {
  const supabase = serviceClient()
  const completedAt = new Date().toISOString()

  const { data: existingVersion } = await supabase
    .from(planVersionTable)
    .select('id')
    .eq('created_by_ai_task_id', taskId)
    .maybeSingle()

  if (existingVersion?.id) {
    await supabase
      .from('ai_tasks')
      .update({
        status: 'completed',
        output_payload: { [outputPayloadKey]: existingVersion.id },
        error: null,
        completed_at: completedAt,
      })
      .eq('id', taskId)

    if (userIdForProfileSync) {
      await supabase
        .from('user_profile')
        .update({ last_plan_generated_at: completedAt })
        .eq('user_id', userIdForProfileSync)
    }

    return
  }

  await supabase
    .from('ai_tasks')
    .update({
      status: 'failed',
      error: userFacingError,
      completed_at: completedAt,
    })
    .eq('id', taskId)
}
