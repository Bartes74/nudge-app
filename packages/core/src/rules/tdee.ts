/**
 * TDEE — Total Daily Energy Expenditure
 * Formula: TDEE = BMR × activity_factor
 *
 * Activity factors (Harris-Benedict scale adapted):
 *   sedentary:   1.2   (desk job, no exercise)
 *   light:       1.375 (1–3 days/week light exercise)
 *   moderate:    1.55  (3–5 days/week moderate exercise)
 *   active:      1.725 (6–7 days/week hard exercise)
 *   very_active: 1.9   (twice/day, very hard exercise or physical job)
 */

import type { ActivityLevel } from '../domain/profile'
import { calculateBMR, ageFromBirthDate, type BmrInput, type BmrResult } from './bmr'

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export interface TdeeInput extends BmrInput {
  activity_level: ActivityLevel | null
  birth_date?: string | null
}

export interface TdeeResult {
  tdee_kcal: number
  bmr: BmrResult
  activity_level: ActivityLevel
  activity_factor: number
}

export function calculateTDEE(input: TdeeInput): TdeeResult | null {
  // Derive age from birth_date if age not provided directly
  const age = input.age ?? ageFromBirthDate(input.birth_date ?? null)
  const bmrResult = calculateBMR({ ...input, age })

  if (bmrResult == null) return null

  const activityLevel = input.activity_level ?? 'sedentary'
  const factor: number = ACTIVITY_FACTORS[activityLevel]

  return {
    tdee_kcal: Math.round(bmrResult.bmr_kcal * factor),
    bmr: bmrResult,
    activity_level: activityLevel,
    activity_factor: factor,
  }
}
