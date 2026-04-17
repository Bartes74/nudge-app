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
import { FieldWithExplanation } from './FieldWithExplanation'
import { OnboardingProgress } from './OnboardingProgress'
import { GuardrailBlock, type GuardrailReason } from './GuardrailBlock'
import type { FieldExplanation } from './FieldWithExplanation'

// ---- Types ----

export interface OnboardingAnswers {
  primary_goal: string | null
  birth_date: string | null
  gender: string | null
  height_cm: number | null
  current_weight_kg: number | null
  days_per_week: number | null
  equipment_location: string | null
  equipment_list: string[]
  experience_level: string | null
  health_constraints: string[]
  is_pregnant: boolean | null
  nutrition_mode: string | null
}

const STORAGE_KEY = 'nudge_onboarding_draft'
const TOTAL_STEPS = 11

const STEP_FIELD_KEYS = [
  'primary_goal',
  'birth_date',
  'gender',
  'height_cm',
  'current_weight_kg',
  'days_per_week',
  'equipment_location',
  'equipment_list',
  'experience_level',
  'health_constraints',
  'is_pregnant_and_nutrition',
] as const

const REQUIRED_STEPS = new Set([0, 5, 6]) // primary_goal, days_per_week, equipment_location

// ---- Explanations (inline) ----
// In production these would come from field_explanations table.
// We embed them here so the wizard works offline (sessionStorage) without an extra fetch.
const EXPLANATIONS: Record<string, FieldExplanation> = {
  primary_goal: {
    why_we_ask: 'Cel główny wyznacza cały kierunek planu. Trening na redukcję wygląda inaczej niż masa mięśniowa.',
    how_to_measure: 'Co chcesz osiągnąć w ciągu najbliższych 3 miesięcy?',
    example: 'np. „Chcę schudnąć 5 kg" → wybierz Redukcja',
  },
  birth_date: {
    why_we_ask: 'Wiek wpływa na metabolizm i regenerację.',
    how_to_measure: 'Podaj rok urodzenia lub pełną datę.',
  },
  gender: {
    why_we_ask: 'Płeć biologiczna wpływa na zapotrzebowanie kaloryczne i proporcje makro.',
    how_to_measure: 'Wybierz opcję najbliższą Twojej fizjologii. To pole jest opcjonalne.',
  },
  height_cm: {
    why_we_ask: 'Wzrost służy do obliczenia BMI i TDEE.',
    how_to_measure: 'Stań bez butów. Wystarczy przybliżona wartość w centymetrach.',
    example: 'np. 172',
  },
  current_weight_kg: {
    why_we_ask: 'Masa ciała to punkt startowy do planu żywieniowego i treningowego.',
    how_to_measure: 'Zważ się rano na czczo lub podaj orientacyjną wartość.',
    example: 'np. 68',
  },
  days_per_week: {
    why_we_ask: 'Liczba dni treningowych wyznacza strukturę tygodnia. Plan na 3 dni to zupełnie co innego niż 5.',
    how_to_measure: 'Ile razy w tygodniu możesz realnie trenować? Nie idealizuj.',
  },
  equipment_location: {
    why_we_ask: 'Lokalizacja treningu determinuje dostępny sprzęt i strukturę planu.',
    how_to_measure: 'Gdzie trenujesz najczęściej?',
    example: 'Jeśli chodzisz na siłownię 3x/tydz, a w domu raz — wybierz Siłownia',
  },
  equipment_list: {
    why_we_ask: 'Wiemy, z czym możesz trenować — dobieramy ćwiczenia, które możesz realnie wykonać.',
    how_to_measure: 'Zaznacz wszystko, do czego masz dostęp.',
  },
  experience_level: {
    why_we_ask: 'Poziom doświadczenia decyduje o złożoności ćwiczeń i tempie progresji.',
    how_to_measure: 'Odpowiedz szczerze — nie ma złej odpowiedzi.',
  },
  health_constraints: {
    why_we_ask: 'Ograniczenia zdrowotne to kluczowe info bezpieczeństwa — bez tego możemy zalecić ćwiczenia, których nie powinieneś robić.',
    how_to_measure: 'Zaznacz to, co dotyczy Ciebie teraz lub nawracało w ostatnim roku.',
  },
}

// ---- Helpers ----

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
  } catch { /* storage quota */ }
}

function clearDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

function emptyAnswers(): OnboardingAnswers {
  return {
    primary_goal: null,
    birth_date: null,
    gender: null,
    height_cm: null,
    current_weight_kg: null,
    days_per_week: null,
    equipment_location: null,
    equipment_list: [],
    experience_level: null,
    health_constraints: [],
    is_pregnant: null,
    nutrition_mode: null,
  }
}

function trackEvent(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return
  const ph = (window as unknown as { posthog?: { capture: (n: string, p: unknown) => void } }).posthog
  ph?.capture(name, props)
}

