#!/usr/bin/env tsx
/**
 * One-time Stripe setup script.
 * Creates Products, Prices, and Customer Portal configuration for Nudge.
 *
 * Run once per Stripe account (test + prod separately):
 *   STRIPE_SECRET_KEY=sk_test_... tsx scripts/stripe-setup.ts
 *
 * Outputs the IDs to copy into your .env.local / Vercel env vars.
 */

import Stripe from 'stripe'

const secretKey = process.env['STRIPE_SECRET_KEY']
if (!secretKey) {
  console.error('STRIPE_SECRET_KEY is required')
  process.exit(1)
}

const stripe = new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' })

async function run() {
  console.log('Setting up Stripe products and prices for Nudge...\n')

  // ── Products ──────────────────────────────────────────────────────────────
  const product = await stripe.products.create({
    name: 'Nudge AI Coach',
    description: 'Adaptacyjny AI coach treningowo-żywieniowy. 7-dniowy trial, pełna funkcjonalność.',
    metadata: { app: 'nudge' },
  })
  console.log(`✓ Product created: ${product.id}`)

  // ── Prices ───────────────────────────────────────────────────────────────
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 4900, // 49.00 PLN in grosze
    currency: 'pln',
    recurring: { interval: 'month' },
    nickname: 'Nudge Monthly',
    metadata: { plan: 'monthly' },
  })
  console.log(`✓ Monthly price created: ${monthlyPrice.id}  (49.00 PLN/mc)`)

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 34900, // 349.00 PLN in grosze
    currency: 'pln',
    recurring: { interval: 'year' },
    nickname: 'Nudge Yearly',
    metadata: { plan: 'yearly' },
  })
  console.log(`✓ Yearly price created: ${yearlyPrice.id}  (349.00 PLN/rok)`)

  // ── Customer Portal ───────────────────────────────────────────────────────
  const portalConfig = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Zarządzaj swoją subskrypcją Nudge',
      privacy_policy_url: 'https://nudge.app/privacy',
      terms_of_service_url: 'https://nudge.app/terms',
    },
    features: {
      subscription_pause: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        cancellation_reason: {
          enabled: true,
          options: [
            'too_expensive',
            'missing_features',
            'switched_service',
            'unused',
            'other',
          ],
        },
      },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        proration_behavior: 'create_prorations',
        products: [
          {
            product: product.id,
            prices: [monthlyPrice.id, yearlyPrice.id],
          },
        ],
      },
    },
    default_return_url: 'https://nudge.app/app/billing',
  })
  console.log(`✓ Customer Portal config created: ${portalConfig.id}`)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n========================================')
  console.log('Add these to your .env.local / Vercel:')
  console.log('========================================')
  console.log(`STRIPE_MONTHLY_PRICE_ID=${monthlyPrice.id}`)
  console.log(`STRIPE_YEARLY_PRICE_ID=${yearlyPrice.id}`)
  console.log(`STRIPE_PORTAL_CONFIG_ID=${portalConfig.id}`)
  console.log('\nStripe webhook endpoint:')
  console.log('  https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhook')
  console.log('\nAfter creating the webhook in Stripe Dashboard, add:')
  console.log('  STRIPE_WEBHOOK_SECRET=whsec_...')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
