/**
 * Macro targets — grams of protein, fat, carbs per day.
 *
 * Strategy per goal:
 *
 * weight_loss
 *   calories = TDEE × (1 − deficit_pct)     default deficit: 20%
 *   protein  = 2.0 g/kg body weight
 *   fat      = 25% of target calories
 *   carbs    = remainder
 *
 * muscle_building
 *   calories = TDEE × (1 + surplus_pct)     default surplus: 10%
 *   protein  = 2.2 g/kg body weight
 *   fat      = 25% of target calories
 *   carbs    = remainder
 *
 * strength_performance
 *   calories = TDEE (maintenance)
 *   protein  = 2.0 g/kg body weight
 *   fat      = 30% of target calories
 *   carbs    = remainder
 *
 * general_health
 *   calories = TDEE (maintenance)
 *   protein  = 1.6 g/kg body weight
 *   fat      = 30% of target calories
 *   carbs    = remainder
 *
 * Calorie density: protein = 4 kcal/g, fat = 9 kcal/g, carbs = 4 kcal/g
 */

import type { PrimaryGoal } from '../domain/profile'

export interface MacroInput {
  tdee_kcal: number
  weight_kg: number
  goal: PrimaryGoal
  /** 0–1. Only applies to weight_loss. Default: 0.20 */
  deficit_pct?: number
  /** 0–1. Only applies to muscle_building. Default: 0.10 */
  surplus_pct?: number
}

export interface MacroTargets {
  calories_target: number
  protein_g: number
  fat_g: number
  carbs_g: number
  goal: PrimaryGoal
  deficit_or_surplus_pct: number
}

const KCAL_PER_G = { protein: 4, fat: 9, carbs: 4 } as const

export function calculateMacroTargets(input: MacroInput): MacroTargets {
  const { tdee_kcal, weight_kg, goal } = input

  let calories_target: number
  let protein_per_kg: number
  let fat_pct: number
  let deficit_or_surplus_pct: number

  switch (goal) {
    case 'weight_loss': {
      const deficit = input.deficit_pct ?? 0.2
      calories_target = Math.round(tdee_kcal * (1 - deficit))
      protein_per_kg = 2.0
      fat_pct = 0.25
      deficit_or_surplus_pct = -deficit
      break
    }
    case 'muscle_building': {
      const surplus = input.surplus_pct ?? 0.1
      calories_target = Math.round(tdee_kcal * (1 + surplus))
      protein_per_kg = 2.2
      fat_pct = 0.25
      deficit_or_surplus_pct = surplus
      break
    }
    case 'strength_performance': {
      calories_target = tdee_kcal
      protein_per_kg = 2.0
      fat_pct = 0.30
      deficit_or_surplus_pct = 0
      break
    }
    case 'general_health': {
      calories_target = tdee_kcal
      protein_per_kg = 1.6
      fat_pct = 0.30
      deficit_or_surplus_pct = 0
      break
    }
  }

  const protein_g = Math.round(protein_per_kg * weight_kg)
  const fat_g = Math.round((calories_target * fat_pct) / KCAL_PER_G.fat)
  const protein_kcal = protein_g * KCAL_PER_G.protein
  const fat_kcal = fat_g * KCAL_PER_G.fat
  const carbs_kcal = Math.max(0, calories_target - protein_kcal - fat_kcal)
  const carbs_g = Math.round(carbs_kcal / KCAL_PER_G.carbs)

  return {
    calories_target,
    protein_g,
    fat_g,
    carbs_g,
    goal,
    deficit_or_surplus_pct,
  }
}
