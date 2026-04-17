import { describe, it, expect } from 'vitest'
import { calculateMacroTargets } from '../macros'
import {
  MACRO_WEIGHT_LOSS,
  MACRO_MUSCLE_BUILDING,
  MACRO_STRENGTH,
  MACRO_GENERAL_HEALTH,
} from './fixtures'

describe('calculateMacroTargets', () => {
  describe('weight_loss', () => {
    it('applies 20% default deficit', () => {
      const result = calculateMacroTargets(MACRO_WEIGHT_LOSS)
      // 2000 × 0.8 = 1600
      expect(result.calories_target).toBe(1600)
      expect(result.goal).toBe('weight_loss')
      expect(result.deficit_or_surplus_pct).toBe(-0.2)
    })

    it('uses 2.0 g/kg protein', () => {
      const result = calculateMacroTargets(MACRO_WEIGHT_LOSS)
      // 70 kg × 2.0 = 140g
      expect(result.protein_g).toBe(140)
    })

    it('uses 25% fat', () => {
      const result = calculateMacroTargets(MACRO_WEIGHT_LOSS)
      // 1600 × 0.25 / 9 ≈ 44g
      expect(result.fat_g).toBe(44)
    })

    it('carbs fill remaining calories', () => {
      const result = calculateMacroTargets(MACRO_WEIGHT_LOSS)
      const protein_kcal = result.protein_g * 4
      const fat_kcal = result.fat_g * 9
      const expected_carbs = Math.round((result.calories_target - protein_kcal - fat_kcal) / 4)
      expect(result.carbs_g).toBe(expected_carbs)
    })

    it('respects custom deficit_pct', () => {
      const result = calculateMacroTargets({ ...MACRO_WEIGHT_LOSS, deficit_pct: 0.30 })
      expect(result.calories_target).toBe(Math.round(2000 * 0.7))
      expect(result.deficit_or_surplus_pct).toBe(-0.3)
    })
  })

  describe('muscle_building', () => {
    it('applies 10% default surplus', () => {
      const result = calculateMacroTargets(MACRO_MUSCLE_BUILDING)
      // 2500 × 1.1 = 2750
      expect(result.calories_target).toBe(2750)
      expect(result.deficit_or_surplus_pct).toBe(0.1)
    })

    it('uses 2.2 g/kg protein', () => {
      const result = calculateMacroTargets(MACRO_MUSCLE_BUILDING)
      // 80 kg × 2.2 = 176g
      expect(result.protein_g).toBe(176)
    })

    it('respects custom surplus_pct', () => {
      const result = calculateMacroTargets({ ...MACRO_MUSCLE_BUILDING, surplus_pct: 0.15 })
      expect(result.calories_target).toBe(Math.round(2500 * 1.15))
    })
  })

  describe('strength_performance', () => {
    it('targets maintenance calories', () => {
      const result = calculateMacroTargets(MACRO_STRENGTH)
      expect(result.calories_target).toBe(2800)
      expect(result.deficit_or_surplus_pct).toBe(0)
    })

    it('uses 2.0 g/kg protein', () => {
      const result = calculateMacroTargets(MACRO_STRENGTH)
      // 90 kg × 2.0 = 180g
      expect(result.protein_g).toBe(180)
    })

    it('uses 30% fat', () => {
      const result = calculateMacroTargets(MACRO_STRENGTH)
      // 2800 × 0.30 / 9 ≈ 93g
      expect(result.fat_g).toBe(93)
    })
  })

  describe('general_health', () => {
    it('targets maintenance calories', () => {
      const result = calculateMacroTargets(MACRO_GENERAL_HEALTH)
      expect(result.calories_target).toBe(2000)
      expect(result.deficit_or_surplus_pct).toBe(0)
    })

    it('uses 1.6 g/kg protein', () => {
      const result = calculateMacroTargets(MACRO_GENERAL_HEALTH)
      // 65 kg × 1.6 = 104g
      expect(result.protein_g).toBe(104)
    })
  })

  describe('carb floor', () => {
    it('carbs_g is never negative', () => {
      // Extreme case: very high protein, high fat, low calories
      const result = calculateMacroTargets({
        tdee_kcal: 1200,
        weight_kg: 100,
        goal: 'weight_loss',
        deficit_pct: 0.0,
      })
      expect(result.carbs_g).toBeGreaterThanOrEqual(0)
    })
  })
})
