import type { CoachIntent } from './types'

const INTENT_TO_PROMPT: Record<CoachIntent, string> = {
  technical_exercise: 'coach_technical_exercise',
  diet: 'coach_diet_question',
  motivation: 'coach_motivation',
  pain: 'coach_pain_flagged',
  goal_extreme: 'coach_pain_flagged', // reuses pain prompt — same referral pattern
  greeting: 'coach_motivation',
  other: 'coach_motivation',
}

export function routeToPrompt(intent: CoachIntent): string {
  return INTENT_TO_PROMPT[intent]
}
