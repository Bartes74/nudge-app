import { describe, expect, it } from 'vitest'
import { summarizeWeekWorkoutStatuses } from '@/lib/training/weekPlan'

describe('summarizeWeekWorkoutStatuses', () => {
  it('keeps a reordered workout completed when an earlier version log exists for the same order in week', () => {
    const currentWorkouts = [
      { id: 'current-workout-1', day_label: 'mon', order_in_week: 1 },
      { id: 'current-workout-2', day_label: 'tue', order_in_week: 2 },
    ] as const

    const historicalWorkouts = [
      { id: 'old-workout-1', order_in_week: 1 },
      { id: 'old-workout-2', order_in_week: 2 },
      { id: 'current-workout-1', order_in_week: 1 },
      { id: 'current-workout-2', order_in_week: 2 },
    ] as const

    const logs = [
      { plan_workout_id: 'old-workout-1', ended_at: '2026-04-21T07:00:00.000Z', overall_rating: 4 },
    ] as const

    const summary = summarizeWeekWorkoutStatuses(currentWorkouts, logs, {
      currentDayLabel: 'wed',
      historicalWorkouts,
    })

    expect(summary.statusByWorkoutId['current-workout-1']).toBe('completed')
    expect(summary.statusByWorkoutId['current-workout-2']).toBe('missed')
    expect(summary.completedPastDueWorkouts).toBe(1)
    expect(summary.missedPastDueWorkouts).toBe(1)
  })

  it('keeps future workouts neutral even when a matching historical workout was already completed', () => {
    const workouts = [{ id: 'current-workout-1', day_label: 'fri', order_in_week: 1 }] as const

    const historicalWorkouts = [
      { id: 'old-workout-1', order_in_week: 1 },
      { id: 'current-workout-1', order_in_week: 1 },
    ] as const

    const logs = [
      { plan_workout_id: 'old-workout-1', ended_at: '2026-04-21T07:00:00.000Z', overall_rating: 5 },
    ] as const

    const summary = summarizeWeekWorkoutStatuses(workouts, logs, {
      currentDayLabel: 'wed',
      historicalWorkouts,
    })

    expect(summary.statusByWorkoutId['current-workout-1']).toBe('upcoming')
    expect(summary.pendingWorkouts).toBe(1)
  })
})
