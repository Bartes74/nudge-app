import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import type { Database } from '@nudge/core/types/db'

/**
 * Server Supabase client — use in Server Components, Server Actions, Route Handlers.
 * Must be called inside a request context (has access to cookies).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // Middleware handles cookie refresh.
          }
        },
      },
    },
  )
}

/**
 * Returns the current session user or null.
 * Use in Server Components to gate UI based on auth.
 */
export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
