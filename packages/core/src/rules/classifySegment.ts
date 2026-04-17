import { normalizeExperienceLevel, type ExperienceLevel, type PrimaryGoal } from '../domain/profile'
import type { SegmentKey, SegmentProfile, SegmentResult } from '../domain/segment'
import { calculateAgeBucket } from './calculateAgeBucket'

/**
 * Classifies a user into one active segment key.
 * Segment key = "{experience_level}_{primary_goal}".
 *
 * Fallbacks:
 *   - null experience_level → 'beginner_zero'
 *   - null primary_goal     → 'general_health'
 *
 * Pure function — no side effects.
 */
export function classifySegment(profile: SegmentProfile): SegmentResult {
  const experience: ExperienceLevel =
    normalizeExperienceLevel(profile.experience_level) ?? 'beginner_zero'
  const goal: PrimaryGoal = profile.primary_goal ?? 'general_health'

  const segment_key: SegmentKey = `${experience}_${goal}` as SegmentKey

  const age_bucket =
    profile.age_bucket ?? calculateAgeBucket(null)

  return {
    segment_key,
    experience_level: experience,
    primary_goal: goal,
    gender: profile.gender ?? null,
    age_bucket: age_bucket ?? null,
    life_context: profile.life_context ?? [],
  }
}
