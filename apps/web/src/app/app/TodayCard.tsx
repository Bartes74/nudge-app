'use client'

import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardEyebrow,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { useGeneratePlan } from '@/hooks/useGeneratePlan'
import { workoutDisplayDuration } from '@/lib/training/weekPlan'

interface Exercise {
  id: string
  order_num: number
  sets: number
  reps_min: number
  reps_max: number
  exercise: { id: string; slug: string; name_pl: string; category: string } | null
}

interface GuidedStep {
  id: string
  step_type: string
  order_num: number
  title: string
  duration_min: number | null
  instruction_text: string
  setup_instructions: string | null
  tempo_hint: string | null
  breathing_hint: string | null
  machine_settings: string | null
}

interface Workout {
  id: string
  day_label: string
  order_in_week: number
  name: string
  duration_min_estimated: number
  confidence_goal?: string | null
  steps?: GuidedStep[]
  exercises: Exercise[]
}

interface PlanVersion {
  id: string
  guided_mode?: boolean | null
  adaptation_phase?: string | null
  view_mode?: 'guided_beginner_view' | 'standard_training_view' | null
  week_structure: Record<string, string>
  workouts: Workout[]
}

interface Plan {
  id: string
  current_version: PlanVersion | null
}

interface TodayCardProps {
  plan: Plan | null
  todayDayLabel: string
  onboardingDone: boolean
  entryPath: string | null
  adaptationPhase: string | null
  lastCompletedWorkoutName: string | null
}

function recommendationForPhase(adaptationPhase: string | null): string {
  if (adaptationPhase === 'phase_0_familiarization') {
    return 'Najważniejsze dziś: spokojnie przejść przez kolejne kroki i oswoić miejsce.'
  }
  if (adaptationPhase === 'phase_1_adaptation') {
    return 'Najważniejsze dziś: zrozumieć 1-2 proste ruchy i skończyć trening bez pośpiechu.'
  }
  if (adaptationPhase === 'phase_2_foundations') {
    return 'Najważniejsze dziś: utrzymać regularność i budować podstawy bez presji na wynik.'
  }
  return 'Najważniejsze dziś: zrób realny krok, nie idealny.'
}

function guidedWorkoutDuration(workout: Workout): number {
  return workoutDisplayDuration(workout)
}

function DurationChip({ minutes }: { minutes: number }) {
  return (
    <Badge variant="outline-warm" className="gap-1.5 px-3 py-1 text-body-s tabular-nums">
      <Clock className="h-3.5 w-3.5" />
      {minutes} min
    </Badge>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border/60 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-label uppercase text-muted-foreground">{label}</span>
      <span className="text-body-m text-foreground">{value}</span>
    </div>
  )
}

