import type { ExerciseCatalogEntry } from './types'

export interface SubstituteResult {
  newExerciseSlug: string
  reason: string
}

/**
 * Pure rule: find the best substitute for a given exercise.
 * Prefers: same category + compatible equipment, then alternatives_slugs from catalog.
 * Falls back to the first available exercise in the same category.
 */
export function substituteExercise(opts: {
  currentSlug: string
  reason: string
  catalog: ExerciseCatalogEntry[]
  availableEquipment: string[]
}): SubstituteResult | null {
  const { currentSlug, catalog, availableEquipment } = opts

  const current = catalog.find((e) => e.slug === currentSlug)
  if (!current) return null

  const equipmentSet = new Set(availableEquipment)

  const isEquipmentAvailable = (e: ExerciseCatalogEntry): boolean =>
    e.equipment_required.length === 0 ||
    e.equipment_required.every((eq) => equipmentSet.has(eq))

  // 1. Try alternatives_slugs from the current exercise
  for (const altSlug of current.alternatives_slugs) {
    const alt = catalog.find((e) => e.slug === altSlug && e.slug !== currentSlug)
    if (alt && isEquipmentAvailable(alt)) {
      return { newExerciseSlug: alt.slug, reason: opts.reason }
    }
  }

  // 2. Try same category, same equipment availability
  const sameCategory = catalog.filter(
    (e) => e.category === current.category && e.slug !== currentSlug && isEquipmentAvailable(e),
  )
  if (sameCategory.length > 0) {
    return { newExerciseSlug: sameCategory[0]!.slug, reason: opts.reason }
  }

  // 3. Any exercise in same category regardless of equipment
  const fallback = catalog.find((e) => e.category === current.category && e.slug !== currentSlug)
  if (fallback) {
    return { newExerciseSlug: fallback.slug, reason: opts.reason }
  }

  return null
}
