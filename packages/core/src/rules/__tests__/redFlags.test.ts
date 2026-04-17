import { describe, expect, it } from 'vitest'
import { evaluateRedFlagSymptoms } from '../guardrails/redFlags'

describe('evaluateRedFlagSymptoms', () => {
  it('returns no escalation when symptoms do not match red flags', () => {
    const result = evaluateRedFlagSymptoms(['normal_fatigue', 'muscle_soreness'])

    expect(result.hasRedFlags).toBe(false)
    expect(result.symptoms).toEqual([])
  })

  it('returns only recognized red flags and ignores unknown symptom keys', () => {
    const result = evaluateRedFlagSymptoms([
      'dizziness',
      'sharp_joint_pain',
      'unknown_symptom',
    ])

    expect(result.hasRedFlags).toBe(true)
    expect(result.symptoms).toEqual(['dizziness', 'sharp_joint_pain'])
  })
})