export function TodayCard({
  plan,
  todayDayLabel,
  onboardingDone,
  entryPath,
  adaptationPhase,
  lastCompletedWorkoutName,
}: TodayCardProps) {
  const router = useRouter()
  const { status, generate, blockedReasons } = useGeneratePlan(() => router.refresh())

  if (!onboardingDone) {
    return (
      <Card variant="hero" padding="xl" className="text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-label uppercase text-muted-foreground">Pierwszy krok</p>
            <p className="text-display-m font-display text-balance">
              Ukończ onboarding żeby dostać swój pierwszy plan treningowy.
            </p>
          </div>
          <Button variant="default" size="hero" onClick={() => router.push('/onboarding')}>
            Wróć do onboardingu
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  if (status === 'blocked') {
    return (
      <Card variant="destructive" padding="lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1.5">
            <p className="text-label uppercase text-destructive">Wstrzymane</p>
            <p className="text-body-l font-medium text-foreground">
              Nie możemy jeszcze wygenerować planu
            </p>
            <p className="text-body-m text-muted-foreground">
              Wykryliśmy kwestie bezpieczeństwa: {blockedReasons?.join(', ')}.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (!plan?.current_version) {
    return (
      <Card variant="hero" padding="xl" className="text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-5">
          <p className="text-label uppercase text-muted-foreground">Twój plan</p>
          <p className="text-display-m font-display text-balance">
            Przygotuj swój pierwszy krok.
          </p>
          <p className="text-body-m text-muted-foreground">
            Zajmie mi to kilka sekund. Dopasujemy tempo do tego, co powiedziałeś w onboardingu.
          </p>
          <Button
            variant="default"
            size="hero"
            onClick={generate}
            disabled={status === 'generating'}
            className="w-full max-w-xs"
          >
            {status === 'generating' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Przygotowuję plan…
              </>
            ) : (
              <>
                Przygotuj mój plan
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    )
  }

  const version = plan.current_version
  const todayWorkout = version.workouts.find((workout) => workout.day_label === todayDayLabel)
  const nextWorkout =
    version.workouts
      .sort((left, right) => left.order_in_week - right.order_in_week)
      .find((workout) => workout.day_label !== todayDayLabel) ?? version.workouts[0]

  if (version.view_mode === 'guided_beginner_view' || entryPath === 'guided_beginner') {
    if (!todayWorkout) {
      return (
        <Card variant="default" padding="lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-label uppercase">Dzień spokoju</span>
          </div>
          <p className="mt-4 text-display-m font-display text-balance">
            Twoim zadaniem jest po prostu wrócić do rytmu.
          </p>
          <p className="mt-3 text-body-m text-muted-foreground">
            {recommendationForPhase(adaptationPhase)}
          </p>
          {nextWorkout && (
            <button
              className="mt-5 flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:border-foreground/30 hover:bg-surface-2"
              onClick={() => router.push(`/app/plan/workout/${nextWorkout.id}`)}
            >
              <div>
                <p className="text-label uppercase text-muted-foreground">Najbliższy trening</p>
                <p className="mt-1 text-body-m font-medium">{nextWorkout.name}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </Card>
      )
    }

    const currentStep = [...(todayWorkout.steps ?? [])].sort(
      (left, right) => left.order_num - right.order_num,
    )[0]

    return (
      <Card variant="hero" padding="lg" className="animate-stagger">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <CardEyebrow>Dzisiejszy krok</CardEyebrow>
            <CardTitle>{todayWorkout.name}</CardTitle>
          </div>
          <DurationChip minutes={guidedWorkoutDuration(todayWorkout)} />
        </div>

        {todayWorkout.confidence_goal && (
          <div className="mt-6 rounded-lg bg-surface-2 p-5">
            <p className="text-label uppercase text-muted-foreground">Cel sesji</p>
            <p className="mt-2 text-body-l font-display italic text-foreground text-balance">
              „{todayWorkout.confidence_goal}”
            </p>
          </div>
        )}

        {currentStep && (
          <Card variant="default" padding="lg" className="mt-4">
            <CardEyebrow>Co robimy teraz</CardEyebrow>
            <p className="mt-2 text-display-m font-display text-balance">{currentStep.title}</p>
            <CardDescription className="mt-3 text-body-l">
              {currentStep.instruction_text}
            </CardDescription>

            <div className="mt-5 flex flex-col">
              {currentStep.duration_min != null && (
                <MetaRow label="Czas" value={`około ${currentStep.duration_min} min`} />
              )}
              {currentStep.setup_instructions && (
                <MetaRow label="Jak się ustawić" value={currentStep.setup_instructions} />
              )}
              {currentStep.tempo_hint && (
                <MetaRow label="Tempo" value={currentStep.tempo_hint} />
              )}
              {currentStep.machine_settings && (
                <MetaRow label="Sprzęt" value={currentStep.machine_settings} />
              )}
            </div>
          </Card>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card variant="recessed" padding="md">
            <p className="text-label uppercase text-muted-foreground">Ostatni ukończony trening</p>
            <p className="mt-1.5 text-body-m font-medium">
              {lastCompletedWorkoutName ?? 'Jeszcze przed Tobą'}
            </p>
          </Card>
          <Card variant="recessed" padding="md">
            <p className="text-label uppercase text-muted-foreground">Rekomendacja</p>
            <p className="mt-1.5 text-body-m font-medium text-balance">
              {recommendationForPhase(adaptationPhase)}
            </p>
          </Card>
        </div>

        {nextWorkout && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-border p-4">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-label uppercase text-muted-foreground">Najbliższy trening</p>
              <p className="mt-1 text-body-m font-medium">{nextWorkout.name}</p>
            </div>
          </div>
        )}

        <Button
          size="hero"
          className="mt-6 w-full"
          onClick={() => router.push(`/app/plan/workout/${todayWorkout.id}`)}
        >
          Otwórz dzisiejszy spokojny trening
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>
    )
  }

  if (!todayWorkout) {
    return (
      <Card variant="default" padding="lg">
        <p className="text-label uppercase text-muted-foreground">Dziś</p>
        <p className="mt-2 text-display-m font-display text-balance">Dzień odpoczynku.</p>
        {nextWorkout && (
          <button
            className="mt-4 flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:border-foreground/30 hover:bg-surface-2"
            onClick={() => router.push(`/app/plan/workout/${nextWorkout.id}`)}
          >
            <div>
              <p className="text-label uppercase text-muted-foreground">Następny trening</p>
              <p className="mt-1 text-body-m font-medium">{nextWorkout.name}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </Card>
    )
  }

  return (
    <Card variant="hero" padding="lg" className="animate-stagger">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <CardEyebrow>Dzisiejszy trening</CardEyebrow>
          <CardTitle>{todayWorkout.name}</CardTitle>
        </div>
        <DurationChip minutes={todayWorkout.duration_min_estimated} />
      </div>

      <ul className="mt-6 flex flex-col">
        {todayWorkout.exercises.slice(0, 4).map((exercise) => (
          <li
            key={exercise.id}
            className="flex items-baseline justify-between gap-3 border-t border-border/60 py-3 first:border-t-0"
          >
            <span className="text-body-m font-medium text-foreground">
              {exercise.exercise?.name_pl ?? '—'}
            </span>
            <span className="font-mono text-body-s tabular-nums text-muted-foreground">
              {exercise.sets} × {exercise.reps_min}–{exercise.reps_max}
            </span>
          </li>
        ))}
        {todayWorkout.exercises.length > 4 && (
          <li className="border-t border-border/60 py-3 text-body-s text-muted-foreground">
            +{todayWorkout.exercises.length - 4} więcej…
          </li>
        )}
      </ul>

      <Button
        size="hero"
        className="mt-6 w-full"
        onClick={() => router.push(`/app/plan/workout/${todayWorkout.id}`)}
      >
        Zacznij trening
        <ChevronRight className="h-4 w-4" />
      </Button>
    </Card>
  )
}
