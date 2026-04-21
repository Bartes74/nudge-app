import { describe, expect, it } from 'vitest'
import {
  buildFallbackFeedbackInsights,
  decidePlanRegeneration,
  deriveAdaptationSnapshot,
  deriveCommunicationProfile,
  summarizeExerciseHistory,
  summarizeMuscleBalance,
} from '../adaptation'
import type {
  ExerciseHistorySession,
  PlannerBehaviorSignals,
  PlannerProfile,
  RecentWorkoutSummary,
  WorkoutFeedbackInsight,
} from '../types'

function baseProfile(overrides: Partial<PlannerProfile> = {}): PlannerProfile {
  return {
    user_id: 'user-1',
    experience_level: 'beginner_zero',
    primary_goal: 'general_health',
    days_per_week: 3,
    equipment_location: 'gym',
    entry_path: 'guided_beginner',
    adaptation_phase: 'phase_0_familiarization',
    needs_guided_mode: true,
    clarity_score: null,
    confidence_score: null,
    trainer_consultation_completed_at: null,
    has_barbell: false,
    has_dumbbells: false,
    has_machines: true,
    has_cables: true,
    has_pullup_bar: false,
    has_bench: false,
    session_duration_min: 30,
    avoid_exercises: [],
    injuries: [],
    ...overrides,
  }
}

function baseSignals(overrides: Partial<PlannerBehaviorSignals> = {}): PlannerBehaviorSignals {
  return {
    workout_completion_rate_7d: 0.5,
    workout_completion_rate_30d: 0.5,
    clarity_score_avg_7d: 4,
    confidence_score_avg_7d: 4,
    substitution_count_7d: 0,
    substitution_count_30d: 0,
    pain_flag_count_7d: 0,
    too_hard_flag_count_7d: 0,
    days_since_last_workout_log: 2,
    avg_session_length_sec: 1800,
    ...overrides,
  }
}

function basePlanAdherence(
  overrides: Partial<{
    current_day_label: string | null
    past_due_workouts: number
    completed_past_due_workouts: number
    missed_past_due_workouts: number
    pending_workouts: number
    completion_rate_past_due: number | null
    blocks_progression_until_plan_completed: boolean
  }> = {},
) {
  return {
    current_day_label: 'wed',
    past_due_workouts: 2,
    completed_past_due_workouts: 2,
    missed_past_due_workouts: 0,
    pending_workouts: 1,
    completion_rate_past_due: 1,
    blocks_progression_until_plan_completed: false,
    ...overrides,
  }
}

function workout(overrides: Partial<RecentWorkoutSummary> = {}): RecentWorkoutSummary {
  return {
    workout_log_id: 'log-1',
    started_at: '2026-04-18T10:00:00.000Z',
    ended_at: '2026-04-18T10:25:00.000Z',
    duration_min: 25,
    overall_rating: 4,
    clarity_score: 4,
    confidence_score: 4,
    felt_safe: true,
    exercise_confusion_flag: false,
    machine_confusion_flag: false,
    too_hard_flag: false,
    pain_flag: false,
    ready_for_next_workout: true,
    went_well: null,
    went_poorly: null,
    what_to_improve: null,
    ...overrides,
  }
}

function feedback(overrides: Partial<WorkoutFeedbackInsight> = {}): WorkoutFeedbackInsight {
  return {
    workout_log_id: 'log-1',
    summary: null,
    themes: [],
    recommended_focus: null,
    needs_more_guidance: false,
    needs_lower_intensity: false,
    confidence_drop: false,
    recovery_issue: false,
    exercise_slugs_to_avoid: [],
    ...overrides,
  }
}

