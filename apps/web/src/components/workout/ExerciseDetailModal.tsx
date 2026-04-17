'use client'

import { X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface PlanExercise {
  sets: number
  reps_min: number
  reps_max: number
  rir_target: number | null
  rest_seconds: number | null
  technique_notes: string | null
  exercise: {
    name_pl: string
    primary_muscles: string[]
    secondary_muscles: string[]
    is_compound?: boolean
    technique_notes: string | null
  } | null
}

interface ExerciseDetailModalProps {
  open: boolean
  onClose: () => void
  planExercise: PlanExercise | null
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'klatka',
  back: 'plecy',
  shoulders: 'barki',
  biceps: 'biceps',
  triceps: 'triceps',
  quads: 'quady',
  hamstrings: 'dwugłowe',
  glutes: 'pośladki',
  calves: 'łydki',
  core: 'brzuch',
  forearms: 'przedramiona',
  lats: 'najszersze',
}

function label(muscle: string) {
  return MUSCLE_LABELS[muscle] ?? muscle
}

export function ExerciseDetailModal({ open, onClose, planExercise }: ExerciseDetailModalProps) {
  if (!planExercise) return null
  const ex = planExercise.exercise

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 bottom-4 z-50 max-h-[70vh] overflow-y-auto rounded-2xl bg-background p-4 shadow-lg focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold">{ex?.name_pl}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
                aria-label="Zamknij"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Serie</p>
                <p className="text-lg font-bold">{planExercise.sets}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Powt.</p>
                <p className="text-lg font-bold">
                  {planExercise.reps_min}–{planExercise.reps_max}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">RIR</p>
                <p className="text-lg font-bold">{planExercise.rir_target ?? '—'}</p>
              </div>
            </div>

            {planExercise.rest_seconds != null && (
              <p className="text-xs text-muted-foreground">
                Przerwa: {planExercise.rest_seconds}s
              </p>
            )}

            {ex?.primary_muscles && ex.primary_muscles.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mięśnie główne
                </p>
                <p className="mt-0.5">{ex.primary_muscles.map(label).join(', ')}</p>
              </div>
            )}

            {ex?.secondary_muscles && ex.secondary_muscles.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mięśnie pomocnicze
                </p>
                <p className="mt-0.5 text-muted-foreground">{ex.secondary_muscles.map(label).join(', ')}</p>
              </div>
            )}

            {planExercise.technique_notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Technika
                </p>
                <p className="mt-0.5 leading-relaxed text-muted-foreground">
                  {planExercise.technique_notes}
                </p>
              </div>
            )}

            {ex?.technique_notes && ex.technique_notes !== planExercise.technique_notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Uwagi ogólne
                </p>
                <p className="mt-0.5 leading-relaxed text-muted-foreground">{ex.technique_notes}</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
