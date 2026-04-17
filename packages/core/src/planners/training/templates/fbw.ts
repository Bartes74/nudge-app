import type { PlanTemplate } from '../types'

/**
 * Full Body Workout — 2-3 sessions/week.
 * Best for: beginners, zero experience, general_health, limited time.
 */
export function fbwTemplate(daysPerWeek: number): PlanTemplate {
  const days = daysPerWeek >= 3 ? ['mon', 'wed', 'fri'] : ['mon', 'thu']
  const sessionNames = days.map((_, i) => `Full Body ${String.fromCharCode(65 + i)}`)

  return {
    split_type: 'fbw',
    workouts_per_week: days.length,
    workouts: days.map((day, i) => ({
      day_label: day,
      name: sessionNames[i]!,
      order_in_week: i + 1,
      duration_min_estimated: 45,
      focus: ['push', 'pull', 'legs', 'core'],
    })),
    week_structure: Object.fromEntries(days.map((d, i) => [d, `fbw_${String.fromCharCode(97 + i)}`])),
    notes_for_llm:
      'Full body — every session trains all muscle groups. ' +
      'Use compound movements first (squat/press/row/hinge), isolations last. ' +
      'Alternate exercise variants between sessions (e.g. session A: squat, session B: goblet squat).',
  }
}
