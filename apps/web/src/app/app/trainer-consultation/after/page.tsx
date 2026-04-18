'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function AfterTrainerConsultationPage() {
  const router = useRouter()
  const [trainerFeedbackNotes, setTrainerFeedbackNotes] = useState('')
  const [recommendedExercises, setRecommendedExercises] = useState('')
  const [avoidExercises, setAvoidExercises] = useState('')
  const [changePlan, setChangePlan] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(): Promise<void> {
    if (!trainerFeedbackNotes.trim()) {
      toast.error('Dodaj krótką notatkę po rozmowie')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/trainer-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_feedback_notes: trainerFeedbackNotes.trim(),
          recommended_exercises: recommendedExercises
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          avoid_exercises: avoidExercises
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          change_plan: changePlan,
        }),
      })

      if (!response.ok) throw new Error('Request failed')

      toast.success('Zapisaliśmy wskazówki od trenera')
      router.push('/app')
    } catch {
      toast.error('Nie udało się zapisać notatek')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Po rozmowie z trenerem</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Zapisz najważniejsze wskazówki, żebyśmy mogli spokojnie dopasować dalszy plan.
        </p>
      </div>

      <Field
        label="Co trener skorygował?"
        value={trainerFeedbackNotes}
        onChange={setTrainerFeedbackNotes}
        placeholder="np. ustawienie siedzenia na maszynie, tor ruchu, tempo"
      />

      <Field
        label="Jakie ćwiczenia polecił?"
        value={recommendedExercises}
        onChange={setRecommendedExercises}
        placeholder="Wpisz po przecinku, jeśli chcesz"
      />

      <Field
        label="Czego kazał unikać?"
        value={avoidExercises}
        onChange={setAvoidExercises}
        placeholder="Wpisz po przecinku, jeśli coś trzeba wykluczyć"
      />

      <label className="flex items-center gap-3 rounded-xl border p-4 text-sm">
        <input
          type="checkbox"
          checked={changePlan}
          onChange={(event) => setChangePlan(event.target.checked)}
        />
        Trener zasugerował zmianę planu
      </label>

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={loading}
        className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {loading ? 'Zapisuję...' : 'Zapisz wskazówki'}
      </button>
    </div>
  )
}

function Field(props: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{props.label}</label>
      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        rows={4}
        placeholder={props.placeholder}
        className="w-full rounded-xl border bg-background px-4 py-3 text-sm"
      />
    </div>
  )
}
