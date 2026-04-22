import type { SupabaseClient } from '@supabase/supabase-js'

export interface AIUsageIncrement {
  costUsd: number
  tokensIn?: number
  tokensOut?: number
  isPhotoAnalysis?: boolean
}

function currentMonthKey(): string {
  const d = new Date()
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
}

/**
 * Atomically increments AI usage counters for the current calendar month.
 * Uses UPSERT with arithmetic so concurrent updates don't race.
 * Called after every LLM invocation that is logged to llm_calls.
 */
export async function recordAIUsage(
  supabase: SupabaseClient,
  userId: string,
  usage: AIUsageIncrement,
): Promise<void> {
  const monthKey = currentMonthKey()

  // Postgres arithmetic upsert: insert initial row or increment existing counters.
  // We use raw SQL via rpc to avoid a read-modify-write race.
  const { error } = await supabase.rpc('increment_ai_usage', {
    p_user_id: userId,
    p_month_key: monthKey,
    p_cost_usd: usage.costUsd,
    p_tokens_in: usage.tokensIn ?? 0,
    p_tokens_out: usage.tokensOut ?? 0,
    p_is_photo: usage.isPhotoAnalysis ?? false,
  })

  if (error) {
    // Non-fatal: usage tracking should not break the main flow.
    // Log and continue — cost alert cron will catch discrepancies.
    console.error(`recordAIUsage: rpc failed — ${error.message}`)
  }
}
