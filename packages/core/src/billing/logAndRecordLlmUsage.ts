import type { SupabaseClient } from '@supabase/supabase-js'
import { logLlmCall, type LogLlmCallInput } from '../llm/client'
import { recordAIUsage } from './recordAIUsage'

export interface LogAndRecordLlmUsageInput extends LogLlmCallInput {
  supabase: SupabaseClient
  isPhotoAnalysis?: boolean
}

export async function logAndRecordLlmUsage(
  input: LogAndRecordLlmUsageInput,
): Promise<string | null> {
  const llmCallId = await logLlmCall(input)

  if (!llmCallId || !input.userId) {
    return llmCallId
  }

  await recordAIUsage(input.supabase, input.userId, {
    costUsd: input.meta.cost_usd,
    tokensIn: input.meta.tokens_in,
    tokensOut: input.meta.tokens_out,
    isPhotoAnalysis: input.isPhotoAnalysis ?? false,
  })

  return llmCallId
}
