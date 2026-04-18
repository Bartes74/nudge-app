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
      <div className="rounded-xl border border-dashed border-border bg-surface-1 px-5 py-6 text-center">
        <p className="text-body-m text-muted-foreground">
          Brak danych o ciężarze w historii.
        </p>
      </div>
    )
  }

  const maxWeight = Math.max(...data.filter((d) => d.weight != null).map((d) => d.weight!))

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-label uppercase text-muted-foreground">Maks. ciężar</p>
          <p className="mt-0.5 font-mono text-data-l tabular-nums text-foreground">
            {maxWeight}
            <span className="ml-1 text-body-m font-sans text-muted-foreground">kg</span>
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--surface-1))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '10px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 4px 16px hsl(var(--foreground) / 0.08)',
            }}
            formatter={(value) => [`${value} kg`, 'max'] as [string, string]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="hsl(var(--brand))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--brand))', r: 3 }}
            activeDot={{ r: 5, fill: 'hsl(var(--brand))' }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
