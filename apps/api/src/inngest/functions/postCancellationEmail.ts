import * as React from 'react'
import { inngest } from '../client.js'
import { sendEmail } from '../../email/sender.js'
import { PostCancellationD1Email } from '../../email/templates/PostCancellationD1.js'
import { createSupabaseAdminClient } from '../../lib/supabaseAdmin.js'
import type { ApiEventContext } from '../types.js'

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://nudge.app'

/**
 * Triggered when a subscription is cancelled.
 * Sends retention email the next day.
 */
export const sendPostCancellationEmail = inngest.createFunction(
  {
    id: 'post-cancellation-email',
    name: 'Post-cancellation D1 email',
    triggers: [{ event: 'nudge/subscription.cancelled' }],
  },
  async ({ event, step }: ApiEventContext<{ userId: string }>) => {
    const { userId } = event.data as { userId: string }

    await step.sleep('wait-1-day', '1d')

    await step.run('send-cancellation-email', async () => {
      const supabase = createSupabaseAdminClient()

      const { data: user } = await supabase.auth.admin.getUserById(userId)
      if (!user.user) return

      const { data: profile } = await supabase
        .from('user_profile')
        .select('display_name')
        .eq('user_id', userId)
        .maybeSingle()

      const firstName = profile?.display_name?.split(' ')[0] ?? 'tam'

      await sendEmail({
        to: user.user.email!,
        subject: 'Twoje dane czekają — wróć kiedy będziesz gotowy/a',
        template: React.createElement(PostCancellationD1Email, {
          firstName,
          returnUrl: `${APP_URL}/paywall`,
        }),
      })
    })
  },
)
