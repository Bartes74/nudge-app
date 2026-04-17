import { describe, it, expect } from 'vitest'
import { shouldProgress } from '../progression'
import type { ExerciseSession } from '../progression'
import { SESSION_HIT_TOP, SESSION_DID_NOT_HIT_TOP } from './fixtures'

const HIT: ExerciseSession = SESSION_HIT_TOP
const MISS: ExerciseSession = SESSION_DID_NOT_HIT_TOP

describe('shouldProgress', () => {
  describe('insufficient history', () => {
    it('returns hold with 0 sessions', () => {
      const result = shouldProgress([])
      expect(result.action).toBe('hold')
      expect(result.weight_delta_kg).toBeNull()
    })

    it('returns hold with 1 session (below minSessions=2)', () => {
      const result = shouldProgress([HIT])
      expect(result.action).toBe('hold')
    })
  })

  describe('weight increase', () => {
    it('all sessions hit top → weight', () => {
      const result = shouldProgress([HIT, HIT])
      expect(result.action).toBe('weight')
      expect(result.weight_delta_kg).toBeNull()
      expect(result.reason).toContain('Increase weight')
    })

    it('3 sessions all hitting top → weight', () => {
      const result = shouldProgress([HIT, HIT, HIT], 3)
      expect(result.action).toBe('weight')
    })
  })

  describe('reps increase', () => {
    it('some but not all sessions hit top → reps', () => {
      const result = shouldProgress([HIT, MISS])
      expect(result.action).toBe('reps')
      expect(result.weight_delta_kg).toBeNull()
    })

    it('mixed over 3 sessions → reps (recent window: last 2)', () => {
      // minSessions=2, recent = last 2 sessions: [HIT, MISS]
      const result = shouldProgress([MISS, HIT, MISS])
      // recent = [HIT, MISS]: anyHitTop=true, allHitTop=false → reps
      expect(result.action).toBe('reps')
    })
  })

  describe('deload — weight drop', () => {
    it('weight drops >15% from peak → deload', () => {
      const peak: ExerciseSession = { weight_kg: 100, total_reps: 30, target_total_reps: 30, hit_top_of_range: true }
      const dropped: ExerciseSession = { weight_kg: 80, total_reps: 24, target_total_reps: 30, hit_top_of_range: false }
      const result = shouldProgress([peak, dropped])
      expect(result.action).toBe('deload')
      expect(result.weight_delta_kg).toBeLessThan(0)
      expect(result.reason).toContain('20%')
    })

    it('deload weight_delta rounded to 0.5 kg increments', () => {
      const peak: ExerciseSession = { weight_kg: 100, total_reps: 30, target_total_reps: 30, hit_top_of_range: true }
      const dropped: ExerciseSession = { weight_kg: 82, total_reps: 24, target_total_reps: 30, hit_top_of_range: false }
      const result = shouldProgress([peak, dropped])
      expect(result.action).toBe('deload')
      // delta = -round(100 * 0.10 * 2) / 2 = -10
      expect(result.weight_delta_kg).toBe(-10)
    })
  })

  describe('deload — stagnation', () => {
    it('no reps progress and no top hit → deload after enough sessions', () => {
      const stagnant: ExerciseSession = { weight_kg: 80, total_reps: 24, target_total_reps: 30, hit_top_of_range: false }
      // Need sessions.length >= minSessions + 1 = 3
      const result = shouldProgress([stagnant, stagnant, stagnant])
      expect(result.action).toBe('deload')
      expect(result.reason).toContain('No reps progress')
    })

    it('only 2 stagnant sessions (< minSessions + 1) → hold, not deload', () => {
      const stagnant: ExerciseSession = { weight_kg: 80, total_reps: 24, target_total_reps: 30, hit_top_of_range: false }
      const result = shouldProgress([stagnant, stagnant])
      // repsStagnant requires sessions.length >= 3; here 2 < 3
      expect(result.action).toBe('hold')
    })
  })

  describe('hold', () => {
    it('no top hit, not stagnant enough → hold', () => {
      const result = shouldProgress([MISS, MISS])
      // sessions.length=2, but stagnation check requires >=3 → hold
      expect(result.action).toBe('hold')
      expect(result.weight_delta_kg).toBeNull()
    })
  })

  describe('custom minSessions', () => {
    it('respects minSessions=3', () => {
      // Only 2 sessions provided but minSessions=3 → hold
      const result = shouldProgress([HIT, HIT], 3)
      expect(result.action).toBe('hold')
      expect(result.reason).toContain('Insufficient')
    })

    it('minSessions=1 with single hit → weight', () => {
      const result = shouldProgress([HIT], 1)
      expect(result.action).toBe('weight')
    })
  })
})
