'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

export default function FinishWorkoutPage({
  params,
}: {
  params: Promise<{ workoutLogId: string }>
}) {
  const { workoutLogId } = use(params)
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [wentWell, setWentWell] = useState('')
  const [wentPoorly, setWentPoorly] = useState('')
  const [whatToImprove, setWhatToImprove] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Wybierz ocenę treningu')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/workout/${workoutLogId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overall_rating: rating,
          went_well: wentWell.trim() || undefined,
          went_poorly: wentPoorly.trim() || undefined,
          what_to_improve: whatToImprove.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('Finish failed')
      toast.success('Trening zapisany 🎉')
      router.push('/app/history')
    } catch {
      toast.error('Nie udało się zapisać treningu')
      setLoading(false)
    }
  }

  const displayRating = hovered || rating

  return (
    <div className="flex min-h-[100dvh] flex-col p-6">
      <h1 className="text-2xl font-bold">Jak był trening?</h1>
      <p className="mt-1 text-sm text-muted-foreground">Podsumuj sesję — to pomoże nam ulepszyć Twój plan</p>

      {/* Star rating */}
      <div className="mt-8 flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onPointerEnter={() => setHovered(star)}
            onPointerLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="transition-transform active:scale-110"
            aria-label={`${star} gwiazdki`}
          >
            <Star
              className={`h-10 w-10 transition-colors ${
                displayRating >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {rating === 1 && 'Ciężki dzień — dobra robota, że wyszedłeś'}
          {rating === 2 && 'Poniżej oczekiwań, ale byłeś'}
          {rating === 3 && 'Solidny trening'}
          {rating === 4 && 'Dobry trening!'}
          {rating === 5 && 'Fenomenalne! 🔥'}
        </p>
      )}

      {/* Feedback fields */}
      <div className="mt-8 flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="went-well">
            Co poszło dobrze?
          </label>
          <textarea
            id="went-well"
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="np. dobra forma na przysiadach, nowy rekord..."
            className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="went-poorly">
            Co poszło słabo?
          </label>
          <textarea
            id="went-poorly"
            value={wentPoorly}
            onChange={(e) => setWentPoorly(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="np. brak energii, za mało czasu..."
            className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="what-to-improve">
            Co poprawię?
          </label>
          <textarea
            id="what-to-improve"
            value={whatToImprove}
            onChange={(e) => setWhatToImprove(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="np. więcej snu przed treningiem, więcej wody..."
            className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={loading || rating === 0}
          onClick={() => void handleSubmit()}
          className="w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground active:bg-primary/90 disabled:opacity-60"
        >
          {loading ? 'Zapisuję...' : 'Zakończ trening'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/app/history')}
          className="mt-3 w-full py-3 text-sm text-muted-foreground"
        >
          Pomiń
        </button>
      </div>
    </div>
  )
}
