import * as React from 'react'
import { inngest } from '../client.js'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '../../email/sender.js'
import { InactivityD60Email } from '../../email/templates/InactivityD60.js'
import { stripe } from '../../stripe/client.js'
import { env } from '../../lib/env.js'
import type { Database } from '@nudge/core/types/db'

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://nudge.app'
const DISCOUNT_PERCENT = 30

/**
 * Daily cron: finds active subscribers who haven't logged anything in 60 days.
 * Sends re-engagement email with a 30% discount coupon.
 */
export const sendInactivityEmails = inngest.createFunction(
  {
    id: 'inactivity-d60-email',
    name: 'Inactivity D60 re-engagement email',
  },
  { cron: '0 9 * * *' }, // 09:00 UTC daily
  async ({ step }) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const cutoff = new Date(Date.now() - 60 * 86_400_000).toISOString()
    const recentCutoff = new Date(Date.now() - 57 * 86_400_000).toISOString() // avoid resending within 3d window

    // Find active/paused subscribers with no workout/meal logs since 60 days ago
    const { data: candidates } = await supabase
      .from('subscriptions')
      .select('user_id, provider_customer_id')
      .in('status', ['active', 'paused'])

    if (!candidates?.length) return { sent: 0 }

    let sent = 0

    for (const candidate of candidates) {
      await step.run(`re-engagement-${candidate.user_id}`, async () => {
        // Check if already sent recently
        const { data: recentNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', candidate.user_id)
          .eq('type', 're_engagement')
          .gte('sent_at', recentCutoff)
          .maybeSingle()

        if (recentNotif) return

        // Check last activity
        const { count: recentWorkouts } = await supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', candidate.user_id)
          .eq('status', 'finished')
          .gte('started_at', cutoff)

        const { count: recentMeals } = await supabase
          .from('meal_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', candidate.user_id)
          .gte('created_at', cutoff)

        if ((recentWorkouts ?? 0) > 0 || (recentMeals ?? 0) > 0) return

        const { data: authUser } = await supabase.auth.admin.getUserById(
          candidate.user_id,
        )
        if (!authUser.user?.email) return

        const { data: profile } = await supabase
          .from('user_profile')
          .select('display_name')
          .eq('user_id', candidate.user_id)
          .maybeSingle()

        // Build progress note from last workout
        const { data: lastWorkout } = await supabase
          .from('workout_logs')
          .select('started_at')
          .eq('user_id', candidate.user_id)
          .eq('status', 'finished')
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const lastWorkoutDate = lastWorkout?.started_at
          ? new Date(lastWorkout.started_at).toLocaleDateString('pl-PL', {
              day: 'numeric',
              month: 'long',
            })
          : 'kilka miesięcy temu'

        // Count total workouts ever
        const { count: totalWorkouts } = await supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', candidate.user_id)
          .eq('status', 'finished')

        const progressNote =
          totalWorkouts && totalWorkouts > 0
            ? `${totalWorkouts} treningów w Nudge, ostatni: ${lastWorkoutDate}`
            : `Zacząłeś/aś z Nudge ${lastWorkoutDate}`

        // Create Stripe coupon for 30% discount (one-time use)
        let couponCode = 'WRACAM30'
        if (candidate.provider_customer_id) {
          try {
            const coupon = await stripe.coupons.create({
              percent_off: DISCOUNT_PERCENT,
              duration: 'once',
              name: `Nudge re-engagement ${DISCOUNT_PERCENT}%`,
              max_redemptions: 1,
              metadata: { nudge_user_id: candidate.user_id, type: 're_engagement' },
            })
            couponCode = coupon.id
          } catch {
            // Coupon creation failure is non-fatal — use generic code
          }
        }

        const firstName = profile?.display_name?.split(' ')[0] ?? 'tam'

        await sendEmail({
          to: authUser.user.email,
          subject: `${firstName}, Twój postęp czeka — i mamy dla Ciebie rabat`,
          template: React.createElement(InactivityD60Email, {
            firstName,
            lastProgressNote: progressNote,
            discountPercent: DISCOUNT_PERCENT,
            couponCode,
            returnUrl: `${APP_URL}/paywall`,
          }),
        })

        // Log the notification to prevent duplicates
        await supabase.from('notifications').insert({
          user_id: candidate.user_id,
          type: 're_engagement',
          title: 'Re-engagement email',
          sent_at: new Date().toISOString(),
        })

        sent++
      })
    }

    return { sent }
  },
)
