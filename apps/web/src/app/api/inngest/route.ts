import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { generateTrainingPlanJob } from '@/inngest/jobs/generateTrainingPlan'
import { generateNutritionPlanJob } from '@/inngest/jobs/generateNutritionPlan'
import { updateBehaviorSignalsJob } from '@/inngest/jobs/updateBehaviorSignals'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateTrainingPlanJob, generateNutritionPlanJob, updateBehaviorSignalsJob],
})
