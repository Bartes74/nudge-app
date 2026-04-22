import type { SupabaseClient } from '@supabase/supabase-js'
import { callStructured } from '../llm/client'
import { logAndRecordLlmUsage } from '../billing'

export interface CheckinAggregates {
  weekOf: string
  workoutsCompleted: number
  workoutsPlanned: number | null
  avgWorkoutRating: number | null
  weightMeasurements: number
  weightStartKg: number | null
  weightEndKg: number | null
  weightDeltaKg: number | null
}

export interface CheckinSubjective {
  energy: number
  recovery: number
  motivation: number
  stress: number
  sleep: number
  winsText?: string | null
  strugglesText?: string | null
  focusNextWeek?: string | null
}

export interface UserProfileSummary {
  primaryGoal: string | null
  segment: string | null
  experienceLevel: string | null
}

export interface CheckinVerdictResult {
  verdict: 'on_track' | 'needs_adjustment' | 'plan_change_recommended'
  verdictSummary: string
  recommendedAction: string
  planChangeNeeded: boolean
  planChangeDetails: { area: 'training' | 'nutrition' | 'recovery'; suggestion: string } | null
}

export interface CheckinAnalysisResult {
  verdict: CheckinVerdictResult
  llmCallId: string | null
}

const CHECKIN_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    verdict: {
      type: 'string',
      enum: ['on_track', 'needs_adjustment', 'plan_change_recommended'],
    },
    verdict_summary: { type: 'string' },
    recommended_action: { type: 'string' },
    plan_change_needed: { type: 'boolean' },
    plan_change_area: {
      type: 'string',
      enum: ['training', 'nutrition', 'recovery', 'none'],
    },
    plan_change_suggestion: { type: 'string' },
  },
  required: [
    'verdict',
    'verdict_summary',
    'recommended_action',
    'plan_change_needed',
    'plan_change_area',
    'plan_change_suggestion',
  ],
  additionalProperties: false,
}

