import type { Fact } from '../domain/fact'
import type { ProfileInput, LocationType } from '../domain/profile'

type EquipmentKey =
  | 'has_barbell'
  | 'has_dumbbells'
  | 'has_kettlebells'
  | 'has_machines'
  | 'has_cables'
  | 'has_pullup_bar'
  | 'has_bench'
  | 'has_cardio'

const EQUIPMENT_KEYS: EquipmentKey[] = [
  'has_barbell',
  'has_dumbbells',
  'has_kettlebells',
  'has_machines',
  'has_cables',
  'has_pullup_bar',
  'has_bench',
  'has_cardio',
]

/**
 * Converts onboarding form answers into an array of Fact objects.
 * Each skipped / null field gets confidence 0 instead of being omitted,
 * so downstream code knows the question was seen but skipped.
 *
 * Pure function — no side effects.
 */
export function generateFactsFromOnboarding(
  answers: ProfileInput,
  observedAt?: string,
): Fact[] {
  const now = observedAt ?? new Date().toISOString()
  const facts: Fact[] = []

  function push(
    field_key: string,
    value: Partial<Omit<Fact, 'field_key' | 'source' | 'observed_at'>>,
    skipped: boolean,
  ): void {
    facts.push({
      field_key,
      value_text: value.value_text ?? null,
      value_numeric: value.value_numeric ?? null,
      value_bool: value.value_bool ?? null,
      value_json: value.value_json ?? null,
      unit: value.unit ?? null,
      source: 'onboarding',
      confidence: skipped ? 0 : (value.confidence ?? 1.0),
      observed_at: now,
    })
  }

  // primary_goal
  if (answers.primary_goal != null) {
    push('primary_goal', { value_text: answers.primary_goal, confidence: 1.0 }, false)
  } else {
    push('primary_goal', {}, true)
  }

  // birth_date
  if (answers.birth_date != null) {
    push('birth_date', { value_text: answers.birth_date, confidence: 1.0 }, false)
  } else {
    push('birth_date', {}, true)
  }

  // gender
  if (answers.gender != null) {
    push('gender', { value_text: answers.gender, confidence: 1.0 }, false)
  } else {
    push('gender', {}, true)
  }

  // height_cm
  if (answers.height_cm != null) {
    push('height_cm', { value_numeric: answers.height_cm, unit: 'cm', confidence: 0.9 }, false)
  } else {
    push('height_cm', { unit: 'cm' }, true)
  }

  // current_weight_kg
  if (answers.current_weight_kg != null) {
    push('current_weight_kg', {
      value_numeric: answers.current_weight_kg,
      unit: 'kg',
      confidence: 0.9,
    }, false)
  } else {
    push('current_weight_kg', { unit: 'kg' }, true)
  }

  // days_per_week
  if (answers.days_per_week != null) {
    push('days_per_week', {
      value_numeric: answers.days_per_week,
      unit: 'days_per_week',
      confidence: 1.0,
    }, false)
  } else {
    push('days_per_week', { unit: 'days_per_week' }, true)
  }

  // equipment_location
  if (answers.equipment_location != null) {
    push('equipment_location', {
      value_text: answers.equipment_location,
      confidence: 1.0,
    }, false)
  } else {
    push('equipment_location', {}, true)
  }

  // equipment_list — stored as JSON array of booleans
  if (answers.equipment_location != null) {
    const equipmentSelection =
      answers.health_constraints != null
        ? EQUIPMENT_KEYS.reduce<Record<EquipmentKey, boolean>>(
            (acc, key) => {
              acc[key] = false
              return acc
            },
            {} as Record<EquipmentKey, boolean>,
          )
        : null

    if (equipmentSelection != null) {
      push('equipment_list', { value_json: equipmentSelection, confidence: 0.9 }, false)
    }
  }

  // experience_level
  if (answers.experience_level != null) {
    push('experience_level', { value_text: answers.experience_level, confidence: 0.9 }, false)
  } else {
    push('experience_level', {}, true)
  }

  // health_constraints (multi-select stored as JSON array)
  if (answers.health_constraints != null && answers.health_constraints.length > 0) {
    push('health_constraints', {
      value_json: answers.health_constraints,
      confidence: 1.0,
    }, false)
  } else if (answers.health_constraints != null) {
    // explicitly answered "none"
    push('health_constraints', { value_json: [], confidence: 1.0 }, false)
  } else {
    push('health_constraints', {}, true)
  }

  // is_pregnant (guardrail)
  if (answers.is_pregnant != null) {
    push('is_pregnant', { value_bool: answers.is_pregnant, confidence: 1.0 }, false)
  } else {
    push('is_pregnant', {}, true)
  }

  // nutrition_mode
  if (answers.nutrition_mode != null) {
    push('nutrition_mode', { value_text: answers.nutrition_mode, confidence: 1.0 }, false)
  } else {
    push('nutrition_mode', {}, true)
  }

  // dietary_constraints
  if (answers.dietary_constraints != null) {
    push('dietary_constraints', {
      value_json: answers.dietary_constraints,
      confidence: 1.0,
    }, false)
  } else {
    push('dietary_constraints', {}, true)
  }

  // life_context
  if (answers.life_context != null) {
    push('life_context', { value_json: answers.life_context, confidence: 1.0 }, false)
  } else {
    push('life_context', {}, true)
  }

  return facts
}

/**
 * Maps onboarding answers to a user_equipment row payload.
 * Pure function.
 */
export function equipmentFromOnboarding(
  location: LocationType,
  selected: string[],
): {
  location_type: LocationType
  has_barbell: boolean
  has_dumbbells: boolean
  has_kettlebells: boolean
  has_machines: boolean
  has_cables: boolean
  has_pullup_bar: boolean
  has_bench: boolean
  has_cardio: boolean
} {
  return {
    location_type: location,
    has_barbell: selected.includes('has_barbell'),
    has_dumbbells: selected.includes('has_dumbbells'),
    has_kettlebells: selected.includes('has_kettlebells'),
    has_machines: selected.includes('has_machines'),
    has_cables: selected.includes('has_cables'),
    has_pullup_bar: selected.includes('has_pullup_bar'),
    has_bench: selected.includes('has_bench'),
    has_cardio: selected.includes('has_cardio'),
  }
}
