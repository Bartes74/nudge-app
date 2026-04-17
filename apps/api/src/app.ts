import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerSentry } from './plugins/sentry.ts'
import { healthRoute } from './routes/health.ts'
import { stripeRoutes } from './routes/stripe.ts'
import { inngestRoute } from './routes/inngest.ts'
import { env } from './lib/env.ts'

export function buildApp() {
  const fastify = Fastify({
    logger: env.NODE_ENV !== 'test',
  })

  registerSentry(fastify)

  void fastify.register(cors, {
    origin: env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  })

  void fastify.register(healthRoute)
  void fastify.register(stripeRoutes)
  void fastify.register(inngestRoute)

  return fastify
}
