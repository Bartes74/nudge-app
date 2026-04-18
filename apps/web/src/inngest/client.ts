import { Inngest } from 'inngest'
import { resolveInngestEnvironment } from '@nudge/config/inngest'

export const inngest = new Inngest({
  id: 'nudge-web',
  eventKey: process.env['INNGEST_EVENT_KEY'] ?? 'local',
  env: resolveInngestEnvironment(process.env),
})
