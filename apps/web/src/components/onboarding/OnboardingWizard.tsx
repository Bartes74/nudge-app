'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FieldWithExplanation, type FieldExplanation } from './FieldWithExplanation'
import { OnboardingProgress } from './OnboardingProgress'
import { GuardrailBlock, type GuardrailReason } from './GuardrailBlock'

export interface OnboardingAnswers {
  primary_goal: string | null
  age_years: number | null
  height_cm: number | null
  current_weight_kg: number | null
  days_per_week: number | null
  equipment_location: string | null
  recent_activity_window: string | null
  health_constraints: string[]
  job_activity: string | null
  training_background: string | null
}

const STORAGE_KEY = 'nudge_onboarding_draft'
const TOTAL_STEPS = 10

const STEP_FIELD_KEYS = [
  'primary_goal',
  'age_years',
  'height_cm',
  'current_weight_kg',
  'days_per_week',
  'equipment_location',
  'recent_activity_window',
  'health_constraints',
  'job_activity',
  'training_background',
] as const

const REQUIRED_STEPS = new Set(STEP_FIELD_KEYS.map((_, index) => index))

const EXPLANATIONS: Record<string, FieldExplanation> = {
  primary_goal: {
    why_we_ask: 'To pomaga nam dobrać bezpieczny kierunek startu.',
    how_to_measure: 'Wybierz to, co jest dziś dla Ciebie najważniejsze.',
  },
  age_years: {
    why_we_ask: 'Wiek pomaga dobrać spokojne tempo startu i poziom ostrożności.',
    how_to_measure: 'Podaj pełne lata. Nie potrzebujemy dokładnej daty urodzenia.',
  },
  height_cm: {
    why_we_ask: 'Wzrost pomaga dopasować plan i ocenić punkt startowy.',
    how_to_measure: 'Wystarczy przybliżona wartość w centymetrach.',
  },
  current_weight_kg: {
    why_we_ask: 'Masa pomaga dopasować plan i łagodny start.',
    how_to_measure: 'Wystarczy orientacyjna wartość.',
  },
  days_per_week: {
    why_we_ask: 'Chcemy zaplanować tyle, ile naprawdę dasz radę zrobić.',
    how_to_measure: 'Wybierz realną liczbę treningów, nie wersję idealną.',
  },
  equipment_location: {
    why_we_ask: 'To pozwala od razu dobrać ćwiczenia i prosty przebieg pierwszych wizyt.',
    how_to_measure: 'Wskaż miejsce, w którym najłatwiej będzie Ci ćwiczyć.',
  },
  recent_activity_window: {
    why_we_ask: 'Na tej podstawie oceniamy, czy potrzebujesz bardzo łagodnego wejścia.',
    how_to_measure: 'Chodzi o regularny ruch, nie pojedyncze próby.',
  },
  health_constraints: {
    why_we_ask: 'To najważniejsza część bezpieczeństwa. Dzięki temu nie dobierzemy zbyt agresywnego startu.',
    how_to_measure: 'Zaznacz to, co może wpływać na wysiłek lub wymaga ostrożności.',
  },
  job_activity: {
    why_we_ask: 'Tryb dnia pomaga dobrać obciążenie i tempo regeneracji.',
    how_to_measure: 'Wybierz opis najbliższy temu, jak zwykle wygląda Twój dzień.',
  },
  training_background: {
    why_we_ask: 'Dzięki temu pokażemy taką ilość instrukcji, jaka naprawdę będzie pomocna.',
    how_to_measure: 'Wybierz opis, który najlepiej pasuje do Ciebie teraz.',
  },
}

function emptyAnswers(): OnboardingAnswers {
  return {
    primary_goal: null,
    age_years: null,
    height_cm: null,
    current_weight_kg: null,
    days_per_week: null,
    equipment_location: null,
    recent_activity_window: null,
    health_constraints: [],
    job_activity: null,
    training_background: null,
  }
}

function loadDraft(): OnboardingAnswers {
  if (typeof window === 'undefined') return emptyAnswers()
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyAnswers()
    return JSON.parse(raw) as OnboardingAnswers
  } catch {
    return emptyAnswers()
  }
}

function saveDraft(answers: OnboardingAnswers): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
  } catch {
    // ignore storage errors
  }
}

function clearDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

