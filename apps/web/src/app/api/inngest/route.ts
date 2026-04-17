import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { generateTrainingPlanJob } from '@/inngest/jobs/generateTrainingPlan'
import { updateBehaviorSignalsJob } from '@/inngest/jobs/updateBehaviorSignals'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateTrainingPlanJob, updateBehaviorSignalsJob],
})
