import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { generateTrainingPlanJob } from '@/inngest/jobs/generateTrainingPlan'
import { updateBehaviorSignalsJob } from '@/inngest/jobs/updateBehaviorSignals'
import { analyzeMealPhotoJob } from '@/inngest/jobs/analyzeMealPhoto'

export const maxDuration = 300

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateTrainingPlanJob,
    updateBehaviorSignalsJob,
    analyzeMealPhotoJob,
  ],
})
