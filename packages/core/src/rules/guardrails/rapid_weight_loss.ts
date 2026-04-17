import type { GuardrailContext, GuardrailResult } from './types'

/**
 * Safe weight loss: ≤ 1% of body weight per week.
 * Warning at > 1%, critical at > 1.5%.
 *
 * Requires at least 2 measurements ≥ 7 days apart to evaluate.
 */
const WARN_PCT_PER_WEEK = 0.01
const CRITICAL_PCT_PER_WEEK = 0.015
const MIN_DAYS_BETWEEN = 7

export function checkRapidWeightLoss(context: GuardrailContext): GuardrailResult | null {
  const weights = context.recent_weights
  if (!weights || weights.length < 2) return null

  // Find earliest and latest measurements
  const sorted = [...weights].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime(),
  )

  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!

  const daysDiff = daysBetween(first.measured_at, last.measured_at)
  if (daysDiff < MIN_DAYS_BETWEEN) return null

  // Only flag if weight is actually dropping
  if (last.weight_kg >= first.weight_kg) return null

  const lostKg = first.weight_kg - last.weight_kg
  const weeksElapsed = daysDiff / 7
  const lostPctPerWeek = lostKg / first.weight_kg / weeksElapsed

  if (lostPctPerWeek > CRITICAL_PCT_PER_WEEK) {
    return {
      flag: 'rapid_weight_loss',
      severity: 'critical',
      message: `Utrata masy ciała wynosi ${(lostPctPerWeek * 100).toFixed(1)}%/tydzień (maks. bezpieczne: 1%). Skonsultuj się z lekarzem.`,
      restrictions: [
        'block_deficit_recommendations',
        'require_medical_disclaimer',
        'notify_coach_review',
      ],
    }
  }

  if (lostPctPerWeek > WARN_PCT_PER_WEEK) {
    return {
      flag: 'rapid_weight_loss',
      severity: 'warning',
      message: `Utrata masy ciała wynosi ${(lostPctPerWeek * 100).toFixed(1)}%/tydzień. Rozważ zmniejszenie deficytu kalorycznego.`,
      restrictions: [
        'warn_deficit_recommendations',
        'require_dietitian_disclaimer',
      ],
    }
  }

  return null
}

function daysBetween(isoA: string, isoB: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return (new Date(isoB).getTime() - new Date(isoA).getTime()) / msPerDay
}
