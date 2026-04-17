import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { generateTrainingPlanJob } from '@/inngest/jobs/generateTrainingPlan'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateTrainingPlanJob],
})
