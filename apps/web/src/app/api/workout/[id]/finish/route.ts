import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { queueAiTask } from '@/lib/aiTasks.server'
import { dispatchInngestEvent } from '@/lib/inngest/dispatchEvent'
import { env } from '@/lib/env'
import { logAndRecordLlmUsage } from '@nudge/core/billing'
import { evaluateRedFlagSymptoms } from '@nudge/core/rules/guardrails'
import { decideBeginnerZeroProgression } from '@nudge/core/rules/beginnerZeroProgression'
import {
  decidePlanRegeneration,
  deriveAdaptationSnapshot,
  deriveCommunicationProfile,
} from '@nudge/core/planners/training/adaptation'
import { extractWorkoutFeedback } from '@nudge/core/planners/training/extractWorkoutFeedback'
import { guardWorkoutFeedbackInput } from '@nudge/core/planners/training/feedbackGuardrails'
import type { Database, Json, TablesInsert, TablesUpdate } from '@nudge/core/types/db'
import { loadPlannerProfile } from '@/lib/training/loadPlannerProfile'
import { buildTrainingPlannerContext } from '@/lib/training/buildTrainingPlannerContext'

const bodySchema = z.object({
  overall_rating: z.number().int().min(1).max(5),
  went_well: z.string().max(500).optional(),
  went_poorly: z.string().max(500).optional(),
  what_to_improve: z.string().max(500).optional(),
  clarity_score: z.number().int().min(1).max(5).optional(),
  confidence_score: z.number().int().min(1).max(5).optional(),
  felt_safe: z.boolean().optional(),
  exercise_confusion_flag: z.boolean().optional(),
  machine_confusion_flag: z.boolean().optional(),
  too_hard_flag: z.boolean().optional(),
  pain_flag: z.boolean().optional(),
  tempo_feedback: z.enum(['too_light', 'just_right', 'too_hard']).optional(),
  ready_for_next_workout: z.boolean().optional(),
  red_flag_symptoms: z.array(z.string()).optional(),
})

const TRAINING_REGENERATION_START_ERROR =
  'Nie udało się uruchomić aktualizacji planu treningowego po treningu.'

