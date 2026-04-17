'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

const SESSION_KEY_PREFIX = 'guided_workout_state_'

type TempoFeedback = 'too_light' | 'just_right' | 'too_hard'

export default function FinishWorkoutPage({
  params,
}: {
  params: Promise<{ workoutLogId: string }>
}) {
  const { workoutLogId } = use(params)
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
      <div className="flex min-h-[100dvh] flex-col p-6">
        <h1 className="text-2xl font-bold">Krótki check-in po treningu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chcemy wiedzieć, czy wszystko było jasne, spokojne i bezpieczne.
        </p>

        <div className="mt-8 space-y-6">
          <ScaleQuestion
            title="Czy wiedziałeś/aś, co robić?"
            value={clarityScore}
            onChange={setClarityScore}
          />

          <ScaleQuestion
            title="Na ile pewnie czułeś/aś się w czasie treningu?"
            value={confidenceScore}
            onChange={setConfidenceScore}
          />

          <BooleanQuestion
            title="Czy trening czuł się bezpiecznie?"
            value={feltSafe}
            onChange={setFeltSafe}
          />

          <div>
            <p className="mb-3 text-sm font-semibold">Jakie było tempo?</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: 'too_light', label: 'Za lekkie' },
                { value: 'just_right', label: 'W sam raz' },
                { value: 'too_hard', label: 'Za mocne' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTempoFeedback(option.value as TempoFeedback)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                    tempoFeedback === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <BooleanQuestion
            title="Czy coś bolało?"
            value={painFlag}
            onChange={setPainFlag}
          />

          {painFlag && (
            <div>
              <p className="mb-3 text-sm font-semibold">Czy pojawił się któryś z tych sygnałów ostrzegawczych?</p>
              <div className="space-y-2">
                {([
                  ['chest_pain', 'Ból w klatce piersiowej'],
                  ['dizziness', 'Zawroty głowy'],
                  ['unusual_shortness_of_breath', 'Nietypowa duszność'],
                  ['radiating_pain', 'Promieniujący ból'],
                  ['sharp_joint_pain', 'Ostry ból stawu'],
                ] as const).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-3 rounded-xl border p-4 text-sm">
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
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <BooleanQuestion
            title="Czy czujesz się gotowy/a wrócić na kolejny trening?"
            value={readyForNextWorkout}
            onChange={setReadyForNextWorkout}
          />
        </div>

        <div className="mt-auto pt-8">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSubmit()}
            className="w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground active:bg-primary/90 disabled:opacity-60"
          >
            {loading ? 'Zapisuję...' : 'Zapisz podsumowanie'}
          </button>
        </div>
      </div>
    )
  }

  const displayRating = hovered || rating

  return (
    <div className="flex min-h-[100dvh] flex-col p-6">
      <h1 className="text-2xl font-bold">Jak był trening?</h1>
      <p className="mt-1 text-sm text-muted-foreground">Podsumuj sesję — to pomoże nam ulepszyć Twój plan</p>

      <div className="mt-8 flex justify-center gap-3">
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
              className={`h-10 w-10 transition-colors ${
                displayRating >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {rating === 1 && 'Ciężki dzień — dobra robota, że wyszedłeś'}
          {rating === 2 && 'Poniżej oczekiwań, ale byłeś'}
          {rating === 3 && 'Solidny trening'}
          {rating === 4 && 'Dobry trening!'}
          {rating === 5 && 'Fenomenalne!'}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4">
        <TextQuestion
          id="went-well"
          label="Co poszło dobrze?"
          value={wentWell}
          onChange={setWentWell}
          placeholder="np. dobra forma na przysiadach, nowy rekord..."
        />
        <TextQuestion
          id="went-poorly"
          label="Co poszło słabo?"
          value={wentPoorly}
          onChange={setWentPoorly}
          placeholder="np. brak energii, za mało czasu..."
        />
        <TextQuestion
          id="what-to-improve"
          label="Co poprawię?"
          value={whatToImprove}
          onChange={setWhatToImprove}
          placeholder="np. więcej snu przed treningiem, więcej wody..."
        />
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={loading || rating === 0}
          onClick={() => void handleSubmit()}
          className="w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground active:bg-primary/90 disabled:opacity-60"
        >
          {loading ? 'Zapisuję...' : 'Zakończ trening'}
        </button>
      </div>
    </div>
  )
}

function ScaleQuestion(props: {
  title: string
  value: number | null
  onChange: (value: number) => void
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{props.title}</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => props.onChange(value)}
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              props.value === value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background'
            }`}
          >
            {value}
          </button>
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
    <div>
      <p className="mb-3 text-sm font-semibold">{props.title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { value: true, label: 'Tak' },
          { value: false, label: 'Nie' },
        ].map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => props.onChange(option.value)}
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              props.value === option.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background'
            }`}
          >
            {option.label}
          </button>
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
    <div>
      <label className="mb-1.5 block text-sm font-semibold" htmlFor={props.id}>
        {props.label}
      </label>
      <textarea
        id={props.id}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder={props.placeholder}
        className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
