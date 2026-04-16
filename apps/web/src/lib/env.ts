import { createEnv } from '@nudge/config/env'
import { z } from 'zod'

export const env = createEnv({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
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
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
})
