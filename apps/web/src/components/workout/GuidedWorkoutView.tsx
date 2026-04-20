'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Footprints,
  Info,
  Lightbulb,
  ShoppingBag,
  Timer,
  Waves,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { posthog } from '@/lib/posthog'

type PreMood = 'bad' | 'ok' | 'good' | 'great'
type PreEnergy = 'low' | 'moderate' | 'high' | 'variable'

interface GuidedStepVariant {
  key: string
  label: string
  duration_min?: number | null
  instruction_text?: string | null
  setup_instructions?: string | null
  execution_steps?: string[]
  tempo_hint?: string | null
  breathing_hint?: string | null
  safety_notes?: string | null
  common_mistakes?: string | null
  machine_settings?: string | null
  normal_after_effects?: string[]
  finish_steps?: string[]
}

interface GuidedStepMachineBusyPolicy {
  prompt: string
  options: GuidedStepVariant[]
}

interface GuidedStepSupportPolicy {
  packlist?: string[]
  reassurance?: string[]
  normal_after_effects?: string[]
  finish_steps?: string[]
}

interface GuidedStepSubstitutionPolicy {
  hide_actions?: boolean
  auto_variant?: 'easy_when_low_readiness' | null
  easy?: GuidedStepVariant | string | null
  machine_busy?: GuidedStepMachineBusyPolicy | string | null
  support?: GuidedStepSupportPolicy | null
}

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
  substitution_policy: GuidedStepSubstitutionPolicy | null
  exercise: {
    id: string
    slug: string
    name_pl: string
    plain_language_name: string | null
  } | null
}

interface GuidedWorkoutViewProps {
  workoutLogId: string
  workoutName: string
  steps: GuidedWorkoutStepView[]
  preMood: PreMood | null
  preEnergy: PreEnergy | null
}

const SESSION_KEY_PREFIX = 'guided_workout_state_'

const ARRIVAL_GUIDE = {
  packlist: [
    'Weź wodę albo bidon.',
    'Jeśli lubisz, weź mały ręcznik.',
    'Załóż wygodne buty i strój, w którym możesz swobodnie chodzić.',
  ],
  firstSteps: [
    'Rozejrzyj się i sprawdź, gdzie na bieżni są przyciski start i stop.',
    'Postaw wodę i ręcznik tak, żeby były pod ręką.',
    'Zanim ruszysz, przeczytaj spokojnie kolejny krok w aplikacji.',
  ],
  reassurance: [
    'To normalne, jeśli na początku czujesz lekki stres albo niepewność.',
    'Na dzisiaj interesuje Cię tylko pierwszy krok, nie cała siłownia.',
    'Jeśli potrzebujesz chwili, zatrzymaj się, napij wody i dopiero potem rusz dalej.',
  ],
} as const

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

function isGuidedStepVariant(value: unknown): value is GuidedStepVariant {
  return typeof value === 'object' && value !== null && 'key' in value && 'label' in value
}

function isGuidedStepMachineBusyPolicy(value: unknown): value is GuidedStepMachineBusyPolicy {
  return typeof value === 'object' && value !== null && 'options' in value && Array.isArray((value as { options?: unknown }).options)
}

function mergeStepWithVariant(
  step: GuidedWorkoutStepView,
  variant: GuidedStepVariant | null,
): GuidedWorkoutStepView & {
  normalAfterEffects: string[]
  finishSteps: string[]
  selectedVariantLabel: string | null
} {
  const support = step.substitution_policy?.support

  return {
    ...step,
    duration_min: variant?.duration_min ?? step.duration_min,
    instruction_text: variant?.instruction_text ?? step.instruction_text,
    setup_instructions: variant?.setup_instructions ?? step.setup_instructions,
    execution_steps: variant?.execution_steps ?? step.execution_steps,
    tempo_hint: variant?.tempo_hint ?? step.tempo_hint,
    breathing_hint: variant?.breathing_hint ?? step.breathing_hint,
    safety_notes: variant?.safety_notes ?? step.safety_notes,
    common_mistakes: variant?.common_mistakes ?? step.common_mistakes,
    machine_settings: variant?.machine_settings ?? step.machine_settings,
    normalAfterEffects:
      variant?.normal_after_effects ??
      support?.normal_after_effects ??
      [],
    finishSteps:
      variant?.finish_steps ??
      support?.finish_steps ??
      [],
    selectedVariantLabel: variant?.label ?? null,
  }
}

