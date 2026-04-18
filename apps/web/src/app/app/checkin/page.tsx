'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

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
  subjective_motivation: ['Brak motywacji', 'Pełna motywacja'],
  subjective_stress: ['Brak stresu', 'Ekstremalny stres'],
  subjective_sleep: ['Tragiczny sen', 'Doskonały sen'],
}

const SLIDER_NAMES: Record<string, string> = {
  subjective_energy: 'Energia',
  subjective_recovery: 'Regeneracja',
  subjective_motivation: 'Motywacja',
  subjective_stress: 'Stres',
  subjective_sleep: 'Sen',
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
      toast.success('Check-in zapisany')
      router.push('/app/checkin/result')
    } catch {
      toast.error('Nie udało się zapisać check-inu')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const agg = current?.aggregates
  const weightDelta = agg?.weightDeltaKg

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-32 animate-stagger">
      <Link
        href="/app"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dzisiaj
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Check-in</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Twój</span>
          <br />
          <span className="font-sans font-semibold">tydzień.</span>
        </h1>
        <p className="text-body-m text-muted-foreground">
          Tydzień od{' '}
          <span className="font-mono tabular-nums text-foreground">{current?.weekOf ?? '…'}</span> —
          ~2 minuty.
        </p>
      </header>

      <Card variant="recessed" padding="md">
        <CardEyebrow>Dane automatyczne</CardEyebrow>
        <div className="mt-3 flex flex-col divide-y divide-border/60">
          <div className="flex items-center justify-between py-2.5 first:pt-0">
            <span className="text-body-m text-muted-foreground">Treningi</span>
            <span className="font-mono text-body-m tabular-nums font-medium">
              {agg?.workoutsCompleted ?? 0} / {agg?.workoutsPlanned ?? '?'}
            </span>
          </div>
          {agg?.avgWorkoutRating != null && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-body-m text-muted-foreground">Średnia ocena</span>
              <span className="font-mono text-body-m tabular-nums font-medium">
                {agg.avgWorkoutRating} / 5
              </span>
            </div>
          )}
          {weightDelta != null ? (
            <div className="flex items-center justify-between py-2.5 last:pb-0">
              <span className="text-body-m text-muted-foreground">Zmiana wagi</span>
              <span
                className={`font-mono text-body-m tabular-nums font-medium ${
                  weightDelta < 0 ? 'text-success' : 'text-warning'
                }`}
              >
                {weightDelta > 0 ? '+' : ''}
                {weightDelta} kg
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between py-2.5 last:pb-0">
              <span className="text-body-m text-muted-foreground">Pomiary wagi</span>
              <span className="font-mono text-body-m tabular-nums text-muted-foreground">
                {agg?.weightMeasurements ?? 0}×
              </span>
            </div>
          )}
        </div>
      </Card>

      <section className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Samopoczucie</p>
        <Card variant="default" padding="md">
          <div className="flex flex-col gap-6">
            {(Object.keys(sliders) as SliderKey[]).map((key) => {
              const [low, high] = SLIDER_LABELS[key]!
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-body-m font-medium tracking-tight">{SLIDER_NAMES[key]}</span>
                    <span className="font-mono text-body-s tabular-nums text-brand">
                      {sliders[key]} / 5
                    </span>
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
                    className="w-full accent-brand"
                  />
                  <div className="flex justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span>{low}</span>
                    <span>{high}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Kilka słów</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-label uppercase text-muted-foreground"
              htmlFor="wins"
            >
              Co poszło dobrze?
            </label>
            <Textarea
              id="wins"
              value={winsText}
              onChange={(e) => setWinsText(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="np. wybiłem/am rekord, nie opuściłem/am żadnego treningu…"
              className="resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-label uppercase text-muted-foreground"
              htmlFor="struggles"
            >
              Co było trudne?
            </label>
            <Textarea
              id="struggles"
              value={strugglesText}
              onChange={(e) => setStrugglesText(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="np. za mało snu, opuszczony trening, stres…"
              className="resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-label uppercase text-muted-foreground"
              htmlFor="focus"
            >
              Na czym skupić się w nowym tygodniu?
            </label>
            <Textarea
              id="focus"
              value={focusNextWeek}
              onChange={(e) => setFocusNextWeek(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="np. więcej snu, trzymanie się planu…"
              className="resize-none"
            />
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border/60 bg-background/80 px-5 py-4 backdrop-blur-xl safe-bottom">
        <div className="mx-auto max-w-2xl">
          <Button
            type="button"
            size="hero"
            disabled={submitting}
            isLoading={submitting}
            onClick={() => void handleSubmit()}
            className="w-full gap-2"
          >
            {!submitting && <Send className="h-4 w-4" />}
            {submitting ? 'Analizuję…' : 'Wyślij check-in'}
          </Button>
        </div>
      </div>
    </div>
  )
}
