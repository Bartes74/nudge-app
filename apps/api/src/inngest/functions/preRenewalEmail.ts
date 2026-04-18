import * as React from 'react'
import { inngest } from '../client.js'
import { sendEmail } from '../../email/sender.js'
import { PreRenewalD14Email } from '../../email/templates/PreRenewalD14.js'
import { createSupabaseAdminClient } from '../../lib/supabaseAdmin.js'
import type { ApiCronContext } from '../types.js'

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://nudge.app'

/**
 * Daily cron: finds yearly subscribers whose renewal is in 14 days.
 * Sends a year-in-review + renewal reminder email.
 */
export const sendPreRenewalEmails = inngest.createFunction(
  {
    id: 'pre-renewal-d14-email',
    name: 'Pre-renewal D14 yearly summary email',
    triggers: [{ cron: '0 10 * * *' }],
  },
  async ({ step }: ApiCronContext) => {
    const supabase = createSupabaseAdminClient()

    const in14Days = new Date(Date.now() + 14 * 86_400_000)
    const windowStart = new Date(in14Days.getTime() - 12 * 60 * 60 * 1000).toISOString()
    const windowEnd = new Date(in14Days.getTime() + 12 * 60 * 60 * 1000).toISOString()

    const { data: renewals } = await supabase
      .from('subscriptions')
      .select('user_id, current_period_end, price_amount, price_currency, provider_customer_id')
      .eq('status', 'active')
      .eq('plan', 'yearly')
      .gte('current_period_end', windowStart)
      .lte('current_period_end', windowEnd)

    if (!renewals?.length) return { sent: 0 }

    let sent = 0

    for (const renewal of renewals) {
      await step.run(`pre-renewal-${renewal.user_id}`, async () => {
        const { data: authUser } = await supabase.auth.admin.getUserById(renewal.user_id)
        if (!authUser.user?.email) return

        const { data: profile } = await supabase
          .from('user_profile')
          .select('display_name')
          .eq('user_id', renewal.user_id)
          .maybeSingle()

        const yearStart = new Date(Date.now() - 365 * 86_400_000).toISOString()

        const { count: workoutsThisYear } = await supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', renewal.user_id)
          .not('ended_at', 'is', null)
          .gte('started_at', yearStart)

        const { count: mealsLoggedThisYear } = await supabase
          .from('meal_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', renewal.user_id)
          .gte('created_at', yearStart)

        const { count: checkInsThisYear } = await supabase
          .from('checkin_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', renewal.user_id)
          .not('submitted_at', 'is', null)
          .gte('submitted_at', yearStart)

        const firstName = profile?.display_name?.split(' ')[0] ?? 'tam'
        const amount = renewal.price_amount
          ? `${(renewal.price_amount / 100).toFixed(0)} ${renewal.price_currency}`
          : '349 PLN'

        const renewalDate = renewal.current_period_end
          ? new Date(renewal.current_period_end).toLocaleDateString('pl-PL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '—'

        // Build portal URL for this customer
        const portalUrl = renewal.provider_customer_id
          ? `${APP_URL}/app/billing`
          : `${APP_URL}/app/billing`

        await sendEmail({
          to: authUser.user.email,
          subject: `Rok z Nudge — podsumowanie i odnowienie za 14 dni`,
          template: React.createElement(PreRenewalD14Email, {
            firstName,
            workoutsThisYear: workoutsThisYear ?? 0,
            mealsLoggedThisYear: mealsLoggedThisYear ?? 0,
            checkInsThisYear: checkInsThisYear ?? 0,
            renewalDate,
            renewalAmount: amount,
            portalUrl,
          }),
        })

        sent++
      })
    }

    return { sent }
  },
)
