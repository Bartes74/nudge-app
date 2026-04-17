import { describe, expect, it } from 'vitest'
import { substituteExercise } from '../substituteExercise'
import type { ExerciseCatalogEntry } from '../types'

const catalog: ExerciseCatalogEntry[] = [
  {
    id: '1',
    slug: 'leg-press',
    name_pl: 'Leg press',
    plain_language_name: 'Wypychanie platformy',
    simple_goal_description: null,
    category: 'legs',
    primary_muscles: ['quads'],
    equipment_required: ['machines'],
    difficulty: 'beginner',
    is_compound: true,
    alternatives_slugs: ['bodyweight-squat'],
    setup_instructions: null,
    execution_steps: [],
    tempo_hint: null,
    breathing_hint: null,
    safety_notes: null,
    common_mistakes: null,
    easy_substitution_slugs: ['sit-to-stand'],
    machine_busy_substitution_slugs: ['bodyweight-squat'],
    stop_conditions: [],
    starting_load_guidance: null,
    technique_notes: null,
  },
  {
    id: '2',
    slug: 'bodyweight-squat',
    name_pl: 'Przysiad bez obciążenia',
    plain_language_name: 'Prosty przysiad',
    simple_goal_description: null,
    category: 'legs',
    primary_muscles: ['quads'],
    equipment_required: [],
    difficulty: 'beginner',
    is_compound: false,
    alternatives_slugs: [],
    setup_instructions: null,
    execution_steps: [],
    tempo_hint: null,
    breathing_hint: null,
    safety_notes: null,
    common_mistakes: null,
    easy_substitution_slugs: [],
    machine_busy_substitution_slugs: [],
    stop_conditions: [],
    starting_load_guidance: null,
    technique_notes: null,
  },
  {
    id: '3',
    slug: 'sit-to-stand',
    name_pl: 'Wstawanie z ławki',
    plain_language_name: 'Wstawanie z ławki',
    simple_goal_description: null,
    category: 'legs',
    primary_muscles: ['quads'],
    equipment_required: ['bench'],
    difficulty: 'beginner',
    is_compound: false,
    alternatives_slugs: [],
    setup_instructions: null,
    execution_steps: [],
    tempo_hint: null,
    breathing_hint: null,
    safety_notes: null,
    common_mistakes: null,
    easy_substitution_slugs: [],
    machine_busy_substitution_slugs: [],
    stop_conditions: [],
    starting_load_guidance: null,
    technique_notes: null,
  },
]

describe('substituteExercise', () => {
  it('uses machine-busy substitutions first when equipment is occupied', () => {
    const result = substituteExercise({
      currentSlug: 'leg-press',
      reason: 'machine_busy',
      catalog,
      availableEquipment: [],
    })

    expect(result).toEqual({
      newExerciseSlug: 'bodyweight-squat',
      reason: 'machine_busy',
    })
  })

  it('uses easier substitutions first when the exercise is unclear or too hard', () => {
    const result = substituteExercise({
      currentSlug: 'leg-press',
      reason: 'too_hard',
      catalog,
      availableEquipment: ['bench'],
    })

    expect(result).toEqual({
      newExerciseSlug: 'sit-to-stand',
      reason: 'too_hard',
    })
  })
})
