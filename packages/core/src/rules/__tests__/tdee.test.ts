import { describe, it, expect } from 'vitest'
import { calculateTDEE, ACTIVITY_FACTORS } from '../tdee'
import { TDEE_MODERATE_MALE, TDEE_SEDENTARY_FEMALE, MALE_70KG_175CM_30 } from './fixtures'

describe('calculateTDEE', () => {
  it('moderate activity male returns correct TDEE', () => {
    // BMR male 70kg/175cm/30y = 1649; × 1.55 = 2555.95 → 2556
    const result = calculateTDEE(TDEE_MODERATE_MALE)
    expect(result).not.toBeNull()
    expect(result!.tdee_kcal).toBe(2556)
    expect(result!.activity_level).toBe('moderate')
    expect(result!.activity_factor).toBe(1.55)
    expect(result!.bmr.bmr_kcal).toBe(1649)
  })

  it('sedentary female returns correct TDEE', () => {
    // BMR female 60kg/165cm/25y = 1345; × 1.2 = 1614
    const result = calculateTDEE(TDEE_SEDENTARY_FEMALE)
    expect(result).not.toBeNull()
    expect(result!.tdee_kcal).toBe(1614)
    expect(result!.activity_level).toBe('sedentary')
  })

  it('null activity_level falls back to sedentary', () => {
    const result = calculateTDEE({ ...TDEE_MODERATE_MALE, activity_level: null })
    expect(result).not.toBeNull()
    expect(result!.activity_level).toBe('sedentary')
    expect(result!.activity_factor).toBe(1.2)
  })

  it('very_active uses factor 1.9', () => {
    const result = calculateTDEE({ ...MALE_70KG_175CM_30, activity_level: 'very_active' })
    expect(result).not.toBeNull()
    expect(result!.activity_factor).toBe(1.9)
    expect(result!.tdee_kcal).toBe(Math.round(1649 * 1.9))
  })

  it('active uses factor 1.725', () => {
    const result = calculateTDEE({ ...MALE_70KG_175CM_30, activity_level: 'active' })
    expect(result).not.toBeNull()
    expect(result!.activity_factor).toBe(1.725)
  })

  it('light uses factor 1.375', () => {
    const result = calculateTDEE({ ...MALE_70KG_175CM_30, activity_level: 'light' })
    expect(result).not.toBeNull()
    expect(result!.activity_factor).toBe(1.375)
  })

  it('returns null when BMR inputs are missing', () => {
    const result = calculateTDEE({ weight_kg: null, height_cm: 175, age: 30, gender: 'male', activity_level: 'moderate' })
    expect(result).toBeNull()
  })

  it('derives age from birth_date when age not provided', () => {
    const result = calculateTDEE({
      weight_kg: 70,
      height_cm: 175,
      age: null,
      gender: 'male',
      activity_level: 'moderate',
      birth_date: '1996-01-01',
    })
    expect(result).not.toBeNull()
    expect(result!.bmr.bmr_kcal).toBeGreaterThan(0)
  })
})

describe('ACTIVITY_FACTORS', () => {
  it('contains all 5 activity levels', () => {
    expect(Object.keys(ACTIVITY_FACTORS)).toHaveLength(5)
    expect(ACTIVITY_FACTORS.sedentary).toBe(1.2)
    expect(ACTIVITY_FACTORS.light).toBe(1.375)
    expect(ACTIVITY_FACTORS.moderate).toBe(1.55)
    expect(ACTIVITY_FACTORS.active).toBe(1.725)
    expect(ACTIVITY_FACTORS.very_active).toBe(1.9)
  })
})
