import type { Database } from '../types/db'

export type SubscriptionStatus = Database['public']['Enums']['subscription_status']
export type SubscriptionPlan = Database['public']['Enums']['subscription_plan']
export type NotificationType = Database['public']['Enums']['notification_type']

export type Subscription = Database['public']['Tables']['subscriptions']['Row']

/**
 * Access level returned by getAccess().
 *
 * full    — active paid subscription
 * trial   — within 7-day trial window
 * paused  — subscription paused; read-only access
 * paywall — trial expired, cancelled, past_due, or no subscription record
 */
export type AccessStatus = 'full' | 'trial' | 'paused' | 'paywall'

export interface AccessResult {
  status: AccessStatus
  /** ISO string of trial end, present when status === 'trial' */
  trialEndsAt?: string
  /** Days remaining in trial (0 = today is last day) */
  trialDaysLeft?: number
  /** ISO string of when pause lifts, present when status === 'paused' */
  pausedUntil?: string
  /** Raw subscription row, null when no record exists */
  subscription: Subscription | null
}
