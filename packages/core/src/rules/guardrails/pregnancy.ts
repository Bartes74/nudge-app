import type { GuardrailProfile, GuardrailResult } from './types'

export function checkPregnancy(profile: GuardrailProfile): GuardrailResult | null {
  if (!profile.is_pregnant) return null

  return {
    flag: 'pregnancy',
    severity: 'critical',
    message: 'Wykryto ciążę. Planowanie treningów i diety wymaga konsultacji z lekarzem.',
    restrictions: [
      'block_plan_generation',
      'block_calorie_targets',
      'block_weight_recommendations',
      'block_intensity_targets',
    ],
  }
}
