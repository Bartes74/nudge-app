export interface WeightPointInput {
  date: string
  weight_kg: number
  source: 'measurement' | 'profile_snapshot'
}

export interface WeightDataPoint {
  date: string
  weight_kg: number
  rolling_avg: number | null
  is_measurement: boolean
  measurement_weight_kg: number | null
  point_type: 'measurement' | 'profile_snapshot' | 'interpolated'
}

export interface WeightTrend {
  direction: 'up' | 'down' | 'stable'
  delta_kg: number
}

interface WeightMeasurementRow {
  measured_at: string | null
  weight_kg: number | string | null
}

interface WeightProfileSnapshot {
  current_weight_kg: number | string | null
  updated_at?: string | null
  onboarding_completed_at?: string | null
}

export type WeightRangeKey = '7d' | '30d' | '3m' | '6m' | '12m' | '3y'

export const WEIGHT_RANGE_OPTIONS: Array<{ key: WeightRangeKey; label: string }> = [
  { key: '7d', label: '7 dni' },
  { key: '30d', label: '30 dni' },
  { key: '3m', label: '3 mies.' },
  { key: '6m', label: '6 mies.' },
  { key: '12m', label: '12 mies.' },
  { key: '3y', label: '3 lata' },
]

const DAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function toDayKey(date: string): string {
  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return date

  const parts = DAY_FORMATTER.formatToParts(parsedDate)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) return date

  return `${year}-${month}-${day}`
}

function toDayValue(dayKey: string): number {
  return new Date(`${dayKey}T00:00:00.000Z`).getTime()
}

function addDays(dayKey: string, days: number): string {
  const date = new Date(`${dayKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function toWeightNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 10) / 10
}

export function buildWeightPointInputs(
  rows: WeightMeasurementRow[],
  profile?: WeightProfileSnapshot | null,
): WeightPointInput[] {
  const byDay = new Map<string, WeightPointInput>()

  for (const row of rows) {
    if (!row.measured_at) continue
    const weight = toWeightNumber(row.weight_kg)
    if (weight == null) continue

    const dayKey = toDayKey(row.measured_at)
    byDay.set(dayKey, { date: dayKey, weight_kg: weight, source: 'measurement' })
  }

  const points = Array.from(byDay.values()).sort((left, right) => left.date.localeCompare(right.date))
  const profileWeight = toWeightNumber(profile?.current_weight_kg)

  if (profileWeight == null) {
    return points
  }

  const profileDate =
    profile?.updated_at ??
    profile?.onboarding_completed_at ??
    new Date().toISOString()
  const profileDay = toDayKey(profileDate)
  const latestPoint = points[points.length - 1]

  if (!latestPoint) {
    return [{ date: profileDay, weight_kg: profileWeight, source: 'profile_snapshot' }]
  }

  if (toDayValue(profileDay) > toDayValue(latestPoint.date)) {
    byDay.set(profileDay, {
      date: profileDay,
      weight_kg: profileWeight,
      source: 'profile_snapshot',
    })
  }

  return Array.from(byDay.values()).sort((left, right) => left.date.localeCompare(right.date))
}

export function buildInterpolatedWeightSeries(points: WeightPointInput[]): WeightDataPoint[] {
  if (points.length === 0) return []

  if (points.length === 1) {
    return [
      {
        date: points[0]!.date,
        weight_kg: points[0]!.weight_kg,
        rolling_avg: null,
        is_measurement: true,
        measurement_weight_kg: points[0]!.weight_kg,
        point_type: points[0]!.source,
      },
    ]
  }

  const series: WeightDataPoint[] = []

  for (let index = 0; index < points.length; index += 1) {
    const currentPoint = points[index]
    const nextPoint = points[index + 1]

    if (!currentPoint) continue

    series.push({
      date: currentPoint.date,
      weight_kg: currentPoint.weight_kg,
      rolling_avg: null,
      is_measurement: true,
      measurement_weight_kg: currentPoint.weight_kg,
      point_type: currentPoint.source,
    })

    if (!nextPoint) continue

    const gapDays =
      Math.round((toDayValue(nextPoint.date) - toDayValue(currentPoint.date)) / (24 * 60 * 60 * 1000))

    if (gapDays <= 1) continue

    for (let offset = 1; offset < gapDays; offset += 1) {
      const ratio = offset / gapDays
      const approximatedWeight =
        currentPoint.weight_kg + (nextPoint.weight_kg - currentPoint.weight_kg) * ratio

      series.push({
        date: addDays(currentPoint.date, offset),
        weight_kg: Math.round(approximatedWeight * 10) / 10,
        rolling_avg: null,
        is_measurement: false,
        measurement_weight_kg: null,
        point_type: 'interpolated',
      })
    }
  }

  return series
}

export function computeRollingAverage(points: WeightDataPoint[], windowDays: number): WeightDataPoint[] {
  return points.map((point, index) => {
    const windowStart = Math.max(0, index - windowDays + 1)
    const windowPoints = points.slice(windowStart, index + 1)
    const averageWeight =
      windowPoints.reduce((sum, current) => sum + current.weight_kg, 0) / windowPoints.length

    return {
      ...point,
      rolling_avg: Math.round(averageWeight * 10) / 10,
    }
  })
}

export function computeTrend(points: WeightDataPoint[]): WeightTrend | null {
  if (points.length < 2) return null

  const newestPoint = points[points.length - 1]
  if (!newestPoint) return null

  const trendStart = addDays(newestPoint.date, -6)
  const recentPoints = points.filter((point) => point.date >= trendStart)
  const oldestPoint = recentPoints[0]

  if (!oldestPoint || !newestPoint) return null

  const delta = Math.round((newestPoint.weight_kg - oldestPoint.weight_kg) * 10) / 10
  const direction = Math.abs(delta) < 0.3 ? 'stable' : delta > 0 ? 'up' : 'down'

  return { direction, delta_kg: delta }
}

function shiftDayKey(dayKey: string, { days = 0, months = 0, years = 0 }: {
  days?: number
  months?: number
  years?: number
}): string {
  const date = new Date(`${dayKey}T12:00:00.000Z`)
  date.setUTCFullYear(date.getUTCFullYear() + years)
  date.setUTCMonth(date.getUTCMonth() + months)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function rangeStart(latestDay: string, range: WeightRangeKey): string {
  switch (range) {
    case '7d':
      return shiftDayKey(latestDay, { days: -6 })
    case '30d':
      return shiftDayKey(latestDay, { days: -29 })
    case '3m':
      return shiftDayKey(latestDay, { months: -3, days: 1 })
    case '6m':
      return shiftDayKey(latestDay, { months: -6, days: 1 })
    case '12m':
      return shiftDayKey(latestDay, { years: -1, days: 1 })
    case '3y':
      return shiftDayKey(latestDay, { years: -3, days: 1 })
  }
}

export function filterWeightSeriesByRange(
  points: WeightDataPoint[],
  range: WeightRangeKey,
): WeightDataPoint[] {
  if (points.length === 0) return []

  const latestDay = points[points.length - 1]!.date
  const start = rangeStart(latestDay, range)
  const filtered = points.filter((point) => point.date >= start)

  if (filtered.length > 0) {
    return filtered
  }

  return [points[points.length - 1]!]
}
