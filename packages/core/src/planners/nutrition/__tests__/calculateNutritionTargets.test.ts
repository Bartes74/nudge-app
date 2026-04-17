import { describe, it, expect } from 'vitest'
import { calculateNutritionTargets } from '../calculateNutritionTargets'
import type { NutritionPlannerProfile } from '../types'

// Persona fixtures (from PRD)
const ANIA: NutritionPlannerProfile = {
  user_id: 'ania-uuid',
  gender: 'female',
  age: 34,
  weight_kg: 68,
  height_cm: 165,
  activity_level: 'light',
  primary_goal: 'general_health',
  nutrition_mode: 'simple',
  dietary_constraints: [],
  life_context: ['parent_young_kids'],
  experience_level: 'beginner_zero',
}

const KUBA: NutritionPlannerProfile = {
  user_id: 'kuba-uuid',
  gender: 'male',
  age: 28,
  weight_kg: 80,
  height_cm: 178,
  activity_level: 'moderate',
  primary_goal: 'muscle_building',
  nutrition_mode: 'exact',
  dietary_constraints: [],
  life_context: [],
  experience_level: 'beginner',
}

const MARTA: NutritionPlannerProfile = {
  user_id: 'marta-uuid',
  gender: 'female',
  age: 42,
  weight_kg: 72,
  height_cm: 168,
  activity_level: 'moderate',
  primary_goal: 'weight_loss',
  nutrition_mode: 'ranges',
  dietary_constraints: [],
  life_context: ['parent_young_kids'],
  experience_level: 'intermediate',
}

describe('calculateNutritionTargets', () => {
  describe('Ania — simple / general_health / female / light activity', () => {
    it('returns valid targets', () => {
      const result = calculateNutritionTargets(ANIA)
      expect(result).not.toBeNull()
    })

    it('calories are at TDEE (maintenance for general_health)', () => {
      const result = calculateNutritionTargets(ANIA)!
      expect(result.calories_target).toBeGreaterThan(1400)
      expect(result.calories_target).toBeLessThan(2200)
    })

    it('protein is ≥ 1.5 g/kg for general_health', () => {
      const result = calculateNutritionTargets(ANIA)!
      expect(result.protein_g).toBeGreaterThanOrEqual(Math.round(1.5 * ANIA.weight_kg!))
    })

    it('fiber is ~14g per 1000 kcal', () => {
      const result = calculateNutritionTargets(ANIA)!
      const expected = Math.round((result.calories_target / 1000) * 14)
      expect(result.fiber_g).toBe(expected)
    })

    it('water is 35 ml/kg', () => {
      const result = calculateNutritionTargets(ANIA)!
      expect(result.water_ml).toBe(Math.max(2000, Math.round(ANIA.weight_kg! * 35)))
    })

    it('macros sum to approximately calories_target', () => {
      const result = calculateNutritionTargets(ANIA)!
      const kcalFromMacros = result.protein_g * 4 + result.fat_g * 9 + result.carbs_g * 4
      expect(Math.abs(kcalFromMacros - result.calories_target)).toBeLessThan(20)
    })
  })

  describe('Kuba — exact / muscle_building / male / moderate activity', () => {
    it('calories are above TDEE (surplus for muscle_building)', () => {
      const result = calculateNutritionTargets(KUBA)!
      // TDEE * 1.10 for muscle building
      expect(result.calories_target).toBeGreaterThan(2500)
    })

    it('protein is ≥ 2.2 g/kg for muscle_building', () => {
      const result = calculateNutritionTargets(KUBA)!
      expect(result.protein_g).toBeGreaterThanOrEqual(Math.round(2.2 * KUBA.weight_kg!))
    })

    it('water minimum is 35ml/kg', () => {
      const result = calculateNutritionTargets(KUBA)!
      expect(result.water_ml).toBe(Math.max(2000, Math.round(KUBA.weight_kg! * 35)))
    })
  })

  describe('Marta — ranges / weight_loss / female / moderate activity', () => {
    it('calories are below TDEE (deficit for weight_loss)', () => {
      const result = calculateNutritionTargets(MARTA)!
      // 20% deficit applied
      expect(result.calories_target).toBeGreaterThan(1300)
      expect(result.calories_target).toBeLessThan(2000)
    })

    it('protein is ≥ 2.0 g/kg for weight_loss', () => {
      const result = calculateNutritionTargets(MARTA)!
      expect(result.protein_g).toBeGreaterThanOrEqual(Math.round(2.0 * MARTA.weight_kg!))
    })

    it('calories_target never drops below 1200 for female (guardrail range)', () => {
      const result = calculateNutritionTargets(MARTA)!
      // calculateNutritionTargets itself does not enforce the guardrail limit —
      // that's evaluateGuardrails responsibility. But the result should be above 1200
      // for a normal profile like Marta.
      expect(result.calories_target).toBeGreaterThanOrEqual(1200)
    })
  })

  describe('edge cases', () => {
    it('returns null when weight_kg is missing', () => {
      const result = calculateNutritionTargets({ ...ANIA, weight_kg: null })
      expect(result).toBeNull()
    })

    it('returns null when primary_goal is missing', () => {
      const result = calculateNutritionTargets({ ...ANIA, primary_goal: null })
      expect(result).toBeNull()
    })

    it('water_ml minimum is 2000 ml even for low weight', () => {
      const lightProfile: NutritionPlannerProfile = {
        ...ANIA,
        weight_kg: 45,
      }
      const result = calculateNutritionTargets(lightProfile)!
      expect(result.water_ml).toBeGreaterThanOrEqual(2000)
    })
  })
})
