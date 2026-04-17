'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell } from 'lucide-react'

type PreMood = 'bad' | 'ok' | 'good' | 'great'
type PreEnergy = 'low' | 'moderate' | 'high' | 'variable'

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
  { value: 'variable', label: 'Zmienna' },
]

export default function StartWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: planWorkoutId } = use(params)
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
    <div className="flex min-h-[100dvh] flex-col justify-between p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Gotowy?</h1>
            <p className="text-sm text-muted-foreground">Powiedz jak się czujesz przed treningiem</p>
          </div>
        </div>

        {/* Mood */}
        <div>
          <p className="mb-3 text-sm font-semibold">Nastrój</p>
          <div className="grid grid-cols-4 gap-2">
            {MOOD_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setMood(o.value)}
                className={`flex flex-col items-center rounded-xl border py-3 text-center transition-colors ${
                  mood === o.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background'
                }`}
              >
                <span className="text-2xl">{o.emoji}</span>
                <span className="mt-1 text-xs font-medium">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div>
          <p className="mb-3 text-sm font-semibold">Energia</p>
          <div className="grid grid-cols-2 gap-2">
            {ENERGY_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setEnergy(o.value)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  energy === o.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => void handleStart()}
        className="mt-8 w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground active:bg-primary/90 disabled:opacity-60"
      >
        {loading ? 'Startuję...' : 'Zaczynamy 🔥'}
      </button>
    </div>
  )
}
