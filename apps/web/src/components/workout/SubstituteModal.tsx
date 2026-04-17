'use client'

import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

export interface Exercise {
  id: string
  slug: string
  name_pl: string
  equipment_required: string[]
  primary_muscles: string[]
  secondary_muscles?: string[]
  alternatives_slugs?: string[]
  technique_notes?: string | null
}

interface SubstituteModalProps {
  open: boolean
  onClose: () => void
  alternatives: Exercise[]
  onSelect: (exercise: Exercise) => void
}

export function SubstituteModal({ open, onClose, alternatives, onSelect }: SubstituteModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelect = async (exercise: Exercise) => {
    setLoading(exercise.id)
    await onSelect(exercise)
    setLoading(null)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 bottom-4 z-50 rounded-2xl bg-background p-4 shadow-lg focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold">Zamień ćwiczenie</Dialog.Title>
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

          {alternatives.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Brak zamienników w katalogu.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {alternatives.map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    disabled={loading === ex.id}
                    onClick={() => void handleSelect(ex)}
                    className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left active:bg-muted disabled:opacity-60"
                  >
                    <div>
                      <p className="font-medium">{ex.name_pl}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.primary_muscles.slice(0, 2).join(', ')}
                        {ex.equipment_required.length > 0
                          ? ` · ${ex.equipment_required[0]}`
                          : ''}
                      </p>
                    </div>
                    <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading === ex.id ? 'animate-spin' : ''}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
