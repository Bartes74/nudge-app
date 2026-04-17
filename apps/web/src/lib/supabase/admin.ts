import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nudge/core/types/db'
import { env } from '@/lib/env'
import { isBootstrapAdminEmail } from '@/lib/auth/roles'

type SyncableUser = {
  id: string
  email?: string | null
  app_metadata?: Record<string, unknown> | null
}

export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

export async function ensureBootstrapAdminMetadata(user: SyncableUser) {
  if (!isBootstrapAdminEmail(user.email)) return
  if (user.app_metadata?.['role'] === 'admin') return

  const admin = createAdminClient()

  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...(user.app_metadata ?? {}),
      role: 'admin',
    },
  })
}
