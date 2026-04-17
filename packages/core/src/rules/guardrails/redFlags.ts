export const RED_FLAG_SYMPTOMS = [
  'chest_pain',
  'dizziness',
  'unusual_shortness_of_breath',
  'radiating_pain',
  'sharp_joint_pain',
] as const

export type RedFlagSymptom = (typeof RED_FLAG_SYMPTOMS)[number]

export interface RedFlagEvaluation {
  hasRedFlags: boolean
  symptoms: RedFlagSymptom[]
}

export function evaluateRedFlagSymptoms(symptoms: string[]): RedFlagEvaluation {
  const matched = symptoms.filter((symptom): symptom is RedFlagSymptom =>
    (RED_FLAG_SYMPTOMS as readonly string[]).includes(symptom),
  )

  return {
    hasRedFlags: matched.length > 0,
    symptoms: matched,
  }
}
