import { createEnv } from '@nudge/config/env'
import { z } from 'zod'

export const env = createEnv({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .default('http://localhost:3000'),
  NEXT_PUBLIC_SENTRY_DSN: z
    .string()
    .url('NEXT_PUBLIC_SENTRY_DSN must be a valid URL')
    .optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_POSTHOG_KEY is required'),
  NEXT_PUBLIC_POSTHOG_HOST: z
    .string()
    .url()
    .default('https://app.posthog.com'),
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  NEXT_PUBLIC_DEV_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  INNGEST_EVENT_KEY: z.string().min(1, 'INNGEST_EVENT_KEY is required').default('local'),
  INNGEST_SIGNING_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required')
    .optional(),
  STRIPE_MONTHLY_PRICE_ID: z.string().min(1, 'STRIPE_MONTHLY_PRICE_ID is required').optional(),
  STRIPE_YEARLY_PRICE_ID: z.string().min(1, 'STRIPE_YEARLY_PRICE_ID is required').optional(),
})

function isLocalHost(url: string): boolean {
  const hostname = new URL(url).hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function warnIfLocalWebUsesRemoteSupabase() {
  if (env.NODE_ENV !== 'development') return

  try {
    if (
      isLocalHost(env.NEXT_PUBLIC_APP_URL) &&
      !isLocalHost(env.NEXT_PUBLIC_SUPABASE_URL)
    ) {
      console.warn(
        [
          '[env] Local web is configured against a remote Supabase project.',
          'If you are running localhost, point NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to the local Supabase instance.',
          `Current Supabase URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`,
        ].join(' '),
      )
    }
  } catch {
    // URL parsing is already validated by zod above.
  }
}

warnIfLocalWebUsesRemoteSupabase()
