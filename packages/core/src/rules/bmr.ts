/**
 * BMR — Basal Metabolic Rate
 * Formula: Mifflin-St Jeor (1990)
 *
 *   Male:   10 × weight_kg + 6.25 × height_cm − 5 × age + 5
 *   Female: 10 × weight_kg + 6.25 × height_cm − 5 × age − 161
 *   Other:  average of male and female results
 *
 * Returns null when required inputs are missing (weight or height or age).
 * Callers must handle null — never silently fall back to a magic number.
 */

import type { Gender } from '../domain/profile'

export interface BmrInput {
  weight_kg: number | null
  height_cm: number | null
  /** Age in full years. Derived from birth_date by the caller. */
  age: number | null
  gender: Gender | null
}

export interface BmrResult {
  bmr_kcal: number
  formula: 'mifflin_st_jeor'
  gender_used: 'male' | 'female' | 'averaged'
}

function bmrMale(weight_kg: number, height_cm: number, age: number): number {
  return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
}

function bmrFemale(weight_kg: number, height_cm: number, age: number): number {
  return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
}

export function calculateBMR(input: BmrInput): BmrResult | null {
  const { weight_kg, height_cm, age, gender } = input

  if (weight_kg == null || height_cm == null || age == null) return null
  if (weight_kg <= 0 || height_cm <= 0 || age <= 0) return null

  if (gender === 'male') {
    return {
      bmr_kcal: Math.round(bmrMale(weight_kg, height_cm, age)),
      formula: 'mifflin_st_jeor',
      gender_used: 'male',
    }
  }

  if (gender === 'female') {
    return {
      bmr_kcal: Math.round(bmrFemale(weight_kg, height_cm, age)),
      formula: 'mifflin_st_jeor',
      gender_used: 'female',
    }
  }

  // gender === 'other' | 'prefer_not_to_say' | null → average
  const averaged = (bmrMale(weight_kg, height_cm, age) + bmrFemale(weight_kg, height_cm, age)) / 2
  return {
    bmr_kcal: Math.round(averaged),
    formula: 'mifflin_st_jeor',
    gender_used: 'averaged',
  }
}

/** Convenience: derive age from ISO birth_date string (YYYY or YYYY-MM-DD). */
export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null
  const year = parseInt(birthDate.slice(0, 4), 10)
  if (isNaN(year)) return null
  const age = new Date().getFullYear() - year
  return age > 0 ? age : null
}