describe('training adaptation', () => {
  it('summarizes exercise history into progression-friendly snapshots', () => {
    const sessions: ExerciseHistorySession[] = [
      {
        exercise_slug: 'leg_press',
        exercise_name: 'Leg press',
        category: 'legs',
        primary_muscles: ['quads'],
        started_at: '2026-04-10T10:00:00.000Z',
        was_substituted: false,
        max_weight_kg: 40,
        total_reps: 36,
        target_total_reps: 36,
        hit_top_of_range: true,
      },
      {
        exercise_slug: 'leg_press',
        exercise_name: 'Leg press',
        category: 'legs',
        primary_muscles: ['quads'],
        started_at: '2026-04-17T10:00:00.000Z',
        was_substituted: false,
        max_weight_kg: 40,
        total_reps: 36,
        target_total_reps: 36,
        hit_top_of_range: true,
      },
    ]

    const summary = summarizeExerciseHistory(sessions)

    expect(summary).toHaveLength(1)
    expect(summary[0]?.progression_action).toBe('weight')
    expect(summary[0]?.sessions_completed).toBe(2)
  })

  it('slows progression when recent feedback shows confusion or too much difficulty', () => {
    const recentWorkouts = [
      workout({
        workout_log_id: 'log-1',
        clarity_score: 2,
        confidence_score: 2,
        too_hard_flag: true,
        ready_for_next_workout: false,
      }),
    ]
    const recentFeedback = [
      feedback({
        themes: ['clarity_issue', 'too_hard', 'recovery_issue'],
        needs_more_guidance: true,
        needs_lower_intensity: true,
      }),
    ]
    const muscleBalance = summarizeMuscleBalance([])

    const snapshot = deriveAdaptationSnapshot({
      profile: baseProfile(),
      recentWorkouts,
      exerciseHistory: [],
      muscleBalance,
      recentFeedback,
      behaviorSignals: baseSignals({
        clarity_score_avg_7d: 2.5,
        confidence_score_avg_7d: 2.5,
        too_hard_flag_count_7d: 1,
      }),
      planAdherence: basePlanAdherence(),
    })

    expect(snapshot.progression_bias).toBe('slow_down')
    expect(snapshot.requires_more_guidance).toBe(true)
    expect(snapshot.can_introduce_new_skills).toBe(false)
    expect(snapshot.deload_exercises).toEqual([])
    expect(snapshot.repeatable_exercises).toEqual([])
  })

  it('allows concise communication for mature users with stable history', () => {
    const communication = deriveCommunicationProfile({
      profile: baseProfile({ experience_level: 'advanced', entry_path: 'standard_training' }),
      recentWorkouts: Array.from({ length: 10 }, (_, index) =>
        workout({
          workout_log_id: `log-${index}`,
          clarity_score: 5,
          confidence_score: 5,
        }),
      ),
      recentFeedback: [],
      behaviorSignals: baseSignals({
        clarity_score_avg_7d: 4.8,
        confidence_score_avg_7d: 4.7,
      }),
    })

    expect(communication.guidance_level).toBe('concise')
    expect(communication.technicality).toBe('technical')
  })

  it('exposes per-exercise progression and repeat signals for the next plan', () => {
    const exerciseHistory = summarizeExerciseHistory([
      {
        exercise_slug: 'barbell_row',
        exercise_name: 'Wiosłowanie sztangą',
        category: 'pull',
        primary_muscles: ['back'],
        started_at: '2026-04-10T10:00:00.000Z',
        was_substituted: false,
        max_weight_kg: 50,
        total_reps: 32,
        target_total_reps: 30,
        hit_top_of_range: true,
      },
      {
        exercise_slug: 'barbell_row',
        exercise_name: 'Wiosłowanie sztangą',
        category: 'pull',
        primary_muscles: ['back'],
        started_at: '2026-04-17T10:00:00.000Z',
        was_substituted: false,
        max_weight_kg: 50,
        total_reps: 33,
        target_total_reps: 30,
        hit_top_of_range: true,
      },
      {
        exercise_slug: 'romanian_deadlift',
        exercise_name: 'RDL',
        category: 'legs',
        primary_muscles: ['hamstrings'],
        started_at: '2026-04-09T10:00:00.000Z',
        was_substituted: false,
        max_weight_kg: 70,
        total_reps: 24,
        target_total_reps: 30,
        hit_top_of_range: false,
      },
      {
        exercise_slug: 'romanian_deadlift',
        exercise_name: 'RDL',
        category: 'legs',
        primary_muscles: ['hamstrings'],
        started_at: '2026-04-18T10:00:00.000Z',
        was_substituted: false,
        max_weight_kg: 55,
        total_reps: 22,
        target_total_reps: 30,
        hit_top_of_range: false,
      },
    ])

    const snapshot = deriveAdaptationSnapshot({
      profile: baseProfile({ experience_level: 'intermediate', entry_path: 'standard_training' }),
      recentWorkouts: [workout()],
      exerciseHistory,
      muscleBalance: summarizeMuscleBalance(exerciseHistory),
      recentFeedback: [],
      behaviorSignals: baseSignals({
        workout_completion_rate_30d: 0.85,
      }),
      planAdherence: basePlanAdherence(),
    })

    expect(snapshot.progress_ready_exercises).toContain('barbell_row')
    expect(snapshot.deload_exercises).toContain('romanian_deadlift')
    expect(snapshot.repeatable_exercises).toContain('barbell_row')
  })

  it('recommends regeneration when the latest feedback materially changes the plan', () => {
    const recentWorkouts = [
      workout({
        workout_log_id: 'log-1',
        clarity_score: 2,
        confidence_score: 2,
        too_hard_flag: true,
      }),
    ]
    const recentFeedback = buildFallbackFeedbackInsights(recentWorkouts)
    const snapshot = deriveAdaptationSnapshot({
      profile: baseProfile(),
      recentWorkouts,
      exerciseHistory: [],
      muscleBalance: summarizeMuscleBalance([]),
      recentFeedback,
      behaviorSignals: baseSignals({
        too_hard_flag_count_7d: 1,
      }),
      planAdherence: basePlanAdherence(),
    })

    const regenerationDecision = decidePlanRegeneration({
      adaptation: snapshot,
      recentFeedback,
      muscleBalance: summarizeMuscleBalance([]),
      behaviorSignals: baseSignals({
        too_hard_flag_count_7d: 1,
      }),
      currentEntryPath: 'guided_beginner',
    })

    expect(regenerationDecision.shouldRegenerate).toBe(true)
    expect(regenerationDecision.recommendationType).toBe('show_more_guidance')
  })

  it('blocks progression when past workouts in the active plan were not completed with a summary', () => {
    const snapshot = deriveAdaptationSnapshot({
      profile: baseProfile({ experience_level: 'intermediate', entry_path: 'standard_training' }),
      recentWorkouts: [workout()],
      exerciseHistory: [],
      muscleBalance: summarizeMuscleBalance([]),
      recentFeedback: [],
      behaviorSignals: baseSignals({
        workout_completion_rate_30d: 0.9,
      }),
      planAdherence: basePlanAdherence({
        completed_past_due_workouts: 1,
        missed_past_due_workouts: 1,
        completion_rate_past_due: 0.5,
        blocks_progression_until_plan_completed: true,
      }),
    })

    expect(snapshot.progression_bias).toBe('hold')
    expect(snapshot.can_introduce_new_skills).toBe(false)
    expect(snapshot.should_reduce_novelty).toBe(true)
    expect(snapshot.blocks_progression_until_plan_completed).toBe(true)
  })
})
