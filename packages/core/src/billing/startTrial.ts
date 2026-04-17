import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/db'

/**
 * Explicitly starts a trial for a user.
 * In practice this is handled automatically by the DB trigger on_user_created_start_trial,
 * but this function lets application code ensure the record exists and return it.
 * Safe to call multiple times — will not overwrite an existing subscription.
 */
export async function startTrial(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      status: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      onConflict: 'user_id',
      ignoreDuplicates: true,
    },
  )

  if (error) {
    throw new Error(`startTrial: failed to upsert subscription — ${error.message}`)
  }
}
