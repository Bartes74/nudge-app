import { describe, it, expect } from 'vitest'
import { classifySegment } from '../classifySegment'
import type { SegmentProfile } from '../../domain/segment'

// 10 test cases covering all primary segments + edge cases

describe('classifySegment', () => {
  it('Ania: beginner_zero × general_health × female', () => {
    const profile: SegmentProfile = {
      experience_level: 'beginner_zero',
      primary_goal: 'general_health',
      gender: 'female',
      age_bucket: 'age_25_40',
      life_context: ['parent_young_kids'],
    }
    const result = classifySegment(profile)
    expect(result.segment_key).toBe('beginner_zero_general_health')
    expect(result.experience_level).toBe('beginner_zero')
    expect(result.primary_goal).toBe('general_health')
    expect(result.gender).toBe('female')
  })

  it('Kuba: beginner × muscle_building × male', () => {
    const profile: SegmentProfile = {
      experience_level: 'beginner',
      primary_goal: 'muscle_building',
      gender: 'male',
      age_bucket: 'under_25',
      life_context: [],
    }
    const result = classifySegment(profile)
    expect(result.segment_key).toBe('beginner_muscle_building')
    expect(result.experience_level).toBe('beginner')
    expect(result.primary_goal).toBe('muscle_building')
  })

  it('Marta: intermediate × weight_loss × female × parent', () => {
    const profile: SegmentProfile = {
      experience_level: 'intermediate',
      primary_goal: 'weight_loss',
      gender: 'female',
      age_bucket: 'age_40_55',
      life_context: ['parent_young_kids'],
    }
    const result = classifySegment(profile)
    expect(result.segment_key).toBe('intermediate_weight_loss')
    expect(result.life_context).toContain('parent_young_kids')
  })

  it('advanced × strength_performance', () => {
    const profile: SegmentProfile = {
      experience_level: 'advanced',
      primary_goal: 'strength_performance',
      gender: 'male',
      age_bucket: 'age_25_40',
      life_context: [],
    }
    const result = classifySegment(profile)
    expect(result.segment_key).toBe('advanced_strength_performance')
  })

  it('beginner × weight_loss', () => {
    const profile: SegmentProfile = {
      experience_level: 'beginner',
      primary_goal: 'weight_loss',
      gender: 'female',
      age_bucket: 'age_25_40',
      life_context: [],
    }
    const result = classifySegment(profile)
    expect(result.segment_key).toBe('beginner_weight_loss')
  })

  it('beginner_zero × weight_loss', () => {
    const profile: SegmentProfile = {
      experience_level: 'beginner_zero',
      primary_goal: 'weight_loss',
      gender: null,
      age_bucket: null,
      life_context: null,
    }
    const result = classifySegment(profile)
    expect(result.segment_key).toBe('beginner_zero_weight_loss')
    expect(result.gender).toBeNull()
    expect(result.life_context).toEqual([])
  })

  it('intermediate × muscle_building', () => {
    const profile: SegmentProfile = {
      experience_level: 'intermediate',
      primary_goal: 'muscle_building',
      gender: 'male',
      age_bucket: 'age_25_40',
      life_context: [],
    }
    const result = classifySegment(profile)
    expect(result.segment_key).toBe('intermediate_muscle_building')
  })

  it('advanced × muscle_building', () => {
    const profile: SegmentProfile = {
      experience_level: 'advanced',
      primary_goal: 'muscle_building',
      gender: 'male',
      age_bucket: 'age_25_40',
      life_context: [],
    }
    const result = classifySegment(profile)
    expect(result.segment_key).toBe('advanced_muscle_building')
  })

  it('null experience_level falls back to beginner_zero', () => {
    const profile: SegmentProfile = {
      experience_level: null,
      primary_goal: 'general_health',
      gender: 'female',
      age_bucket: 'age_55_plus',
      life_context: [],
    }
    const result = classifySegment(profile)
    expect(result.experience_level).toBe('beginner_zero')
    expect(result.segment_key).toBe('beginner_zero_general_health')
  })

  it('null primary_goal falls back to general_health', () => {
    const profile: SegmentProfile = {
      experience_level: 'beginner',
      primary_goal: null,
      gender: null,
      age_bucket: null,
      life_context: null,
    }
    const result = classifySegment(profile)
    expect(result.primary_goal).toBe('general_health')
    expect(result.segment_key).toBe('beginner_general_health')
  })
})
