import type { SupabaseClient } from '@supabase/supabase-js'

export interface QuestionCandidate {
  id: string
  fieldKey: string
  priorityBase: number
  text: string
  answerType: string
  answerOptions: unknown
  whyWeAsk: string
}

export interface PickNextOptions {
  userId: string
  userSegment?: string | null
  tonePreset?: 'warm_encouraging' | 'partnering' | 'factual_technical' | 'calm_guided' | null
  entryPath?: 'guided_beginner' | 'standard_training' | null
  count?: number
}

// Don't re-ask within 14 days
const COOLDOWN_DAYS = 14

// If we already have a fact for this field, heavily penalize (allow re-ask after major life change)
const ALREADY_KNOWN_FACTOR = 0.1

// After COOLDOWN_DAYS, score ramps from 0 to 1.0 linearly over the next 16 days
const RAMP_DAYS = 16

export async function pickNextQuestions(
  supabase: SupabaseClient,
  opts: PickNextOptions,
): Promise<QuestionCandidate[]> {
  const { userId, userSegment } = opts
  const count = opts.entryPath === 'guided_beginner' ? Math.min(opts.count ?? 1, 1) : (opts.count ?? 2)
  const tone = opts.tonePreset ?? 'warm_encouraging'

  const [questionsResult, askedResult, factsResult] = await Promise.all([
    supabase
      .from('question_library')
      .select(
        'id, field_key, layer, applicable_segments, priority_base, phrasing_options, answer_type, answer_options, why_we_ask',
      )
      .in('layer', ['layer_2_segment', 'layer_3_behavioral', 'layer_4_advanced'])
      .eq('is_active', true),

    supabase
      .from('user_question_asks')
      .select('question_id, answered_at, skipped_at, asked_at')
      .eq('user_id', userId)
      .order('asked_at', { ascending: false }),

    supabase
      .from('user_profile_facts')
      .select('field_key')
      .eq('user_id', userId),
  ])

  const questions = questionsResult.data ?? []
  const knownFields = new Set((factsResult.data ?? []).map((f) => f.field_key))

  // Build a map of most-recent ask per question
  const askedMap = new Map<
    string,
    { answeredAt: string | null; skippedAt: string | null; askedAt: string }
  >()
  for (const a of askedResult.data ?? []) {
    if (!askedMap.has(a.question_id)) {
      askedMap.set(a.question_id, {
        answeredAt: a.answered_at ?? null,
        skippedAt: a.skipped_at ?? null,
        askedAt: a.asked_at ?? new Date().toISOString(),
      })
    }
  }

  const now = Date.now()

  const scored = questions.map((q) => {
    const history = askedMap.get(q.id)
    const priorityBase = q.priority_base ?? 50

    // alreadyKnownFactor: penalize if we already have this fact
    const alreadyKnownFactor = knownFields.has(q.field_key) ? ALREADY_KNOWN_FACTOR : 1.0

    // segmentFitFactor: reward questions targeted at the user's segment
    const segments = q.applicable_segments as string[] | null
    let segmentFitFactor: number
    if (!segments || segments.length === 0) {
      segmentFitFactor = 0.7
    } else if (userSegment && segments.includes(userSegment)) {
      segmentFitFactor = 1.0
    } else {
      segmentFitFactor = 0.2
    }

    // cooldownFactor: zero within cooldown window, ramps up after
    let cooldownFactor = 1.0
    if (history) {
      const daysSince =
        (now - new Date(history.askedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < COOLDOWN_DAYS) {
        cooldownFactor = 0
      } else {
        cooldownFactor = Math.min(1.0, (daysSince - COOLDOWN_DAYS) / RAMP_DAYS)
      }
    }

    // Fully answered + known fact → score 0 (no re-ask unless fact decays)
    if (history?.answeredAt && knownFields.has(q.field_key)) {
      return { question: q, score: 0 }
    }

    const guidedPriorityBoost =
      opts.entryPath === 'guided_beginner'
        ? (
            ['health_constraints', 'recovery_status', 'clarity_score', 'confidence_score', 'pain_flag', 'ready_for_next_workout'].includes(q.field_key)
              ? 1.4
              : ['supplements', 'exact_macros', 'volume_preference', 'preferred_split'].includes(q.field_key)
                ? 0.2
                : 0.7
          )
        : 1

    return {
      question: q,
      score: priorityBase * alreadyKnownFactor * segmentFitFactor * cooldownFactor * guidedPriorityBoost,
    }
  })

  const top = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)

  return top.map(({ question }) => {
    const phrasings = question.phrasing_options as Record<string, string> | null
    const text =
      phrasings?.[tone] ??
      phrasings?.['warm_encouraging'] ??
      question.why_we_ask

    return {
      id: question.id,
      fieldKey: question.field_key,
      priorityBase: question.priority_base ?? 50,
      text,
      answerType: question.answer_type,
      answerOptions: question.answer_options,
      whyWeAsk: question.why_we_ask,
    }
  })
}
