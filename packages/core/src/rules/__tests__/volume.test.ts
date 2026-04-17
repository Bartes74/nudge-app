import { describe, it, expect } from 'vitest'
import { recommendedVolume } from '../volume'
import { VOLUME_ZERO_GENERAL, VOLUME_ADVANCED_MUSCLE } from './fixtures'

describe('recommendedVolume', () => {
  describe('beginner_zero × general_health', () => {
    it('returns minimum sets (8)', () => {
      const result = recommendedVolume(VOLUME_ZERO_GENERAL)
      expect(result.push.sets_per_week).toBe(8)
      expect(result.pull.sets_per_week).toBe(8)
      expect(result.legs.sets_per_week).toBe(8)
      expect(result.experience_level).toBe('beginner_zero')
      expect(result.primary_goal).toBe('general_health')
    })

    it('core gets 75% of main sets (floor 6)', () => {
      const result = recommendedVolume(VOLUME_ZERO_GENERAL)
      // 8 × 0.75 = 6
      expect(result.core.sets_per_week).toBe(6)
    })

    it('frequency is 2x per week', () => {
      const result = recommendedVolume(VOLUME_ZERO_GENERAL)
      expect(result.push.frequency_per_week).toBe(2)
    })
  })

  describe('advanced × muscle_building', () => {
    it('returns maximum sets (20)', () => {
      const result = recommendedVolume(VOLUME_ADVANCED_MUSCLE)
      expect(result.push.sets_per_week).toBe(20)
      expect(result.pull.sets_per_week).toBe(20)
      expect(result.legs.sets_per_week).toBe(20)
    })

    it('frequency is 3x per week', () => {
      const result = recommendedVolume(VOLUME_ADVANCED_MUSCLE)
      expect(result.push.frequency_per_week).toBe(3)
    })

    it('core gets 75% of main sets', () => {
      const result = recommendedVolume(VOLUME_ADVANCED_MUSCLE)
      // 20 × 0.75 = 15
      expect(result.core.sets_per_week).toBe(15)
    })
  })

  describe('goal modifiers', () => {
    it('weight_loss → lower bound', () => {
      const result = recommendedVolume({ experience_level: 'intermediate', primary_goal: 'weight_loss' })
      // intermediate range: 14–16, weight_loss → min = 14
      expect(result.push.sets_per_week).toBe(14)
    })

    it('muscle_building → upper bound', () => {
      const result = recommendedVolume({ experience_level: 'intermediate', primary_goal: 'muscle_building' })
      // intermediate range: 14–16, muscle_building → max = 16
      expect(result.push.sets_per_week).toBe(16)
    })

    it('strength_performance → mid range', () => {
      const result = recommendedVolume({ experience_level: 'intermediate', primary_goal: 'strength_performance' })
      // intermediate range: 14–16, mid = round(15) = 15
      expect(result.push.sets_per_week).toBe(15)
    })
  })

  describe('beginner', () => {
    it('returns 10 sets for general_health', () => {
      const result = recommendedVolume({ experience_level: 'beginner', primary_goal: 'general_health' })
      expect(result.push.sets_per_week).toBe(10)
    })

    it('returns 12 sets for muscle_building', () => {
      const result = recommendedVolume({ experience_level: 'beginner', primary_goal: 'muscle_building' })
      expect(result.push.sets_per_week).toBe(12)
    })
  })

  describe('null inputs', () => {
    it('null experience_level falls back to beginner_zero', () => {
      const result = recommendedVolume({ experience_level: null, primary_goal: 'general_health' })
      expect(result.experience_level).toBe('beginner_zero')
    })

    it('null primary_goal falls back to general_health', () => {
      const result = recommendedVolume({ experience_level: 'beginner', primary_goal: null })
      expect(result.primary_goal).toBe('general_health')
    })
  })

  describe('frequency thresholds', () => {
    it('advanced strength (18 sets) → 3x frequency', () => {
      const result = recommendedVolume({ experience_level: 'advanced', primary_goal: 'strength_performance' })
      // advanced range 16-20, mid = 18, advanced × 18 → 3x
      expect(result.push.frequency_per_week).toBe(3)
    })

    it('intermediate weight_loss (14 sets) → 2x for non-advanced', () => {
      const result = recommendedVolume({ experience_level: 'intermediate', primary_goal: 'weight_loss' })
      // 14 sets, intermediate → 2x
      expect(result.push.frequency_per_week).toBe(2)
    })
  })
})
