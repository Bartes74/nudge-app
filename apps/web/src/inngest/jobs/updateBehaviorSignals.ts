import { createClient } from '@supabase/supabase-js'
import { inngest } from '../client'
import { env } from '@/lib/env'
import { updateBehaviorSignals } from '@nudge/core/signals/updateBehaviorSignals'

function serviceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

export const updateBehaviorSignalsJob = inngest.createFunction(
  {
    id: 'update-behavior-signals',
    name: 'Update Behavior Signals',
    triggers: [{ event: 'nudge/workout.finished' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: { data: Record<string, unknown> }; step: any }) => {
    const { user_id } = event.data as { user_id: string; workout_log_id: string }

    await step.run('update-signals', async () => {
      const supabase = serviceClient()
      await updateBehaviorSignals(supabase, { userId: user_id })
    })
  },
)
