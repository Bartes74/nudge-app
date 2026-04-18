'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dzisiaj
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Notatki</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Po rozmowie</span>
          <br />
          <span className="font-sans font-semibold">z trenerem.</span>
        </h1>
        <p className="text-body-m text-muted-foreground">
          Zapisz najważniejsze wskazówki, żebyśmy mogli spokojnie dopasować dalszy plan.
        </p>
      </header>

      <div className="flex flex-col gap-5">
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
      </div>

      <button
        type="button"
        onClick={() => setChangePlan((prev) => !prev)}
        className="group text-left"
      >
        <Card
          variant="default"
          padding="md"
          className={`flex items-center gap-3 transition-[border-color,background-color] duration-200 ease-premium ${
            changePlan
              ? 'border-foreground bg-surface-2/60'
              : 'hover:border-foreground/30 hover:bg-surface-2/40'
          }`}
        >
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
              changePlan
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-surface-1'
            }`}
            aria-hidden="true"
          >
            {changePlan && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </div>
          <span className="text-body-m text-foreground">Trener zasugerował zmianę planu</span>
        </Card>
      </button>

      <Button
        type="button"
        size="hero"
        onClick={() => void handleSubmit()}
        disabled={loading}
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Zapisuję…
          </>
        ) : (
          'Zapisz wskazówki'
        )}
      </Button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-label uppercase text-muted-foreground">{label}</label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder={placeholder}
      />
    </div>
  )
}
