'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Aggregates {
  weekOf: string
  workoutsCompleted: number
  workoutsPlanned: number | null
  avgWorkoutRating: number | null
  weightMeasurements: number
  weightDeltaKg: number | null
}

interface CheckinSession {
  id: string
  submitted_at: string | null
  verdict: string | null
}

interface CurrentCheckin {
  weekOf: string
  aggregates: Aggregates
  session: CheckinSession | null
}

const SLIDER_LABELS: Record<string, [string, string]> = {
  subjective_energy: ['Brak energii', 'Pełna energia'],
  subjective_recovery: ['Słaba regeneracja', 'Doskonała regeneracja'],
  subjective_motivation: ['Brak motywacji', 'Bardzo zmotywowany/a'],
  subjective_stress: ['Brak stresu', 'Ekstremalny stres'],
  subjective_sleep: ['Tragiczny sen', 'Doskonały sen'],
}

type SliderKey = keyof typeof SLIDER_LABELS

export default function CheckinPage() {
  const router = useRouter()
  const [current, setCurrent] = useState<CurrentCheckin | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [sliders, setSliders] = useState<Record<SliderKey, number>>({
    subjective_energy: 3,
    subjective_recovery: 3,
    subjective_motivation: 3,
    subjective_stress: 3,
    subjective_sleep: 3,
  })

  const [winsText, setWinsText] = useState('')
  const [strugglesText, setStrugglesText] = useState('')
  const [focusNextWeek, setFocusNextWeek] = useState('')

  useEffect(() => {
    fetch('/api/checkin/current')
      .then((r) => r.json())
      .then((data: CurrentCheckin) => {
        setCurrent(data)
        if (data.session?.submitted_at) {
          router.replace('/app/checkin/result')
        }
      })
      .catch(() => toast.error('Nie udało się załadować danych'))
      .finally(() => setLoading(false))
  }, [router])

  const handleSubmit = async () => {
    if (!current) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_of: current.weekOf,
          ...sliders,
          wins_text: winsText.trim() || undefined,
          struggles_text: strugglesText.trim() || undefined,
          focus_next_week: focusNextWeek.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('Submit failed')
      toast.success('Check-in zapisany!')
      router.push('/app/checkin/result')
    } catch {
      toast.error('Nie udało się zapisać check-inu')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Ładowanie...</p>
      </div>
    )
  }

  const agg = current?.aggregates

  return (
    <div className="flex min-h-[100dvh] flex-col p-6 pb-24">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 self-start text-sm text-muted-foreground"
      >
        ← Wróć
      </button>

      <h1 className="text-2xl font-bold">Cotygodniowy check-in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tydzień od {current?.weekOf ?? '...'} — zajmie ~2 minuty
      </p>

      {/* Section 1: Auto-aggregates */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">📊 Twój tydzień — dane automatyczne</h2>
        <div className="rounded-2xl border bg-muted/30 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Treningi</span>
            <span className="font-medium">
              {agg?.workoutsCompleted ?? 0} / {agg?.workoutsPlanned ?? '?'}
            </span>
          </div>
          {agg?.avgWorkoutRating !== null && agg?.avgWorkoutRating !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Średnia ocena treningu</span>
              <span className="font-medium">{agg.avgWorkoutRating} / 5</span>
            </div>
          )}
          {agg?.weightDeltaKg !== null && agg?.weightDeltaKg !== undefined ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zmiana wagi</span>
              <span
                className={`font-medium ${
                  agg.weightDeltaKg < 0 ? 'text-green-600' : 'text-orange-500'
                }`}
              >
                {agg.weightDeltaKg > 0 ? '+' : ''}
                {agg.weightDeltaKg} kg
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pomiary wagi</span>
              <span className="font-medium text-muted-foreground">{agg?.weightMeasurements ?? 0}x</span>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Subjective sliders */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">🎚️ Jak się czułeś/aś?</h2>
        <div className="space-y-6">
          {(Object.keys(sliders) as SliderKey[]).map((key) => {
            const [low, high] = SLIDER_LABELS[key]!
            const labels: Record<SliderKey, string> = {
              subjective_energy: 'Energia',
              subjective_recovery: 'Regeneracja',
              subjective_motivation: 'Motywacja',
              subjective_stress: 'Stres',
              subjective_sleep: 'Sen',
            }
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{labels[key]}</span>
                  <span className="text-sm font-bold text-primary">{sliders[key]} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={sliders[key]}
                  onChange={(e) =>
                    setSliders((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                  }
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{low}</span>
                  <span>{high}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Section 3: Free text */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">✍️ Kilka słów</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="wins">
              Co poszło dobrze w tym tygodniu?
            </label>
            <textarea
              id="wins"
              value={winsText}
              onChange={(e) => setWinsText(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="np. wybiłem/am rekord w martwym ciągu, nie opuściłem/am żadnego treningu..."
              className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="struggles">
              Co było trudne lub poszło gorzej niż planowałem/am?
            </label>
            <textarea
              id="struggles"
              value={strugglesText}
              onChange={(e) => setStrugglesText(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="np. za mało spałem/am, opuściłem/am trening w środę, stres w pracy..."
              className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="focus">
              Na czym chcę się skupić w przyszłym tygodniu?
            </label>
            <textarea
              id="focus"
              value={focusNextWeek}
              onChange={(e) => setFocusNextWeek(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="np. więcej snu, trzymanie się planu treningowego..."
              className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background px-6 py-4">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          className="w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground active:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? 'Analizuję...' : 'Wyślij check-in'}
        </button>
      </div>
    </div>
  )
}
