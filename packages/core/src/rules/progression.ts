/**
 * Progression decision — should the user increase weight, reps, deload or hold?
 *
 * Algorithm (simplified double-progression model):
 *
 *   For each of the last N sessions of an exercise:
 *     - record whether the user hit the TOP of their target rep range on all sets.
 *
 *   Decision rules:
 *     - All N sessions hit top rep range → increase WEIGHT (next session, drop to bottom of range)
 *     - ≥ 1 session hit top, but not all  → increase REPS (stay at same weight)
 *     - Performance dropped > 15% vs best in window → DELOAD (reduce weight 10–15%)
 *     - Stagnant for N sessions (no reps improvement, no weight increase) → DELOAD
 *     - Otherwise → HOLD (keep weight and reps)
 *
 * Inputs are deliberately simple — no LLM, pure math.
 */

export interface ExerciseSession {
  /** Heaviest weight used in that session (kg). */
  weight_kg: number
  /** Total reps completed across all sets. */
  total_reps: number
  /** Target total reps for that session (sets × target_reps_per_set). */
  target_total_reps: number
  /** True if the user completed all sets at the top of their rep range. */
  hit_top_of_range: boolean
}

export type ProgressionAction = 'weight' | 'reps' | 'deload' | 'hold'

export interface ProgressionResult {
  action: ProgressionAction
  reason: string
  /** Suggested weight adjustment (kg), negative for deload. Null for reps/hold. */
  weight_delta_kg: number | null
}

const DELOAD_THRESHOLD_PCT = 0.15  // 15% drop triggers deload
const DELOAD_REDUCTION_PCT = 0.10  // reduce 10% on deload

export function shouldProgress(
  sessions: ExerciseSession[],
  /** Minimum sessions required before making a progression call. */
  minSessions = 2,
): ProgressionResult {
  if (sessions.length < minSessions) {
    return { action: 'hold', reason: 'Insufficient session history.', weight_delta_kg: null }
  }

  const recent = sessions.slice(-minSessions)
  const allHitTop = recent.every((s) => s.hit_top_of_range)
  const anyHitTop = recent.some((s) => s.hit_top_of_range)

  // Performance drop check — compare last session to best in window
  const bestWeight = Math.max(...sessions.map((s) => s.weight_kg))
  const lastSession = sessions[sessions.length - 1]!
  const lastWeight = lastSession.weight_kg
  const lastTotalReps = lastSession.total_reps
  const prevTotalReps = sessions.length > 1
    ? sessions[sessions.length - 2]!.total_reps
    : lastTotalReps

  const weightDropPct = bestWeight > 0 ? (bestWeight - lastWeight) / bestWeight : 0
  if (weightDropPct > DELOAD_THRESHOLD_PCT) {
    return {
      action: 'deload',
      reason: `Weight dropped ${Math.round(weightDropPct * 100)}% from peak. Deload recommended.`,
      weight_delta_kg: -Math.round(bestWeight * DELOAD_REDUCTION_PCT * 2) / 2, // round to 0.5
    }
  }

  // Stagnation check — reps not improving across all recent sessions
  const repsStagnant = recent.every((s) => !s.hit_top_of_range) &&
    lastTotalReps <= prevTotalReps &&
    sessions.length >= minSessions + 1

  if (repsStagnant) {
    return {
      action: 'deload',
      reason: 'No reps progress across recent sessions. Deload to reset.',
      weight_delta_kg: -Math.round(lastWeight * DELOAD_REDUCTION_PCT * 2) / 2,
    }
  }

  if (allHitTop) {
    return {
      action: 'weight',
      reason: `Hit top of rep range in all ${minSessions} recent sessions. Increase weight.`,
      weight_delta_kg: null,
    }
  }

  if (anyHitTop) {
    return {
      action: 'reps',
      reason: 'Partial progress — push for more reps before adding weight.',
      weight_delta_kg: null,
    }
  }

  return {
    action: 'hold',
    reason: 'Keep current weight and focus on technique.',
    weight_delta_kg: null,
  }
}
