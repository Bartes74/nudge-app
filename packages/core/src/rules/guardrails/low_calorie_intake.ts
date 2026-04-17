import type { GuardrailProfile, GuardrailContext, GuardrailResult } from './types'

/** Absolute minimums per sports medicine guidelines */
const MIN_CALORIES_FEMALE = 1200
const MIN_CALORIES_MALE = 1500
const MIN_CALORIES_OTHER = 1350  // midpoint

export function checkLowCalorieIntake(
  profile: GuardrailProfile,
  context: GuardrailContext,
): GuardrailResult | null {
  if (context.planned_calories === null) return null

  const threshold = getCalorieThreshold(profile)
  if (context.planned_calories >= threshold) return null

  const severity = context.planned_calories < threshold * 0.85 ? 'critical' : 'warning'

  return {
    flag: 'low_calorie_intake',
    severity,
    message: `Planowane kalorie (${context.planned_calories} kcal) są poniżej bezpiecznego minimum (${threshold} kcal). Ryzyko niedoborów żywieniowych.`,
    restrictions:
      severity === 'critical'
        ? ['block_calorie_targets', 'require_dietitian_disclaimer']
        : ['warn_calorie_targets', 'require_dietitian_disclaimer'],
  }
}

function getCalorieThreshold(profile: GuardrailProfile): number {
  switch (profile.gender) {
    case 'female':           return MIN_CALORIES_FEMALE
    case 'male':             return MIN_CALORIES_MALE
    case 'other':
    case 'prefer_not_to_say':
    case null:               return MIN_CALORIES_OTHER
  }
}
