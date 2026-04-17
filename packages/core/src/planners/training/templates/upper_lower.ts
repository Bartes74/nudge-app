import type { PlanTemplate } from '../types'

/**
 * Upper / Lower split — 4 sessions/week.
 * Best for: beginner-amateur, muscle_building or weight_loss, 4 days.
 */
export function upperLowerTemplate(): PlanTemplate {
  return {
    split_type: 'upper_lower',
    workouts_per_week: 4,
    workouts: [
      { day_label: 'mon', name: 'Upper A', order_in_week: 1, duration_min_estimated: 50, focus: ['push', 'pull'] },
      { day_label: 'tue', name: 'Lower A', order_in_week: 2, duration_min_estimated: 50, focus: ['legs', 'core'] },
      { day_label: 'thu', name: 'Upper B', order_in_week: 3, duration_min_estimated: 50, focus: ['push', 'pull'] },
      { day_label: 'fri', name: 'Lower B', order_in_week: 4, duration_min_estimated: 50, focus: ['legs', 'core'] },
    ],
    week_structure: { mon: 'upper_a', tue: 'lower_a', thu: 'upper_b', fri: 'lower_b' },
    notes_for_llm:
      'Upper days: horizontal push + vertical pull + horizontal pull + vertical push + arm isolation. ' +
      'Lower days: squat pattern + hinge pattern + unilateral leg + calf + core. ' +
      'Upper A and B should vary exercises slightly for frequency variety.',
  }
}
