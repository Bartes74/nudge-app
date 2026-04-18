import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nudge/core/types/db'
import { env } from './env.js'

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}
