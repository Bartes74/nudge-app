// Segment domain types (ADR-003)

import type { AgeBucket, ExperienceLevel, Gender, PrimaryGoal } from './profile'

/**
 * Segment keys are derived from experience_level × primary_goal.
 * Named "{experience}_{goal}" — never use bare if-chains on this value.
 * Use modifier flags (gender, age_bucket, life_context) for nuance.
 */
export type SegmentKey = `${ExperienceLevel}_${PrimaryGoal}`

export interface SegmentProfile {
  experience_level: ExperienceLevel | null
  primary_goal: PrimaryGoal | null
  gender: Gender | null
  age_bucket: AgeBucket | null
  life_context: string[] | null
}

export interface SegmentResult {
  segment_key: SegmentKey
  experience_level: ExperienceLevel
  primary_goal: PrimaryGoal
  gender: Gender | null
  age_bucket: AgeBucket | null
  life_context: string[]
}
