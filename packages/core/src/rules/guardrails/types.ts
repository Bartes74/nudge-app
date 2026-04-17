import type { Gender } from '../../domain/profile'

export type GuardrailFlag =
  | 'underage'
  | 'pregnancy'
  | 'bmi_extreme'
  | 'low_calorie_intake'
  | 'rapid_weight_loss'

export type GuardrailSeverity = 'info' | 'warning' | 'critical'

export interface GuardrailResult {
  flag: GuardrailFlag
  severity: GuardrailSeverity
  /** Human-readable reason why this guardrail was triggered. */
  message: string
  /** What the plan engine should do when this flag is active. */
  restrictions: string[]
}

/** Static profile data needed for guardrail evaluation. */
export interface GuardrailProfile {
  age: number | null
  gender: Gender | null
  weight_kg: number | null
  height_cm: number | null
  is_pregnant: boolean | null
}

/** Dynamic / computed context for guardrails that need recent history. */
export interface GuardrailContext {
  /** Planned daily calorie intake (from macro calculator). Null = not yet calculated. */
  planned_calories: number | null
  /**
   * Recent weight measurements: [{ weight_kg, measured_at ISO string }]
   * Sorted oldest first.
   */
  recent_weights: Array<{ weight_kg: number; measured_at: string }> | null
}
