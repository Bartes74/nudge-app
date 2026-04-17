import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getServerAccess } from '@/lib/access'
import { env } from '@/lib/env'
import { BillingClient } from './BillingClient'

export const metadata: Metadata = { title: 'Subskrypcja — Nudge' }

export default async function BillingPage() {
  const billingEnabled = Boolean(env.NEXT_PUBLIC_API_URL)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const access = await getServerAccess(
    supabase,
    user.id,
    user.app_metadata as Record<string, unknown> | undefined,
    user.email,
  )

  return (
    <BillingClient
      access={access}
      userId={user.id}
      userEmail={user.email ?? ''}
      billingEnabled={billingEnabled}
      apiUrl={env.NEXT_PUBLIC_API_URL ?? null}
    />
  )
}
