import type { FastifyInstance } from 'fastify'
import { serve } from 'inngest/fastify'
import { inngest } from '../inngest/client.js'
import {
  scheduleTrialEmails,
  sendPostCancellationEmail,
  sendInactivityEmails,
  sendPreRenewalEmails,
  checkCostAlert,
} from '../inngest/functions/index.js'

const handler = serve({
  client: inngest,
  functions: [
    scheduleTrialEmails,
    sendPostCancellationEmail,
    sendInactivityEmails,
    sendPreRenewalEmails,
    checkCostAlert,
  ],
})

export function inngestRoute(app: FastifyInstance) {
  app.route({
    method: ['GET', 'POST', 'PUT'],
    url: '/api/inngest',
    handler,
  })
}
