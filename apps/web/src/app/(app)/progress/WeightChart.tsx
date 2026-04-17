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
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
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
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minW, maxW]}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}`}
        />
        <Tooltip
          formatter={(value, name) => [
            formatWeight(Number(value)),
            String(name) === 'waga' ? 'Pomiar' : 'Śr. 7 dni',
          ]}
          labelClassName="font-medium"
          contentStyle={{
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend
          formatter={(value: string) => (value === 'waga' ? 'Pomiar' : 'Śr. 7 dni')}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Line
          type="monotone"
          dataKey="waga"
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          dot={{ r: 3, fill: 'hsl(var(--primary))' }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="śr. 7 dni"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          strokeDasharray="4 2"
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
