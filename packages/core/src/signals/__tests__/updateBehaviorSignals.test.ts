import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateBehaviorSignals } from '../updateBehaviorSignals'

const USER_ID = 'user-uuid-test'

function makeDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function buildSupabaseMock(overrides: {
  workoutLogs?: object[]
  mealLogs?: object[]
  bodyMeasurements?: object[]
  questionAsks?: object[]
  coachMessages?: object[]
  planWorkouts?: object | null
  skippedAsks?: object[]
}) {
  const {
    workoutLogs = [],
    mealLogs = [],
    bodyMeasurements = [],
    questionAsks = [],
    coachMessages = [],
    planWorkouts = null,
    skippedAsks = [],
  } = overrides

  const upsertSpy = vi.fn().mockResolvedValue({ error: null })

  const mockQuery = (data: object[]) => {
    const chain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'lt', 'not', 'is', 'order', 'limit', 'maybeSingle', 'select']
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain['then'] = vi.fn().mockImplementation((cb: (r: { data: object[] }) => unknown) =>
      Promise.resolve(cb({ data })),
    )
    Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' })
    return chain
  }

  const fromMap: Record<string, object> = {
    workout_logs: {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: workoutLogs }),
          }),
        }),
      }),
    },
    meal_logs: {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ data: mealLogs }),
        }),
      }),
    },
    body_measurements: {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: bodyMeasurements }),
          }),
        }),
      }),
    },
    user_question_asks: {
      select: vi.fn().mockImplementation((fields: string, opts?: { count?: string }) => {
        if (opts?.count === 'exact') {
          return {
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: skippedAsks }),
              }),
            }),
          }
        }
        return {
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: questionAsks }),
              }),
            }),
          }),
        }
      }),
    },
    coach_messages: {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: coachMessages }),
          }),
        }),
      }),
    },
    training_plans: {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: planWorkouts }),
            }),
          }),
        }),
      }),
    },
    behavior_signals: {
      upsert: upsertSpy,
    },
  }

  return {
    from: vi.fn().mockImplementation((table: string) => fromMap[table] ?? mockQuery([])),
    upsertSpy,
  }
}

describe('updateBehaviorSignals', () => {
  describe('scenario: no workout logs (new user)', () => {
    it('sets days_since_last = null and completion rates to null', async () => {
      const supabase = buildSupabaseMock({})
      await updateBehaviorSignals(supabase as never, { userId: USER_ID })

      const upserted = supabase.upsertSpy.mock.calls[0][0]
      expect(upserted.days_since_last_workout_log).toBeNull()
      expect(upserted.workout_completion_rate_7d).toBeNull()
      expect(upserted.meal_logs_per_day_7d).toBe(0)
    })
  })

  describe('scenario: regular training (5 workouts completed last 7d)', () => {
    it('calculates completion rate based on plan workouts', async () => {
      const logs = Array.from({ length: 5 }, (_, i) => ({
        started_at: makeDate(i),
        ended_at: makeDate(i),
        duration_min: 60,
      }))
      const planWorkouts = {
        current_version: { workouts: [{ id: '1' }, { id: '2' }, { id: '3' }] },
      }
      const supabase = buildSupabaseMock({ workoutLogs: logs, planWorkouts })
      await updateBehaviorSignals(supabase as never, { userId: USER_ID })

      const upserted = supabase.upsertSpy.mock.calls[0][0]
      expect(upserted.days_since_last_workout_log).toBe(0)
      expect(upserted.avg_session_length_sec).toBe(3600)
    })
  })

  describe('scenario: irregular training (last workout 10 days ago)', () => {
    it('reflects days_since_last correctly', async () => {
      const logs = [
        { started_at: makeDate(10), ended_at: makeDate(10), duration_min: 45 },
      ]
      const supabase = buildSupabaseMock({ workoutLogs: logs })
      await updateBehaviorSignals(supabase as never, { userId: USER_ID })

      const upserted = supabase.upsertSpy.mock.calls[0][0]
      expect(upserted.days_since_last_workout_log).toBe(10)
      expect(upserted.workout_completion_rate_7d).toBeNull()
    })
  })

  describe('scenario: photo logging active (4/5 meals are photos)', () => {
    it('calculates photo_vs_text_ratio correctly', async () => {
      const mealLogs = [
        { logged_at: makeDate(1), input_mode: 'photo' },
        { logged_at: makeDate(1), input_mode: 'photo' },
        { logged_at: makeDate(2), input_mode: 'photo_plus_text' },
        { logged_at: makeDate(2), input_mode: 'photo' },
        { logged_at: makeDate(3), input_mode: 'text' },
      ]
      const supabase = buildSupabaseMock({ mealLogs })
      await updateBehaviorSignals(supabase as never, { userId: USER_ID })

      const upserted = supabase.upsertSpy.mock.calls[0][0]
      expect(upserted.photo_vs_text_ratio).toBe(0.8)
      expect(upserted.meal_logs_per_day_7d).toBeCloseTo(5 / 7, 1)
    })
  })

  describe('scenario: exercise substitutions tracked', () => {
    it('always upserts regardless of substitution data', async () => {
      const logs = [
        { started_at: makeDate(0), ended_at: makeDate(0), duration_min: 30 },
      ]
      const supabase = buildSupabaseMock({ workoutLogs: logs, skippedAsks: [{ id: 'q1' }, { id: 'q2' }] })
      await updateBehaviorSignals(supabase as never, { userId: USER_ID })

      const upserted = supabase.upsertSpy.mock.calls[0][0]
      expect(upserted.onboarding_fields_skipped).toBe(2)
      expect(upserted.user_id).toBe(USER_ID)
    })
  })
})
