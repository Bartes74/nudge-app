'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Session {
  started_at: string
  max_weight_kg: number | null
  total_sets: number
}

interface ExerciseHistoryChartProps {
  sessions: Session[]
}

function shortDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}.${d.getMonth() + 1}`
}

export function ExerciseHistoryChart({ sessions }: ExerciseHistoryChartProps) {
  const data = sessions.map((s) => ({
    date: shortDate(s.started_at),
    weight: s.max_weight_kg,
    sets: s.total_sets,
  }))

  const hasWeightData = data.some((d) => d.weight != null)

  if (!hasWeightData) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Brak danych o ciężarze w historii.
      </p>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Maksymalny ciężar (kg)
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value} kg`, 'max'] as [string, string]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