function isLowReadiness(preMood: PreMood | null, preEnergy: PreEnergy | null): boolean {
  return preMood === 'bad' || preEnergy === 'low'
}

function detailButtonLabel(stepType: string): string {
  if (stepType === 'warmup' || stepType === 'main_block') return 'Pokaż dokładnie ten krok'
  if (stepType === 'cooldown') return 'Pokaż dokładnie, jak kończyć'
  return 'Pokaż dokładnie, jak to zrobić'
}

function guidedStepSafetyNotes(step: GuidedWorkoutStepView, isArrivalStep: boolean): string | null {
  if (isArrivalStep) {
    return 'Zacznij dopiero wtedy, kiedy czujesz się stabilnie i możesz spokojnie wejść w bardzo lekką rozgrzewkę.'
  }

  return step.safety_notes
}

function guidedStepStopConditions(
  step: GuidedWorkoutStepView,
  isArrivalStep: boolean,
): string[] {
  if (isArrivalStep) {
    return [
      'ból, który pojawia się jeszcze przed startem',
      'wyraźne osłabienie już na wejściu',
      'brak poczucia stabilności przed wejściem na bieżnię',
    ]
  }

  return step.stop_conditions
}

export function GuidedWorkoutView({
  workoutLogId,
  workoutName,
  steps,
  preMood,
  preEnergy,
}: GuidedWorkoutViewProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [machineConfusionFlag, setMachineConfusionFlag] = useState(false)
  const [exerciseConfusionFlag, setExerciseConfusionFlag] = useState(false)
  const [tooHardFlag, setTooHardFlag] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, GuidedStepVariant>>({})
  const [showMachineOptionsForStep, setShowMachineOptionsForStep] = useState<string | null>(null)

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

  useEffect(() => {
    if (!currentStep) return
    if (selectedVariants[currentStep.id]) return
    if (!isLowReadiness(preMood, preEnergy)) return

    const easyVariant = currentStep.substitution_policy?.easy
    const shouldAutoSelect =
      currentStep.substitution_policy?.auto_variant === 'easy_when_low_readiness' &&
      isGuidedStepVariant(easyVariant)

    if (!shouldAutoSelect) return

    setSelectedVariants((current) => ({
      ...current,
      [currentStep.id]: easyVariant,
    }))
  }, [currentStep, preEnergy, preMood, selectedVariants])

  if (!currentStep) return null

  const isArrivalStep = currentStep.step_type === 'arrival_prep'
  const hideActions = currentStep.substitution_policy?.hide_actions === true
  const selectedVariant = selectedVariants[currentStep.id] ?? null
  const activeStep = mergeStepWithVariant(currentStep, selectedVariant)
  const safetyNotes = guidedStepSafetyNotes(activeStep, isArrivalStep)
  const stopConditions = guidedStepStopConditions(activeStep, isArrivalStep)
  const machineBusyPolicy = isGuidedStepMachineBusyPolicy(
    currentStep.substitution_policy?.machine_busy,
  )
    ? currentStep.substitution_policy?.machine_busy
    : null
  const easyVariant = isGuidedStepVariant(currentStep.substitution_policy?.easy)
    ? currentStep.substitution_policy?.easy
    : null

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

  function handleMachineBusy(): void {
    setMachineConfusionFlag(true)
    recordProductEvent('guided_substitution_requested', {
      workout_log_id: workoutLogId,
      step_id: activeStep.id,
      reason: 'machine_busy',
    })

    if (!machineBusyPolicy) {
      toast.message('Jeśli to stanowisko jest zajęte, poczekaj chwilę albo wybierz prostszy wolny sprzęt.')
      return
    }

    setShowMachineOptionsForStep((current) =>
      current === activeStep.id ? null : activeStep.id,
    )
  }

  function selectMachineOption(option: GuidedStepVariant): void {
    setSelectedVariants((current) => ({
      ...current,
      [activeStep.id]: option,
    }))
    setShowMachineOptionsForStep(null)
    toast.success(`Przełączono na: ${option.label}.`)
  }

  function handleTooHard(): void {
    setTooHardFlag(true)

    if (!easyVariant) {
      toast.message('Zwolnij tempo i skróć ten krok o 1-2 minuty.')
      return
    }

    setSelectedVariants((current) => ({
      ...current,
      [activeStep.id]: easyVariant,
    }))

    recordProductEvent('guided_substitution_requested', {
      workout_log_id: workoutLogId,
      step_id: activeStep.id,
      reason: 'too_hard',
      substitute: easyVariant.label,
    })
    toast.success('Pokazaliśmy łagodniejszą wersję tego kroku.')
  }

  function goNext(): void {
    if (isLast) {
      router.push(`/app/today/workout/${workoutLogId}/finish`)
      return
    }
    setCurrentIndex((index) => Math.min(index + 1, sortedSteps.length - 1))
    setShowDetails(false)
    setShowMachineOptionsForStep(null)
  }

  const showDetailCard = showDetails || isArrivalStep

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
        <div className="rounded-2xl border bg-card p-5">
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

          {activeStep.selectedVariantLabel && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Wybrana wersja tego kroku: <span className="font-semibold">{activeStep.selectedVariantLabel}</span>
            </div>
          )}

          {currentStep.substitution_policy?.auto_variant === 'easy_when_low_readiness' &&
            isLowReadiness(preMood, preEnergy) &&
            selectedVariant?.key === easyVariant?.key && (
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
              Dziś pokazujemy spokojniejszą wersję tego kroku, bo na starcie zaznaczyłeś/aś mniej energii albo słabszy nastrój.
            </div>
          )}

          {activeStep.setup_instructions && !isArrivalStep && (
            <div className="mt-4 rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {isArrivalStep ? 'Na czym się dziś skupiamy' : 'Jak ustawić sprzęt'}
              </p>
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

          {showMachineOptionsForStep === activeStep.id && machineBusyPolicy && (
            <div className="mt-4 rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Wybierz wolne urządzenie</p>
              <p className="mt-2 text-sm text-muted-foreground">{machineBusyPolicy.prompt}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {machineBusyPolicy.options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => selectMachineOption(option)}
                    className="rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted/30"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showDetailCard && (
            <div className="mt-4 space-y-4 rounded-xl border p-4">
              {isArrivalStep && (
                <div>
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Co zabrać
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {ARRIVAL_GUIDE.packlist.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentStep.execution_steps.length > 0 && !isArrivalStep && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {isArrivalStep ? 'Pierwsze spokojne kroki' : detailButtonLabel(activeStep.step_type)}
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {activeStep.execution_steps.map((step) => (
                      <li key={step}>• {step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isArrivalStep && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Jak spokojnie zacząć
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {ARRIVAL_GUIDE.firstSteps.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isArrivalStep && (
                <div>
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Footprints className="h-3.5 w-3.5" />
                    Co może pomóc poczuć się pewniej
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {ARRIVAL_GUIDE.reassurance.map((item) => (
                      <li key={item}>• {item}</li>
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

              {safetyNotes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bezpieczeństwo</p>
                  <p className="mt-2 text-sm">{safetyNotes}</p>
                </div>
              )}

              {activeStep.normalAfterEffects.length > 0 && (
                <div>
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Waves className="h-3.5 w-3.5" />
                    Co możesz poczuć po tym kroku
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {activeStep.normalAfterEffects.map((effect) => (
                      <li key={effect}>• {effect}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeStep.finishSteps.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Jak bezpiecznie zakończyć ten krok</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {activeStep.finishSteps.map((step) => (
                      <li key={step}>• {step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {stopConditions.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Przerwij i odpocznij, jeśli...</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {stopConditions.map((condition) => (
                      <li key={condition}>• {condition}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {nextStep && (
            <div className="mt-4 rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Co będzie następne?</p>
              <p className="mt-1 text-sm font-medium">{nextStep.title}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background px-4 pb-6 pt-3">
        {!hideActions && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={markExerciseHelpOpened}
              className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium"
            >
              <Info className="h-4 w-4" />
              {detailButtonLabel(activeStep.step_type)}
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
              onClick={() => {
                setExerciseConfusionFlag(true)
                setShowDetails(true)
                toast.message('Najpierw rozwiń dokładny opis tego kroku. Jeśli nadal coś będzie niejasne, wrócimy do tego w kolejnej iteracji.')
              }}
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
        )}

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
