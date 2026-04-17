export const COACH_INTENTS = [
  'technical_exercise',
  'diet',
  'motivation',
  'pain',
  'goal_extreme',
  'greeting',
  'other',
] as const

export type CoachIntent = (typeof COACH_INTENTS)[number]

export interface IntentClassificationResult {
  intent: CoachIntent
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export interface GuardrailResult {
  safe: boolean
  modified_text: string
  flags: string[]
}

export interface CoachContext {
  segment?: string
  primary_goal?: string | null
  exercise_name?: string | null
  exercise_slug?: string | null
  exercise_description?: string | null
  kcal?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  strategy_notes?: string | null
  workouts_7d?: number
  weight_trend?: string | null
}
