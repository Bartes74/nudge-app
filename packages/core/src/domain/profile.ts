// Core domain types for user profile

export type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say'

export type AgeBucket = 'under_25' | 'age_25_40' | 'age_40_55' | 'age_55_plus'

export type ExperienceLevel = 'beginner_zero' | 'beginner' | 'intermediate' | 'advanced'

export type LegacyExperienceLevel = 'zero' | 'amateur'

export type PrimaryGoal =
  | 'weight_loss'
  | 'muscle_building'
  | 'strength_performance'
  | 'general_health'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export type TonePreset =
  | 'warm_encouraging'
  | 'partnering'
  | 'factual_technical'
  | 'calm_guided'

export type NutritionMode = 'simple' | 'ranges' | 'exact'

export type LocationType = 'home' | 'gym' | 'mixed'

export type EntryPath = 'guided_beginner' | 'standard_training'

export type AdaptationPhase =
  | 'phase_0_familiarization'
  | 'phase_1_adaptation'
  | 'phase_2_foundations'

export type TrainingBackground =
  | 'just_starting'
  | 'returning_after_break'
  | 'knows_basics_needs_plan'
  | 'training_regularly'

export type RecentActivityWindow =
  | 'never_regular'
  | 'over_12_months'
  | 'within_12_months'
  | 'within_3_months'

export type JobActivity =
  | 'mostly_sitting'
  | 'mixed'
  | 'mostly_standing'
  | 'physically_active'

export interface ProfileInput {
  age_years?: number | null
  experience_level: ExperienceLevel | LegacyExperienceLevel | null
  primary_goal: PrimaryGoal | null
  gender: Gender | null
  birth_date: string | null  // ISO date string
  height_cm: number | null
  current_weight_kg: number | null
  days_per_week: number | null
  equipment_location: LocationType | null
  equipment_list?: string[] | null
  entry_path?: EntryPath | null
  adaptation_phase?: AdaptationPhase | null
  needs_guided_mode?: boolean | null
  nutrition_mode: NutritionMode | null
  dietary_constraints: string[] | null
  life_context: string[] | null
  health_constraints: string[] | null
  recent_activity_window?: RecentActivityWindow | null
  last_regular_activity?: string | null
  training_background?: TrainingBackground | null
  job_activity?: JobActivity | null
  is_pregnant: boolean | null
}

export function normalizeExperienceLevel(
  level: ExperienceLevel | LegacyExperienceLevel | null | undefined,
): ExperienceLevel | null {
  if (level == null) return null
  if (level === 'zero') return 'beginner_zero'
  if (level === 'amateur') return 'intermediate'
  return level
}
