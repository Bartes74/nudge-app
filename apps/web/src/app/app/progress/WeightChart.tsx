'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { WeightDataPoint } from '@/app/api/measurements/weight-history/route'

interface Props {
  data: WeightDataPoint[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
}

function formatWeight(value: number): string {
  return `${value.toFixed(1)} kg`
}

export function WeightChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-body-s text-muted-foreground">
        Brak danych do wyświetlenia
      </div>
    )
  }

  const allWeights = data.map((d) => d.weight_kg)
  const minW = Math.floor(Math.min(...allWeights)) - 1
  const maxW = Math.ceil(Math.max(...allWeights)) + 1

  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    waga: d.weight_kg,
    'śr. 7 dni': d.rolling_avg,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          className="font-mono tabular-nums"
        />
        <YAxis
          domain={[minW, maxW]}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}`}
          className="font-mono tabular-nums"
        />
        <Tooltip
          formatter={(value, name) => [
            formatWeight(Number(value)),
            String(name) === 'waga' ? 'Pomiar' : 'Śr. 7 dni',
          ]}
          labelClassName="font-semibold"
          contentStyle={{
            borderRadius: '12px',
            fontSize: '12px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--surface-1))',
            boxShadow: '0 8px 24px -12px rgb(0 0 0 / 0.15)',
          }}
        />
        <Legend
          formatter={(value: string) => (value === 'waga' ? 'Pomiar' : 'Śr. 7 dni')}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        />
        <Line
          type="monotone"
          dataKey="waga"
          stroke="hsl(var(--brand))"
          strokeWidth={2}
          dot={{ r: 3, fill: 'hsl(var(--brand))', strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="śr. 7 dni"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
