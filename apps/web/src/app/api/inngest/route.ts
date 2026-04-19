import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { generateTrainingPlanJob } from '@/inngest/jobs/generateTrainingPlan'
import { updateBehaviorSignalsJob } from '@/inngest/jobs/updateBehaviorSignals'
import { proactiveCoachCheckJob } from '@/inngest/jobs/proactiveCoachCheck'
import { weeklyCheckinNotificationJob } from '@/inngest/jobs/weeklyCheckinNotification'
import { analyzeMealPhotoJob } from '@/inngest/jobs/analyzeMealPhoto'

export const maxDuration = 300

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateTrainingPlanJob,
    updateBehaviorSignalsJob,
    proactiveCoachCheckJob,
    weeklyCheckinNotificationJob,
    analyzeMealPhotoJob,
  ],
})
