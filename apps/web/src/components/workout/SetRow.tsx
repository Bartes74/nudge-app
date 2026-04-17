'use client'

import { useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import type { LocalSet } from '@/hooks/useWorkoutStore'

interface SetRowProps {
  set: LocalSet
  index: number
  prevWeight?: number | null
  prevReps?: number | null
  onChange: (patch: Partial<LocalSet>) => void
  onRemove: () => void
}

export function SetRow({ set, index, prevWeight, prevReps, onChange, onRemove }: SetRowProps) {
  const weightRef = useRef<HTMLInputElement>(null)
  const repsRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">SERIA {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive"
          aria-label="Usuń serię"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-end gap-3">
        {/* Weight input */}
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Ciężar (kg)
            {prevWeight != null && (
              <span className="ml-1 font-normal normal-case text-muted-foreground/60">
                prev {prevWeight}
              </span>
            )}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange({ weight_kg: Math.max(0, (set.weight_kg ?? 0) - 2.5) })}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background text-lg font-semibold active:bg-muted"
              aria-label="Zmniejsz ciężar o 2.5kg"
            >
              −
            </button>
            <input
              ref={weightRef}
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="1000"
              value={set.weight_kg ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? null : parseFloat(e.target.value)
                onChange({ weight_kg: v != null && !isNaN(v) ? v : null })
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-center text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={prevWeight != null ? String(prevWeight) : '—'}
            />
            <button
              type="button"
              onClick={() => onChange({ weight_kg: (set.weight_kg ?? 0) + 2.5 })}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background text-lg font-semibold active:bg-muted"
              aria-label="Zwiększ ciężar o 2.5kg"
            >
              +
            </button>
          </div>
        </div>

        {/* Reps input */}
        <div className="flex w-24 flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Powt.
            {prevReps != null && (
              <span className="ml-1 font-normal normal-case text-muted-foreground/60">
                p{prevReps}
              </span>
            )}
          </span>
          <input
            ref={repsRef}
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            max="999"
            value={set.reps ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? null : parseInt(e.target.value, 10)
              onChange({ reps: v != null && !isNaN(v) ? v : null })
            }}
            className="h-10 w-full rounded-lg border bg-background px-3 text-center text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={prevReps != null ? String(prevReps) : '—'}
          />
        </div>
      </div>

      {/* RIR slider */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          RIR
        </span>
        <div className="flex-1">
          <Slider
            min={0}
            max={5}
            step={1}
            value={[set.rir]}
            onValueChange={([v]) => onChange({ rir: v })}
            className="w-full"
          />
        </div>
        <span className="w-6 text-center text-sm font-bold tabular-nums">{set.rir}</span>
        <button
          type="button"
          onClick={() => onChange({ to_failure: !set.to_failure })}
          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
            set.to_failure
              ? 'border-destructive bg-destructive/10 text-destructive'
              : 'border-border text-muted-foreground'
          }`}
        >
          do max
        </button>
      </div>

      {!set.synced && (
        <span className="text-[9px] text-muted-foreground/50">• niezapisana</span>
      )}
    </div>
  )
}
