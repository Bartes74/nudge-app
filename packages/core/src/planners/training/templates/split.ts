import type { PlanTemplate } from '../types'

/**
 * Body part split — 4-5 sessions/week.
 * Best for: advanced, strength_performance or muscle_building, 4-5 days.
 */
export function splitTemplate(daysPerWeek: number): PlanTemplate {
  const fiveDay = daysPerWeek >= 5

  const workouts = fiveDay
    ? [
        { day_label: 'mon', name: 'Klatka i triceps',   order_in_week: 1, duration_min_estimated: 55, focus: ['push'] },
        { day_label: 'tue', name: 'Plecy i biceps',     order_in_week: 2, duration_min_estimated: 55, focus: ['pull'] },
        { day_label: 'wed', name: 'Nogi',               order_in_week: 3, duration_min_estimated: 65, focus: ['legs'] },
        { day_label: 'thu', name: 'Barki i triceps',    order_in_week: 4, duration_min_estimated: 50, focus: ['push'] },
        { day_label: 'fri', name: 'Pośladki i core',    order_in_week: 5, duration_min_estimated: 50, focus: ['legs', 'core'] },
      ]
    : [
        { day_label: 'mon', name: 'Klatka i triceps',   order_in_week: 1, duration_min_estimated: 55, focus: ['push'] },
        { day_label: 'tue', name: 'Plecy i biceps',     order_in_week: 2, duration_min_estimated: 55, focus: ['pull'] },
        { day_label: 'thu', name: 'Nogi i pośladki',   order_in_week: 3, duration_min_estimated: 65, focus: ['legs'] },
        { day_label: 'fri', name: 'Barki i core',       order_in_week: 4, duration_min_estimated: 50, focus: ['push', 'core'] },
      ]

  const weekStructure = Object.fromEntries(
    workouts.map((w) => [w.day_label, w.name.toLowerCase().replace(/\s+/g, '_').replace(/[ąćęłńóśźż]/g, (c) => c)]),
  )

  return {
    split_type: 'split',
    workouts_per_week: workouts.length,
    workouts,
    week_structure: weekStructure,
    notes_for_llm:
      'Body part split — each session focuses on specific muscle groups. ' +
      'Higher volume per muscle group per session vs other splits. ' +
      'Include both compound and isolation movements.',
  }
}
