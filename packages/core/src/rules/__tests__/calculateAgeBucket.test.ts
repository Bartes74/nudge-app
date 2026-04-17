import { describe, it, expect } from 'vitest'
import { calculateAgeBucket } from '../calculateAgeBucket'

const currentYear = new Date().getFullYear()

describe('calculateAgeBucket', () => {
  it('returns null for null input', () => {
    expect(calculateAgeBucket(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(calculateAgeBucket('')).toBeNull()
  })

  it('returns null for invalid date', () => {
    expect(calculateAgeBucket('not-a-date')).toBeNull()
  })

  it('returns under_25 for age 22', () => {
    const year = currentYear - 22
    expect(calculateAgeBucket(`${year}-06-01`)).toBe('under_25')
  })

  it('returns age_25_40 for age 30', () => {
    const year = currentYear - 30
    expect(calculateAgeBucket(`${year}`)).toBe('age_25_40')
  })

  it('returns age_40_55 for age 45', () => {
    const year = currentYear - 45
    expect(calculateAgeBucket(`${year}-01-15`)).toBe('age_40_55')
  })

  it('returns age_55_plus for age 60', () => {
    const year = currentYear - 60
    expect(calculateAgeBucket(`${year}`)).toBe('age_55_plus')
  })
})
