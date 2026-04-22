export interface HistoricalLlmCallUsage {
  id: string
  user_id: string | null
  created_at: string
  cost_usd: number | null
  tokens_in: number | null
  tokens_out: number | null
}

export interface UserAIUsageBackfillRow {
  user_id: string
  month_key: string
  llm_calls_count: number
  photo_analysis_count: number
  tokens_in_total: number
  tokens_out_total: number
  cost_usd_total: number
}

function monthKeyFromTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function aggregateUserAIUsage(
  calls: HistoricalLlmCallUsage[],
  photoAnalysisCallIds: Iterable<string>,
): UserAIUsageBackfillRow[] {
  const photoCallIdSet = new Set(photoAnalysisCallIds)
  const usageByUserAndMonth = new Map<string, UserAIUsageBackfillRow>()

  for (const call of calls) {
    if (!call.user_id) continue

    const monthKey = monthKeyFromTimestamp(call.created_at)
    const aggregateKey = `${call.user_id}:${monthKey}`
    const current =
      usageByUserAndMonth.get(aggregateKey) ??
      {
        user_id: call.user_id,
        month_key: monthKey,
        llm_calls_count: 0,
        photo_analysis_count: 0,
        tokens_in_total: 0,
        tokens_out_total: 0,
        cost_usd_total: 0,
      }

    current.llm_calls_count += 1
    current.tokens_in_total += call.tokens_in ?? 0
    current.tokens_out_total += call.tokens_out ?? 0
    current.cost_usd_total += call.cost_usd ?? 0

    if (photoCallIdSet.has(call.id)) {
      current.photo_analysis_count += 1
    }

    usageByUserAndMonth.set(aggregateKey, current)
  }

  return [...usageByUserAndMonth.values()]
    .sort((left, right) => {
      if (left.user_id === right.user_id) {
        return left.month_key.localeCompare(right.month_key)
      }
      return left.user_id.localeCompare(right.user_id)
    })
    .map((row) => ({
      ...row,
      cost_usd_total: Number(row.cost_usd_total.toFixed(6)),
    }))
}
