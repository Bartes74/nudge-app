// Core domain types for user profile

export type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say'

export type AgeBucket = 'under_25' | 'age_25_40' | 'age_40_55' | 'age_55_plus'

export type ExperienceLevel = 'zero' | 'beginner' | 'amateur' | 'advanced'

export type PrimaryGoal =
  | 'weight_loss'
  | 'muscle_building'
  | 'strength_performance'
  | 'general_health'

export type TonePreset = 'warm_encouraging' | 'partnering' | 'factual_technical'

export type NutritionMode = 'simple' | 'ranges' | 'exact'

export type LocationType = 'home' | 'gym' | 'mixed'

export interface ProfileInput {
  experience_level: ExperienceLevel | null
  primary_goal: PrimaryGoal | null
  gender: Gender | null
  birth_date: string | null  // ISO date string
  height_cm: number | null
  current_weight_kg: number | null
  days_per_week: number | null
  equipment_location: LocationType | null
  nutrition_mode: NutritionMode | null
  dietary_constraints: string[] | null
  life_context: string[] | null
  health_constraints: string[] | null
  is_pregnant: boolean | null
}
