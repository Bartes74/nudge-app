import { createClient } from '@supabase/supabase-js'
import { inngest } from '../client'

const PROACTIVE_COOLDOWN_DAYS = 3
const MISSED_WORKOUTS_THRESHOLD = 2
const ONBOARDING_DAYS_THRESHOLD = 14

function serviceClient() {
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  )
}

type UserId = string

async function shouldSendProactiveNudge(
  supabase: ReturnType<typeof serviceClient>,
  userId: UserId,
): Promise<{ send: boolean; reason: 'missed_workouts' | 'onboarding_summary' | null }> {
  const { data: signals } = await supabase
    .from('behavior_signals')
    .select(
      'missed_workouts_7d, days_since_registration, last_proactive_coach_at',
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (!signals) return { send: false, reason: null }

  // Check cooldown
  if (signals.last_proactive_coach_at) {
    const lastNudge = new Date(signals.last_proactive_coach_at as string)
    const daysSince = (Date.now() - lastNudge.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < PROACTIVE_COOLDOWN_DAYS) return { send: false, reason: null }
  }

  if ((signals.missed_workouts_7d as number) >= MISSED_WORKOUTS_THRESHOLD) {
    return { send: true, reason: 'missed_workouts' }
  }

  if ((signals.days_since_registration as number) >= ONBOARDING_DAYS_THRESHOLD) {
    const { data: conversation } = await supabase
      .from('coach_conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('entry_point', 'proactive_coach')
      .limit(1)
      .maybeSingle()

    if (!conversation) {
      return { send: true, reason: 'onboarding_summary' }
    }
  }

  return { send: false, reason: null }
}

function buildOpenerMessage(reason: 'missed_workouts' | 'onboarding_summary'): string {
  if (reason === 'missed_workouts') {
    return 'Zauważyłem, że w ostatnim tygodniu opuściłeś kilka treningów. Chcesz pogadać o tym, co stoi na przeszkodzie? Może dostosujemy plan.'
  }
  return 'Mamy Cię już od ponad 2 tygodni! Chcesz zrobić szybkie podsumowanie — co działa, a co można poprawić?'
}

export const proactiveCoachCheckJob = inngest.createFunction(
  {
    id: 'proactive-coach-check',
    name: 'Proactive Coach Check',
    triggers: [
      { cron: '0 */6 * * *' },
      { event: 'nudge/coach.proactive.check' },
    ],
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

    let nudgesSent = 0

    for (const userId of activeUserIds) {
      const { send, reason } = await step.run(
        `check-user-${userId}`,
        async () => shouldSendProactiveNudge(supabase, userId),
      )

      if (!send || !reason) continue

      await step.run(`nudge-user-${userId}`, async () => {
        // Create proactive conversation
        const { data: conv } = await supabase
          .from('coach_conversations')
          .insert({
            user_id: userId,
            entry_point: 'proactive_coach',
          })
          .select('id')
          .single()

        if (!conv) return

        // Insert opener message as assistant
        await supabase.from('coach_messages').insert({
          conversation_id: conv.id,
          role: 'assistant',
          content: buildOpenerMessage(reason),
        })

        // Update last_message_at on conversation
        await supabase
          .from('coach_conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conv.id)

        // Update cooldown timestamp
        await supabase
          .from('behavior_signals')
          .update({ last_proactive_coach_at: new Date().toISOString() })
          .eq('user_id', userId)
      })

      nudgesSent++
    }

    return { checked: activeUserIds.length, nudgesSent }
  },
)
