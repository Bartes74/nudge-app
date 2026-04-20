import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  Json,
} from '@nudge/core/types/db'
import {
  buildFallbackFeedbackInsights,
  deriveAdaptationSnapshot,
  deriveCommunicationProfile,
  summarizeExerciseHistory,
  summarizeMuscleBalance,
} from '@nudge/core/planners/training/adaptation'
import type {
  ExerciseHistorySession,
  PlannerBehaviorSignals,
  PlannerProfile,
  RecentWorkoutSummary,
  TrainingPlannerContext,
  WorkoutFeedbackInsight,
} from '@nudge/core/planners/training/types'

type AppSupabaseClient = SupabaseClient<Database>

interface PlannerContextSource {
  workoutLogId: string
  startedAt: string
}

function toRecentWorkoutSummary(
  row: Pick<
    Database['public']['Tables']['workout_logs']['Row'],
    | 'id'
    | 'started_at'
    | 'ended_at'
    | 'duration_min'
    | 'overall_rating'
    | 'clarity_score'
    | 'confidence_score'
    | 'felt_safe'
    | 'exercise_confusion_flag'
    | 'machine_confusion_flag'
    | 'too_hard_flag'
    | 'pain_flag'
    | 'ready_for_next_workout'
    | 'went_well'
    | 'went_poorly'
    | 'what_to_improve'
  >,
): RecentWorkoutSummary {
  return {
    workout_log_id: row.id,
    started_at: row.started_at,
    ended_at: row.ended_at,
    duration_min: row.duration_min,
    overall_rating: row.overall_rating,
    clarity_score: row.clarity_score,
    confidence_score: row.confidence_score,
    felt_safe: row.felt_safe,
    exercise_confusion_flag: row.exercise_confusion_flag ?? false,
    machine_confusion_flag: row.machine_confusion_flag ?? false,
    too_hard_flag: row.too_hard_flag ?? false,
    pain_flag: row.pain_flag ?? false,
    ready_for_next_workout: row.ready_for_next_workout,
    went_well: row.went_well,
    went_poorly: row.went_poorly,
    what_to_improve: row.what_to_improve,
  }
}

function defaultBehaviorSignals(): PlannerBehaviorSignals {
  return {
    workout_completion_rate_7d: null,
    workout_completion_rate_30d: null,
    clarity_score_avg_7d: null,
    confidence_score_avg_7d: null,
    substitution_count_7d: null,
    substitution_count_30d: null,
    pain_flag_count_7d: null,
    too_hard_flag_count_7d: null,
    days_since_last_workout_log: null,
    avg_session_length_sec: null,
  }
}

function parseFeedbackInsight(
  decisionPayload: Json | null,
): WorkoutFeedbackInsight | null {
  if (!decisionPayload || typeof decisionPayload !== 'object' || Array.isArray(decisionPayload)) {
    return null
  }

  const feedbackInsight = (decisionPayload as { feedback_insight?: unknown }).feedback_insight
  if (!feedbackInsight || typeof feedbackInsight !== 'object' || Array.isArray(feedbackInsight)) {
    return null
  }

  const insight = feedbackInsight as {
    workout_log_id?: unknown
    summary?: unknown
    themes?: unknown
    recommended_focus?: unknown
    needs_more_guidance?: unknown
    needs_lower_intensity?: unknown
    confidence_drop?: unknown
    recovery_issue?: unknown
    exercise_slugs_to_avoid?: unknown
  }

  return {
    workout_log_id: typeof insight.workout_log_id === 'string' ? insight.workout_log_id : null,
    summary: typeof insight.summary === 'string' ? insight.summary : null,
    themes: Array.isArray(insight.themes)
      ? insight.themes.filter((value): value is WorkoutFeedbackInsight['themes'][number] => typeof value === 'string')
      : [],
    recommended_focus:
      typeof insight.recommended_focus === 'string' ? insight.recommended_focus : null,
    needs_more_guidance: insight.needs_more_guidance === true,
    needs_lower_intensity: insight.needs_lower_intensity === true,
    confidence_drop: insight.confidence_drop === true,
    recovery_issue: insight.recovery_issue === true,
    exercise_slugs_to_avoid: Array.isArray(insight.exercise_slugs_to_avoid)
      ? insight.exercise_slugs_to_avoid.filter((value): value is string => typeof value === 'string')
      : [],
  }
}

