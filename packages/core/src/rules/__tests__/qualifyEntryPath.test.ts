import { describe, expect, it } from 'vitest'
import { qualifyEntryPath } from '../qualifyEntryPath'

describe('qualifyEntryPath', () => {
  it('routes no-training users into beginner_zero guided path', () => {
    const result = qualifyEntryPath({
      ageYears: 29,
      heightCm: 170,
      currentWeightKg: 78,
      recentActivityWindow: 'over_12_months',
      trainingBackground: 'just_starting',
      healthConstraints: ['none'],
    })

    expect(result.experienceLevel).toBe('beginner_zero')
    expect(result.entryPath).toBe('guided_beginner')
    expect(result.adaptationPhase).toBe('phase_0_familiarization')
    expect(result.guidedMode).toBe(true)
    expect(result.needsGuidedMode).toBe(true)
    expect(result.tonePreset).toBe('calm_guided')
    expect(result.nutritionMode).toBe('simple')
    expect(result.inferredBeginnerReasonCodes).toContain('no_regular_training_last_12_months')
  })

  it('adds guided-priority reasons for age over 45 and higher BMI', () => {
    const result = qualifyEntryPath({
      ageYears: 52,
      heightCm: 165,
      currentWeightKg: 82,
      recentActivityWindow: 'never_regular',
      trainingBackground: 'just_starting',
      healthConstraints: ['none'],
    })

    expect(result.experienceLevel).toBe('beginner_zero')
    expect(result.inferredBeginnerReasonCodes).toContain('age_over_45_with_low_recent_activity')
    expect(result.inferredBeginnerReasonCodes).toContain('higher_bmi_with_low_recent_activity')
  })

  it('keeps regularly training users on the standard path', () => {
    const result = qualifyEntryPath({
      ageYears: 34,
      heightCm: 180,
      currentWeightKg: 76,
      recentActivityWindow: 'within_3_months',
      trainingBackground: 'training_regularly',
      healthConstraints: ['none'],
    })

    expect(result.experienceLevel).toBe('intermediate')
    expect(result.entryPath).toBe('standard_training')
    expect(result.guidedMode).toBe(false)
    expect(result.inferredBeginnerStatus).toBe(false)
    expect(result.inferredBeginnerReasonCodes).toEqual([])
  })

  it('marks returning users as beginner and requires safety screening when needed', () => {
    const result = qualifyEntryPath({
      ageYears: 41,
      heightCm: 172,
      currentWeightKg: 74,
      recentActivityWindow: 'within_12_months',
      trainingBackground: 'returning_after_break',
      healthConstraints: ['medical_condition'],
    })

    expect(result.experienceLevel).toBe('beginner')
    expect(result.entryPath).toBe('standard_training')
    expect(result.adaptationPhase).toBe('phase_1_adaptation')
    expect(result.requiresSafetyScreening).toBe(true)
    expect(result.inferredBeginnerStatus).toBe(true)
  })
})
