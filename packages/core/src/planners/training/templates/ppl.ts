import type { PlanTemplate } from '../types'

/**
 * Push / Pull / Legs — 6 sessions/week (2x frequency).
 * Best for: amateur-advanced, muscle_building or strength_performance, 5-6 days.
 */
export function pplTemplate(daysPerWeek: number): PlanTemplate {
  const sixDay = daysPerWeek >= 6

  const workouts = sixDay
    ? [
        { day_label: 'mon', name: 'Push A', order_in_week: 1, duration_min_estimated: 60, focus: ['push'] },
        { day_label: 'tue', name: 'Pull A', order_in_week: 2, duration_min_estimated: 60, focus: ['pull'] },
        { day_label: 'wed', name: 'Legs A', order_in_week: 3, duration_min_estimated: 60, focus: ['legs'] },
        { day_label: 'thu', name: 'Push B', order_in_week: 4, duration_min_estimated: 60, focus: ['push'] },
        { day_label: 'fri', name: 'Pull B', order_in_week: 5, duration_min_estimated: 60, focus: ['pull'] },
        { day_label: 'sat', name: 'Legs B', order_in_week: 6, duration_min_estimated: 60, focus: ['legs'] },
      ]
    : [
        { day_label: 'mon', name: 'Push',  order_in_week: 1, duration_min_estimated: 60, focus: ['push'] },
        { day_label: 'wed', name: 'Pull',  order_in_week: 2, duration_min_estimated: 60, focus: ['pull'] },
        { day_label: 'fri', name: 'Legs',  order_in_week: 3, duration_min_estimated: 60, focus: ['legs'] },
        { day_label: 'sat', name: 'Core',  order_in_week: 4, duration_min_estimated: 30, focus: ['core'] },
      ]

  const weekStructure = Object.fromEntries(
    workouts.map((w) => [w.day_label, w.name.toLowerCase().replace(' ', '_')]),
  )

  return {
    split_type: 'ppl',
    workouts_per_week: workouts.length,
    workouts,
    week_structure: weekStructure,
    notes_for_llm:
      'Push days: chest, shoulders, triceps. ' +
      'Pull days: back, biceps, rear delts. ' +
      'Legs days: quads, hamstrings, glutes, calves. ' +
      (sixDay ? 'A sessions = heavier compound focus, B sessions = volume/isolation focus.' : ''),
  }
}