export async function computeAggregates(
  supabase: SupabaseClient,
  userId: string,
  weekOf: string,
): Promise<CheckinAggregates> {
  const weekStart = new Date(weekOf)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [workoutResult, measurementResult, daysFact] = await Promise.all([
    supabase
      .from('workout_logs')
      .select('ended_at, overall_rating')
      .eq('user_id', userId)
      .gte('started_at', weekStart.toISOString())
      .lt('started_at', weekEnd.toISOString()),

    supabase
      .from('body_measurements')
      .select('weight_kg, measured_at')
      .eq('user_id', userId)
      .gte('measured_at', weekStart.toISOString())
      .lt('measured_at', weekEnd.toISOString())
      .order('measured_at', { ascending: true }),

    supabase
      .from('user_profile_facts')
      .select('value_numeric')
      .eq('user_id', userId)
      .eq('field_key', 'days_per_week')
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const workoutLogs = workoutResult.data ?? []
  const completed = workoutLogs.filter((w) => w.ended_at !== null).length
  const ratings = workoutLogs
    .map((w) => w.overall_rating)
    .filter((r): r is number => r !== null)
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null

  const measurements = measurementResult.data ?? []
  const weightWithValues = measurements.filter(
    (m): m is typeof m & { weight_kg: number } => m.weight_kg !== null,
  )
  const weightStart = weightWithValues[0]?.weight_kg ?? null
  const weightEnd = weightWithValues[weightWithValues.length - 1]?.weight_kg ?? null
  const weightDelta =
    weightStart !== null && weightEnd !== null
      ? Math.round((weightEnd - weightStart) * 100) / 100
      : null

  const workoutsPlanned = daysFact.data?.value_numeric ?? null

  return {
    weekOf,
    workoutsCompleted: completed,
    workoutsPlanned,
    avgWorkoutRating: avgRating,
    weightMeasurements: weightWithValues.length,
    weightStartKg: weightStart,
    weightEndKg: weightEnd,
    weightDeltaKg: weightDelta,
  }
}

export async function analyzeCheckin(
  aggregates: CheckinAggregates,
  subjective: CheckinSubjective,
  profile: UserProfileSummary,
  opts: { apiKey: string; supabase: SupabaseClient; userId: string },
): Promise<CheckinAnalysisResult> {
  const systemPrompt = `Jesteś AI coachem Nudge. Analizujesz tygodniowy check-in i wystawiasz werdykt na podstawie danych obiektywnych i subiektywnych.

Zasady werdyktu:
- "on_track": postęp zgodny z planem, parametry subiektywne ≥3, treningi wykonane w ≥80% zaplanowanej liczby
- "needs_adjustment": drobne korekty wystarczą (np. zmniejsz intensywność, popraw sen, dodaj dzień regeneracji)
- "plan_change_recommended": znaczące odchylenie — ≥2 tygodnie słabych wyników, Energy+Recovery ≤2, treningi <50%
- Zmiana planu NIE CZĘŚCIEJ niż co 2-3 tygodnie (fundamentalna zasada produktu)
- Rekomendacje: krótkie, konkretne, max 3 zdania, w języku polskim
- NIGDY nie wystawiaj diagnoz medycznych, nie dawkuj suplementów, nie sugeruj specyficznych leków`

  const plannedStr =
    aggregates.workoutsPlanned !== null ? String(aggregates.workoutsPlanned) : '?'
  const ratingStr = aggregates.avgWorkoutRating !== null ? String(aggregates.avgWorkoutRating) : 'brak'
  const deltaStr =
    aggregates.weightDeltaKg !== null
      ? `${aggregates.weightDeltaKg > 0 ? '+' : ''}${aggregates.weightDeltaKg} kg`
      : 'brak pomiarów'

  const userPrompt = `## Check-in tygodniowy — tydzień od ${aggregates.weekOf}

### Dane obiektywne
- Treningi wykonane: ${aggregates.workoutsCompleted} / ${plannedStr} zaplanowanych
- Średnia ocena treningu: ${ratingStr} / 5
- Pomiary wagi: ${aggregates.weightMeasurements}x | delta masy ciała: ${deltaStr}

### Oceny subiektywne (skala 1-5)
- Energia: ${subjective.energy}
- Regeneracja: ${subjective.recovery}
- Motywacja: ${subjective.motivation}
- Stres: ${subjective.stress} (wyższy = gorzej)
- Sen: ${subjective.sleep}

### Notatki użytkownika
- Co poszło dobrze: ${subjective.winsText ?? 'brak'}
- Trudności: ${subjective.strugglesText ?? 'brak'}
- Focus na przyszły tydzień: ${subjective.focusNextWeek ?? 'brak'}

### Profil użytkownika
- Cel główny: ${profile.primaryGoal ?? 'nieznany'}
- Segment: ${profile.segment ?? 'nieznany'}
- Poziom doświadczenia: ${profile.experienceLevel ?? 'nieznany'}`

  const { output, meta } = await callStructured<{
    verdict: string
    verdict_summary: string
    recommended_action: string
    plan_change_needed: boolean
    plan_change_area: string
    plan_change_suggestion: string
  }>({
    apiKey: opts.apiKey,
    model: 'gpt-4o-mini',
    systemPrompt,
    userPrompt,
    jsonSchema: CHECKIN_ANALYSIS_SCHEMA,
    schemaName: 'checkin_analysis',
  })

  const llmCallId = await logAndRecordLlmUsage({
    supabase: opts.supabase,
    userId: opts.userId,
    meta,
  })

  const planChangeNeeded = output.plan_change_needed
  const planChangeDetails =
    planChangeNeeded && output.plan_change_area !== 'none'
      ? {
          area: output.plan_change_area as 'training' | 'nutrition' | 'recovery',
          suggestion: output.plan_change_suggestion,
        }
      : null

  return {
    verdict: {
      verdict: output.verdict as CheckinVerdictResult['verdict'],
      verdictSummary: output.verdict_summary,
      recommendedAction: output.recommended_action,
      planChangeNeeded,
      planChangeDetails,
    },
    llmCallId,
  }
}
