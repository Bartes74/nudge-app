import { describe, it, expect } from 'vitest'
import { calculateBMR, ageFromBirthDate } from '../bmr'
import {
  MALE_70KG_175CM_30,
  FEMALE_60KG_165CM_25,
  OTHER_80KG_180CM_40,
} from './fixtures'

describe('calculateBMR', () => {
  describe('male', () => {
    it('returns correct BMR using Mifflin-St Jeor', () => {
      // 10×70 + 6.25×175 − 5×30 + 5 = 700 + 1093.75 − 150 + 5 = 1648.75 → 1649
      const result = calculateBMR(MALE_70KG_175CM_30)
      expect(result).not.toBeNull()
      expect(result!.bmr_kcal).toBe(1649)
      expect(result!.formula).toBe('mifflin_st_jeor')
      expect(result!.gender_used).toBe('male')
    })
  })

  describe('female', () => {
    it('returns correct BMR using Mifflin-St Jeor', () => {
      // 10×60 + 6.25×165 − 5×25 − 161 = 600 + 1031.25 − 125 − 161 = 1345.25 → 1345
      const result = calculateBMR(FEMALE_60KG_165CM_25)
      expect(result).not.toBeNull()
      expect(result!.bmr_kcal).toBe(1345)
      expect(result!.gender_used).toBe('female')
    })
  })

  describe('other gender', () => {
    it('averages male and female formulas', () => {
      // M: 10×80 + 6.25×180 − 5×40 + 5 = 800 + 1125 − 200 + 5 = 1730
      // F: 10×80 + 6.25×180 − 5×40 − 161 = 800 + 1125 − 200 − 161 = 1564
      // avg: (1730 + 1564) / 2 = 1647
      const result = calculateBMR(OTHER_80KG_180CM_40)
      expect(result).not.toBeNull()
      expect(result!.bmr_kcal).toBe(1647)
      expect(result!.gender_used).toBe('averaged')
    })

    it('prefer_not_to_say also averages', () => {
      const result = calculateBMR({ ...OTHER_80KG_180CM_40, gender: 'prefer_not_to_say' })
      expect(result).not.toBeNull()
      expect(result!.gender_used).toBe('averaged')
    })
  })

  describe('null gender falls back to averaged', () => {
    it('returns averaged result when gender is null', () => {
      const result = calculateBMR({ ...MALE_70KG_175CM_30, gender: null })
      expect(result).not.toBeNull()
      expect(result!.gender_used).toBe('averaged')
    })
  })

  describe('null / invalid inputs', () => {
    it('returns null when weight_kg is null', () => {
      expect(calculateBMR({ ...MALE_70KG_175CM_30, weight_kg: null })).toBeNull()
    })

    it('returns null when height_cm is null', () => {
      expect(calculateBMR({ ...MALE_70KG_175CM_30, height_cm: null })).toBeNull()
    })

    it('returns null when age is null', () => {
      expect(calculateBMR({ ...MALE_70KG_175CM_30, age: null })).toBeNull()
    })

    it('returns null when weight_kg is 0', () => {
      expect(calculateBMR({ ...MALE_70KG_175CM_30, weight_kg: 0 })).toBeNull()
    })

    it('returns null when height_cm is negative', () => {
      expect(calculateBMR({ ...MALE_70KG_175CM_30, height_cm: -10 })).toBeNull()
    })

    it('returns null when age is 0', () => {
      expect(calculateBMR({ ...MALE_70KG_175CM_30, age: 0 })).toBeNull()
    })
  })
})

describe('ageFromBirthDate', () => {
  it('returns null for null input', () => {
    expect(ageFromBirthDate(null)).toBeNull()
  })

  it('returns null for invalid date string', () => {
    expect(ageFromBirthDate('not-a-date')).toBeNull()
  })

  it('calculates age from ISO date', () => {
    // Current year in tests context is 2026 (per CLAUDE.md)
    const age = ageFromBirthDate('1996-01-01')
    expect(age).toBeGreaterThanOrEqual(29)
    expect(age).toBeLessThanOrEqual(31)
  })

  it('returns null for a birth date this year (age = 0)', () => {
    const thisYear = new Date().getFullYear()
    // age = 0 → function returns null (below valid range)
    expect(ageFromBirthDate(`${thisYear}-06-15`)).toBeNull()
  })
})
