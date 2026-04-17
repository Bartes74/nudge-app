import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/db'
import type { AccessResult } from './types'

/**
 * Returns the access level for a user based on their subscription record.
 *
 * Access matrix:
 *   trial   + trial_ends_at in future → 'trial'
 *   trial   + trial_ends_at in past   → 'paywall'
 *   active                            → 'full'
 *   paused  + paused_until in future  → 'paused'
 *   paused  + paused_until in past    → 'full'  (pause expired, treat as active)
 *   past_due                          → 'full'  (grace period — don't lock out immediately)
 *   cancelled | expired               → 'paywall'
 *   no record                         → 'paywall'
 *
 * Roles admin and tester bypass this check at the middleware layer.
 * This function is role-agnostic — it only reads the subscriptions table.
 */
export async function getAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AccessResult> {
  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`getAccess: failed to query subscription — ${error.message}`)
  }

  if (!sub) {
    return { status: 'paywall', subscription: null }
  }

  const now = new Date()

  switch (sub.status) {
    case 'trial': {
      const endsAt = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null
      if (!endsAt || endsAt <= now) {
        return { status: 'paywall', subscription: sub }
      }
      const msLeft = endsAt.getTime() - now.getTime()
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
      return {
        status: 'trial',
        trialEndsAt: sub.trial_ends_at ?? undefined,
        trialDaysLeft: daysLeft,
        subscription: sub,
      }
    }

    case 'active':
      return { status: 'full', subscription: sub }

    case 'paused': {
      const pausedUntil = sub.paused_until ? new Date(sub.paused_until) : null
      if (pausedUntil && pausedUntil <= now) {
        return { status: 'full', subscription: sub }
      }
      return {
        status: 'paused',
        pausedUntil: sub.paused_until ?? undefined,
        subscription: sub,
      }
    }

    case 'past_due':
      // Grace period — keep access while payment retries
      return { status: 'full', subscription: sub }

    case 'cancelled':
    case 'expired':
      return { status: 'paywall', subscription: sub }

    default:
      return { status: 'paywall', subscription: sub }
  }
}
