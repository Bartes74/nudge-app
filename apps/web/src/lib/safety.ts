/**
 * persistFlags — writes guardrail results to user_safety_flags in Supabase.
 *
 * Lives in apps/web (not packages/core) because it has a DB side-effect.
 * packages/core evaluateGuardrails() is the pure function; this is the transport layer.
 *
 * NOTE: The DB `safety_flag` enum does not yet include `bmi_extreme`.
 * A future migration must add it. Until then, bmi_extreme rows are cast as unknown.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@nudge/core/types/db'
import type { GuardrailResult } from '@nudge/core/rules/guardrails'

type DbSafetyFlag = Database['public']['Enums']['safety_flag']
type SafetyFlagInsert = Database['public']['Tables']['user_safety_flags']['Insert']

/**
 * Upsert guardrail results for a user.
 *
 * For each GuardrailResult:
 *   - inserts or updates a row in user_safety_flags with status = 'active'
 *
 * For flags that are no longer triggered:
 *   - marks them resolved: status = 'resolved', resolved_at = now()
 *
 * @param supabase  Server-side Supabase client (with user session)
 * @param userId    The authenticated user's UUID
 * @param results   Output of evaluateGuardrails()
 */
export async function persistFlags(
  supabase: SupabaseClient<Database>,
  userId: string,
  results: GuardrailResult[],
): Promise<void> {
  // 1. Upsert active flags
  if (results.length > 0) {
    const inserts: SafetyFlagInsert[] = results.map((r) => ({
      user_id: userId,
      // Cast required until `bmi_extreme` is added to the safety_flag DB enum
      flag: r.flag as DbSafetyFlag,
      severity: r.severity,
      status: 'active' as const,
      restrictions_applied: r.restrictions as unknown as Json,
      resolved_at: null,
    }))

    const { error: upsertError } = await supabase
      .from('user_safety_flags')
      .upsert(inserts, { onConflict: 'user_id,flag', ignoreDuplicates: false })

    if (upsertError) {
      throw new Error(`persistFlags upsert failed: ${upsertError.message}`)
    }
  }

  // 2. Resolve flags that are no longer triggered
  const activeFlags = results.map((r) => r.flag as DbSafetyFlag)

  let query = supabase
    .from('user_safety_flags')
    .update({ status: 'resolved' as const, resolved_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (activeFlags.length > 0) {
    query = query.not('flag', 'in', `(${activeFlags.map((f) => `"${f}"`).join(',')})`)
  }

  const { error: resolveError } = await query

  if (resolveError) {
    throw new Error(`persistFlags resolve failed: ${resolveError.message}`)
  }
}
