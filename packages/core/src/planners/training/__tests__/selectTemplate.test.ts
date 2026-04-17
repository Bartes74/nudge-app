import { describe, it, expect } from 'vitest'
import { selectTemplate } from '../selectTemplate'
import type { PlannerProfile } from '../types'

function profile(overrides: Partial<PlannerProfile>): PlannerProfile {
  return {
    user_id: 'test-user',
    experience_level: 'beginner',
    primary_goal: 'general_health',
    days_per_week: 3,
    equipment_location: 'gym',
    has_barbell: true,
    has_dumbbells: true,
    has_machines: true,
    has_cables: true,
    has_pullup_bar: true,
    has_bench: true,
    session_duration_min: 60,
    avoid_exercises: [],
    injuries: [],
    ...overrides,
  }
}

describe('selectTemplate', () => {
  it('returns FBW for 2 days/week regardless of level', () => {
    const t = selectTemplate(profile({ days_per_week: 2 }))
    expect(t.split_type).toBe('fbw')
    expect(t.workouts_per_week).toBe(2)
  })

  it('returns FBW for 3 days/week (beginner)', () => {
    const t = selectTemplate(profile({ days_per_week: 3, experience_level: 'beginner' }))
    expect(t.split_type).toBe('fbw')
    expect(t.workouts_per_week).toBe(3)
  })

  it('returns FBW for 3 days/week (beginner_zero)', () => {
    const t = selectTemplate(profile({ days_per_week: 3, experience_level: 'beginner_zero' }))
    expect(t.split_type).toBe('fbw')
  })

  it('returns FBW for 4 days/week (beginner_zero)', () => {
    const t = selectTemplate(profile({ days_per_week: 4, experience_level: 'beginner_zero' }))
    expect(t.split_type).toBe('fbw')
  })

  it('returns Upper/Lower for 4 days/week (intermediate)', () => {
    const t = selectTemplate(profile({ days_per_week: 4, experience_level: 'intermediate' }))
    expect(t.split_type).toBe('upper_lower')
    expect(t.workouts_per_week).toBe(4)
  })

  it('returns Split for 4 days/week (advanced)', () => {
    const t = selectTemplate(profile({ days_per_week: 4, experience_level: 'advanced' }))
    expect(t.split_type).toBe('split')
    expect(t.workouts_per_week).toBe(4)
  })

  it('returns Upper/Lower for 5 days/week (beginner)', () => {
    const t = selectTemplate(profile({ days_per_week: 5, experience_level: 'beginner' }))
    expect(t.split_type).toBe('upper_lower')
  })

  it('returns PPL for 5 days/week (intermediate)', () => {
    const t = selectTemplate(profile({ days_per_week: 5, experience_level: 'intermediate' }))
    expect(t.split_type).toBe('ppl')
  })

  it('returns Split for 5 days/week (advanced)', () => {
    const t = selectTemplate(profile({ days_per_week: 5, experience_level: 'advanced' }))
    expect(t.split_type).toBe('split')
    expect(t.workouts_per_week).toBe(5)
  })

  it('returns PPL (6-day) for 6 days/week (advanced)', () => {
    const t = selectTemplate(profile({ days_per_week: 6, experience_level: 'advanced' }))
    expect(t.split_type).toBe('ppl')
    expect(t.workouts_per_week).toBe(6)
  })

  it('week_structure keys match day_labels of workouts', () => {
    const t = selectTemplate(profile({ days_per_week: 4, experience_level: 'intermediate' }))
    const labels = new Set(t.workouts.map((w) => w.day_label))
    const structureKeys = new Set(Object.keys(t.week_structure))
    expect(labels).toEqual(structureKeys)
  })

  it('all templates have duration_min_estimated > 0', () => {
    const profiles: Partial<PlannerProfile>[] = [
      { days_per_week: 3, experience_level: 'beginner_zero' },
      { days_per_week: 4, experience_level: 'intermediate' },
      { days_per_week: 5, experience_level: 'advanced' },
      { days_per_week: 6, experience_level: 'intermediate' },
    ]
    for (const p of profiles) {
      const t = selectTemplate(profile(p))
      for (const w of t.workouts) {
        expect(w.duration_min_estimated).toBeGreaterThan(0)
      }
    }
  })
})
