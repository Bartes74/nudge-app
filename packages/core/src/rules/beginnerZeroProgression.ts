import type { AdaptationPhase } from '../domain/profile'

export interface BeginnerZeroProgressMetrics {
  adaptationPhase: AdaptationPhase
  completedSessions: number
  clarityAverage: number | null
  confidenceAverage: number | null
  feltSafeSessions: number
  painFlagCount: number
  tooHardFlagCount: number
  confusionFlagCount: number
  abortedExerciseCount: number
}

export interface BeginnerZeroProgressDecision {
  shouldAdvance: boolean
  nextAdaptationPhase: AdaptationPhase | null
  switchToStandardView: boolean
  recommendationType:
    | 'repeat_similar_session'
    | 'slow_down'
    | 'show_more_guidance'
    | 'introduce_strength_basics'
  reason: string
}

export function decideBeginnerZeroProgression(
  metrics: BeginnerZeroProgressMetrics,
): BeginnerZeroProgressDecision {
  const clarity = metrics.clarityAverage ?? 0
  const confidence = metrics.confidenceAverage ?? 0
  const hasRedFlags = metrics.painFlagCount > 0
  const isFrequentlyConfused = metrics.confusionFlagCount >= 2 || metrics.abortedExerciseCount >= 2
  const isFrequentlyOverloaded = metrics.tooHardFlagCount >= 2

  if (hasRedFlags) {
    return {
      shouldAdvance: false,
      nextAdaptationPhase: metrics.adaptationPhase,
      switchToStandardView: false,
      recommendationType: 'slow_down',
      reason: 'User reported pain or other safety red flags.',
    }
  }

  if (isFrequentlyConfused) {
    return {
      shouldAdvance: false,
      nextAdaptationPhase: metrics.adaptationPhase,
      switchToStandardView: false,
      recommendationType: 'show_more_guidance',
      reason: 'User still needs clearer instructions before progression.',
    }
  }

  if (isFrequentlyOverloaded) {
    return {
      shouldAdvance: false,
      nextAdaptationPhase: metrics.adaptationPhase,
      switchToStandardView: false,
      recommendationType: 'repeat_similar_session',
      reason: 'The current load still feels too hard.',
    }
  }

  if (
    metrics.adaptationPhase === 'phase_0_familiarization' &&
    metrics.completedSessions >= 3 &&
    clarity >= 4 &&
    metrics.feltSafeSessions >= 2
  ) {
    return {
      shouldAdvance: true,
      nextAdaptationPhase: 'phase_1_adaptation',
      switchToStandardView: false,
      recommendationType: 'repeat_similar_session',
      reason: 'User completed familiarization safely and understands the flow.',
    }
  }

  if (
    metrics.adaptationPhase === 'phase_1_adaptation' &&
    metrics.completedSessions >= 4 &&
    clarity >= 4 &&
    confidence >= 3.5
  ) {
    return {
      shouldAdvance: true,
      nextAdaptationPhase: 'phase_2_foundations',
      switchToStandardView: false,
      recommendationType: 'introduce_strength_basics',
      reason: 'User is ready to start simple strength foundations.',
    }
  }

  if (
    metrics.adaptationPhase === 'phase_2_foundations' &&
    metrics.completedSessions >= 4 &&
    clarity >= 4 &&
    confidence >= 4 &&
    metrics.abortedExerciseCount === 0
  ) {
    return {
      shouldAdvance: true,
      nextAdaptationPhase: 'phase_2_foundations',
      switchToStandardView: true,
      recommendationType: 'introduce_strength_basics',
      reason: 'User can move from guided foundations to the standard view.',
    }
  }

  return {
    shouldAdvance: false,
    nextAdaptationPhase: metrics.adaptationPhase,
    switchToStandardView: false,
    recommendationType: 'repeat_similar_session',
    reason: 'Keep building confidence with a similar session.',
  }
}
