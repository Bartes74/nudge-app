import type { AgeBucket } from '../domain/profile'

/**
 * Derives an age bucket from a birth date string (YYYY-MM-DD or YYYY).
 * Returns null if birthDate is null/empty/invalid.
 * Pure function — no side effects.
 */
export function calculateAgeBucket(birthDate: string | null): AgeBucket | null {
  if (!birthDate) return null

  const yearStr = birthDate.slice(0, 4)
  const year = parseInt(yearStr, 10)
  if (isNaN(year)) return null

  const currentYear = new Date().getFullYear()
  const age = currentYear - year

  if (age < 0) return null
  if (age < 25) return 'under_25'
  if (age < 40) return 'age_25_40'
  if (age < 55) return 'age_40_55'
  return 'age_55_plus'
}

export function calculateAgeBucketFromAge(ageYears: number | null): AgeBucket | null {
  if (ageYears == null || Number.isNaN(ageYears) || ageYears < 0) return null
  if (ageYears < 25) return 'under_25'
  if (ageYears < 40) return 'age_25_40'
  if (ageYears < 55) return 'age_40_55'
  return 'age_55_plus'
}
