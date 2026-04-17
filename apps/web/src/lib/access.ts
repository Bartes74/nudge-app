import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nudge/core/types/db'
import { getAccess } from '@nudge/core/billing'
import type { AccessResult } from '@nudge/core/billing'
import { getUserRole, isPrivilegedRole } from '@/lib/auth/roles'

export type { AccessResult }

/**
 * Returns access status for use in Server Components and API routes.
 * Roles admin and tester bypass billing — they always get 'full'.
 */
export async function getServerAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  appMetadata: Record<string, unknown> | undefined,
  email?: string | null,
): Promise<AccessResult> {
  const role = getUserRole({ app_metadata: appMetadata, email })
  if (isPrivilegedRole(role)) {
    return {
      status: 'full',
      subscription: null,
    }
  }

  return getAccess(supabase, userId)
}
