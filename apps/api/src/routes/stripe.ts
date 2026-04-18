import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { stripe } from '../stripe/client.js'
import { env } from '../lib/env.js'
import { createSupabaseAdminClient } from '../lib/supabaseAdmin.js'

const createCheckoutSchema = z.object({
  priceId: z.string().min(1),
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

const createPortalSchema = z.object({
  userId: z.string().uuid(),
  returnUrl: z.string().url(),
})

export function stripeRoutes(app: FastifyInstance) {
  const supabaseAdmin = createSupabaseAdminClient()

  /**
   * POST /stripe/checkout
   * Creates a Stripe Checkout Session and returns the URL.
   * Called by the /paywall page after user clicks a plan.
   */
  app.post('/stripe/checkout', async (request, reply) => {
    const body = createCheckoutSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request', issues: body.error.issues })
    }

    const { priceId, userId, userEmail, successUrl, cancelUrl } = body.data

    // Find or create Stripe customer
    let customerId: string | undefined
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('provider_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (sub?.provider_customer_id) {
      customerId = sub.provider_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { nudge_user_id: userId },
      })
      customerId = customer.id

      // Store customer id immediately so webhook can look up the user
      await supabaseAdmin
        .from('subscriptions')
        .update({ provider_customer_id: customerId })
        .eq('user_id', userId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { nudge_user_id: userId },
      },
      allow_promotion_codes: true,
      locale: 'pl',
    })

    return reply.send({ url: session.url })
  })

  /**
   * POST /stripe/portal
   * Creates a Stripe Customer Portal session and returns the URL.
   * Called by /app/billing to let users manage their subscription.
   */
  app.post('/stripe/portal', async (request, reply) => {
    const body = createPortalSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request', issues: body.error.issues })
    }

    const { userId, returnUrl } = body.data

    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('provider_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!sub?.provider_customer_id) {
      return reply.status(404).send({ error: 'No Stripe customer found for this user' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.provider_customer_id,
      configuration: env.STRIPE_PORTAL_CONFIG_ID,
      return_url: returnUrl,
    })

    return reply.send({ url: session.url })
  })
}
