import type { GuardrailProfile, GuardrailResult } from './types'

const MIN_AGE = 18

export function checkUnderage(profile: GuardrailProfile): GuardrailResult | null {
  if (profile.age === null) return null
  if (profile.age >= MIN_AGE) return null

  return {
    flag: 'underage',
    severity: 'critical',
    message: `Użytkownik ma ${profile.age} lat. Nudge wymaga ukończenia ${MIN_AGE} lat.`,
    restrictions: [
      'block_plan_generation',
      'block_calorie_targets',
      'block_weight_recommendations',
    ],
  }
}
