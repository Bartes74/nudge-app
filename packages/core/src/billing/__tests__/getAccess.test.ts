import { describe, it, expect, vi } from 'vitest'
import { getAccess } from '../getAccess'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/db'
import type { Subscription } from '../types'

const USER_ID = '00000000-0000-0000-0000-000000000001'

function future(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

function past(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function makeBaseSub(overrides: Partial<Subscription>): Subscription {
  return {
    id: '00000000-0000-0000-0000-000000000099',
    user_id: USER_ID,
    status: 'trial',
    plan: null,
    provider: null,
    provider_subscription_id: null,
    provider_customer_id: null,
    trial_started_at: past(1),
    trial_ends_at: future(6),
    current_period_start: null,
    current_period_end: null,
    paused_until: null,
    cancelled_at: null,
    price_amount: null,
    price_currency: 'PLN',
    created_at: past(1),
    updated_at: past(1),
    ...overrides,
  }
}

function mockSupabase(sub: Subscription | null, error?: { message: string }) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: sub, error: error ?? null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient<Database>
}

describe('getAccess', () => {
  it('returns paywall when no subscription record exists', async () => {
    const result = await getAccess(mockSupabase(null), USER_ID)
    expect(result.status).toBe('paywall')
    expect(result.subscription).toBeNull()
  })

  it('returns trial with daysLeft when trial is active', async () => {
    const sub = makeBaseSub({ status: 'trial', trial_ends_at: future(3) })
    const result = await getAccess(mockSupabase(sub), USER_ID)
    expect(result.status).toBe('trial')
    expect(result.trialDaysLeft).toBe(3)
    expect(result.trialEndsAt).toBe(sub.trial_ends_at)
  })

  it('returns paywall when trial has expired', async () => {
    const sub = makeBaseSub({ status: 'trial', trial_ends_at: past(1) })
    const result = await getAccess(mockSupabase(sub), USER_ID)
    expect(result.status).toBe('paywall')
  })

  it('returns paywall when trial_ends_at is null', async () => {
    const sub = makeBaseSub({ status: 'trial', trial_ends_at: null })
    const result = await getAccess(mockSupabase(sub), USER_ID)
    expect(result.status).toBe('paywall')
  })

  it('returns full for active subscription', async () => {
    const sub = makeBaseSub({ status: 'active', plan: 'monthly' })
    const result = await getAccess(mockSupabase(sub), USER_ID)
    expect(result.status).toBe('full')
  })

  it('returns paused when subscription is paused and paused_until is in future', async () => {
    const sub = makeBaseSub({ status: 'paused', paused_until: future(30) })
    const result = await getAccess(mockSupabase(sub), USER_ID)
    expect(result.status).toBe('paused')
    expect(result.pausedUntil).toBe(sub.paused_until)
  })

  it('returns full when paused but paused_until has passed', async () => {
    const sub = makeBaseSub({ status: 'paused', paused_until: past(1) })
    const result = await getAccess(mockSupabase(sub), USER_ID)
    expect(result.status).toBe('full')
  })

  it('returns full for past_due (grace period)', async () => {
    const sub = makeBaseSub({ status: 'past_due', plan: 'monthly' })
    const result = await getAccess(mockSupabase(sub), USER_ID)
    expect(result.status).toBe('full')
  })

  it('returns paywall for cancelled subscription', async () => {
    const sub = makeBaseSub({
      status: 'cancelled',
      cancelled_at: past(3),
    })
    const result = await getAccess(mockSupabase(sub), USER_ID)
    expect(result.status).toBe('paywall')
  })

  it('returns paywall for expired subscription', async () => {
    const sub = makeBaseSub({ status: 'expired' })
    const result = await getAccess(mockSupabase(sub), USER_ID)
    expect(result.status).toBe('paywall')
  })

  it('throws when supabase query returns error', async () => {
    const errSupabase = mockSupabase(null, { message: 'connection timeout' })
    await expect(getAccess(errSupabase, USER_ID)).rejects.toThrow('getAccess')
  })
})
