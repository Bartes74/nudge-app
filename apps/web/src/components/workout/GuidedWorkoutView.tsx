'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Info, Lightbulb, Timer, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { posthog } from '@/lib/posthog'

export interface GuidedWorkoutStepView {
  id: string
  order_num: number
  step_type: string
  title: string
  duration_min: number | null
  instruction_text: string
  setup_instructions: string | null
  execution_steps: string[]
  tempo_hint: string | null
  breathing_hint: string | null
  safety_notes: string | null
  common_mistakes: string | null
  starting_load_guidance: string | null
  stop_conditions: string[]
  machine_settings: string | null
  substitution_policy: {
    easy?: string | null
    machine_busy?: string | null
  } | null
  exercise: {
    slug: string
    name_pl: string
    plain_language_name: string | null
  } | null
}

interface GuidedWorkoutViewProps {
  workoutLogId: string
  workoutName: string
  confidenceGoal: string | null
  steps: GuidedWorkoutStepView[]
}

const SESSION_KEY_PREFIX = 'guided_workout_state_'

function recordProductEvent(eventName: string, properties: Record<string, unknown>): void {
  void fetch('/api/product-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      properties,
    }),
  })
}

export function GuidedWorkoutView({
  workoutLogId,
  workoutName,
  confidenceGoal,
  steps,
}: GuidedWorkoutViewProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [machineConfusionFlag, setMachineConfusionFlag] = useState(false)
  const [exerciseConfusionFlag, setExerciseConfusionFlag] = useState(false)
  const [tooHardFlag, setTooHardFlag] = useState(false)
  const [substitutionNotes, setSubstitutionNotes] = useState<Record<string, string>>({})

  const sortedSteps = useMemo(
    () => [...steps].sort((left, right) => left.order_num - right.order_num),
    [steps],
  )
  const safeCurrentIndex =
    sortedSteps.length === 0
      ? 0
      : Math.min(currentIndex, sortedSteps.length - 1)
  const currentStep = sortedSteps[safeCurrentIndex] ?? null
  const nextStep = sortedSteps[safeCurrentIndex + 1] ?? null
  const isLast =
    sortedSteps.length > 0 && safeCurrentIndex === sortedSteps.length - 1

  useEffect(() => {
    posthog.capture('guided_workout_started', {
      workout_log_id: workoutLogId,
      workout_name: workoutName,
    })
    recordProductEvent('guided_workout_started', {
      workout_log_id: workoutLogId,
      workout_name: workoutName,
    })
  }, [workoutLogId, workoutName])

  useEffect(() => {
    const payload = {
      guided_mode: true,
      machine_confusion_flag: machineConfusionFlag,
      exercise_confusion_flag: exerciseConfusionFlag,
      too_hard_flag: tooHardFlag,
    }
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${workoutLogId}`, JSON.stringify(payload))
  }, [exerciseConfusionFlag, machineConfusionFlag, tooHardFlag, workoutLogId])

  if (!currentStep) return null
  const activeStep = currentStep

  function markExerciseHelpOpened(): void {
    setShowDetails((current) => !current)
    posthog.capture('exercise_help_opened', {
      workout_log_id: workoutLogId,
      step_id: activeStep.id,
      exercise_slug: activeStep.exercise?.slug ?? null,
    })
    recordProductEvent('exercise_help_opened', {
      workout_log_id: workoutLogId,
      step_id: activeStep.id,
      exercise_slug: activeStep.exercise?.slug ?? null,
    })
  }

  function markConfusing(): void {
    setExerciseConfusionFlag(true)
    setShowDetails(true)
    posthog.capture('exercise_marked_confusing', {
      workout_log_id: workoutLogId,
      step_id: activeStep.id,
    })
    recordProductEvent('exercise_marked_confusing', {
      workout_log_id: workoutLogId,
      step_id: activeStep.id,
    })
    toast.message('Pokażemy więcej wskazówek w podsumowaniu po treningu.')
  }

  function handleMachineBusy(): void {
    setMachineConfusionFlag(true)
    const substitute = activeStep.substitution_policy?.machine_busy
    if (!substitute) {
      toast.message('Przejdź spokojnie do kolejnego kroku albo zapytaj obsługę o wolne stanowisko.')
      return
    }
    setSubstitutionNotes((current) => ({
      ...current,
      [activeStep.id]: `Jeśli to urządzenie jest zajęte, zrób zamiast tego: ${substitute}.`,
    }))
    recordProductEvent('guided_substitution_requested', {
      workout_log_id: workoutLogId,
      step_id: activeStep.id,
      reason: 'machine_busy',
      substitute,
    })
    toast.success('Pokazaliśmy prosty zamiennik.')
  }

  function handleTooHard(): void {
    setTooHardFlag(true)
    const substitute = activeStep.substitution_policy?.easy
    if (!substitute) {
      toast.message('Zwolnij tempo i skróć czas tego kroku.')
      return
    }
    setSubstitutionNotes((current) => ({
      ...current,
      [activeStep.id]: `Jeśli to za trudne, wybierz łatwiejszą wersję: ${substitute}.`,
    }))
    recordProductEvent('guided_substitution_requested', {
      workout_log_id: workoutLogId,
      step_id: activeStep.id,
      reason: 'too_hard',
      substitute,
    })
    toast.success('Pokazaliśmy łatwiejszą wersję.')
  }

  function goNext(): void {
    if (isLast) {
      router.push(`/app/today/workout/${workoutLogId}/finish`)
      return
    }
    setCurrentIndex((index) => Math.min(index + 1, sortedSteps.length - 1))
    setShowDetails(false)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button
          type="button"
          onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
          disabled={currentIndex === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted disabled:opacity-30"
          aria-label="Poprzedni krok"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">{workoutName}</p>
          <p className="text-xs font-semibold text-muted-foreground">
            Krok {safeCurrentIndex + 1} z {sortedSteps.length}
          </p>
        </div>

        <button
          type="button"
          onClick={goNext}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
          aria-label="Następny krok"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 px-4 py-5">
        {confidenceGoal && (
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cel tej sesji</p>
            <p className="mt-1 text-sm font-medium">{confidenceGoal}</p>
          </div>
        )}

        <div className="mt-4 rounded-2xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Co robimy teraz</p>
              <h1 className="mt-1 text-2xl font-semibold">{activeStep.title}</h1>
            </div>
            {activeStep.duration_min != null && (
              <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                {activeStep.duration_min} min
              </div>
            )}
          </div>

          <p className="mt-4 text-base leading-relaxed">{activeStep.instruction_text}</p>

          {activeStep.setup_instructions && (
            <div className="mt-4 rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Jak ustawić sprzęt</p>
              <p className="mt-1 text-sm">{activeStep.setup_instructions}</p>
            </div>
          )}

          {activeStep.tempo_hint && (
            <p className="mt-4 text-sm">
              <span className="font-medium">Jak rozpoznać dobre tempo:</span> {activeStep.tempo_hint}
            </p>
          )}

          {activeStep.breathing_hint && (
            <p className="mt-2 text-sm">
              <span className="font-medium">Oddech:</span> {activeStep.breathing_hint}
            </p>
          )}

          {activeStep.machine_settings && (
            <p className="mt-2 text-sm">
              <span className="font-medium">Ustawienie sprzętu:</span> {activeStep.machine_settings}
            </p>
          )}

          {substitutionNotes[activeStep.id] && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              {substitutionNotes[activeStep.id]}
            </div>
          )}

          {showDetails && (
            <div className="mt-4 space-y-4 rounded-xl border p-4">
              {activeStep.execution_steps.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Pokaż dokładnie, jak to zrobić</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {activeStep.execution_steps.map((step) => (
                      <li key={step}>• {step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeStep.starting_load_guidance && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Jak dobrać ciężar startowy</p>
                  <p className="mt-2 text-sm">{activeStep.starting_load_guidance}</p>
                </div>
              )}

              {activeStep.common_mistakes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Na co uważać</p>
                  <p className="mt-2 text-sm">{activeStep.common_mistakes}</p>
                </div>
              )}

              {activeStep.safety_notes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bezpieczeństwo</p>
                  <p className="mt-2 text-sm">{activeStep.safety_notes}</p>
                </div>
              )}

              {activeStep.stop_conditions.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Przerwij i wybierz zamiennik, jeśli...</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {activeStep.stop_conditions.map((condition) => (
                      <li key={condition}>• {condition}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {nextStep && (
            <div className="mt-4 rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Co dalej</p>
              <p className="mt-1 text-sm font-medium">{nextStep.title}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background px-4 pb-6 pt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={markExerciseHelpOpened}
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium"
          >
            <Info className="h-4 w-4" />
            Pokaż dokładnie, jak to zrobić
          </button>
          <button
            type="button"
            onClick={handleMachineBusy}
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium"
          >
            <Wrench className="h-4 w-4" />
            To urządzenie jest zajęte
          </button>
          <button
            type="button"
            onClick={markConfusing}
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium"
          >
            <Lightbulb className="h-4 w-4" />
            To ćwiczenie jest dla mnie niejasne
          </button>
          <button
            type="button"
            onClick={handleTooHard}
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4 rotate-90" />
            Potrzebuję łatwiejszej wersji
          </button>
        </div>

        <button
          type="button"
          onClick={goNext}
          className="mt-3 w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground active:bg-primary/90"
        >
          {isLast ? 'Przejdź do podsumowania treningu' : 'Dalej'}
        </button>
      </div>
    </div>
  )
}
