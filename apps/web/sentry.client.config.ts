import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],
  environment: process.env['NODE_ENV'],
  tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
  debug: false,
  // Replay only in production
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 0,
  integrations: [],
})
