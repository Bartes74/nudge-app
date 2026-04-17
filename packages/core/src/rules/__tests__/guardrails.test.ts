import { describe, it, expect } from 'vitest'
import { evaluateGuardrails, hasBlockingGuardrail } from '../guardrails/index'
import { checkUnderage } from '../guardrails/underage'
import { checkPregnancy } from '../guardrails/pregnancy'
import { checkBmiExtreme } from '../guardrails/bmi_extreme'
import { checkLowCalorieIntake } from '../guardrails/low_calorie_intake'
import { checkRapidWeightLoss } from '../guardrails/rapid_weight_loss'
import {
  PROFILE_SAFE,
  PROFILE_UNDERAGE,
  PROFILE_PREGNANT,
  PROFILE_BMI_CRITICAL_LOW,
  PROFILE_BMI_WARNING_LOW,
  PROFILE_BMI_WARNING_HIGH,
  CONTEXT_SAFE,
  CONTEXT_LOW_CALORIES_FEMALE,
  CONTEXT_RAPID_WEIGHT_LOSS,
  CONTEXT_CRITICAL_WEIGHT_LOSS,
} from './fixtures'

// ── underage ────────────────────────────────────────────────────────────────

describe('checkUnderage', () => {
  it('returns null for adult (25)', () => {
    expect(checkUnderage(PROFILE_SAFE)).toBeNull()
  })

  it('returns null when age is null', () => {
    expect(checkUnderage({ ...PROFILE_SAFE, age: null })).toBeNull()
  })

  it('returns critical flag for age 16', () => {
    const result = checkUnderage(PROFILE_UNDERAGE)
    expect(result).not.toBeNull()
    expect(result!.flag).toBe('underage')
    expect(result!.severity).toBe('critical')
    expect(result!.restrictions).toContain('block_plan_generation')
  })

  it('returns critical flag for age 17 (one below threshold)', () => {
    const result = checkUnderage({ ...PROFILE_SAFE, age: 17 })
    expect(result).not.toBeNull()
    expect(result!.severity).toBe('critical')
  })

  it('returns null for exactly age 18', () => {
    expect(checkUnderage({ ...PROFILE_SAFE, age: 18 })).toBeNull()
  })
})

// ── pregnancy ───────────────────────────────────────────────────────────────

describe('checkPregnancy', () => {
  it('returns null when not pregnant', () => {
    expect(checkPregnancy(PROFILE_SAFE)).toBeNull()
  })

  it('returns null when is_pregnant is null', () => {
    expect(checkPregnancy({ ...PROFILE_SAFE, is_pregnant: null })).toBeNull()
  })

  it('returns critical flag when pregnant', () => {
    const result = checkPregnancy(PROFILE_PREGNANT)
    expect(result).not.toBeNull()
    expect(result!.flag).toBe('pregnancy')
    expect(result!.severity).toBe('critical')
    expect(result!.restrictions).toContain('block_plan_generation')
    expect(result!.restrictions).toContain('block_intensity_targets')
  })
})

// ── bmi_extreme ─────────────────────────────────────────────────────────────

