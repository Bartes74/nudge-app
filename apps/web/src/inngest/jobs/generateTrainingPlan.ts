import { inngest } from '../client'
import { finalizeAiTaskAfterFailure } from './utils/finalizeAiTaskAfterFailure'
import { runGenerateTrainingPlanTask } from '@/lib/training/runGenerateTrainingPlanTask'

export const generateTrainingPlanJob = inngest.createFunction(
  {
    id: 'generate-training-plan',
    name: 'Generate Training Plan',
    triggers: [{ event: 'nudge/plan.training.generate' }],
    retries: 0,
    onFailure: async ({ event, error }: { event: { data: { event: { data: Record<string, unknown> } } }; error: Error }) => {
      const { task_id } = event.data.event.data as { task_id: string }
      const { user_id } = event.data.event.data as { user_id?: string }
      if (!task_id) return
      console.error('[generate-training-plan] job failed', error)
      await finalizeAiTaskAfterFailure({
        taskId: task_id,
        userFacingError: 'Nie udało się wygenerować planu treningowego. Spróbuj ponownie.',
        userIdForProfileSync: user_id,
      })
    },
  },
  async ({ event, step }: { event: { data: Record<string, unknown> }; step: any }) => {
    const { task_id, user_id } = event.data as { task_id: string; user_id: string }
    return runGenerateTrainingPlanTask({
      taskId: task_id,
      userId: user_id,
      runStep: (name, fn) => step.run(name, fn),
    })
  },
)
