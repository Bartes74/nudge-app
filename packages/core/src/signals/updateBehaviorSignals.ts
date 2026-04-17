import type { SupabaseClient } from '@supabase/supabase-js'

export interface BehaviorSignalsInput {
  userId: string
}

/**
 * Recalculates all 10 behavior signal counters for a user and upserts the row.
 * Called by Inngest after workout.finished, checkin.submitted, meal.logged events.
 */
export async function updateBehaviorSignals(
  supabase: SupabaseClient,
  { userId }: BehaviorSignalsInput,
): Promise<void> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    workoutLogsResult,
    mealLogsResult,
    bodyMeasurementsResult,
    questionAsksResult,
    coachMessagesResult,
    planWorkoutsResult,
  ] = await Promise.all([
    supabase
      .from('workout_logs')
      .select('started_at, ended_at, duration_min')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(60),

    supabase
      .from('meal_logs')
      .select('logged_at, input_mode')
      .eq('user_id', userId)
      .gte('logged_at', sevenDaysAgo),

    supabase
      .from('body_measurements')
      .select('measured_at')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(30),

    supabase
      .from('user_question_asks')
      .select('answered_at')
      .eq('user_id', userId)
      .not('answered_at', 'is', null)
      .order('answered_at', { ascending: false })
      .limit(1),

    supabase
      .from('coach_messages')
      .select('created_at')
      .eq('role', 'user')
      .gte('created_at', sevenDaysAgo)
      .limit(200),

    supabase
      .from('training_plans')
      .select(`
        current_version:training_plan_versions!training_plans_current_version_fk (
          workouts:plan_workouts ( id )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
  ])

  interface WorkoutLogRow { started_at: string; ended_at: string | null; duration_min: number | null }
  interface MealLogRow { logged_at: string; input_mode: string | null }
  interface MeasurementRow { measured_at: string }
  interface QuestionAskRow { answered_at: string | null }

  const workoutLogs: WorkoutLogRow[] = workoutLogsResult.data ?? []
  const mealLogs: MealLogRow[] = mealLogsResult.data ?? []
  const bodyMeasurements: MeasurementRow[] = bodyMeasurementsResult.data ?? []
  const questionAsks: QuestionAskRow[] = questionAsksResult.data ?? []
  const coachMessages: unknown[] = coachMessagesResult.data ?? []

  // 1. days_since_last_workout_log
  const lastWorkout = workoutLogs[0]
  const daysSinceLast = lastWorkout
    ? Math.floor((now.getTime() - new Date(lastWorkout.started_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // 2. workout_completion_rate_7d — completed / planned in last 7 days
  const recentLogs7d = workoutLogs.filter((w) => w.started_at >= sevenDaysAgo)
  const completedWithEnd7d = recentLogs7d.filter((w) => w.ended_at != null).length

  const planVersion = (planWorkoutsResult.data?.current_version as unknown as { workouts: { id: string }[] } | null)
  const workoutsPerWeek = planVersion?.workouts?.length ?? 0
  const completionRate7d =
    workoutsPerWeek > 0
      ? Math.min(completedWithEnd7d / workoutsPerWeek, 1)
      : completedWithEnd7d > 0
        ? 1
        : null

  // 3. workout_completion_rate_30d
  const recentLogs30d = workoutLogs.filter((w) => w.started_at >= thirtyDaysAgo)
  const completedWithEnd30d = recentLogs30d.filter((w) => w.ended_at != null).length
  const plannedIn30d = workoutsPerWeek * 4
  const completionRate30d =
    plannedIn30d > 0
      ? Math.min(completedWithEnd30d / plannedIn30d, 1)
      : completedWithEnd30d > 0
        ? 1
        : null

  // 4. meal_logs_per_day_7d
  const mealLogsPerDay7d = mealLogs.length > 0 ? Math.round((mealLogs.length / 7) * 100) / 100 : 0

  // 5. photo_vs_text_ratio (among last 7d meal logs)
  const photoCount = mealLogs.filter((m) =>
    m.input_mode === 'photo' || m.input_mode === 'photo_plus_text',
  ).length
  const photoVsTextRatio =
    mealLogs.length > 0 ? Math.round((photoCount / mealLogs.length) * 100) / 100 : null

  // 6. onboarding_fields_skipped — count question_asks skipped without answering
  const { data: skippedAsks } = await supabase
    .from('user_question_asks')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .not('skipped_at', 'is', null)
    .is('answered_at', null)
  const onboardingFieldsSkipped = skippedAsks?.length ?? 0

  // 7. weight_log_regularity_score — fraction of weeks with ≥1 measurement in last 4 weeks
  const weeksWithMeasurement = new Set<number>()
  for (const m of bodyMeasurements) {
    const msAgo = now.getTime() - new Date(m.measured_at).getTime()
    const weeksAgo = Math.floor(msAgo / (7 * 24 * 60 * 60 * 1000))
    if (weeksAgo < 4) weeksWithMeasurement.add(weeksAgo)
  }
  const weightLogRegularityScore = Math.round((weeksWithMeasurement.size / 4) * 100) / 100

  // 8. avg_session_length_sec — average over completed sessions with duration
  const completedWithDuration = workoutLogs.filter(
    (w) => w.ended_at != null && w.duration_min != null,
  )
  const avgSessionLengthSec =
    completedWithDuration.length > 0
      ? Math.round(
          completedWithDuration.reduce((sum, w) => sum + (w.duration_min ?? 0), 0) /
            completedWithDuration.length *
            60,
        )
      : null

  // 9. last_question_answered_at
  const lastQuestionAnsweredAt = questionAsks[0]?.answered_at ?? null

  // 10. coach_messages_sent_7d
  const coachMessagesSent7d = coachMessages.length

  await supabase.from('behavior_signals').upsert(
    {
      user_id: userId,
      days_since_last_workout_log: daysSinceLast,
      workout_completion_rate_7d: completionRate7d,
      workout_completion_rate_30d: completionRate30d,
      meal_logs_per_day_7d: mealLogsPerDay7d,
      photo_vs_text_ratio: photoVsTextRatio,
      onboarding_fields_skipped: onboardingFieldsSkipped,
      weight_log_regularity_score: weightLogRegularityScore,
      avg_session_length_sec: avgSessionLengthSec,
      last_question_answered_at: lastQuestionAnsweredAt,
      coach_messages_sent_7d: coachMessagesSent7d,
      updated_at: now.toISOString(),
    },
    { onConflict: 'user_id' },
  )
}