describe('checkBmiExtreme', () => {
  it('returns null for normal BMI', () => {
    // PROFILE_SAFE: 75kg/178cm → BMI ≈ 23.7
    expect(checkBmiExtreme(PROFILE_SAFE)).toBeNull()
  })

  it('returns null when weight or height is null', () => {
    expect(checkBmiExtreme({ ...PROFILE_SAFE, weight_kg: null })).toBeNull()
    expect(checkBmiExtreme({ ...PROFILE_SAFE, height_cm: null })).toBeNull()
  })

  it('returns null when weight or height is 0', () => {
    expect(checkBmiExtreme({ ...PROFILE_SAFE, weight_kg: 0 })).toBeNull()
    expect(checkBmiExtreme({ ...PROFILE_SAFE, height_cm: 0 })).toBeNull()
  })

  it('returns critical for BMI < 16 (severe underweight)', () => {
    // PROFILE_BMI_CRITICAL_LOW: 38kg/165cm → BMI ≈ 14.0
    const result = checkBmiExtreme(PROFILE_BMI_CRITICAL_LOW)
    expect(result).not.toBeNull()
    expect(result!.flag).toBe('bmi_extreme')
    expect(result!.severity).toBe('critical')
    expect(result!.restrictions).toContain('block_plan_generation')
  })

  it('returns warning for BMI 16–17.5 (underweight)', () => {
    // PROFILE_BMI_WARNING_LOW: 44kg/165cm → BMI ≈ 16.2
    const result = checkBmiExtreme(PROFILE_BMI_WARNING_LOW)
    expect(result).not.toBeNull()
    expect(result!.flag).toBe('bmi_extreme')
    expect(result!.severity).toBe('warning')
    expect(result!.restrictions).toContain('block_deficit_recommendations')
  })

  it('returns warning for BMI > 40 (severe obesity)', () => {
    // PROFILE_BMI_WARNING_HIGH: 130kg/175cm → BMI ≈ 42.4
    const result = checkBmiExtreme(PROFILE_BMI_WARNING_HIGH)
    expect(result).not.toBeNull()
    expect(result!.flag).toBe('bmi_extreme')
    expect(result!.severity).toBe('warning')
    expect(result!.restrictions).toContain('block_high_intensity_training')
  })
})

// ── low_calorie_intake ───────────────────────────────────────────────────────

describe('checkLowCalorieIntake', () => {
  it('returns null when planned_calories is null', () => {
    expect(checkLowCalorieIntake(PROFILE_SAFE, { planned_calories: null, recent_weights: null })).toBeNull()
  })

  it('returns null for safe calorie target', () => {
    expect(checkLowCalorieIntake(PROFILE_SAFE, CONTEXT_SAFE)).toBeNull()
  })

  it('returns warning for female below 1200 kcal (but above 85% threshold)', () => {
    // threshold female = 1200; 85% = 1020. Test: 1100 → warning
    const result = checkLowCalorieIntake(
      { ...PROFILE_SAFE, gender: 'female' },
      { planned_calories: 1100, recent_weights: null },
    )
    expect(result).not.toBeNull()
    expect(result!.flag).toBe('low_calorie_intake')
    expect(result!.severity).toBe('warning')
  })

  it('returns critical for female below 85% of 1200 (< 1020 kcal)', () => {
    // CONTEXT_LOW_CALORIES_FEMALE: 1000 kcal, < 1020
    const result = checkLowCalorieIntake(
      { ...PROFILE_SAFE, gender: 'female' },
      CONTEXT_LOW_CALORIES_FEMALE,
    )
    expect(result).not.toBeNull()
    expect(result!.severity).toBe('critical')
    expect(result!.restrictions).toContain('block_calorie_targets')
  })

  it('applies male threshold (1500 kcal)', () => {
    const result = checkLowCalorieIntake(
      { ...PROFILE_SAFE, gender: 'male' },
      { planned_calories: 1400, recent_weights: null },
    )
    expect(result).not.toBeNull()
    expect(result!.flag).toBe('low_calorie_intake')
  })

  it('applies midpoint threshold for null gender', () => {
    const result = checkLowCalorieIntake(
      { ...PROFILE_SAFE, gender: null },
      { planned_calories: 1300, recent_weights: null },
    )
    // midpoint = 1350; 1300 < 1350 → flagged
    expect(result).not.toBeNull()
  })

  it('returns null when calories are exactly at threshold', () => {
    // female threshold = 1200; exactly 1200 → no flag
    expect(
      checkLowCalorieIntake(
        { ...PROFILE_SAFE, gender: 'female' },
        { planned_calories: 1200, recent_weights: null },
      ),
    ).toBeNull()
  })
})

// ── rapid_weight_loss ────────────────────────────────────────────────────────

