import type { Metadata } from 'next'
import { PaywallClient } from './PaywallClient'
import { env } from '@/lib/env'

export const metadata: Metadata = { title: 'Aktywuj plan — Nudge' }

export default function PaywallPage() {
  const billingEnabled = Boolean(
    env.NEXT_PUBLIC_API_URL &&
      env.STRIPE_MONTHLY_PRICE_ID &&
      env.STRIPE_YEARLY_PRICE_ID,
  )

  return (
    <PaywallClient
      billingEnabled={billingEnabled}
      apiUrl={env.NEXT_PUBLIC_API_URL ?? null}
      monthlyPriceId={env.STRIPE_MONTHLY_PRICE_ID ?? null}
      yearlyPriceId={env.STRIPE_YEARLY_PRICE_ID ?? null}
    />
  )
}
