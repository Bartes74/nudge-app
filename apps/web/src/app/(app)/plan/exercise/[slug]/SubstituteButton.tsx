'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Loader2 } from 'lucide-react'
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
        plan_exercise_id: '', // contextual — user can substitute from workout page too
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
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="h-4 w-4" />
        Zamień ćwiczenie w planie
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zamień: {exerciseName}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="reason">
                Dlaczego chcesz zamienić?
              </label>
              <textarea
                id="reason"
                className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="np. boli mnie bark, brak sztangi, za trudne…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button
              onClick={handleSubstitute}
              disabled={loading || !reason.trim()}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Zamień'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
