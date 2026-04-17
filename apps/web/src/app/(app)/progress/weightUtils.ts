export interface WeightDataPoint {
  date: string
  weight_kg: number
  rolling_avg: number | null
}

export interface WeightTrend {
  direction: 'up' | 'down' | 'stable'
  delta_kg: number
}

export function computeRollingAverage(
  points: { date: string; weight_kg: number }[],
  windowDays: number,
): WeightDataPoint[] {
  return points.map((point, idx) => {
    const pointDate = new Date(point.date).getTime()
    const windowStart = pointDate - windowDays * 24 * 60 * 60 * 1000

    const windowPoints = points
      .slice(0, idx + 1)
      .filter((p) => new Date(p.date).getTime() >= windowStart)

    const avg =
      windowPoints.length > 0
        ? windowPoints.reduce((sum, p) => sum + p.weight_kg, 0) / windowPoints.length
        : null

    return {
      date: point.date,
      weight_kg: point.weight_kg,
      rolling_avg: avg != null ? Math.round(avg * 10) / 10 : null,
    }
  })
}

export function computeTrend(points: WeightDataPoint[]): WeightTrend | null {
  if (points.length < 2) return null

  const recent = points.slice(-7)
  const oldest = recent[0]
  const newest = recent[recent.length - 1]

  if (!oldest || !newest) return null

  const delta = Math.round((newest.weight_kg - oldest.weight_kg) * 10) / 10
  const direction = Math.abs(delta) < 0.3 ? 'stable' : delta > 0 ? 'up' : 'down'

  return { direction, delta_kg: delta }
}
