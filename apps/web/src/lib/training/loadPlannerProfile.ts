import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nudge/core/types/db'
import type { PlannerProfile } from '@nudge/core/planners/training/types'

type AppSupabaseClient = SupabaseClient<Database>

export async function loadPlannerProfile(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<{
  plannerProfile: PlannerProfile
  profile: Database['public']['Tables']['user_profile']['Row']
  equipment: Database['public']['Tables']['user_equipment']['Row'] | null
  health: Database['public']['Tables']['user_health']['Row'] | null
  goal: Database['public']['Tables']['user_goals']['Row'] | null
}> {
  const [profileRes, equipmentRes, healthRes, goalRes, preferencesRes] = await Promise.all([
    supabase.from('user_profile').select('*').eq('user_id', userId).single(),
    supabase.from('user_equipment').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_health').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_goals').select('*').eq('user_id', userId).eq('is_current', true).maybeSingle(),
    supabase
      .from('user_training_preferences')
      .select('days_per_week, session_duration_min, avoid_exercises')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (profileRes.error || !profileRes.data) {
    throw new Error(`Failed to load profile for user ${userId}: ${profileRes.error?.message}`)
  }

  const profile = profileRes.data
  const equipment = equipmentRes.data
  const health = healthRes.data
  const goal = goalRes.data
  const preferences = preferencesRes.data

  const plannerProfile: PlannerProfile = {
    user_id: userId,
    experience_level: profile.experience_level as PlannerProfile['experience_level'],
    primary_goal: (goal?.goal_type ?? profile.primary_goal) as PlannerProfile['primary_goal'],
    days_per_week: preferences?.days_per_week ?? 3,
    equipment_location:
      (equipment?.location_type as PlannerProfile['equipment_location'] | null) ?? 'gym',
    entry_path: (profile.entry_path as PlannerProfile['entry_path'] | null) ?? 'standard_training',
    adaptation_phase:
      (profile.adaptation_phase as PlannerProfile['adaptation_phase'] | null) ?? null,
    needs_guided_mode: profile.needs_guided_mode ?? false,
    clarity_score: null,
    confidence_score: null,
    trainer_consultation_completed_at:
      (profile.trainer_consultation_completed_at as string | null) ?? null,
    has_barbell: equipment?.has_barbell ?? false,
    has_dumbbells: equipment?.has_dumbbells ?? false,
    has_machines: equipment?.has_machines ?? false,
    has_cables: equipment?.has_cables ?? false,
    has_pullup_bar: equipment?.has_pullup_bar ?? false,
    has_bench: equipment?.has_bench ?? false,
    session_duration_min: preferences?.session_duration_min ?? null,
    avoid_exercises: (preferences?.avoid_exercises as string[] | null) ?? [],
    injuries: (health?.injuries as string[] | null) ?? [],
  }

  return { plannerProfile, profile, equipment, health, goal }
}