function trackEvent(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return
  const ph = (window as unknown as { posthog?: { capture: (n: string, p: unknown) => void } }).posthog
  ph?.capture(name, props)
}

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = React.useState(0)
  const [direction, setDirection] = React.useState<1 | -1>(1)
  const [answers, setAnswers] = React.useState<OnboardingAnswers>(emptyAnswers)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [guardrail, setGuardrail] = React.useState<GuardrailReason | null>(null)

  React.useEffect(() => {
    setAnswers(loadDraft())
    trackEvent('onboarding_started')
  }, [])

  React.useEffect(() => {
    saveDraft(answers)
  }, [answers])

  function patch(update: Partial<OnboardingAnswers>): void {
    setAnswers((prev) => ({ ...prev, ...update }))
  }

  function goNext(): void {
    const fieldKey = STEP_FIELD_KEYS[step]
    const isAnswered = isStepAnswered(step, answers)
    if (!isAnswered) return

    trackEvent('onboarding_field_answered', { step, field_key: fieldKey })
    setDirection(1)
    setStep((current) => current + 1)
  }

  function goBack(): void {
    if (step === 0) return
    setDirection(-1)
    setStep((current) => current - 1)
  }

  async function handleSubmit(): Promise<void> {
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })

      const json = (await response.json()) as { blocked?: boolean; reason?: string }

      if (!response.ok) {
        setError('Nie udało się zapisać odpowiedzi. Spróbuj jeszcze raz.')
        return
      }

      if (json.blocked) {
        setGuardrail(json.reason as GuardrailReason)
        return
      }

      trackEvent('onboarding_completed')
      clearDraft()
      router.push('/onboarding/done')
    } catch {
      setError('Błąd połączenia. Spróbuj ponownie za chwilę.')
    } finally {
      setSubmitting(false)
    }
  }

  if (guardrail) {
    return <GuardrailBlock reason={guardrail} />
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  const isLastStep = step === TOTAL_STEPS - 1
  const canProceed = isStepAnswered(step, answers)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="-ml-1 rounded p-1 hover:bg-muted disabled:opacity-30"
            aria-label="Wróć"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <OnboardingProgress current={step + 1} total={TOTAL_STEPS} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-lg px-4 py-8">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.22 }}
              className="space-y-6"
            >
              <StepContent step={step} answers={answers} onChange={patch} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 border-t bg-background px-4 py-4 safe-bottom">
        <div className="mx-auto max-w-lg space-y-2">
          {error && (
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            {isLastStep ? (
              <Button
                className="flex-1"
                onClick={handleSubmit}
                isLoading={submitting}
                disabled={!canProceed}
              >
                Zapisz i pokaż kolejny krok
              </Button>
            ) : (
              <Button className="flex-1" onClick={goNext} disabled={!canProceed || submitting}>
                Dalej
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

function isStepAnswered(step: number, answers: OnboardingAnswers): boolean {
  switch (step) {
    case 0:
      return answers.primary_goal !== null
    case 1:
      return answers.age_years !== null
    case 2:
      return answers.height_cm !== null
    case 3:
      return answers.current_weight_kg !== null
    case 4:
      return answers.days_per_week !== null
    case 5:
      return answers.equipment_location !== null
    case 6:
      return answers.recent_activity_window !== null
    case 7:
      return answers.health_constraints.length > 0
    case 8:
      return answers.job_activity !== null
    case 9:
      return answers.training_background !== null
    default:
      return true
  }
}

interface StepContentProps {
  step: number
  answers: OnboardingAnswers
  onChange: (update: Partial<OnboardingAnswers>) => void
}

function StepContent({ step, answers, onChange }: StepContentProps) {
  switch (step) {
    case 0:
      return (
        <FieldWithExplanation
          label="Jaki jest dziś Twój główny cel?"
          explanation={EXPLANATIONS.primary_goal ?? null}
          required
        >
          <RadioGroup
            value={answers.primary_goal ?? ''}
            onValueChange={(value) => onChange({ primary_goal: value })}
            className="space-y-3"
          >
            {[
              { value: 'weight_loss', label: 'Chcę schudnąć lub zmniejszyć ilość tkanki tłuszczowej' },
              { value: 'muscle_building', label: 'Chcę zbudować mięśnie i poprawić sylwetkę' },
              { value: 'strength_performance', label: 'Chcę poprawić siłę i sprawność' },
              { value: 'general_health', label: 'Chcę po prostu regularnie się ruszać i czuć się lepiej' },
            ].map((option) => (
              <ChoiceCard key={option.value} name={`goal_${option.value}`} value={option.value}>
                <RadioGroupItem value={option.value} id={`goal_${option.value}`} className="mt-0.5" />
                <span className="text-sm leading-snug">{option.label}</span>
              </ChoiceCard>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 1:
      return (
        <FieldWithExplanation label="Ile masz lat?" explanation={EXPLANATIONS.age_years ?? null} required>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={16}
              max={99}
              placeholder="np. 34"
              value={answers.age_years ?? ''}
              onChange={(event) => {
                const value = parseInt(event.target.value, 10)
                onChange({ age_years: Number.isNaN(value) ? null : value })
              }}
              className="text-lg"
            />
            <span className="shrink-0 text-muted-foreground">lat</span>
          </div>
        </FieldWithExplanation>
      )

    case 2:
      return (
        <FieldWithExplanation label="Jaki masz wzrost?" explanation={EXPLANATIONS.height_cm ?? null} required>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={120}
              max={250}
              placeholder="np. 172"
              value={answers.height_cm ?? ''}
              onChange={(event) => {
                const value = parseFloat(event.target.value)
                onChange({ height_cm: Number.isNaN(value) ? null : value })
              }}
              className="text-lg"
            />
            <span className="shrink-0 text-muted-foreground">cm</span>
          </div>
        </FieldWithExplanation>
      )

    case 3:
      return (
        <FieldWithExplanation label="Jaka jest Twoja masa ciała?" explanation={EXPLANATIONS.current_weight_kg ?? null} required>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={30}
              max={300}
              step={0.5}
              placeholder="np. 78"
              value={answers.current_weight_kg ?? ''}
              onChange={(event) => {
                const value = parseFloat(event.target.value)
                onChange({ current_weight_kg: Number.isNaN(value) ? null : value })
              }}
              className="text-lg"
            />
            <span className="shrink-0 text-muted-foreground">kg</span>
          </div>
        </FieldWithExplanation>
      )

    case 4:
      return (
        <FieldWithExplanation label="Ile treningów tygodniowo jest realne?" explanation={EXPLANATIONS.days_per_week ?? null} required>
          <RadioGroup
            value={answers.days_per_week?.toString() ?? ''}
            onValueChange={(value) => onChange({ days_per_week: parseInt(value, 10) })}
            className="space-y-3"
          >
            {[
              { value: '2', label: '2 treningi tygodniowo' },
              { value: '3', label: '3 treningi tygodniowo' },
              { value: '4', label: '4 treningi tygodniowo' },
              { value: '5', label: '5 lub więcej' },
            ].map((option) => (
              <ChoiceCard key={option.value} name={`days_${option.value}`} value={option.value}>
                <RadioGroupItem value={option.value} id={`days_${option.value}`} />
                <span className="text-sm">{option.label}</span>
              </ChoiceCard>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 5:
      return (
        <FieldWithExplanation label="Gdzie najłatwiej będzie Ci ćwiczyć?" explanation={EXPLANATIONS.equipment_location ?? null} required>
          <RadioGroup
            value={answers.equipment_location ?? ''}
            onValueChange={(value) => onChange({ equipment_location: value })}
            className="space-y-3"
          >
            {[
              { value: 'gym', label: 'Na siłowni' },
              { value: 'home', label: 'W domu albo na zewnątrz' },
              { value: 'mixed', label: 'Różnie, zależnie od dnia' },
            ].map((option) => (
              <ChoiceCard key={option.value} name={`location_${option.value}`} value={option.value}>
                <RadioGroupItem value={option.value} id={`location_${option.value}`} />
                <span className="text-sm">{option.label}</span>
              </ChoiceCard>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 6:
      return (
        <FieldWithExplanation
          label="Kiedy ostatnio miałeś/aś regularną aktywność fizyczną?"
          explanation={EXPLANATIONS.recent_activity_window ?? null}
          required
        >
          <RadioGroup
            value={answers.recent_activity_window ?? ''}
            onValueChange={(value) => onChange({ recent_activity_window: value })}
            className="space-y-3"
          >
            {[
              { value: 'never_regular', label: 'Nie miałem/am jeszcze regularnych treningów' },
              { value: 'over_12_months', label: 'Ponad 12 miesięcy temu' },
              { value: 'within_12_months', label: 'W ostatnich 12 miesiącach, ale nie teraz regularnie' },
              { value: 'within_3_months', label: 'Ćwiczę regularnie teraz albo ćwiczyłem/am w ostatnich 3 miesiącach' },
            ].map((option) => (
              <ChoiceCard key={option.value} name={`activity_${option.value}`} value={option.value}>
                <RadioGroupItem value={option.value} id={`activity_${option.value}`} className="mt-0.5" />
                <span className="text-sm leading-snug">{option.label}</span>
              </ChoiceCard>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 7:
      return (
        <FieldWithExplanation
          label="Czy coś może wpływać na bezpieczny wysiłek?"
          explanation={EXPLANATIONS.health_constraints ?? null}
          required
        >
          <div className="space-y-3">
            {[
              { value: 'pain_or_injury', label: 'Mam ból, uraz albo nawracający dyskomfort przy ruchu' },
              { value: 'medical_condition', label: 'Mam chorobę lub stan zdrowotny, który warto uwzględnić' },
              { value: 'medication_affecting_exertion', label: 'Biorę leki, które mogą wpływać na wysiłek lub tętno' },
              { value: 'other_contraindication', label: 'Mam inne przeciwwskazanie albo potrzebuję ostrożnego startu' },
              { value: 'none', label: 'Nic z tych rzeczy mnie nie dotyczy' },
            ].map((option) => (
              <Label
                key={option.value}
                htmlFor={`health_${option.value}`}
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors"
              >
                <Checkbox
                  id={`health_${option.value}`}
                  checked={answers.health_constraints.includes(option.value)}
                  onCheckedChange={(checked) => {
                    let nextValues: string[]
                    if (option.value === 'none') {
                      nextValues = checked ? ['none'] : []
                    } else {
                      const withoutNone = answers.health_constraints.filter((item) => item !== 'none')
                      nextValues = checked
                        ? [...withoutNone, option.value]
                        : withoutNone.filter((item) => item !== option.value)
                    }
                    onChange({ health_constraints: nextValues })
                  }}
                />
                <span className="text-sm leading-snug">{option.label}</span>
              </Label>
            ))}
          </div>
        </FieldWithExplanation>
      )

    case 8:
      return (
        <FieldWithExplanation label="Jak wygląda Twój typowy dzień pracy?" explanation={EXPLANATIONS.job_activity ?? null} required>
          <RadioGroup
            value={answers.job_activity ?? ''}
            onValueChange={(value) => onChange({ job_activity: value })}
            className="space-y-3"
          >
            {[
              { value: 'mostly_sitting', label: 'Głównie siedzę' },
              { value: 'mixed', label: 'Trochę siedzę, trochę chodzę' },
              { value: 'mostly_standing', label: 'Głównie stoję albo dużo chodzę' },
              { value: 'physically_active', label: 'Moja praca jest fizyczna' },
            ].map((option) => (
              <ChoiceCard key={option.value} name={`job_${option.value}`} value={option.value}>
                <RadioGroupItem value={option.value} id={`job_${option.value}`} />
                <span className="text-sm">{option.label}</span>
              </ChoiceCard>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 9:
      return (
        <FieldWithExplanation label="Który opis najlepiej do Ciebie pasuje?" explanation={EXPLANATIONS.training_background ?? null} required>
          <RadioGroup
            value={answers.training_background ?? ''}
            onValueChange={(value) => onChange({ training_background: value })}
            className="space-y-3"
          >
            {[
              { value: 'just_starting', label: 'Dopiero zaczynam i chcę prostych instrukcji krok po kroku' },
              { value: 'returning_after_break', label: 'Wracam po długiej przerwie' },
              { value: 'knows_basics_needs_plan', label: 'Znam podstawy, ale potrzebuję planu' },
              { value: 'training_regularly', label: 'Ćwiczę regularnie' },
            ].map((option) => (
              <ChoiceCard key={option.value} name={`background_${option.value}`} value={option.value}>
                <RadioGroupItem value={option.value} id={`background_${option.value}`} className="mt-0.5" />
                <span className="text-sm leading-snug">{option.label}</span>
              </ChoiceCard>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    default:
      return null
  }
}

function ChoiceCard(props: {
  children: React.ReactNode
  name: string
  value: string
}) {
  return (
    <Label
      htmlFor={props.name}
      className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5"
    >
      {props.children}
    </Label>
  )
}