describe('checkRapidWeightLoss', () => {
  it('returns null when recent_weights is null', () => {
    expect(checkRapidWeightLoss({ planned_calories: 2000, recent_weights: null })).toBeNull()
  })

  it('returns null with only 1 measurement', () => {
    expect(
      checkRapidWeightLoss({
        planned_calories: 2000,
        recent_weights: [{ weight_kg: 80, measured_at: '2026-04-01T08:00:00Z' }],
      }),
    ).toBeNull()
  })

  it('returns null when measurements are < 7 days apart', () => {
    expect(
      checkRapidWeightLoss({
        planned_calories: 2000,
        recent_weights: [
          { weight_kg: 80, measured_at: '2026-04-01T08:00:00Z' },
          { weight_kg: 78, measured_at: '2026-04-05T08:00:00Z' }, // 4 days
        ],
      }),
    ).toBeNull()
  })

  it('returns null when weight is stable or increasing', () => {
    expect(
      checkRapidWeightLoss({
        planned_calories: 2000,
        recent_weights: [
          { weight_kg: 78, measured_at: '2026-04-01T08:00:00Z' },
          { weight_kg: 80, measured_at: '2026-04-08T08:00:00Z' },
        ],
      }),
    ).toBeNull()
  })

  it('returns null for safe rate (< 1%/week)', () => {
    // 80 → 79.5 in 7 days = 0.625%/week → safe
    expect(
      checkRapidWeightLoss({
        planned_calories: 1800,
        recent_weights: [
          { weight_kg: 80, measured_at: '2026-04-01T08:00:00Z' },
          { weight_kg: 79.5, measured_at: '2026-04-08T08:00:00Z' },
        ],
      }),
    ).toBeNull()
  })

  it('returns warning for 1–1.5%/week loss', () => {
    // CONTEXT_RAPID_WEIGHT_LOSS: 80→78.5 in 7d = 1.875%/week → warning
    const result = checkRapidWeightLoss(CONTEXT_RAPID_WEIGHT_LOSS)
    expect(result).not.toBeNull()
    expect(result!.flag).toBe('rapid_weight_loss')
    expect(result!.severity).toBe('warning')
    expect(result!.restrictions).toContain('warn_deficit_recommendations')
  })

  it('returns critical for > 1.5%/week loss', () => {
    // CONTEXT_CRITICAL_WEIGHT_LOSS: 80→78 in 7d = 2.5%/week → critical
    const result = checkRapidWeightLoss(CONTEXT_CRITICAL_WEIGHT_LOSS)
    expect(result).not.toBeNull()
    expect(result!.flag).toBe('rapid_weight_loss')
    expect(result!.severity).toBe('critical')
    expect(result!.restrictions).toContain('block_deficit_recommendations')
  })
})

// ── evaluateGuardrails (integration) ────────────────────────────────────────

describe('evaluateGuardrails', () => {
  it('returns empty array for a safe profile + context', () => {
    const results = evaluateGuardrails(PROFILE_SAFE, CONTEXT_SAFE)
    expect(results).toHaveLength(0)
  })

  it('returns underage flag for minor', () => {
    const results = evaluateGuardrails(PROFILE_UNDERAGE, CONTEXT_SAFE)
    expect(results.some((r) => r.flag === 'underage')).toBe(true)
  })

  it('returns pregnancy flag for pregnant user', () => {
    const results = evaluateGuardrails(PROFILE_PREGNANT, CONTEXT_SAFE)
    expect(results.some((r) => r.flag === 'pregnancy')).toBe(true)
  })

  it('can return multiple flags at once', () => {
    // Underage + low calories
    const results = evaluateGuardrails(
      { ...PROFILE_UNDERAGE, gender: 'female' },
      CONTEXT_LOW_CALORIES_FEMALE,
    )
    const flags = results.map((r) => r.flag)
    expect(flags).toContain('underage')
    expect(flags).toContain('low_calorie_intake')
  })
})

// ── hasBlockingGuardrail ─────────────────────────────────────────────────────

describe('hasBlockingGuardrail', () => {
  it('returns false for empty array', () => {
    expect(hasBlockingGuardrail([])).toBe(false)
  })

  it('returns false when only warnings present', () => {
    const results = evaluateGuardrails(PROFILE_BMI_WARNING_HIGH, CONTEXT_SAFE)
    expect(hasBlockingGuardrail(results)).toBe(false)
  })

  it('returns true when critical flag present', () => {
    const results = evaluateGuardrails(PROFILE_UNDERAGE, CONTEXT_SAFE)
    expect(hasBlockingGuardrail(results)).toBe(true)
  })
})
