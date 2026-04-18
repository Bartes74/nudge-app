'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SubstituteButtonProps {
  exerciseSlug: string
  exerciseName: string
}

export function SubstituteButton({ exerciseSlug, exerciseName }: SubstituteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubstitute() {
    if (!reason.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/plan/training/substitute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_exercise_id: '',
        current_slug: exerciseSlug,
        reason: reason.trim(),
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const json = await res.json() as { error?: string }
      setError(json.error ?? 'Nie udało się zamienić ćwiczenia.')
      return
    }

    const json = await res.json() as { new_exercise: { slug: string; name_pl: string } }
    setOpen(false)
    router.push(`/app/plan/exercise/${json.new_exercise.slug}`)
    router.refresh()
  }

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="h-4 w-4" />
        Zamień ćwiczenie w planie
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-display-m font-normal text-balance">
              Zamień:{' '}
              <span className="font-sans font-semibold">{exerciseName}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-label uppercase text-muted-foreground" htmlFor="reason">
                Dlaczego chcesz zamienić?
              </label>
              <textarea
                id="reason"
                className="w-full resize-none rounded-lg border border-border bg-surface-1 px-3 py-2.5 text-body-m leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                rows={3}
                placeholder="np. boli mnie bark, brak sztangi, za trudne…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {error && <p className="text-body-s text-destructive">{error}</p>}

            <Button
              onClick={handleSubstitute}
              disabled={loading || !reason.trim()}
              isLoading={loading}
              size="lg"
              className="w-full"
            >
              Zamień
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