// ---- Main Component ----

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = React.useState(0)
  const [direction, setDirection] = React.useState<1 | -1>(1)
  const [answers, setAnswers] = React.useState<OnboardingAnswers>(emptyAnswers)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [guardrail, setGuardrail] = React.useState<GuardrailReason | null>(null)

  // Load draft from sessionStorage on mount
  React.useEffect(() => {
    const draft = loadDraft()
    setAnswers(draft)
    trackEvent('onboarding_started')
  }, [])

  // Persist draft on every change
  React.useEffect(() => {
    saveDraft(answers)
  }, [answers])

  function patch(update: Partial<OnboardingAnswers>): void {
    setAnswers((prev) => ({ ...prev, ...update }))
  }

  function goNext(): void {
    const fieldKey = STEP_FIELD_KEYS[step]
    const isRequired = REQUIRED_STEPS.has(step)
    const isAnswered = isStepAnswered(step, answers)

    if (isRequired && !isAnswered) return  // hard block — handled in UI

    // Track
    if (isAnswered) {
      trackEvent('onboarding_field_answered', { step, field_key: fieldKey })
    } else {
      trackEvent('onboarding_field_skipped', { step, field_key: fieldKey })
    }

    setDirection(1)
    setStep((s) => s + 1)
  }

  function goBack(): void {
    if (step === 0) return
    setDirection(-1)
    setStep((s) => s - 1)
  }

  async function handleSubmit(): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
      const json = (await res.json()) as { blocked?: boolean; reason?: string; success?: boolean }

      if (!res.ok) {
        setError('Coś poszło nie tak. Spróbuj ponownie.')
        return
      }

      if (json.blocked) {
        setGuardrail(json.reason as GuardrailReason)
        return
      }

      trackEvent('onboarding_completed', { segment_key: (json as unknown as { segment_key?: string }).segment_key })
      clearDraft()
      router.push('/onboarding/done')
    } catch {
      setError('Błąd połączenia. Sprawdź internet i spróbuj ponownie.')
    } finally {
      setSubmitting(false)
    }
  }

  if (guardrail) {
    return <GuardrailBlock reason={guardrail} />
  }

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  }

  const isLastStep = step === TOTAL_STEPS - 1
  const isRequired = REQUIRED_STEPS.has(step)
  const isAnswered = isStepAnswered(step, answers)
  const canProceed = !isRequired || isAnswered

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="disabled:opacity-30 -ml-1 p-1 hover:bg-muted rounded"
            aria-label="Wróć"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <OnboardingProgress current={step + 1} total={TOTAL_STEPS} />
          </div>
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-lg mx-auto px-4 py-8 h-full">
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

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 bg-background border-t px-4 py-4 safe-bottom">
        <div className="max-w-lg mx-auto space-y-2">
          {error && (
            <p className="text-sm text-destructive text-center" role="alert">{error}</p>
          )}
          <div className="flex gap-3">
            {!isRequired && !isLastStep && (
              <Button
                variant="ghost"
                className="flex-1"
                onClick={goNext}
                disabled={submitting}
              >
                Pomiń
              </Button>
            )}
            {isLastStep ? (
              <Button
                className="flex-1"
                onClick={handleSubmit}
                isLoading={submitting}
                disabled={!canProceed}
              >
                Gotowe — pokaż mój profil
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={goNext}
                disabled={!canProceed || submitting}
              >
                Dalej
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

// ---- Step content ----

function isStepAnswered(step: number, answers: OnboardingAnswers): boolean {
  switch (step) {
    case 0: return answers.primary_goal !== null
    case 1: return answers.birth_date !== null
    case 2: return answers.gender !== null
    case 3: return answers.height_cm !== null
    case 4: return answers.current_weight_kg !== null
    case 5: return answers.days_per_week !== null
    case 6: return answers.equipment_location !== null
    case 7: return true  // equipment_list optional
    case 8: return answers.experience_level !== null
    case 9: return answers.health_constraints.length > 0
    case 10: return true  // last step — is_pregnant + nutrition_mode optional by themselves
    default: return true
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
        <FieldWithExplanation label="Jaki jest Twój główny cel?" explanation={EXPLANATIONS.primary_goal ?? null} required>
          <RadioGroup
            value={answers.primary_goal ?? ''}
            onValueChange={(v) => onChange({ primary_goal: v })}
            className="space-y-3"
          >
            {[
              { value: 'weight_loss', label: 'Chcę schudnąć / zredukować tkankę tłuszczową' },
              { value: 'muscle_building', label: 'Chcę zbudować mięśnie / poprawić sylwetkę' },
              { value: 'strength_performance', label: 'Chcę zwiększyć siłę i wydolność' },
              { value: 'general_health', label: 'Chcę po prostu być aktywna/y i czuć się lepiej' },
            ].map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`goal_${opt.value}`}
                className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 transition-colors"
              >
                <RadioGroupItem value={opt.value} id={`goal_${opt.value}`} className="mt-0.5" />
                <span className="text-sm leading-snug">{opt.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 1:
      return (
        <FieldWithExplanation label="Kiedy się urodziłeś/aś?" explanation={EXPLANATIONS.birth_date ?? null}>
          <Input
            type="date"
            value={answers.birth_date ?? ''}
            onChange={(e) => onChange({ birth_date: e.target.value || null })}
            max={new Date().toISOString().split('T')[0]}
            placeholder="RRRR-MM-DD"
          />
        </FieldWithExplanation>
      )

    case 2:
      return (
        <FieldWithExplanation label="Płeć" explanation={EXPLANATIONS.gender ?? null}>
          <RadioGroup
            value={answers.gender ?? ''}
            onValueChange={(v) => onChange({ gender: v })}
            className="space-y-3"
          >
            {[
              { value: 'female', label: 'Kobieta' },
              { value: 'male', label: 'Mężczyzna' },
              { value: 'other', label: 'Inna' },
              { value: 'prefer_not_to_say', label: 'Wolę nie podawać' },
            ].map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`gender_${opt.value}`}
                className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 transition-colors"
              >
                <RadioGroupItem value={opt.value} id={`gender_${opt.value}`} />
                <span className="text-sm">{opt.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 3:
      return (
        <FieldWithExplanation label="Wzrost (cm)" explanation={EXPLANATIONS.height_cm ?? null}>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={120}
              max={250}
              placeholder="np. 172"
              value={answers.height_cm ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                onChange({ height_cm: isNaN(v) ? null : v })
              }}
              className="text-lg"
            />
            <span className="text-muted-foreground shrink-0">cm</span>
          </div>
        </FieldWithExplanation>
      )

    case 4:
      return (
        <FieldWithExplanation label="Aktualna masa ciała (kg)" explanation={EXPLANATIONS.current_weight_kg ?? null}>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={30}
              max={300}
              step={0.5}
              placeholder="np. 72"
              value={answers.current_weight_kg ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                onChange({ current_weight_kg: isNaN(v) ? null : v })
              }}
              className="text-lg"
            />
            <span className="text-muted-foreground shrink-0">kg</span>
          </div>
        </FieldWithExplanation>
      )

    case 5:
      return (
        <FieldWithExplanation label="Ile razy w tygodniu możesz trenować?" explanation={EXPLANATIONS.days_per_week ?? null} required>
          <RadioGroup
            value={answers.days_per_week?.toString() ?? ''}
            onValueChange={(v) => onChange({ days_per_week: parseInt(v, 10) })}
            className="space-y-3"
          >
            {[
              { value: '2', label: '2 razy — na start' },
              { value: '3', label: '3 razy — klasyk' },
              { value: '4', label: '4 razy' },
              { value: '5', label: '5 razy lub więcej' },
            ].map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`days_${opt.value}`}
                className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 transition-colors"
              >
                <RadioGroupItem value={opt.value} id={`days_${opt.value}`} />
                <span className="text-sm">{opt.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 6:
      return (
        <FieldWithExplanation label="Gdzie trenujesz?" explanation={EXPLANATIONS.equipment_location ?? null} required>
          <RadioGroup
            value={answers.equipment_location ?? ''}
            onValueChange={(v) => onChange({ equipment_location: v })}
            className="space-y-3"
          >
            {[
              { value: 'home', label: 'W domu (lub na dworze)' },
              { value: 'gym', label: 'Na siłowni' },
              { value: 'mixed', label: 'Mixuję — i w domu, i na siłowni' },
            ].map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`loc_${opt.value}`}
                className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 transition-colors"
              >
                <RadioGroupItem value={opt.value} id={`loc_${opt.value}`} />
                <span className="text-sm">{opt.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 7:
      return (
        <FieldWithExplanation label="Dostępny sprzęt" explanation={EXPLANATIONS.equipment_list ?? null}>
          <div className="space-y-3">
            {[
              { value: 'has_barbell', label: 'Sztanga ze stojakiem' },
              { value: 'has_dumbbells', label: 'Hantle' },
              { value: 'has_kettlebells', label: 'Kettlebell' },
              { value: 'has_machines', label: 'Maszyny (np. leg press, kablówka)' },
              { value: 'has_cables', label: 'Wyciągi / kablówka' },
              { value: 'has_pullup_bar', label: 'Drążek do podciągania' },
              { value: 'has_bench', label: 'Ławeczka' },
              { value: 'has_cardio', label: 'Sprzęt cardio (bieżnia, rower stacjonarny)' },
            ].map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`eq_${opt.value}`}
                className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors"
              >
                <Checkbox
                  id={`eq_${opt.value}`}
                  checked={answers.equipment_list.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    const list = checked
                      ? [...answers.equipment_list, opt.value]
                      : answers.equipment_list.filter((x) => x !== opt.value)
                    onChange({ equipment_list: list })
                  }}
                />
                <span className="text-sm">{opt.label}</span>
              </Label>
            ))}
          </div>
        </FieldWithExplanation>
      )

    case 8:
      return (
        <FieldWithExplanation label="Jak oceniasz swoje doświadczenie treningowe?" explanation={EXPLANATIONS.experience_level ?? null}>
          <RadioGroup
            value={answers.experience_level ?? ''}
            onValueChange={(v) => onChange({ experience_level: v })}
            className="space-y-3"
          >
            {[
              { value: 'zero', label: 'Dopiero zaczynam — nigdy nie trenowałem/am regularnie' },
              { value: 'beginner', label: 'Trenuję od kilku miesięcy, znam podstawy' },
              { value: 'amateur', label: 'Trenuję regularnie od 1–3 lat' },
              { value: 'advanced', label: 'Trenuję poważnie od 3+ lat, znam technikę' },
            ].map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`exp_${opt.value}`}
                className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 transition-colors"
              >
                <RadioGroupItem value={opt.value} id={`exp_${opt.value}`} className="mt-0.5" />
                <span className="text-sm leading-snug">{opt.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </FieldWithExplanation>
      )

    case 9:
      return (
        <FieldWithExplanation label="Ograniczenia zdrowotne" explanation={EXPLANATIONS.health_constraints ?? null}>
          <div className="space-y-3">
            {[
              { value: 'back_pain', label: 'Ból pleców (lędźwiowy lub szyjny)' },
              { value: 'knee_pain', label: 'Ból kolan' },
              { value: 'shoulder_pain', label: 'Ból barków' },
              { value: 'hip_pain', label: 'Ból bioder' },
              { value: 'wrist_pain', label: 'Ból nadgarstków' },
              { value: 'cardiovascular', label: 'Problemy kardiologiczne' },
              { value: 'none', label: 'Żadnych ograniczeń — jestem zdrowy/a' },
            ].map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`hc_${opt.value}`}
                className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors"
              >
                <Checkbox
                  id={`hc_${opt.value}`}
                  checked={answers.health_constraints.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    let list: string[]
                    if (opt.value === 'none') {
                      list = checked ? ['none'] : []
                    } else {
                      const withoutNone = answers.health_constraints.filter((x) => x !== 'none')
                      list = checked
                        ? [...withoutNone, opt.value]
                        : withoutNone.filter((x) => x !== opt.value)
                    }
                    onChange({ health_constraints: list })
                  }}
                />
                <span className="text-sm">{opt.label}</span>
              </Label>
            ))}
          </div>
        </FieldWithExplanation>
      )

    case 10:
      return (
        <div className="space-y-6">
          <FieldWithExplanation label="Jesteś w ciąży?" explanation={null}>
            <RadioGroup
              value={answers.is_pregnant === null ? '' : String(answers.is_pregnant)}
              onValueChange={(v) => onChange({ is_pregnant: v === 'true' })}
              className="space-y-3"
            >
              {[
                { value: 'false', label: 'Nie' },
                { value: 'true', label: 'Tak, jestem w ciąży' },
              ].map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`preg_${opt.value}`}
                  className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 transition-colors"
                >
                  <RadioGroupItem value={opt.value} id={`preg_${opt.value}`} />
                  <span className="text-sm">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </FieldWithExplanation>

          <FieldWithExplanation
            label="Jak dokładnie chcesz śledzić jedzenie?"
            explanation={{
              why_we_ask: 'Nudge może pracować na różnych poziomach precyzji żywieniowej. Polecamy zacząć od Prostego.',
              how_to_measure: 'Możesz zmienić w każdej chwili.',
              example: 'Prosty: „zjedz 4 posiłki, 1 dłoń białka na każdy"',
            }}
          >
            <RadioGroup
              value={answers.nutrition_mode ?? ''}
              onValueChange={(v) => onChange({ nutrition_mode: v })}
              className="space-y-3"
            >
              {[
                { value: 'simple', label: 'Prosty — ogólne wskazówki, bez liczenia kalorii' },
                { value: 'ranges', label: 'Zakresy — widełki kalorii i makro bez gramatur' },
                { value: 'exact', label: 'Dokładny — pełne makro w gramach' },
              ].map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`nm_${opt.value}`}
                  className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 transition-colors"
                >
                  <RadioGroupItem value={opt.value} id={`nm_${opt.value}`} className="mt-0.5" />
                  <span className="text-sm leading-snug">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </FieldWithExplanation>
        </div>
      )

    default:
      return null
  }
}
