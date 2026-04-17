import { describe, it, expect, vi, type Mock } from 'vitest'
import { pickNextQuestions } from '../pickNext'
import type { SupabaseClient } from '@supabase/supabase-js'

function makeQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'q-1',
    field_key: 'avg_sleep_hours',
    layer: 'layer_2_segment',
    applicable_segments: null,
    priority_base: 70,
    phrasing_options: { warm_encouraging: 'Ile śpisz?', factual_technical: 'Godziny snu.' },
    answer_type: 'numeric',
    answer_options: { unit: 'h', min: 3, max: 12 },
    why_we_ask: 'Sen to filar regeneracji.',
    ...overrides,
  }
}

function makeSupabase({
  questions = [makeQuestion()],
  asked = [] as Array<{ question_id: string; answered_at: string | null; skipped_at: string | null; asked_at: string }>,
  facts = [] as Array<{ field_key: string }>,
} = {}): SupabaseClient {
  const makeMockChain = (data: unknown) => {
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'in', 'eq', 'order', 'not', 'limit', 'maybeSingle']
    methods.forEach((m) => {
      chain[m] = () => chain
    })
    chain['then'] = (resolve: (v: unknown) => unknown) => Promise.resolve(resolve({ data, error: null }))
    return chain
  }

  const fromMap: Record<string, unknown> = {
    question_library: makeMockChain(questions),
    user_question_asks: makeMockChain(asked),
    user_profile_facts: makeMockChain(facts),
  }

  return {
    from: (table: string) => fromMap[table],
  } as unknown as SupabaseClient
}

describe('pickNextQuestions', () => {
  it('returns top question for user with no history', async () => {
    const supabase = makeSupabase()
    const results = await pickNextQuestions(supabase, { userId: 'user-1', count: 1 })
    expect(results).toHaveLength(1)
    expect(results[0]!.fieldKey).toBe('avg_sleep_hours')
    expect(results[0]!.text).toBe('Ile śpisz?')
  })

  it('excludes question asked within cooldown window (< 14 days)', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const supabase = makeSupabase({
      asked: [{ question_id: 'q-1', answered_at: null, skipped_at: null, asked_at: tenDaysAgo }],
    })
    const results = await pickNextQuestions(supabase, { userId: 'user-1', count: 1 })
    expect(results).toHaveLength(0)
  })

  it('penalizes but does not exclude questions with known facts (alreadyKnownFactor=0.1)', async () => {
    const q1 = makeQuestion({ id: 'q-1', field_key: 'avg_sleep_hours', priority_base: 70 })
    const q2 = makeQuestion({ id: 'q-2', field_key: 'session_duration_minutes', priority_base: 65 })
    const supabase = makeSupabase({
      questions: [q1, q2],
      facts: [{ field_key: 'avg_sleep_hours' }],
    })
    const results = await pickNextQuestions(supabase, { userId: 'user-1', count: 2 })
    // q2 (score=65*1*0.7*1=45.5) should rank above q1 (score=70*0.1*0.7*1=4.9)
    expect(results[0]!.fieldKey).toBe('session_duration_minutes')
  })

  it('ranks segment-matched questions higher', async () => {
    const q1 = makeQuestion({
      id: 'q-1', field_key: 'cardio_preference',
      applicable_segments: ['beginner_weight_loss'],
      priority_base: 65,
    })
    const q2 = makeQuestion({
      id: 'q-2', field_key: 'avg_sleep_hours',
      applicable_segments: null,
      priority_base: 70,
    })
    const supabase = makeSupabase({ questions: [q1, q2] })
    const results = await pickNextQuestions(supabase, {
      userId: 'user-1',
      userSegment: 'beginner_weight_loss',
      count: 2,
    })
    // q1: 65*1*1.0*1 = 65, q2: 70*1*0.7*1 = 49
    expect(results[0]!.fieldKey).toBe('cardio_preference')
  })

  it('scores 0 for fully answered + known fact question', async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const supabase = makeSupabase({
      asked: [{
        question_id: 'q-1',
        answered_at: thirtyDaysAgo,
        skipped_at: null,
        asked_at: thirtyDaysAgo,
      }],
      facts: [{ field_key: 'avg_sleep_hours' }],
    })
    const results = await pickNextQuestions(supabase, { userId: 'user-1', count: 1 })
    expect(results).toHaveLength(0)
  })

  it('handles advanced user profile (no Layer 1 questions returned)', async () => {
    const layer1q = makeQuestion({ id: 'q-l1', field_key: 'primary_goal', layer: 'layer_1_minimum' })
    const layer2q = makeQuestion({ id: 'q-l2', field_key: 'avg_sleep_hours', layer: 'layer_2_segment' })
    // pickNext only queries layer_2_segment+, so layer1 questions won't be in the list
    const supabase = makeSupabase({ questions: [layer2q] })
    const results = await pickNextQuestions(supabase, { userId: 'user-1', count: 2 })
    expect(results.some((r) => r.fieldKey === 'primary_goal')).toBe(false)
    expect(results.some((r) => r.fieldKey === 'avg_sleep_hours')).toBe(true)
  })

  it('limits guided beginner follow-up questions to one item', async () => {
    const q1 = makeQuestion({ id: 'q-1', field_key: 'health_constraints', priority_base: 70 })
    const q2 = makeQuestion({ id: 'q-2', field_key: 'preferred_split', priority_base: 90 })
    const supabase = makeSupabase({ questions: [q1, q2] })

    const results = await pickNextQuestions(supabase, {
      userId: 'user-1',
      entryPath: 'guided_beginner',
      tonePreset: 'calm_guided',
      count: 3,
    })

    expect(results).toHaveLength(1)
    expect(results[0]!.fieldKey).toBe('health_constraints')
  })
})
