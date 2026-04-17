import type { Gender, PrimaryGoal, NutritionMode, ActivityLevel, ExperienceLevel } from '../../domain/profile'

export interface NutritionPlannerProfile {
  user_id: string
  gender: Gender | null
  age: number | null
  weight_kg: number | null
  height_cm: number | null
  activity_level: ActivityLevel | null
  primary_goal: PrimaryGoal | null
  nutrition_mode: NutritionMode
  dietary_constraints: string[]
  life_context: string[]
  experience_level: ExperienceLevel | null
}

export interface MealDistributionEntry {
  meal: number
  name: string
  kcal_share: number
  time: string
}

export interface SupplementRecommendations {
  sensible: string[]
  optional: string[]
  unnecessary: string[]
}

export interface EmergencyPlan {
  no_time: string
  party: string
  hunger: string
  low_energy: string
  stagnation: string
}

export interface PracticalGuidelines {
  base_products: string[]
  protein_sources: string[]
  limit: string[]
}

export interface NumericalTargets {
  calories_target: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g: number
  water_ml: number
}

export interface NutritionPlanOutput extends NumericalTargets {
  meal_distribution: MealDistributionEntry[]
  strategy_notes: string
  practical_guidelines: PracticalGuidelines
  supplement_recommendations: SupplementRecommendations
  emergency_plan: EmergencyPlan
}

export interface LlmNutritionOutput {
  meal_distribution: MealDistributionEntry[]
  strategy_notes: string
  practical_guidelines: PracticalGuidelines
  supplement_recommendations: SupplementRecommendations
  emergency_plan: EmergencyPlan
}
