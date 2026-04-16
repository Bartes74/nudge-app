import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'
import type { Database } from '@nudge/core/types/db'

/**
 * Browser Supabase client — use in Client Components.
 * Creates a singleton per page load via `createBrowserClient`.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
