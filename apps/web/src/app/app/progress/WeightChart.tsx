'use client'

import * as React from 'react'
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
import { Button } from '@/components/ui/button'
import {
  WEIGHT_RANGE_OPTIONS,
  filterWeightSeriesByRange,
  type WeightDataPoint,
  type WeightRangeKey,
} from './weightUtils'

interface Props {
  data: WeightDataPoint[]
}

function formatDate(dateStr: string, range: WeightRangeKey): string {
  const date = new Date(`${dateStr}T12:00:00`)

  if (range === '7d') {
    return date.toLocaleDateString('pl-PL', { weekday: 'short' })
  }

  if (range === '30d' || range === '3m') {
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
  }

  return date.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' })
}

function formatWeight(value: number): string {
  return `${value.toFixed(1)} kg`
}

export function WeightChart({ data }: Props) {
  const [range, setRange] = React.useState<WeightRangeKey>('7d')
  const gridColor = 'var(--border-subtle)'
  const axisColor = 'var(--fg-secondary)'
  const tooltipBackground = 'var(--bg-elevated)'
  const tooltipBorder = 'var(--border-strong)'
  const trendColor = 'var(--fg-accent-copper)'
  const rollingAverageColor = 'var(--fg-accent-sage)'
  const dotStrokeColor = 'var(--bg-surface)'

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-body-s text-muted-foreground">
        Brak danych do wyświetlenia
      </div>
    )
  }

  const filteredData = filterWeightSeriesByRange(data, range)
  const allWeights = filteredData.map((d) => d.weight_kg)
  const minW = Math.floor(Math.min(...allWeights)) - 1
  const maxW = Math.ceil(Math.max(...allWeights)) + 1

  const chartData = filteredData.map((d) => ({
    date: d.date,
    trend: d.weight_kg,
    rollingAvg: d.rolling_avg,
    isMeasurement: d.is_measurement,
    measurementWeight: d.measurement_weight_kg,
    pointType: d.point_type,
  }))

  const renderMeasurementDot = (
    props: {
      cx?: number
      cy?: number
      payload?: { isMeasurement?: boolean }
    },
  ): React.ReactElement | null => {
    if (!props.payload?.isMeasurement || props.cx == null || props.cy == null) {
      return null
    }

    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={4}
        fill={trendColor}
        stroke={dotStrokeColor}
        strokeWidth={2}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {WEIGHT_RANGE_OPTIONS.map((option) => (
          <Button
            key={option.key}
            type="button"
            size="sm"
            variant={range === option.key ? 'default' : 'outline'}
            onClick={() => setRange(option.key)}
            className="min-w-[5.25rem]"
          >
            {option.label}
          </Button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={gridColor} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: axisColor }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
            tickFormatter={(value: string) => formatDate(value, range)}
            className="font-mono tabular-nums"
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fontSize: 11, fill: axisColor }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}`}
            className="font-mono tabular-nums"
          />
          <Tooltip
            formatter={(value, name, item) => {
              if (String(name) === 'trend') {
                const pointType = (item.payload as { pointType?: string } | undefined)?.pointType
                const label =
                  pointType === 'profile_snapshot'
                    ? 'Ostatni zapisany stan'
                    : 'Trend dzienny'

                return [formatWeight(Number(value)), label]
              }

              return [formatWeight(Number(value)), 'Śr. 7 dni']
            }}
            labelFormatter={(label) =>
              new Date(`${String(label)}T12:00:00`).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            }
            labelClassName="font-semibold"
            contentStyle={{
              borderRadius: '12px',
              fontSize: '12px',
              border: `1px solid ${tooltipBorder}`,
              background: tooltipBackground,
              color: 'var(--fg-primary)',
              boxShadow: '0 8px 24px -12px rgb(0 0 0 / 0.15)',
            }}
            labelStyle={{ color: 'var(--fg-primary)' }}
            itemStyle={{ color: 'var(--fg-secondary)' }}
          />
          <Legend
            formatter={(value: string) => (value === 'trend' ? 'Trend dzienny' : 'Śr. 7 dni')}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: axisColor,
            }}
          />
          <Line
            type="monotone"
            dataKey="trend"
            stroke={trendColor}
            strokeWidth={2.5}
            dot={renderMeasurementDot}
            activeDot={{ r: 5, strokeWidth: 2, stroke: dotStrokeColor, fill: trendColor }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="rollingAvg"
            stroke={rollingAverageColor}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
