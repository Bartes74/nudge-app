'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Dumbbell } from 'lucide-react'
import { PageHero, PageSection } from '@/components/layout/PageHero'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PreMood = 'bad' | 'ok' | 'good' | 'great'
type PreEnergy = 'low' | 'moderate' | 'high'

const MOOD_OPTIONS: { value: PreMood; label: string; emoji: string }[] = [
  { value: 'bad', label: 'Słabo', emoji: '😔' },
  { value: 'ok', label: 'Średnio', emoji: '😐' },
  { value: 'good', label: 'Dobrze', emoji: '🙂' },
  { value: 'great', label: 'Świetnie', emoji: '💪' },
]

const ENERGY_OPTIONS: { value: PreEnergy; label: string }[] = [
  { value: 'low', label: 'Niska' },
  { value: 'moderate', label: 'Średnia' },
  { value: 'high', label: 'Wysoka' },
]

export default function StartWorkoutPage({
  params,
}: {
  params: { id: string }
}) {
  const { id: planWorkoutId } = params
  const router = useRouter()
  const [mood, setMood] = useState<PreMood>('good')
  const [energy, setEnergy] = useState<PreEnergy>('moderate')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workout/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_workout_id: planWorkoutId,
          pre_mood: mood,
          pre_energy: energy,
        }),
      })
      if (!res.ok) throw new Error('Start failed')
      const { workout_log_id } = (await res.json()) as { workout_log_id: string }
      router.push(`/app/today/workout/${workout_log_id}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-between gap-12 pb-8">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-muted">
            <Dumbbell className="h-5 w-5 text-brand" aria-hidden="true" />
          </div>
          <PageHero
            eyebrow="Przed startem"
            titleEmphasis="Zanim zaczniemy —"
            titleMain="Jak się dzisiaj czujesz?"
            lede="Na podstawie odpowiedzi, dostosuję intensywność treningu."
          />
        </div>

        <PageSection
          number="01 — Nastrój"
          title="Jak się czujesz"
          description="Wybierz odpowiedź, która najlepiej oddaje Twoje samopoczucie przed treningiem."
        >
          <div className="grid grid-cols-4 gap-2">
            {MOOD_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setMood(o.value)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-4 text-center transition-[border-color,background-color,transform] duration-200 ease-premium active:scale-[0.97]',
                  mood === o.value
                    ? 'border-foreground bg-foreground text-background shadow-lift'
                    : 'border-border bg-surface-1 text-foreground hover:border-foreground/30 hover:bg-surface-2',
                )}
                aria-pressed={mood === o.value}
              >
                <span className="text-2xl">{o.emoji}</span>
                <span className="text-body-s font-medium tracking-tight">{o.label}</span>
              </button>
            ))}
          </div>
        </PageSection>

        <PageSection
          number="02 — Energia"
          title="Ile masz dziś energii"
          description="Ta odpowiedź nie zmienia planu ćwiczeń, tylko pomaga dobrać dzisiejszą intensywność."
        >
          <div className="grid grid-cols-3 gap-2">
            {ENERGY_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setEnergy(o.value)}
                className={cn(
                  'rounded-xl border px-4 py-4 text-body-m font-semibold tracking-tight transition-[border-color,background-color,transform] duration-200 ease-premium active:scale-[0.97]',
                  energy === o.value
                    ? 'border-foreground bg-foreground text-background shadow-lift'
                    : 'border-border bg-surface-1 text-foreground hover:border-foreground/30 hover:bg-surface-2',
                )}
                aria-pressed={energy === o.value}
              >
                {o.label}
              </button>
            ))}
          </div>
        </PageSection>
      </div>

      <Button
        type="button"
        disabled={loading}
        onClick={() => void handleStart()}
        size="hero"
        className="w-full gap-2"
        isLoading={loading}
      >
        {loading ? 'Startuję…' : (
          <>
            Zaczynamy
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}
