import { describe, it, expect } from 'vitest'
import { selectTemplate } from '../selectTemplate'
import type { PlannerProfile, TrainingPlannerContext } from '../types'

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

function context(overrides: Partial<TrainingPlannerContext> = {}): TrainingPlannerContext {
  const baseProfile = profile({ entry_path: 'standard_training' })

  return {
    profile: baseProfile,
    recent_workouts: [],
    exercise_history: [],
    muscle_balance: {
      category_counts: {},
      primary_muscle_counts: {},
      undertrained_categories: [],
      overtrained_categories: [],
      undertrained_muscles: [],
      overtrained_muscles: [],
    },
    recent_feedback: [],
    behavior_signals: {
      workout_completion_rate_7d: 0.6,
      workout_completion_rate_30d: 0.7,
      clarity_score_avg_7d: 4.5,
      confidence_score_avg_7d: 4.4,
      substitution_count_7d: 0,
      substitution_count_30d: 0,
      pain_flag_count_7d: 0,
      too_hard_flag_count_7d: 0,
      days_since_last_workout_log: 2,
      avg_session_length_sec: 2400,
    },
    communication: {
      guidance_level: 'concise',
      technicality: 'balanced',
      tone_preset: 'partnering',
      explanation_depth: 'low',
    },
    adaptation: {
      training_maturity: 'progressing',
      communication_maturity: 'independent',
      progression_bias: 'progress',
      requires_more_guidance: false,
      can_introduce_new_skills: true,
      should_reduce_novelty: false,
      latest_feedback_themes: [],
      avoid_exercise_slugs: [],
      preferred_focus: [],
      progress_ready_exercises: ['barbell_row'],
      deload_exercises: [],
      repeatable_exercises: ['barbell_row', 'lat_pulldown'],
      rationale: ['Stable history supports progression.'],
    },
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

  it('upgrades 4-day standard beginners to upper/lower when history supports more novelty', () => {
    const t = selectTemplate(
      profile({
        days_per_week: 4,
        experience_level: 'beginner',
        entry_path: 'standard_training',
      }),
      context(),
    )
    expect(t.split_type).toBe('upper_lower')
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

  it('falls back from advanced split to simpler ppl when adaptation says to slow down', () => {
    const t = selectTemplate(
      profile({
        days_per_week: 5,
        experience_level: 'advanced',
        entry_path: 'standard_training',
      }),
      context({
        adaptation: {
          ...context().adaptation,
          progression_bias: 'slow_down',
          requires_more_guidance: true,
          can_introduce_new_skills: false,
          should_reduce_novelty: true,
          deload_exercises: ['back_squat'],
        },
      }),
    )
    expect(t.split_type).toBe('ppl')
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

  it('embeds planning directives from context into the selected template', () => {
    const t = selectTemplate(
      profile({
        days_per_week: 4,
        experience_level: 'intermediate',
        entry_path: 'standard_training',
        session_duration_min: 45,
      }),
      context({
        muscle_balance: {
          category_counts: { push: 6, pull: 2, legs: 4 },
          primary_muscle_counts: { chest: 6, back: 2, quads: 4 },
          undertrained_categories: ['pull'],
          overtrained_categories: ['push'],
          undertrained_muscles: ['back'],
          overtrained_muscles: ['chest'],
        },
      }),
    )

    expect(t.planning_directives?.some((directive) => directive.includes('pull'))).toBe(true)
    expect(t.planning_directives?.some((directive) => directive.includes('barbell_row'))).toBe(true)
    expect(t.workouts.every((workout) => workout.duration_min_estimated <= 45)).toBe(true)
  })
})