function serviceClient() {
  return createAdminClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: workoutLogId } = await params
  const supabase = await createClient()
  const adminSupabase = serviceClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: log } = await supabase
    .from('workout_logs')
    .select('id, started_at')
    .eq('id', workoutLogId)
    .eq('user_id', user.id)
    .single()

  if (!log) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const endedAt = new Date()
  const startedAt = new Date(log.started_at as string)
  const durationMin = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
  const redFlagEvaluation = evaluateRedFlagSymptoms(parsed.data.red_flag_symptoms ?? [])
  const guardedFeedbackInput = guardWorkoutFeedbackInput({
    wentWell: parsed.data.went_well ?? null,
    wentPoorly: parsed.data.went_poorly ?? null,
    whatToImprove: parsed.data.what_to_improve ?? null,
  })

  const { error: updateErr } = await supabase
    .from('workout_logs')
    .update({
      ended_at: endedAt.toISOString(),
      duration_min: durationMin,
      overall_rating: parsed.data.overall_rating,
      went_well: guardedFeedbackInput.wentWell,
      went_poorly: guardedFeedbackInput.wentPoorly,
      what_to_improve: guardedFeedbackInput.whatToImprove,
      clarity_score: parsed.data.clarity_score ?? null,
      confidence_score: parsed.data.confidence_score ?? null,
      felt_safe: parsed.data.felt_safe ?? null,
      exercise_confusion_flag: parsed.data.exercise_confusion_flag ?? false,
      machine_confusion_flag: parsed.data.machine_confusion_flag ?? false,
      too_hard_flag: parsed.data.too_hard_flag ?? false,
      pain_flag: parsed.data.pain_flag ?? false,
      tempo_feedback: parsed.data.tempo_feedback ?? null,
      ready_for_next_workout: parsed.data.ready_for_next_workout ?? null,
    })
    .eq('id', workoutLogId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  if (redFlagEvaluation.hasRedFlags) {
    await supabase.from('safety_escalations').insert({
      user_id: user.id,
      source: 'post_workout_checkin',
      symptom_codes: redFlagEvaluation.symptoms,
      severity: 'critical',
      blocked_progression: true,
      recommended_action:
        'Przerwij progresję i skonsultuj objawy z lekarzem, fizjoterapeutą lub trenerem.',
    })
  }

  const { data: guidedProfile } = await adminSupabase
    .from('user_profile')
    .select('entry_path, adaptation_phase, needs_guided_mode, trainer_consultation_recommended_at')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: workoutLogExerciseRows } = await adminSupabase
    .from('workout_log_exercises')
    .select('exercise_id, original_exercise_id')
    .eq('workout_log_id', workoutLogId)

  const sourceExerciseIds = [
    ...new Set(
      (workoutLogExerciseRows ?? [])
        .flatMap((row) => [row.exercise_id, row.original_exercise_id])
        .filter((value): value is string => typeof value === 'string'),
    ),
  ]

  const { data: sourceExercises } = sourceExerciseIds.length > 0
    ? await adminSupabase
        .from('exercises')
        .select('id, slug')
        .in('id', sourceExerciseIds)
    : { data: [] as Array<Pick<Database['public']['Tables']['exercises']['Row'], 'id' | 'slug'>> }

  const sourceExerciseSlugs = [...new Set((sourceExercises ?? []).map((exercise) => exercise.slug))]

  const feedbackExtraction = await extractWorkoutFeedback({
    apiKey: env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    workoutLogId,
    overallRating: parsed.data.overall_rating,
    clarityScore: parsed.data.clarity_score ?? null,
    confidenceScore: parsed.data.confidence_score ?? null,
    exerciseConfusionFlag: parsed.data.exercise_confusion_flag ?? false,
    machineConfusionFlag: parsed.data.machine_confusion_flag ?? false,
    tooHardFlag: parsed.data.too_hard_flag ?? false,
    painFlag: parsed.data.pain_flag ?? false,
    readyForNextWorkout: parsed.data.ready_for_next_workout ?? null,
    sourceExerciseSlugs,
    wentWell: guardedFeedbackInput.wentWell,
    wentPoorly: guardedFeedbackInput.wentPoorly,
    whatToImprove: guardedFeedbackInput.whatToImprove,
  })

  const feedbackLlmCallId = feedbackExtraction.meta
    ? await logAndRecordLlmUsage({
        supabase: adminSupabase,
        userId: user.id,
        meta: feedbackExtraction.meta,
        aiTaskId: null,
        promptId: null,
        promptVersion: null,
      })
    : null

  let progressionDecision:
    | ReturnType<typeof decideBeginnerZeroProgression>
    | null = null
  let shouldRecommendTrainerConsultation = false

  if (
    guidedProfile?.entry_path === 'guided_beginner' &&
    guidedProfile.adaptation_phase
  ) {
    const { data: recentLogs } = await adminSupabase
      .from('workout_logs')
      .select(
        'ended_at, clarity_score, confidence_score, felt_safe, pain_flag, too_hard_flag, exercise_confusion_flag, machine_confusion_flag, ready_for_next_workout',
      )
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(8)

    const completedLogs = (recentLogs ?? []).filter((entry) => entry.ended_at)
    const clarityScores = completedLogs
      .map((entry) => entry.clarity_score)
      .filter((value): value is number => typeof value === 'number')
    const confidenceScores = completedLogs
      .map((entry) => entry.confidence_score)
      .filter((value): value is number => typeof value === 'number')

    progressionDecision = decideBeginnerZeroProgression({
      adaptationPhase: guidedProfile.adaptation_phase,
      completedSessions: completedLogs.length,
      clarityAverage:
        clarityScores.length > 0
          ? clarityScores.reduce((sum, value) => sum + value, 0) / clarityScores.length
          : null,
      confidenceAverage:
        confidenceScores.length > 0
          ? confidenceScores.reduce((sum, value) => sum + value, 0) / confidenceScores.length
          : null,
      feltSafeSessions: completedLogs.filter((entry) => entry.felt_safe === true).length,
      painFlagCount: completedLogs.filter((entry) => entry.pain_flag === true).length,
      tooHardFlagCount: completedLogs.filter((entry) => entry.too_hard_flag === true).length,
      confusionFlagCount: completedLogs.filter(
        (entry) => entry.exercise_confusion_flag === true || entry.machine_confusion_flag === true,
      ).length,
      abortedExerciseCount: completedLogs.filter(
        (entry) => entry.ready_for_next_workout === false,
      ).length,
    })

    shouldRecommendTrainerConsultation =
      !guidedProfile.trainer_consultation_recommended_at &&
      completedLogs.length >= 3 &&
      (
        progressionDecision.recommendationType === 'show_more_guidance' ||
        progressionDecision.recommendationType === 'introduce_strength_basics'
      )

    const profilePatch: TablesUpdate<'user_profile'> = {}

    if (
      progressionDecision.shouldAdvance &&
      progressionDecision.nextAdaptationPhase &&
      progressionDecision.nextAdaptationPhase !== guidedProfile.adaptation_phase
    ) {
      profilePatch.adaptation_phase = progressionDecision.nextAdaptationPhase
    }

    if (progressionDecision.switchToStandardView) {
      profilePatch.entry_path = 'standard_training'
      profilePatch.needs_guided_mode = false
    }

    if (shouldRecommendTrainerConsultation) {
      profilePatch.trainer_consultation_recommended_at = endedAt.toISOString()
    }

    if (Object.keys(profilePatch).length > 0) {
      profilePatch.updated_at = endedAt.toISOString()
      await adminSupabase.from('user_profile').update(profilePatch).eq('user_id', user.id)
    }
  }

  const { plannerProfile } = await loadPlannerProfile(adminSupabase, user.id)
  const plannerContext = await buildTrainingPlannerContext({
    supabase: adminSupabase,
    userId: user.id,
    profile: plannerProfile,
  })

  const recomputedFeedback = [
    feedbackExtraction.insight,
    ...plannerContext.recent_feedback.filter(
      (feedback) => feedback.workout_log_id !== workoutLogId,
    ),
  ].slice(0, 6)

  const recomputedCommunication = deriveCommunicationProfile({
    profile: plannerProfile,
    recentWorkouts: plannerContext.recent_workouts,
    recentFeedback: recomputedFeedback,
    behaviorSignals: plannerContext.behavior_signals,
  })

  const recomputedAdaptation = deriveAdaptationSnapshot({
    profile: plannerProfile,
    recentWorkouts: plannerContext.recent_workouts,
    exerciseHistory: plannerContext.exercise_history,
    muscleBalance: plannerContext.muscle_balance,
    recentFeedback: recomputedFeedback,
    behaviorSignals: plannerContext.behavior_signals,
    planAdherence: plannerContext.plan_adherence,
  })

  plannerContext.recent_feedback = recomputedFeedback
  plannerContext.communication = recomputedCommunication
  plannerContext.adaptation = recomputedAdaptation

  const regenerationDecision = decidePlanRegeneration({
    adaptation: plannerContext.adaptation,
    recentFeedback: plannerContext.recent_feedback,
    muscleBalance: plannerContext.muscle_balance,
    behaviorSignals: plannerContext.behavior_signals,
    currentEntryPath: plannerProfile.entry_path,
  })

  let recommendationType: TablesInsert<'ai_decisions'>['recommendation_type'] =
    regenerationDecision.recommendationType

  if (shouldRecommendTrainerConsultation) {
    recommendationType = 'trainer_consultation'
  } else if (progressionDecision?.switchToStandardView) {
    recommendationType = 'introduce_strength_basics'
  } else if (progressionDecision?.recommendationType === 'show_more_guidance') {
    recommendationType = 'show_more_guidance'
  }

  const aiDecisionInsert: TablesInsert<'ai_decisions'> = {
    user_id: user.id,
    llm_call_id: feedbackLlmCallId,
    recommendation_type: recommendationType,
    entry_path: plannerProfile.entry_path ?? null,
    adaptation_phase: plannerProfile.adaptation_phase ?? null,
    input_snapshot: {
      workout_log_id: workoutLogId,
      overall_rating: parsed.data.overall_rating,
      clarity_score: parsed.data.clarity_score ?? null,
      confidence_score: parsed.data.confidence_score ?? null,
      felt_safe: parsed.data.felt_safe ?? null,
      too_hard_flag: parsed.data.too_hard_flag ?? false,
      pain_flag: parsed.data.pain_flag ?? false,
      ready_for_next_workout: parsed.data.ready_for_next_workout ?? null,
      red_flag_symptoms: redFlagEvaluation.symptoms,
      source_exercise_slugs: sourceExerciseSlugs,
      feedback_guardrails: {
        blocked_for_llm: feedbackExtraction.guardrails.blockedForLlm,
        reasons: feedbackExtraction.guardrails.reasons,
        sanitized_text_present: feedbackExtraction.guardrails.sanitizedText.length > 0,
      },
      planner_context_summary: {
        communication: plannerContext.communication,
        adaptation: plannerContext.adaptation,
      },
    } as unknown as Json,
    decision_payload: {
      feedback_insight: feedbackExtraction.insight,
      regeneration_decision: regenerationDecision,
      progression_decision: progressionDecision
        ? {
            should_advance: progressionDecision.shouldAdvance,
            next_adaptation_phase: progressionDecision.nextAdaptationPhase,
            switch_to_standard_view: progressionDecision.switchToStandardView,
            recommendation_type: progressionDecision.recommendationType,
            trainer_consultation_recommended: shouldRecommendTrainerConsultation,
          }
        : null,
      adaptation_snapshot: plannerContext.adaptation,
      communication_profile: plannerContext.communication,
      muscle_balance: plannerContext.muscle_balance,
      feedback_guardrails: {
        blocked_for_llm: feedbackExtraction.guardrails.blockedForLlm,
        reasons: feedbackExtraction.guardrails.reasons,
      },
    } as unknown as Json,
    rationale: progressionDecision?.reason ?? regenerationDecision.rationale,
  }

  await adminSupabase.from('ai_decisions').insert(aiDecisionInsert)

  const shouldQueueRegeneration =
    regenerationDecision.shouldRegenerate ||
    progressionDecision?.shouldAdvance === true ||
    progressionDecision?.recommendationType === 'show_more_guidance'

  if (shouldQueueRegeneration) {
    try {
      await queueAiTask({
        userId: user.id,
        taskType: 'generate_training_plan',
        eventName: 'nudge/plan.training.generate',
        taskFailureMessage: TRAINING_REGENERATION_START_ERROR,
      })
    } catch (error) {
      console.error('Failed to queue training plan regeneration after workout finish.', error)
    }
  }

  try {
    await dispatchInngestEvent({
      name: 'nudge/workout.finished',
      data: {
        user_id: user.id,
        workout_log_id: workoutLogId,
        red_flag_symptoms: redFlagEvaluation.symptoms,
      },
    })
  } catch (error) {
    console.error('Failed to dispatch workout.finished event.', error)
  }

  return NextResponse.json({ ok: true })
}
