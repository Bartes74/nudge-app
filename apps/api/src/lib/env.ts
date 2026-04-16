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
})
