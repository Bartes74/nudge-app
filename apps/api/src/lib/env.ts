import { createEnv } from '@nudge/config/env'
import { z } from 'zod'

export const env = createEnv({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_PORTAL_CONFIG_ID: z.string().min(1, 'STRIPE_PORTAL_CONFIG_ID is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.string().email().default('hello@nudge.app'),
  SLACK_COST_ALERT_WEBHOOK_URL: z.string().url().optional(),
  INNGEST_EVENT_KEY: z.string().min(1, 'INNGEST_EVENT_KEY is required').default('local'),
  INNGEST_SIGNING_KEY: z.string().optional(),
})
