type NullableProfileValue = string | number | string[] | null | undefined

export interface ProfileFactRow {
  field_key: string
  value_text: string | null
  value_numeric: number | null
  value_json: unknown | null
}

export interface BasicProfileFields {
  display_name: string | null
  birth_date: string | null
  gender: string | null
  height_cm: number | null
  current_weight_kg: number | null
  experience_level: string | null
  primary_goal: string | null
  nutrition_mode: string | null
  dietary_constraints: string[] | null
  life_context: string[] | null
}

function isMissingValue(value: NullableProfileValue): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

function factValueForField(
  fact: ProfileFactRow | undefined,
  field: keyof BasicProfileFields,
): NullableProfileValue {
  if (!fact) return null

  if (field === 'height_cm' || field === 'current_weight_kg') {
    return fact.value_numeric
  }

  if (field === 'dietary_constraints' || field === 'life_context') {
    return Array.isArray(fact.value_json) ? (fact.value_json as string[]) : null
  }

  return fact.value_text
}

export function applyProfileFallbacks<T extends BasicProfileFields>(
  profile: T,
  facts: ProfileFactRow[],
): T {
  const latestFacts = new Map<string, ProfileFactRow>()

  for (const fact of facts) {
    if (!latestFacts.has(fact.field_key)) {
      latestFacts.set(fact.field_key, fact)
    }
  }

  const nextProfile = { ...profile } as T
  const mutableProfile = nextProfile as unknown as Record<string, NullableProfileValue>
  const fields: Array<keyof BasicProfileFields> = [
    'display_name',
    'birth_date',
    'gender',
    'height_cm',
    'current_weight_kg',
    'experience_level',
    'primary_goal',
    'nutrition_mode',
    'dietary_constraints',
    'life_context',
  ]

  for (const field of fields) {
    if (!isMissingValue(mutableProfile[field])) continue

    const fallbackValue = factValueForField(latestFacts.get(field), field)
    if (isMissingValue(fallbackValue)) continue

    mutableProfile[field] = fallbackValue
  }

  return nextProfile
}
