import { inngest } from '../client.js'
import { createClient } from '@supabase/supabase-js'
import { env } from '../../lib/env.js'
import type { Database } from '@nudge/core/types/db'

const COST_ALERT_THRESHOLD_USD = 3.0

/**
 * Daily cron: calculates cost per active user for the last 30 days.
 * Sends Slack alert if threshold exceeded (ADR-004).
 */
export const checkCostAlert = inngest.createFunction(
  {
    id: 'cost-alert-daily',
    name: 'Daily cost per active user alert',
  },
  { cron: '0 8 * * *' }, // 08:00 UTC daily
  async () => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const now = new Date()
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const prevMonth = now.getUTCMonth() === 0
      ? `${now.getUTCFullYear() - 1}-12`
      : `${now.getUTCFullYear()}-${String(now.getUTCMonth()).padStart(2, '0')}`

    // Total AI cost for current + previous month
    const { data: usageRows } = await supabase
      .from('user_ai_usage')
      .select('user_id, cost_usd_total')
      .in('month_key', [currentMonth, prevMonth])

    const totalCost = usageRows?.reduce((sum, r) => sum + Number(r.cost_usd_total), 0) ?? 0
    const uniqueUsers = new Set(usageRows?.map((r) => r.user_id) ?? []).size

    if (uniqueUsers === 0) return { skipped: true }

    const costPerUser = totalCost / uniqueUsers

    // Count active subscribers
    const { count: activeCount } = await supabase
      .from('subscriptions')
      .select('user_id', { count: 'exact', head: true })
      .in('status', ['active', 'trial', 'paused'])

    if (!env.SLACK_COST_ALERT_WEBHOOK_URL) return { costPerUser, activeCount, alerted: false }

    if (costPerUser > COST_ALERT_THRESHOLD_USD) {
      await sendSlackAlert({
        webhookUrl: env.SLACK_COST_ALERT_WEBHOOK_URL,
        costPerUser,
        totalCost,
        activeUsers: activeCount ?? 0,
        month: currentMonth,
      })
      return { costPerUser, activeCount, alerted: true }
    }

    return { costPerUser, activeCount, alerted: false }
  },
)

async function sendSlackAlert({
  webhookUrl,
  costPerUser,
  totalCost,
  activeUsers,
  month,
}: {
  webhookUrl: string
  costPerUser: number
  totalCost: number
  activeUsers: number
  month: string
}) {
  const payload = {
    text: `🚨 *Nudge Cost Alert — ${month}*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🚨 *Cost per active user exceeded threshold*\n\n*Cost/user:* $${costPerUser.toFixed(2)} (threshold: $${COST_ALERT_THRESHOLD_USD.toFixed(2)})\n*Total AI cost:* $${totalCost.toFixed(2)}\n*Active users:* ${activeUsers}\n*Period:* ${month}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Check `user_ai_usage` table for top consumers. Consider: image compression, prompt caching, rate limit review.',
        },
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    console.error(`Slack alert failed: ${res.status} ${await res.text()}`)
  }
}
