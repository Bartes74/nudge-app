/**
 * Weekly volume recommendations — sets per muscle group per week.
 *
 * Based on experience_level × primary_goal.
 * Ranges from sports science literature (Schoenfeld, Israetel MEV/MAV/MRV model simplified):
 *
 *   zero:      8–10  sets/week   (minimum effective volume)
 *   beginner: 10–12  sets/week
 *   amateur:  14–16  sets/week
 *   advanced: 16–20  sets/week
 *
 * Goal modifier:
 *   weight_loss        → lower bound of range (caloric deficit limits recovery)
 *   muscle_building    → upper bound of range
 *   strength_performance → mid range (strength, not hypertrophy focus — lower sets, heavier)
 *   general_health     → lower bound (sustainability > volume)
 *
 * Output: sets per week for each muscle group category.
 */

import type { ExperienceLevel, PrimaryGoal } from '../domain/profile'

export interface VolumeInput {
  experience_level: ExperienceLevel | null
  primary_goal: PrimaryGoal | null
}

export interface MuscleGroupVolume {
  sets_per_week: number
  frequency_per_week: number   // how many times to train that group
}

export interface VolumeTargets {
  /** Primary push muscles (chest, anterior deltoid, triceps) */
  push: MuscleGroupVolume
  /** Primary pull muscles (back, rear deltoid, biceps) */
  pull: MuscleGroupVolume
  /** Legs (quads, hamstrings, glutes) */
  legs: MuscleGroupVolume
  /** Core */
  core: MuscleGroupVolume
  experience_level: ExperienceLevel
  primary_goal: PrimaryGoal
}

interface VolumeRange {
  min: number
  max: number
}

const VOLUME_BY_LEVEL: Record<ExperienceLevel, VolumeRange> = {
  zero:     { min: 8,  max: 10 },
  beginner: { min: 10, max: 12 },
  amateur:  { min: 14, max: 16 },
  advanced: { min: 16, max: 20 },
}

function pickSets(range: VolumeRange, goal: PrimaryGoal): number {
  switch (goal) {
    case 'muscle_building':     return range.max
    case 'strength_performance': return Math.round((range.min + range.max) / 2)
    case 'weight_loss':         return range.min
    case 'general_health':      return range.min
  }
}

function frequencyForSets(sets: number, experienceLevel: ExperienceLevel): number {
  // Advanced/amateur can handle higher frequency; beginners benefit from lower
  if (sets >= 18) return 3
  if (sets >= 14) return experienceLevel === 'advanced' ? 3 : 2
  if (sets >= 10) return 2
  return 2 // minimum 2x/week for effective stimulus
}

export function recommendedVolume(input: VolumeInput): VolumeTargets {
  const level: ExperienceLevel = input.experience_level ?? 'zero'
  const goal: PrimaryGoal = input.primary_goal ?? 'general_health'

  const range = VOLUME_BY_LEVEL[level]
  const sets = pickSets(range, goal)

  // Legs typically get same volume as push/pull; core slightly less
  const coreSets = Math.max(6, Math.round(sets * 0.75))
  const freq = frequencyForSets(sets, level)

  const muscleGroup = (s: number, f: number): MuscleGroupVolume => ({
    sets_per_week: s,
    frequency_per_week: f,
  })

  return {
    push: muscleGroup(sets, freq),
    pull: muscleGroup(sets, freq),
    legs: muscleGroup(sets, freq),
    core: muscleGroup(coreSets, Math.max(2, freq - 1)),
    experience_level: level,
    primary_goal: goal,
  }
}
