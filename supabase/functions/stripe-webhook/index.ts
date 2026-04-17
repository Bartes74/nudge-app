// Supabase Edge Function — Stripe Webhook Handler
// Deno runtime. Verifies Stripe signature, then updates subscriptions table.
// ADR-001: webhooks for payments → Edge Functions.

import Stripe from 'npm:stripe@16'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-01-27.acacia',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  const body = await req.text()

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`Webhook signature verification failed: ${msg}`)
    return new Response(`Webhook Error: ${msg}`, { status: 400 })
  }

  try {
    await handleEvent(event)
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`Error handling event ${event.type}: ${msg}`)
    // Return 500 so Stripe will retry
    return new Response(`Handler error: ${msg}`, { status: 500 })
  }
})

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncSubscription(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted':
      await cancelSubscription(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.paused':
      await pauseSubscription(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.resumed':
      await resumeSubscription(event.data.object as Stripe.Subscription)
      break

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice)
      break

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
      break

    default:
      // Unhandled event — log and ignore (don't error)
      console.log(`Unhandled Stripe event: ${event.type}`)
  }
}

async function findUserByCustomerId(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('provider_customer_id', customerId)
    .maybeSingle()
  return data?.user_id ?? null
}

async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = await findUserByCustomerId(customerId)

  if (!userId) {
    // Customer created before we stored the mapping — check metadata
    const metaUserId = sub.metadata?.['nudge_user_id']
    if (!metaUserId) {
      console.warn(`syncSubscription: no user found for customer ${customerId}`)
      return
    }

    // First time link — store customer id
    await supabase
      .from('subscriptions')
      .update({ provider_customer_id: customerId })
      .eq('user_id', metaUserId)
  }

  const resolvedUserId = userId ?? sub.metadata?.['nudge_user_id']
  if (!resolvedUserId) return

  const priceId = sub.items.data[0]?.price.id ?? null
  const interval = sub.items.data[0]?.price.recurring?.interval

  const plan = interval === 'year' ? 'yearly' : interval === 'month' ? 'monthly' : null
  const amount = sub.items.data[0]?.price.unit_amount ?? null
  const currency = (sub.items.data[0]?.price.currency ?? 'pln').toUpperCase()

  let status: 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired'
  switch (sub.status) {
    case 'active':
      status = 'active'
      break
    case 'past_due':
    case 'unpaid':
      status = 'past_due'
      break
    case 'paused':
      status = 'paused'
      break
    case 'canceled':
      status = 'cancelled'
      break
    default:
      status = 'expired'
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status,
      plan,
      provider: 'stripe',
      provider_subscription_id: sub.id,
      provider_customer_id: customerId,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      price_amount: amount,
      price_currency: currency,
      paused_until: sub.pause_collection?.resumes_at
        ? new Date(sub.pause_collection.resumes_at * 1000).toISOString()
        : null,
    })
    .eq('user_id', resolvedUserId)

  if (error) {
    throw new Error(`syncSubscription: update failed — ${error.message}`)
  }
}

async function cancelSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = await findUserByCustomerId(customerId)
  if (!userId) return

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`cancelSubscription: update failed — ${error.message}`)
  }
}

async function pauseSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = await findUserByCustomerId(customerId)
  if (!userId) return

  const resumesAt = sub.pause_collection?.resumes_at
    ? new Date(sub.pause_collection.resumes_at * 1000).toISOString()
    : null

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'paused', paused_until: resumesAt })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`pauseSubscription: update failed — ${error.message}`)
  }
}

async function resumeSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = await findUserByCustomerId(customerId)
  if (!userId) return

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'active', paused_until: null })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`resumeSubscription: update failed — ${error.message}`)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Invoice paid — subscription is already synced via subscription.updated.
  // Additional hook: could trigger a "payment received" notification here.
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const userId = await findUserByCustomerId(customerId)
  if (!userId) return

  // Ensure status is active (handles past_due recovery)
  await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('user_id', userId)
    .eq('status', 'past_due')
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const userId = await findUserByCustomerId(customerId)
  if (!userId) return

  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('user_id', userId)
    .in('status', ['active', 'trial'])
}
