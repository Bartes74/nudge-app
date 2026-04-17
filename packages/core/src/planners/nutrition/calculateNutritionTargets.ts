import { calculateBMR } from '../../rules/bmr'
import { calculateTDEE } from '../../rules/tdee'
import { calculateMacroTargets } from '../../rules/macros'
import type { NutritionPlannerProfile, NumericalTargets } from './types'

const FIBER_PER_1000_KCAL = 14
const WATER_ML_PER_KG = 35
const WATER_ML_MIN = 2000

export function calculateNutritionTargets(
  profile: NutritionPlannerProfile,
): NumericalTargets | null {
  if (
    profile.weight_kg == null ||
    profile.height_cm == null ||
    profile.age == null ||
    profile.gender == null ||
    profile.primary_goal == null
  ) {
    return null
  }

  const tdeeResult = calculateTDEE({
    weight_kg: profile.weight_kg,
    height_cm: profile.height_cm,
    age: profile.age,
    gender: profile.gender,
    activity_level: profile.activity_level,
  })

  if (!tdeeResult) return null

  const macros = calculateMacroTargets({
    tdee_kcal: tdeeResult.tdee_kcal,
    weight_kg: profile.weight_kg,
    goal: profile.primary_goal,
  })

  const fiber_g = Math.round((macros.calories_target / 1000) * FIBER_PER_1000_KCAL)
  const water_ml = Math.max(
    WATER_ML_MIN,
    Math.round(profile.weight_kg * WATER_ML_PER_KG),
  )

  return {
    calories_target: macros.calories_target,
    protein_g: macros.protein_g,
    fat_g: macros.fat_g,
    carbs_g: macros.carbs_g,
    fiber_g,
    water_ml,
  }
}
