'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

const SESSION_KEY_PREFIX = 'guided_workout_state_'

type TempoFeedback = 'too_light' | 'just_right' | 'too_hard'

export default function FinishWorkoutPage({
  params,
}: {
  params: { workoutLogId: string }
}) {
  const { workoutLogId } = params
  const router = useRouter()
  const [isGuidedMode, setIsGuidedMode] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [wentWell, setWentWell] = useState('')
  const [wentPoorly, setWentPoorly] = useState('')
  const [whatToImprove, setWhatToImprove] = useState('')
  const [clarityScore, setClarityScore] = useState<number | null>(null)
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null)
  const [feltSafe, setFeltSafe] = useState<boolean | null>(null)
  const [tempoFeedback, setTempoFeedback] = useState<TempoFeedback | null>(null)
  const [readyForNextWorkout, setReadyForNextWorkout] = useState<boolean | null>(null)
  const [painFlag, setPainFlag] = useState(false)
  const [redFlagSymptoms, setRedFlagSymptoms] = useState<string[]>([])
  const [guidedImprovementNote, setGuidedImprovementNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${workoutLogId}`)
    if (!raw) return
    setIsGuidedMode(true)
    try {
      const parsed = JSON.parse(raw) as {
        exercise_confusion_flag?: boolean
        machine_confusion_flag?: boolean
        too_hard_flag?: boolean
      }
      if (parsed.too_hard_flag) setTempoFeedback('too_hard')
    } catch {
      // ignore invalid state
    }
  }, [workoutLogId])

  async function handleSubmit(): Promise<void> {
    if (isGuidedMode) {
      if (
        clarityScore == null ||
        confidenceScore == null ||
        feltSafe == null ||
        tempoFeedback == null ||
        readyForNextWorkout == null
      ) {
        toast.error('Uzupełnij krótkie podsumowanie treningu')
        return
      }
    } else if (rating === 0) {
      toast.error('Wybierz ocenę treningu')
      return
    }

    setLoading(true)

    const guidedStateRaw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${workoutLogId}`)
    const guidedState = guidedStateRaw
      ? (JSON.parse(guidedStateRaw) as {
          exercise_confusion_flag?: boolean
          machine_confusion_flag?: boolean
          too_hard_flag?: boolean
        })
      : {}

    try {
      const response = await fetch(`/api/workout/${workoutLogId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isGuidedMode
            ? {
                overall_rating: 4,
                clarity_score: clarityScore,
                confidence_score: confidenceScore,
                felt_safe: feltSafe,
                exercise_confusion_flag: guidedState.exercise_confusion_flag ?? false,
                machine_confusion_flag: guidedState.machine_confusion_flag ?? false,
                too_hard_flag:
                  guidedState.too_hard_flag ?? tempoFeedback === 'too_hard',
                pain_flag: painFlag,
                tempo_feedback: tempoFeedback,
                ready_for_next_workout: readyForNextWorkout,
                red_flag_symptoms: redFlagSymptoms,
                what_to_improve: guidedImprovementNote.trim() || undefined,
              }
            : {
                overall_rating: rating,
                went_well: wentWell.trim() || undefined,
                went_poorly: wentPoorly.trim() || undefined,
                what_to_improve: whatToImprove.trim() || undefined,
              },
        ),
      })

      if (!response.ok) throw new Error('Finish failed')

      if (isGuidedMode) {
        const eventName = 'guided_workout_completed'
        void fetch('/api/product-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: eventName,
            properties: {
              workout_log_id: workoutLogId,
              clarity_score: clarityScore,
              confidence_score: confidenceScore,
              ready_for_next_workout: readyForNextWorkout,
            },
          }),
        })

        if ((confidenceScore ?? 0) >= 4) {
          void fetch('/api/product-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_name: 'confidence_improved',
              properties: {
                workout_log_id: workoutLogId,
                confidence_score: confidenceScore,
              },
            }),
          })
        }
      }

      sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${workoutLogId}`)
      toast.success('Trening zapisany')
      router.push('/app/history')
    } catch {
      toast.error('Nie udało się zapisać treningu')
      setLoading(false)
    }
  }

  if (isGuidedMode) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
        <header className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">Po treningu</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-display italic text-muted-foreground">Krótki</span>
            <br />
            <span className="font-sans font-semibold">check-in.</span>
          </h1>
          <p className="text-body-m text-muted-foreground">
            Chcemy wiedzieć, czy wszystko było jasne, spokojne i bezpieczne.
          </p>
        </header>

        <div className="flex flex-col gap-5">
          <ScaleQuestion
            title="Czy wiedziałeś/aś, co robić?"
            value={clarityScore}
            onChange={setClarityScore}
          />

          <ScaleQuestion
            title="Na ile pewnie się czułeś/aś?"
            value={confidenceScore}
            onChange={setConfidenceScore}
          />

          <BooleanQuestion
            title="Czy trening czuł się bezpiecznie?"
            value={feltSafe}
            onChange={setFeltSafe}
          />

          <div className="flex flex-col gap-2">
            <p className="text-label uppercase text-muted-foreground">Jakie było tempo?</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: 'too_light', label: 'Za lekkie' },
                { value: 'just_right', label: 'W sam raz' },
                { value: 'too_hard', label: 'Za mocne' },
              ].map((option) => (
                <OptionButton
                  key={option.value}
                  active={tempoFeedback === option.value}
                  onClick={() => setTempoFeedback(option.value as TempoFeedback)}
                >
                  {option.label}
                </OptionButton>
              ))}
            </div>
          </div>

          <BooleanQuestion
            title="Czy coś bolało?"
            value={painFlag}
            onChange={setPainFlag}
          />

          {painFlag && (
            <Card variant="destructive" padding="md">
              <CardEyebrow className="text-destructive">Sygnały ostrzegawcze</CardEyebrow>
              <div className="mt-3 flex flex-col gap-2">
                {(
                  [
                    ['chest_pain', 'Ból w klatce piersiowej'],
                    ['dizziness', 'Zawroty głowy'],
                    ['unusual_shortness_of_breath', 'Nietypowa duszność'],
                    ['radiating_pain', 'Promieniujący ból'],
                    ['sharp_joint_pain', 'Ostry ból stawu'],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-3 text-body-m font-medium tracking-tight"
                  >
                    <input
                      type="checkbox"
                      checked={redFlagSymptoms.includes(value)}
                      onChange={(event) => {
                        setRedFlagSymptoms((current) =>
                          event.target.checked
                            ? [...current, value]
                            : current.filter((item) => item !== value),
                        )
                      }}
                      className="h-4 w-4 accent-destructive"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Card>
          )}

          <BooleanQuestion
            title="Gotowy/a na kolejny trening?"
            value={readyForNextWorkout}
            onChange={setReadyForNextWorkout}
          />

          <TextQuestion
            id="guided-what-to-improve"
            label="Co uprościć albo dopracować następnym razem?"
            value={guidedImprovementNote}
            onChange={setGuidedImprovementNote}
            placeholder="np. prostsze wskazówki przy ustawieniu sprzętu, wolniejsze tempo…"
          />
        </div>

        <Button
          type="button"
          size="hero"
          disabled={loading}
          isLoading={loading}
          onClick={() => void handleSubmit()}
          className="w-full"
        >
          Zapisz podsumowanie
        </Button>
      </div>
    )
  }

  const displayRating = hovered || rating

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Po treningu</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Jak był</span>
          <br />
          <span className="font-sans font-semibold">trening?</span>
        </h1>
        <p className="text-body-m text-muted-foreground">
          Podsumuj sesję — pomoże nam dopasować Twój plan.
        </p>
      </header>

      <Card variant="recessed" padding="md">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onPointerEnter={() => setHovered(star)}
              onPointerLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="transition-transform active:scale-110"
              aria-label={`${star} gwiazdki`}
            >
              <Star
                className={`h-10 w-10 transition-colors duration-200 ease-premium ${
                  displayRating >= star
                    ? 'fill-brand text-brand'
                    : 'text-muted-foreground/30'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-4 text-center font-display text-body-m italic text-muted-foreground">
            {rating === 1 && 'Ciężki dzień — dobra robota, że wyszedłeś.'}
            {rating === 2 && 'Poniżej oczekiwań, ale byłeś.'}
            {rating === 3 && 'Solidny trening.'}
            {rating === 4 && 'Dobry trening.'}
            {rating === 5 && 'Fenomenalne.'}
          </p>
        )}
      </Card>

      <div className="flex flex-col gap-3">
        <TextQuestion
          id="went-well"
          label="Co poszło dobrze?"
          value={wentWell}
          onChange={setWentWell}
          placeholder="np. dobra forma na przysiadach, nowy rekord…"
        />
        <TextQuestion
          id="went-poorly"
          label="Co poszło słabo?"
          value={wentPoorly}
          onChange={setWentPoorly}
          placeholder="np. brak energii, za mało czasu…"
        />
        <TextQuestion
          id="what-to-improve"
          label="Co poprawię?"
          value={whatToImprove}
          onChange={setWhatToImprove}
          placeholder="np. więcej snu, więcej wody…"
        />
      </div>

      <Button
        type="button"
        size="hero"
        disabled={loading || rating === 0}
        isLoading={loading}
        onClick={() => void handleSubmit()}
        className="w-full"
      >
        Zakończ trening
      </Button>
    </div>
  )
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-body-m font-medium tracking-tight transition-[background-color,border-color,color] duration-200 ease-premium ${
        active
          ? 'border-foreground bg-foreground text-background shadow-lift'
          : 'border-border bg-surface-1 text-foreground hover:border-foreground/40'
      }`}
    >
      {children}
    </button>
  )
}

function ScaleQuestion(props: {
  title: string
  value: number | null
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label uppercase text-muted-foreground">{props.title}</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <OptionButton
            key={value}
            active={props.value === value}
            onClick={() => props.onChange(value)}
          >
            <span className="font-mono tabular-nums">{value}</span>
          </OptionButton>
        ))}
      </div>
    </div>
  )
}

function BooleanQuestion(props: {
  title: string
  value: boolean | null
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label uppercase text-muted-foreground">{props.title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { value: true, label: 'Tak' },
          { value: false, label: 'Nie' },
        ].map((option) => (
          <OptionButton
            key={String(option.value)}
            active={props.value === option.value}
            onClick={() => props.onChange(option.value)}
          >
            {option.label}
          </OptionButton>
        ))}
      </div>
    </div>
  )
}

function TextQuestion(props: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label uppercase text-muted-foreground" htmlFor={props.id}>
        {props.label}
      </label>
      <Textarea
        id={props.id}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder={props.placeholder}
        className="resize-none"
      />
    </div>
  )
}
