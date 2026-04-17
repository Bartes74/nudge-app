import { describe, expect, it } from 'vitest'
import { decideBeginnerZeroProgression } from '../beginnerZeroProgression'

describe('decideBeginnerZeroProgression', () => {
  it('blocks progression when pain flags are present', () => {
    const result = decideBeginnerZeroProgression({
      adaptationPhase: 'phase_0_familiarization',
      completedSessions: 3,
      clarityAverage: 5,
      confidenceAverage: 4,
      feltSafeSessions: 3,
      painFlagCount: 1,
      tooHardFlagCount: 0,
      confusionFlagCount: 0,
      abortedExerciseCount: 0,
    })

    expect(result.shouldAdvance).toBe(false)
    expect(result.recommendationType).toBe('slow_down')
  })

  it('holds progression and asks for more guidance when confusion repeats', () => {
    const result = decideBeginnerZeroProgression({
      adaptationPhase: 'phase_1_adaptation',
      completedSessions: 4,
      clarityAverage: 4.5,
      confidenceAverage: 4,
      feltSafeSessions: 4,
      painFlagCount: 0,
      tooHardFlagCount: 0,
      confusionFlagCount: 2,
      abortedExerciseCount: 0,
    })

    expect(result.shouldAdvance).toBe(false)
    expect(result.recommendationType).toBe('show_more_guidance')
  })

  it('advances from familiarization to adaptation when quality gates are met', () => {
    const result = decideBeginnerZeroProgression({
      adaptationPhase: 'phase_0_familiarization',
      completedSessions: 3,
      clarityAverage: 4.2,
      confidenceAverage: 3.2,
      feltSafeSessions: 3,
      painFlagCount: 0,
      tooHardFlagCount: 0,
      confusionFlagCount: 0,
      abortedExerciseCount: 0,
    })

    expect(result.shouldAdvance).toBe(true)
    expect(result.nextAdaptationPhase).toBe('phase_1_adaptation')
    expect(result.switchToStandardView).toBe(false)
  })

  it('moves phase 2 users to standard view only after confidence and clarity are high enough', () => {
    const result = decideBeginnerZeroProgression({
      adaptationPhase: 'phase_2_foundations',
      completedSessions: 4,
      clarityAverage: 4.4,
      confidenceAverage: 4.1,
      feltSafeSessions: 4,
      painFlagCount: 0,
      tooHardFlagCount: 0,
      confusionFlagCount: 0,
      abortedExerciseCount: 0,
    })

    expect(result.shouldAdvance).toBe(true)
    expect(result.switchToStandardView).toBe(true)
    expect(result.recommendationType).toBe('introduce_strength_basics')
  })
})
