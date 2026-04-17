// Segment domain types (ADR-003)

import type { AgeBucket, ExperienceLevel, Gender, PrimaryGoal } from './profile'

/**
 * 8 active segment keys derived from experience_level × primary_goal.
 * Named "{experience}_{goal}" — never use bare if-chains on this value.
 * Use modifier flags (gender, age_bucket, life_context) for nuance.
 */
export type SegmentKey =
  | 'zero_general_health'
  | 'zero_weight_loss'
  | 'zero_muscle_building'
  | 'beginner_muscle_building'
  | 'beginner_weight_loss'
  | 'beginner_general_health'
  | 'amateur_weight_loss'
  | 'amateur_muscle_building'
  | 'amateur_strength_performance'
  | 'amateur_general_health'
  | 'advanced_strength_performance'
  | 'advanced_muscle_building'

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
