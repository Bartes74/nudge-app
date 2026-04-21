import type { ExperienceLevel } from '../../domain/profile'
import { shouldProgress, type ExerciseSession, type ProgressionAction } from '../../rules/progression'
import type {
  AdaptationSnapshot,
  CommunicationMaturity,
  CommunicationProfile,
  ExerciseHistorySession,
  ExerciseHistorySummary,
  FeedbackTheme,
  MuscleBalanceSummary,
  PlannerBehaviorSignals,
  PlannerProfile,
  ProgressionBias,
  RecentWorkoutSummary,
  TrainingMaturity,
  WorkoutFeedbackInsight,
} from './types'

type RecommendationType =
  | 'slow_down'
  | 'repeat_similar_session'
  | 'show_more_guidance'
  | 'trainer_consultation'
  | 'simplify_plan'
  | 'introduce_new_machine'
  | 'introduce_strength_basics'

export interface RegenerationDecision {
  shouldRegenerate: boolean
  recommendationType: RecommendationType
  rationale: string
  changeSignals: string[]
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function normalizeExperienceLevel(level: PlannerProfile['experience_level']): ExperienceLevel {
  return level ?? 'beginner'
}

function buildBaseTrainingMaturity(
  experienceLevel: PlannerProfile['experience_level'],
): TrainingMaturity {
  const normalizedLevel = normalizeExperienceLevel(experienceLevel)
  if (normalizedLevel === 'advanced') return 'advanced'
  if (normalizedLevel === 'intermediate') return 'progressing'
  if (normalizedLevel === 'beginner') return 'building'
  return 'novice'
}

function buildBaseCommunicationMaturity(
  experienceLevel: PlannerProfile['experience_level'],
): CommunicationMaturity {
  const normalizedLevel = normalizeExperienceLevel(experienceLevel)
  if (normalizedLevel === 'advanced') return 'advanced'
  if (normalizedLevel === 'intermediate') return 'independent'
  if (normalizedLevel === 'beginner') return 'developing'
  return 'novice'
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function sortByRecentSession(left: ExerciseHistorySummary, right: ExerciseHistorySummary): number {
  const leftTime = left.last_started_at ? new Date(left.last_started_at).getTime() : 0
  const rightTime = right.last_started_at ? new Date(right.last_started_at).getTime() : 0
  return rightTime - leftTime
}

export function summarizeExerciseHistory(
  sessions: ExerciseHistorySession[],
): ExerciseHistorySummary[] {
  const grouped = new Map<string, ExerciseHistorySession[]>()

  for (const session of sessions) {
    const group = grouped.get(session.exercise_slug) ?? []
    group.push(session)
    grouped.set(session.exercise_slug, group)
  }

  return [...grouped.entries()]
    .map(([exerciseSlug, groupedSessions]) => {
      const sortedSessions = [...groupedSessions].sort((left, right) =>
        new Date(left.started_at).getTime() - new Date(right.started_at).getTime(),
      )
      const progressionSessions: ExerciseSession[] = sortedSessions
        .filter((session) => session.max_weight_kg != null && session.target_total_reps != null)
        .map((session) => ({
          weight_kg: session.max_weight_kg ?? 0,
          total_reps: session.total_reps,
          target_total_reps: session.target_total_reps ?? session.total_reps,
          hit_top_of_range: session.hit_top_of_range,
        }))

      const progression =
        progressionSessions.length >= 2
          ? shouldProgress(progressionSessions)
          : {
              action: 'hold' as ProgressionAction,
              reason: 'Insufficient exercise history.',
              weight_delta_kg: null,
            }

      const lastSession = sortedSessions[sortedSessions.length - 1] ?? null

      return {
        exercise_slug: exerciseSlug,
        exercise_name: lastSession?.exercise_name ?? null,
        category: lastSession?.category ?? null,
        primary_muscles: uniqueStrings(sortedSessions.flatMap((session) => session.primary_muscles)),
        sessions_completed: sortedSessions.length,
        last_started_at: lastSession?.started_at ?? null,
        substitutions: sortedSessions.filter((session) => session.was_substituted).length,
        last_weight_kg: lastSession?.max_weight_kg ?? null,
        max_weight_kg:
          sortedSessions.reduce<number | null>(
            (maxWeight, session) => {
              if (session.max_weight_kg == null) return maxWeight
              return maxWeight == null
                ? session.max_weight_kg
                : Math.max(maxWeight, session.max_weight_kg)
            },
            null,
          ) ?? null,
        avg_total_reps:
          average(sortedSessions.map((session) => session.total_reps).filter((value) => value > 0)) ??
          null,
        progression_action:
          progressionSessions.length >= 2
            ? (progression.action as ExerciseHistorySummary['progression_action'])
            : 'none',
        progression_reason:
          progressionSessions.length >= 2 ? progression.reason : 'Not enough data yet.',
        hit_top_recently: sortedSessions.slice(-2).some((session) => session.hit_top_of_range),
      }
    })
    .sort((left, right) => {
      const leftTime = left.last_started_at ? new Date(left.last_started_at).getTime() : 0
      const rightTime = right.last_started_at ? new Date(right.last_started_at).getTime() : 0
      return rightTime - leftTime
    })
}

export function summarizeMuscleBalance(
  exerciseHistory: ExerciseHistorySummary[],
): MuscleBalanceSummary {
  const categoryCounts: Record<string, number> = {}
  const primaryMuscleCounts: Record<string, number> = {}

  for (const summary of exerciseHistory) {
    if (summary.category) {
      categoryCounts[summary.category] = (categoryCounts[summary.category] ?? 0) + summary.sessions_completed
    }

    for (const muscle of summary.primary_muscles) {
      primaryMuscleCounts[muscle] = (primaryMuscleCounts[muscle] ?? 0) + summary.sessions_completed
    }
  }

  const categoryValues = Object.values(categoryCounts)
  const muscleValues = Object.values(primaryMuscleCounts)
  const avgCategoryCount = average(categoryValues) ?? 0
  const avgMuscleCount = average(muscleValues) ?? 0

  return {
    category_counts: categoryCounts,
    primary_muscle_counts: primaryMuscleCounts,
    undertrained_categories: Object.keys(categoryCounts).filter(
      (category) => categoryCounts[category]! < Math.max(1, avgCategoryCount * 0.65),
    ),
    overtrained_categories: Object.keys(categoryCounts).filter(
      (category) => categoryCounts[category]! > Math.max(2, avgCategoryCount * 1.5),
    ),
    undertrained_muscles: Object.keys(primaryMuscleCounts).filter(
      (muscle) => primaryMuscleCounts[muscle]! < Math.max(1, avgMuscleCount * 0.65),
    ),
    overtrained_muscles: Object.keys(primaryMuscleCounts).filter(
      (muscle) => primaryMuscleCounts[muscle]! > Math.max(2, avgMuscleCount * 1.5),
    ),
  }
}

function deriveMaturityFromHistory(
  recentWorkouts: RecentWorkoutSummary[],
  baseTrainingMaturity: TrainingMaturity,
): TrainingMaturity {
  if (recentWorkouts.length === 0) return baseTrainingMaturity

  const recentCompletion = recentWorkouts.filter((workout) => workout.ended_at != null).length
  const recentRating = average(
    recentWorkouts
      .map((workout) => workout.overall_rating)
      .filter((value): value is number => typeof value === 'number'),
  )
  const tooHardCount = recentWorkouts.filter((workout) => workout.too_hard_flag).length

  if (baseTrainingMaturity === 'advanced') return 'advanced'
  if (recentCompletion >= 24 && tooHardCount <= 1 && (recentRating ?? 0) >= 4) return 'advanced'
  if (recentCompletion >= 12 && tooHardCount <= 2) return 'progressing'
  if (recentCompletion >= 4) return baseTrainingMaturity === 'novice' ? 'building' : baseTrainingMaturity
  return baseTrainingMaturity
}

function deriveCommunicationMaturity(
  recentWorkouts: RecentWorkoutSummary[],
  recentFeedback: WorkoutFeedbackInsight[],
  baseCommunicationMaturity: CommunicationMaturity,
): CommunicationMaturity {
  const guidanceIssues = recentFeedback.filter((feedback) => feedback.needs_more_guidance).length
  const clarityScores = recentWorkouts
    .map((workout) => workout.clarity_score)
    .filter((value): value is number => typeof value === 'number')
  const clarityAverage = average(clarityScores)

  if (baseCommunicationMaturity === 'advanced') return 'advanced'
  if (guidanceIssues >= 2 || (clarityAverage != null && clarityAverage < 3.5)) {
    return 'developing'
  }
  if (recentWorkouts.length >= 10 && (clarityAverage ?? 0) >= 4.4) return 'independent'
  return baseCommunicationMaturity
}

export function deriveCommunicationProfile(input: {
  profile: PlannerProfile
  recentWorkouts: RecentWorkoutSummary[]
  recentFeedback: WorkoutFeedbackInsight[]
  behaviorSignals: PlannerBehaviorSignals
}): CommunicationProfile {
  const communicationMaturity = deriveCommunicationMaturity(
    input.recentWorkouts,
    input.recentFeedback,
    buildBaseCommunicationMaturity(input.profile.experience_level),
  )

  const needsMoreGuidance =
    input.recentFeedback.some((feedback) => feedback.needs_more_guidance) ||
    (input.behaviorSignals.clarity_score_avg_7d ?? 5) < 3.8 ||
    (input.behaviorSignals.confidence_score_avg_7d ?? 5) < 3.8

  if (communicationMaturity === 'advanced') {
    return {
      guidance_level: needsMoreGuidance ? 'supported' : 'concise',
      technicality: 'technical',
      tone_preset: 'factual_technical',
      explanation_depth: needsMoreGuidance ? 'medium' : 'low',
    }
  }

  if (communicationMaturity === 'independent') {
    return {
      guidance_level: needsMoreGuidance ? 'supported' : 'concise',
      technicality: 'balanced',
      tone_preset: 'partnering',
      explanation_depth: needsMoreGuidance ? 'medium' : 'low',
    }
  }

  if (communicationMaturity === 'developing') {
    return {
      guidance_level: 'supported',
      technicality: 'plain',
      tone_preset: 'warm_encouraging',
      explanation_depth: 'medium',
    }
  }

  return {
    guidance_level: 'full',
    technicality: 'plain',
    tone_preset: 'calm_guided',
    explanation_depth: 'high',
  }
}

export function buildFallbackFeedbackInsights(
  recentWorkouts: RecentWorkoutSummary[],
): WorkoutFeedbackInsight[] {
  return recentWorkouts
    .filter(
      (workout) =>
        workout.too_hard_flag ||
        workout.pain_flag ||
        workout.ready_for_next_workout === false ||
        workout.went_poorly ||
        workout.what_to_improve,
    )
    .map((workout) => {
      const themes: FeedbackTheme[] = []
      if (workout.too_hard_flag) themes.push('too_hard')
      if (workout.pain_flag) themes.push('pain_or_red_flag')
      if (workout.ready_for_next_workout === false) themes.push('recovery_issue')
      if (workout.clarity_score != null && workout.clarity_score <= 3) themes.push('clarity_issue')
      if (workout.confidence_score != null && workout.confidence_score <= 3) themes.push('confidence_drop')

      return {
        workout_log_id: workout.workout_log_id,
        summary:
          workout.what_to_improve ||
          workout.went_poorly ||
          workout.went_well ||
          null,
        themes: uniqueStrings(themes) as FeedbackTheme[],
        recommended_focus:
          workout.clarity_score != null && workout.clarity_score <= 3
            ? 'Uprość instrukcje i zmniejsz liczbę nowości.'
            : workout.too_hard_flag
              ? 'Utrzymaj prostszy bodziec i spokojniejsze tempo progresji.'
              : null,
        needs_more_guidance:
          (workout.clarity_score != null && workout.clarity_score <= 3) ||
          workout.exercise_confusion_flag === true ||
          workout.machine_confusion_flag === true,
        needs_lower_intensity: workout.too_hard_flag,
        confidence_drop:
          workout.confidence_score != null && workout.confidence_score <= 3,
        recovery_issue: workout.ready_for_next_workout === false,
        exercise_slugs_to_avoid: [],
      }
    })
}

export function deriveAdaptationSnapshot(input: {
  profile: PlannerProfile
  recentWorkouts: RecentWorkoutSummary[]
  exerciseHistory: ExerciseHistorySummary[]
  muscleBalance: MuscleBalanceSummary
  recentFeedback: WorkoutFeedbackInsight[]
  behaviorSignals: PlannerBehaviorSignals
  planAdherence: {
    blocks_progression_until_plan_completed: boolean
    missed_past_due_workouts: number
  }
}): AdaptationSnapshot {
  const baseTrainingMaturity = buildBaseTrainingMaturity(input.profile.experience_level)
  const trainingMaturity = deriveMaturityFromHistory(input.recentWorkouts, baseTrainingMaturity)
  const communicationMaturity = deriveCommunicationMaturity(
    input.recentWorkouts,
    input.recentFeedback,
    buildBaseCommunicationMaturity(input.profile.experience_level),
  )

  const latestFeedbackThemes = uniqueStrings(
    input.recentFeedback.flatMap((feedback) => feedback.themes).slice(0, 8),
  ) as FeedbackTheme[]

  const negativeFeedback =
    latestFeedbackThemes.includes('too_hard') ||
    latestFeedbackThemes.includes('pain_or_red_flag') ||
    latestFeedbackThemes.includes('recovery_issue')
  const incompletePlanBlocksProgression = input.planAdherence.blocks_progression_until_plan_completed
  const requiresMoreGuidance =
    latestFeedbackThemes.includes('clarity_issue') ||
    latestFeedbackThemes.includes('confidence_drop') ||
    input.recentFeedback.some((feedback) => feedback.needs_more_guidance) ||
    (input.behaviorSignals.clarity_score_avg_7d ?? 5) < 3.8 ||
    (input.behaviorSignals.confidence_score_avg_7d ?? 5) < 3.8

  let progressionBias: ProgressionBias = 'hold'
  if (negativeFeedback || (input.behaviorSignals.too_hard_flag_count_7d ?? 0) >= 1) {
    progressionBias = 'slow_down'
  } else if (incompletePlanBlocksProgression) {
    progressionBias = 'hold'
  } else if (
    !requiresMoreGuidance &&
    trainingMaturity !== 'novice' &&
    (input.behaviorSignals.workout_completion_rate_30d ?? 0) >= 0.6
  ) {
    progressionBias = 'progress'
  }

  const avoidExerciseSlugs = uniqueStrings(
    input.recentFeedback.flatMap((feedback) => feedback.exercise_slugs_to_avoid),
  )
  const progressReadyExercises = input.exerciseHistory
    .filter((summary) => summary.progression_action === 'weight' || summary.progression_action === 'reps')
    .sort(sortByRecentSession)
    .map((summary) => summary.exercise_slug)
    .filter((slug) => !avoidExerciseSlugs.includes(slug))
    .slice(0, 6)
  const deloadExercises = input.exerciseHistory
    .filter((summary) => summary.progression_action === 'deload')
    .sort(sortByRecentSession)
    .map((summary) => summary.exercise_slug)
    .slice(0, 4)
  const repeatableExercises = input.exerciseHistory
    .filter((summary) => summary.sessions_completed >= 2 && summary.substitutions === 0)
    .sort(sortByRecentSession)
    .map((summary) => summary.exercise_slug)
    .filter((slug) => !avoidExerciseSlugs.includes(slug))
    .slice(0, 8)
  const preferredFocus = uniqueStrings([
    ...input.muscleBalance.undertrained_categories,
    ...input.muscleBalance.undertrained_muscles,
  ]).slice(0, 4)
  const rationale = [
    progressionBias === 'slow_down'
      ? 'Recent feedback suggests lowering progression pace.'
      : progressionBias === 'progress'
        ? 'Recent completion and confidence allow realistic progression.'
        : 'Hold progression until more signal is available.',
    incompletePlanBlocksProgression
      ? `Do not progress yet because ${input.planAdherence.missed_past_due_workouts} past scheduled workout(s) from the active week were not completed with a summary.`
      : 'Past scheduled workouts are completed enough to evaluate progression fairly.',
    requiresMoreGuidance
      ? 'Communication should stay more guided because clarity/confidence is still building.'
      : 'Communication can be shorter and more autonomous.',
  ]

  return {
    training_maturity: trainingMaturity,
    communication_maturity: communicationMaturity,
    progression_bias: progressionBias,
    requires_more_guidance: requiresMoreGuidance,
    blocks_progression_until_plan_completed: incompletePlanBlocksProgression,
    missed_past_due_workouts: input.planAdherence.missed_past_due_workouts,
    can_introduce_new_skills:
      progressionBias === 'progress' &&
      !incompletePlanBlocksProgression &&
      !requiresMoreGuidance &&
      !latestFeedbackThemes.includes('pain_or_red_flag'),
    should_reduce_novelty:
      progressionBias === 'slow_down' ||
      incompletePlanBlocksProgression ||
      requiresMoreGuidance ||
      trainingMaturity === 'novice',
    latest_feedback_themes: latestFeedbackThemes,
    avoid_exercise_slugs: avoidExerciseSlugs,
    preferred_focus: preferredFocus,
    progress_ready_exercises: progressReadyExercises,
    deload_exercises: deloadExercises,
    repeatable_exercises: repeatableExercises,
    rationale,
  }
}

export function decidePlanRegeneration(input: {
  adaptation: AdaptationSnapshot
  recentFeedback: WorkoutFeedbackInsight[]
  muscleBalance: MuscleBalanceSummary
  behaviorSignals: PlannerBehaviorSignals
  currentEntryPath: PlannerProfile['entry_path']
}): RegenerationDecision {
  const changeSignals: string[] = []
  const latestFeedbackThemes = input.adaptation.latest_feedback_themes

  if (input.adaptation.progression_bias === 'slow_down') {
    changeSignals.push('slow_down')
  }
  if (input.adaptation.requires_more_guidance) {
    changeSignals.push('more_guidance')
  }
  if (input.adaptation.can_introduce_new_skills) {
    changeSignals.push('new_skill_ready')
  }
  if (input.muscleBalance.undertrained_categories.length > 0) {
    changeSignals.push('balance_adjustment')
  }
  if ((input.behaviorSignals.pain_flag_count_7d ?? 0) > 0) {
    changeSignals.push('pain_flag')
  }
  if ((input.behaviorSignals.too_hard_flag_count_7d ?? 0) > 0) {
    changeSignals.push('too_hard')
  }
  if (latestFeedbackThemes.includes('equipment_issue')) {
    changeSignals.push('equipment_issue')
  }

  if (changeSignals.length === 0) {
    return {
      shouldRegenerate: false,
      recommendationType: 'repeat_similar_session',
      rationale: 'No material change signals detected after the latest workout.',
      changeSignals: [],
    }
  }

  if (latestFeedbackThemes.includes('pain_or_red_flag')) {
    return {
      shouldRegenerate: true,
      recommendationType: 'trainer_consultation',
      rationale: 'Safety-related feedback should trigger a more conservative next plan.',
      changeSignals,
    }
  }

  if (input.adaptation.progression_bias === 'slow_down') {
    return {
      shouldRegenerate: true,
      recommendationType: input.currentEntryPath === 'guided_beginner' ? 'show_more_guidance' : 'simplify_plan',
      rationale: 'The next plan should be simplified or slowed down based on recent difficulty/recovery signals.',
      changeSignals,
    }
  }

  if (input.adaptation.can_introduce_new_skills) {
    return {
      shouldRegenerate: true,
      recommendationType:
        input.currentEntryPath === 'guided_beginner'
          ? 'introduce_strength_basics'
          : 'introduce_new_machine',
      rationale: 'The user is ready for a realistic next step in training complexity.',
      changeSignals,
    }
  }

  return {
    shouldRegenerate: true,
    recommendationType: 'repeat_similar_session',
    rationale: 'The next plan should be refreshed to reflect new balance or guidance signals.',
    changeSignals,
  }
}