export async function buildTrainingPlannerContext({
  supabase,
  userId,
  profile,
}: {
  supabase: AppSupabaseClient
  userId: string
  profile: PlannerProfile
}): Promise<TrainingPlannerContext> {
  const { data: workoutLogs, error: workoutLogsError } = await supabase
    .from('workout_logs')
    .select(
      'id, started_at, ended_at, duration_min, overall_rating, clarity_score, confidence_score, felt_safe, exercise_confusion_flag, machine_confusion_flag, too_hard_flag, pain_flag, ready_for_next_workout, went_well, went_poorly, what_to_improve',
    )
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(24)

  if (workoutLogsError) {
    throw new Error(`Failed to load workout history: ${workoutLogsError.message}`)
  }

  const recentWorkouts = (workoutLogs ?? []).map(toRecentWorkoutSummary)
  const workoutLogIds = recentWorkouts.map((workout) => workout.workout_log_id)
  const workoutLogMap = new Map(
    recentWorkouts.map((workout) => [workout.workout_log_id, { workoutLogId: workout.workout_log_id, startedAt: workout.started_at } satisfies PlannerContextSource]),
  )

  const { data: behaviorSignals } = await supabase
    .from('behavior_signals')
    .select(
      'workout_completion_rate_7d, workout_completion_rate_30d, clarity_score_avg_7d, confidence_score_avg_7d, substitution_count_7d, substitution_count_30d, pain_flag_count_7d, too_hard_flag_count_7d, days_since_last_workout_log, avg_session_length_sec',
    )
    .eq('user_id', userId)
    .maybeSingle()

  const behaviorSignalsSummary: PlannerBehaviorSignals = behaviorSignals
    ? {
        workout_completion_rate_7d: behaviorSignals.workout_completion_rate_7d,
        workout_completion_rate_30d: behaviorSignals.workout_completion_rate_30d,
        clarity_score_avg_7d: behaviorSignals.clarity_score_avg_7d,
        confidence_score_avg_7d: behaviorSignals.confidence_score_avg_7d,
        substitution_count_7d: behaviorSignals.substitution_count_7d,
        substitution_count_30d: behaviorSignals.substitution_count_30d,
        pain_flag_count_7d: behaviorSignals.pain_flag_count_7d,
        too_hard_flag_count_7d: behaviorSignals.too_hard_flag_count_7d,
        days_since_last_workout_log: behaviorSignals.days_since_last_workout_log,
        avg_session_length_sec: behaviorSignals.avg_session_length_sec,
      }
    : defaultBehaviorSignals()

  let exerciseHistorySessions: ExerciseHistorySession[] = []

  if (workoutLogIds.length > 0) {
    const { data: workoutLogExercises, error: workoutLogExercisesError } = await supabase
      .from('workout_log_exercises')
      .select('id, workout_log_id, exercise_id, original_exercise_id, plan_exercise_id, was_substituted')
      .in('workout_log_id', workoutLogIds)

    if (workoutLogExercisesError) {
      throw new Error(`Failed to load workout exercise history: ${workoutLogExercisesError.message}`)
    }

    const workoutLogExerciseIds = (workoutLogExercises ?? []).map((entry) => entry.id)
    const planExerciseIds = (workoutLogExercises ?? [])
      .map((entry) => entry.plan_exercise_id)
      .filter((value): value is string => typeof value === 'string')

    const [{ data: workoutLogSets }, { data: planExercises }] = await Promise.all([
      workoutLogExerciseIds.length > 0
        ? supabase
            .from('workout_log_sets')
            .select('workout_log_exercise_id, reps, weight_kg')
            .in('workout_log_exercise_id', workoutLogExerciseIds)
        : Promise.resolve({ data: [] }),
      planExerciseIds.length > 0
        ? supabase
            .from('plan_exercises')
            .select('id, sets, reps_max')
            .in('id', planExerciseIds)
        : Promise.resolve({ data: [] }),
    ])

    const exerciseIds = [...new Set(
      (workoutLogExercises ?? [])
        .flatMap((entry) => [entry.exercise_id, entry.original_exercise_id])
        .filter((value): value is string => typeof value === 'string'),
    )]

    const { data: exercises } = exerciseIds.length > 0
      ? await supabase
          .from('exercises')
          .select('id, slug, name_pl, category, primary_muscles')
          .in('id', exerciseIds)
      : { data: [] as Array<Pick<Database['public']['Tables']['exercises']['Row'], 'id' | 'slug' | 'name_pl' | 'category' | 'primary_muscles'>> }

    const setsByExerciseId = new Map<string, Array<{ reps: number | null; weight_kg: number | null }>>()
    for (const set of workoutLogSets ?? []) {
      const groupedSets = setsByExerciseId.get(set.workout_log_exercise_id) ?? []
      groupedSets.push({ reps: set.reps, weight_kg: set.weight_kg })
      setsByExerciseId.set(set.workout_log_exercise_id, groupedSets)
    }

    const planExerciseMap = new Map(
      (planExercises ?? []).map((entry) => [entry.id, entry]),
    )
    const exerciseMap = new Map(
      (exercises ?? []).map((entry) => [entry.id, entry]),
    )

    exerciseHistorySessions = (workoutLogExercises ?? []).flatMap((entry) => {
      const log = workoutLogMap.get(entry.workout_log_id)
      if (!log) return []

      const exercise = exerciseMap.get(entry.exercise_id ?? entry.original_exercise_id ?? '')
      if (!exercise) return []

      const sets = setsByExerciseId.get(entry.id) ?? []
      const planExercise = entry.plan_exercise_id
        ? planExerciseMap.get(entry.plan_exercise_id)
        : null
      const totalReps = sets.reduce((sum, set) => sum + (set.reps ?? 0), 0)
      const maxWeightKg = sets.reduce<number | null>((currentMax, set) => {
        if (set.weight_kg == null) return currentMax
        return currentMax == null ? set.weight_kg : Math.max(currentMax, set.weight_kg)
      }, null)

      const targetTotalReps =
        planExercise?.sets != null && planExercise.reps_max != null
          ? planExercise.sets * planExercise.reps_max
          : null

      return [
        {
          exercise_slug: exercise.slug,
          exercise_name: exercise.name_pl,
          category: exercise.category,
          primary_muscles: exercise.primary_muscles ?? [],
          started_at: log.startedAt,
          was_substituted: entry.was_substituted,
          max_weight_kg: maxWeightKg,
          total_reps: totalReps,
          target_total_reps: targetTotalReps,
          hit_top_of_range: targetTotalReps != null ? totalReps >= targetTotalReps : false,
        } satisfies ExerciseHistorySession,
      ]
    })
  }

  const exerciseHistory = summarizeExerciseHistory(exerciseHistorySessions)
  const muscleBalance = summarizeMuscleBalance(exerciseHistory)

  const { data: aiDecisions } = await supabase
    .from('ai_decisions')
    .select('decision_payload')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12)

  const parsedFeedbackInsights = (aiDecisions ?? [])
    .map((decision) => parseFeedbackInsight(decision.decision_payload))
    .filter((insight): insight is WorkoutFeedbackInsight => insight != null)

  const recentFeedback =
    parsedFeedbackInsights.length > 0
      ? parsedFeedbackInsights
      : buildFallbackFeedbackInsights(recentWorkouts)

  const communication = deriveCommunicationProfile({
    profile,
    recentWorkouts,
    recentFeedback,
    behaviorSignals: behaviorSignalsSummary,
  })

  const adaptation = deriveAdaptationSnapshot({
    profile,
    recentWorkouts,
    exerciseHistory,
    muscleBalance,
    recentFeedback,
    behaviorSignals: behaviorSignalsSummary,
  })

  return {
    profile,
    recent_workouts: recentWorkouts,
    exercise_history: exerciseHistory,
    muscle_balance: muscleBalance,
    recent_feedback: recentFeedback,
    behavior_signals: behaviorSignalsSummary,
    communication,
    adaptation,
  }
}
