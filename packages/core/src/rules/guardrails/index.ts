export type { GuardrailFlag, GuardrailSeverity, GuardrailResult, GuardrailProfile, GuardrailContext } from './types'

import type { GuardrailProfile, GuardrailContext, GuardrailResult } from './types'
import { checkUnderage } from './underage'
import { checkPregnancy } from './pregnancy'
import { checkBmiExtreme } from './bmi_extreme'
import { checkLowCalorieIntake } from './low_calorie_intake'
import { checkRapidWeightLoss } from './rapid_weight_loss'

/**
 * Run all guardrail checks and return every triggered result.
 * Empty array = no flags, safe to proceed.
 *
 * Order matters: critical safety checks run first so callers can
 * short-circuit on the first critical flag if needed.
 */
export function evaluateGuardrails(
  profile: GuardrailProfile,
  context: GuardrailContext,
): GuardrailResult[] {
  const results: GuardrailResult[] = []

  const checks = [
    checkUnderage(profile),
    checkPregnancy(profile),
    checkBmiExtreme(profile),
    checkLowCalorieIntake(profile, context),
    checkRapidWeightLoss(context),
  ]

  for (const result of checks) {
    if (result !== null) {
      results.push(result)
    }
  }

  return results
}

/** Returns true if any critical guardrail is active — plan generation should be blocked. */
export function hasBlockingGuardrail(results: GuardrailResult[]): boolean {
  return results.some((r) => r.severity === 'critical')
}
