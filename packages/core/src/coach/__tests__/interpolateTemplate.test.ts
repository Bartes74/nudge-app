import { describe, expect, it } from 'vitest'
import { interpolateTemplate } from '../callCoach'
import { TONE_PRESETS, type CoachContext } from '../types'

const baseContext: CoachContext & { user_message: string } = {
  user_message: 'Jak poprawnie zrobić martwy ciąg?',
  segment: 'beginner',
  primary_goal: 'muscle_building',
  workouts_7d: 3,
}

describe('interpolateTemplate', () => {
  it('replaces user_message and basic context placeholders', () => {
    const out = interpolateTemplate(
      'Cel: {{primary_goal}}. Segment: {{segment}}. Pytanie: {{user_message}}',
      baseContext,
    )
    expect(out).toBe(
      'Cel: muscle_building. Segment: beginner. Pytanie: Jak poprawnie zrobić martwy ciąg?',
    )
  })

  it('falls back to warm_encouraging directive when tone_preset is absent', () => {
    const out = interpolateTemplate('Styl: {{tone_preset}}.', baseContext)
    expect(out).toContain('ciepły')
    expect(out).toContain('wspierający')
    expect(out).not.toContain('{{tone_preset}}')
  })

  it('maps each tone_preset enum value to a distinct Polish directive', () => {
    const directives = new Set<string>()
    for (const tone of TONE_PRESETS) {
      const out = interpolateTemplate('{{tone_preset}}', { ...baseContext, tone_preset: tone })
      expect(out).not.toContain('{{tone_preset}}')
      expect(out.length).toBeGreaterThan(10)
      directives.add(out)
    }
    expect(directives.size).toBe(TONE_PRESETS.length)
  })

  it('uses empty strings for missing exercise/nutrition context rather than leaving placeholders', () => {
    const out = interpolateTemplate(
      'Ćwiczenie: "{{exercise_name}}", Kcal: {{kcal}}',
      baseContext,
    )
    expect(out).toBe('Ćwiczenie: "", Kcal: ?')
  })
})
