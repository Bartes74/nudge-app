import * as Sentry from '@sentry/node'
import { type FastifyInstance } from 'fastify'
import { env } from '../lib/env.ts'

export function registerSentry(fastify: FastifyInstance) {
  if (!env.SENTRY_DSN) return

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  })

  Sentry.setupFastifyErrorHandler(fastify)

  fastify.log.info('Sentry initialized')
}
