import * as React from 'react'
import { inngest } from '../client.js'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '../../email/sender.js'
import { TrialD4Email } from '../../email/templates/TrialD4.js'
import { TrialD7Email } from '../../email/templates/TrialD7.js'
import { env } from '../../lib/env.js'
import type { Database } from '@nudge/core/types/db'

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://nudge.app'
const PAYWALL_URL = `${APP_URL}/paywall`

/**
 * Triggered when a user's trial starts.
 * Schedules D4 insight email and D7 conversion email.
 */
export const scheduleTrialEmails = inngest.createFunction(
  { id: 'trial-emails-schedule', name: 'Schedule trial email sequence' },
  { event: 'nudge/trial.started' },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string }

    // D4 — 4 days after trial start
    await step.sleep('wait-4-days', '4d')
    await step.run('send-d4-email', async () => {
      await sendTrialD4(userId)
    })

    // D7 — 3 more days (7 total)
    await step.sleep('wait-3-more-days', '3d')
    await step.run('send-d7-email', async () => {
      await sendTrialD7(userId)
    })
  },
)

async function sendTrialD4(userId: string) {
  const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: user } = await supabase.auth.admin.getUserById(userId)
  if (!user.user) return

  const { data: profile } = await supabase
    .from('user_profile')
    .select('display_name, primary_goal, experience_level')
    .eq('user_id', userId)
    .maybeSingle()

  const { data: prefData } = await supabase
    .from('user_training_preferences')
    .select('days_per_week')
    .eq('user_id', userId)
    .maybeSingle()

  const firstName = profile?.display_name?.split(' ')[0] ?? 'tam'

  await sendEmail({
    to: user.user.email!,
    subject: `Oto co Nudge już wie o Tobie, ${firstName}`,
    template: React.createElement(TrialD4Email, {
      firstName,
      primaryGoal: profile?.primary_goal ?? 'general_health',
      experienceLevel: profile?.experience_level ?? 'beginner',
      workoutsPerWeek: prefData?.days_per_week ?? 3,
      appUrl: `${APP_URL}/app`,
    }),
  })
}

async function sendTrialD7(userId: string) {
  const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: user } = await supabase.auth.admin.getUserById(userId)
  if (!user.user) return

  const { data: profile } = await supabase
    .from('user_profile')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle()

  // Count completed workouts and meal logs during trial
  const trialStart = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const { count: workoutsCompleted } = await supabase
    .from('workout_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'finished')
    .gte('started_at', trialStart)

  const { count: mealsLogged } = await supabase
    .from('meal_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', trialStart)

  const firstName = profile?.display_name?.split(' ')[0] ?? 'tam'

  await sendEmail({
    to: user.user.email!,
    subject: `Ostatni dzień trialu — kontynuuj coaching`,
    template: React.createElement(TrialD7Email, {
      firstName,
      workoutsCompleted: workoutsCompleted ?? 0,
      mealsLogged: mealsLogged ?? 0,
      paywallUrl: PAYWALL_URL,
      monthlyPrice: '49 PLN',
      yearlyPrice: '349 PLN',
    }),
  })
}
