/**
 * Shared test fixtures for rules engine tests.
 */

import type { BmrInput } from '../bmr'
import type { TdeeInput } from '../tdee'
import type { MacroInput } from '../macros'
import type { VolumeInput } from '../volume'
import type { ExerciseSession } from '../progression'
import type { GuardrailProfile, GuardrailContext } from '../guardrails/types'

// ── BMR / TDEE fixtures ──────────────────────────────────────────────────────

export const MALE_70KG_175CM_30: BmrInput = {
  weight_kg: 70,
  height_cm: 175,
  age: 30,
  gender: 'male',
}

export const FEMALE_60KG_165CM_25: BmrInput = {
  weight_kg: 60,
  height_cm: 165,
  age: 25,
  gender: 'female',
}

export const OTHER_80KG_180CM_40: BmrInput = {
  weight_kg: 80,
  height_cm: 180,
  age: 40,
  gender: 'other',
}

export const TDEE_MODERATE_MALE: TdeeInput = {
  ...MALE_70KG_175CM_30,
  activity_level: 'moderate',
}

export const TDEE_SEDENTARY_FEMALE: TdeeInput = {
  ...FEMALE_60KG_165CM_25,
  activity_level: 'sedentary',
}

// ── Macro fixtures ───────────────────────────────────────────────────────────

export const MACRO_WEIGHT_LOSS: MacroInput = {
  tdee_kcal: 2000,
  weight_kg: 70,
  goal: 'weight_loss',
}

export const MACRO_MUSCLE_BUILDING: MacroInput = {
  tdee_kcal: 2500,
  weight_kg: 80,
  goal: 'muscle_building',
}

export const MACRO_STRENGTH: MacroInput = {
  tdee_kcal: 2800,
  weight_kg: 90,
  goal: 'strength_performance',
}

export const MACRO_GENERAL_HEALTH: MacroInput = {
  tdee_kcal: 2000,
  weight_kg: 65,
  goal: 'general_health',
}

// ── Volume fixtures ──────────────────────────────────────────────────────────

export const VOLUME_ZERO_GENERAL: VolumeInput = {
  experience_level: 'beginner_zero',
  primary_goal: 'general_health',
}

export const VOLUME_ADVANCED_MUSCLE: VolumeInput = {
  experience_level: 'advanced',
  primary_goal: 'muscle_building',
}

// ── Progression fixtures ─────────────────────────────────────────────────────

export const SESSION_HIT_TOP: ExerciseSession = {
  weight_kg: 80,
  total_reps: 30,
  target_total_reps: 30,
  hit_top_of_range: true,
}

export const SESSION_DID_NOT_HIT_TOP: ExerciseSession = {
  weight_kg: 80,
  total_reps: 24,
  target_total_reps: 30,
  hit_top_of_range: false,
}

// ── Guardrail fixtures ───────────────────────────────────────────────────────

export const PROFILE_SAFE: GuardrailProfile = {
  age: 25,
  gender: 'male',
  weight_kg: 75,
  height_cm: 178,
  is_pregnant: false,
}

export const PROFILE_UNDERAGE: GuardrailProfile = {
  ...PROFILE_SAFE,
  age: 16,
}

export const PROFILE_PREGNANT: GuardrailProfile = {
  ...PROFILE_SAFE,
  gender: 'female',
  is_pregnant: true,
}

export const PROFILE_BMI_CRITICAL_LOW: GuardrailProfile = {
  age: 25,
  gender: 'female',
  weight_kg: 38,
  height_cm: 165,
  is_pregnant: false,
}

export const PROFILE_BMI_WARNING_LOW: GuardrailProfile = {
  age: 25,
  gender: 'female',
  weight_kg: 44,
  height_cm: 165,
  is_pregnant: false,
}

export const PROFILE_BMI_WARNING_HIGH: GuardrailProfile = {
  age: 40,
  gender: 'male',
  weight_kg: 130,
  height_cm: 175,
  is_pregnant: false,
}

export const CONTEXT_SAFE: GuardrailContext = {
  planned_calories: 2000,
  recent_weights: null,
}

export const CONTEXT_LOW_CALORIES_FEMALE: GuardrailContext = {
  planned_calories: 1000,
  recent_weights: null,
}

export const CONTEXT_RAPID_WEIGHT_LOSS: GuardrailContext = {
  planned_calories: 1800,
  recent_weights: [
    { weight_kg: 80, measured_at: '2026-04-01T08:00:00Z' },
    { weight_kg: 79, measured_at: '2026-04-08T08:00:00Z' },  // 1.25%/week → warning (>1%, <1.5%)
  ],
}

export const CONTEXT_CRITICAL_WEIGHT_LOSS: GuardrailContext = {
  planned_calories: 1800,
  recent_weights: [
    { weight_kg: 80, measured_at: '2026-04-01T08:00:00Z' },
    { weight_kg: 78, measured_at: '2026-04-08T08:00:00Z' },  // 2.5% in 7 days → critical
  ],
}
