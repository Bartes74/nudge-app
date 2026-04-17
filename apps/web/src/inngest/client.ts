import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'nudge-web',
  eventKey: process.env['INNGEST_EVENT_KEY'] ?? 'local',
})
