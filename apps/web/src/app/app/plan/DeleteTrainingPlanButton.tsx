'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function DeleteTrainingPlanButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(): Promise<void> {
    setIsDeleting(true)

    try {
      const res = await fetch('/api/plan/training/reset', {
        method: 'POST',
      })
      const json = (await res.json()) as { error?: string }

      if (!res.ok) {
        throw new Error(json.error ?? 'Nie udało się usunąć aktywnego planu.')
      }

      toast.success('Usunęliśmy bieżący plan. Możesz wygenerować nowy od zera.')
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Nie udało się usunąć aktywnego planu.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Usuń plan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-left">Usunąć bieżący plan?</DialogTitle>
            <DialogDescription className="text-left">
              Ten plan przestanie być aktywny. Historia zostanie zachowana, ale na ekranie
              planu wrócisz do pustego stanu i dopiero wtedy wygenerujesz nowy plan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
              isLoading={isDeleting}
            >
              Usuń bieżący plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
