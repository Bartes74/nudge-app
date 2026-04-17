import { createClient } from '@supabase/supabase-js'
import { inngest } from '../client'

function serviceClient() {
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  )
}

// Sunday 19:00 UTC — adjust per user TZ if needed
// Cron: every Sunday at 19:00 UTC
const CRON_SCHEDULE = '0 19 * * 0'

type UserId = string

export const weeklyCheckinNotificationJob = inngest.createFunction(
  {
    id: 'weekly-checkin-notification',
    name: 'Weekly Check-in Notification',
    triggers: [
      { cron: CRON_SCHEDULE },
      { event: 'nudge/checkin.notification.trigger' },
    ],
    // Prevent duplicate sends within 1h
    rateLimit: { limit: 1, period: '1h', key: 'event.data.user_id' },
  },
  async ({ step }: { step: any }) => {
    const supabase = serviceClient()

    const activeUserIds = await step.run('load-active-users', async () => {
      const { data } = await supabase
        .from('behavior_signals')
        .select('user_id')
        .not('user_id', 'is', null)

      return (data ?? []).map((r) => r.user_id as UserId)
    })

    let notified = 0

    for (const userId of activeUserIds) {
      const sent = await step.run(`notify-${userId}`, async () => {
        const weekOf = getCurrentWeekStart()

        // Skip if user already submitted this week
        const { data: existing } = await supabase
          .from('checkin_sessions')
          .select('id, submitted_at')
          .eq('user_id', userId)
          .eq('week_of', weekOf)
          .maybeSingle()

        if (existing?.submitted_at) return false

        // Check proactive nudge cooldown (max 1 per 3 days)
        const { data: signals } = await supabase
          .from('behavior_signals')
          .select('last_proactive_coach_at')
          .eq('user_id', userId)
          .maybeSingle()

        if (signals?.last_proactive_coach_at) {
          const lastNudge = new Date(signals.last_proactive_coach_at as string)
          const daysSince = (Date.now() - lastNudge.getTime()) / (1000 * 60 * 60 * 24)
          if (daysSince < 3) return false
        }

        // Create a proactive coach conversation as the notification mechanism
        const { data: conv } = await supabase
          .from('coach_conversations')
          .insert({
            user_id: userId,
            entry_point: 'checkin_shortcut',
          })
          .select('id')
          .single()

        if (!conv) return false

        await supabase.from('coach_messages').insert({
          conversation_id: conv.id,
          role: 'assistant',
          content: buildCheckinPrompt(),
        })

        await supabase
          .from('coach_conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conv.id)

        await supabase
          .from('behavior_signals')
          .update({ last_proactive_coach_at: new Date().toISOString() })
          .eq('user_id', userId)

        return true
      })

      if (sent) notified++
    }

    return { checked: activeUserIds.length, notified }
  },
)

function getCurrentWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]!
}

function buildCheckinPrompt(): string {
  return 'To koniec tygodnia — czas na Twój cotygodniowy check-in! 📊 Zajmie Ci to 2-3 minuty. Sprawdzimy razem jak poszedł tydzień i czy plan wymaga korekty.'
}
