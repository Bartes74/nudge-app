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
import { DAY_LABELS, DAY_ORDER, workoutDisplayDuration } from '@/lib/training/weekPlan'

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

type WeekDayLabel = (typeof DAY_ORDER)[number]

function recommendationForPhase(adaptationPhase: string | null): string {
  if (adaptationPhase === 'phase_0_familiarization') {
    return 'Otwórz plan treningu i zobacz po kolei, co będziesz dziś robić.'
  }
  if (adaptationPhase === 'phase_1_adaptation') {
    return 'Sprawdź plan przed startem i skup się na spokojnym wykonaniu pierwszych ćwiczeń.'
  }
  if (adaptationPhase === 'phase_2_foundations') {
    return 'Otwórz plan, wykonaj trening bez pośpiechu i trzymaj się prostych wskazówek.'
  }
  return 'Otwórz plan i przejdź przez dzisiejszy trening krok po kroku.'
}

function sessionGoalForPhase(adaptationPhase: string | null): string {
  if (adaptationPhase === 'phase_0_familiarization') {
    return 'Dziś celem jest spokojnie zapoznać się z planem treningu i bez pośpiechu zrobić pierwszy krok.'
  }
  if (adaptationPhase === 'phase_1_adaptation') {
    return 'Dziś celem jest spokojnie wejść w rytm treningu i dokładnie wykonać najważniejsze ćwiczenia.'
  }
  if (adaptationPhase === 'phase_2_foundations') {
    return 'Dziś celem jest zrobić pełny trening zgodnie z planem i utrzymać regularność.'
  }
  return 'Dziś celem jest zrobić zaplanowany trening spokojnie i bez zgadywania.'
}

function recoveryRecommendationForPhase(adaptationPhase: string | null): string {
  if (adaptationPhase === 'phase_0_familiarization') {
    return 'Dziś wystarczy lekki spacer, chwila odpoczynku i przygotowanie się do kolejnego treningu.'
  }
  if (adaptationPhase === 'phase_1_adaptation') {
    return 'To dobry moment na regenerację: trochę lekkiego ruchu, więcej snu i spokojny dzień bez presji.'
  }
  if (adaptationPhase === 'phase_2_foundations') {
    return 'Dziś postaw na odpoczynek albo lekki ruch. Nie musisz niczego nadrabiać.'
  }
  return 'Regeneracja też jest częścią planu. Odpocznij albo wybierz lekki spacer.'
}

function asWeekDayLabel(value: string): WeekDayLabel | null {
  return DAY_ORDER.includes(value as WeekDayLabel) ? (value as WeekDayLabel) : null
}

function nextWorkoutDayLabel(todayDayLabel: string, nextWorkout: Workout | null): string | null {
  if (!nextWorkout) return null

  const today = asWeekDayLabel(todayDayLabel)
  const nextDay = asWeekDayLabel(nextWorkout.day_label)

  if (!today || !nextDay) return null

  const todayIndex = DAY_ORDER.indexOf(today)
  const nextIndex = DAY_ORDER.indexOf(nextDay)
  const distance = (nextIndex - todayIndex + 7) % 7

  if (distance === 0) return 'W przyszłym tygodniu'
  if (distance === 1) return 'Jutro'
  return DAY_LABELS[nextDay]
}

function findNextWorkout(workouts: Workout[], todayDayLabel: string): Workout | null {
  if (workouts.length === 0) return null

  const orderedWorkouts = [...workouts].sort((left, right) => left.order_in_week - right.order_in_week)
  const today = asWeekDayLabel(todayDayLabel)

  if (!today) return orderedWorkouts[0] ?? null

  const todayIndex = DAY_ORDER.indexOf(today)

  for (let offset = 1; offset <= 7; offset += 1) {
    const candidateDay = DAY_ORDER[(todayIndex + offset) % DAY_ORDER.length]
    const workout = orderedWorkouts.find((entry) => entry.day_label === candidateDay)
    if (workout) return workout
  }

  return orderedWorkouts[0] ?? null
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

function RestDayCard({
  title,
  description,
  nextWorkout,
  nextWorkoutLabel,
  lastCompletedWorkoutName,
  onOpenNextWorkout,
  onOpenPlan,
}: {
  title: string
  description: string
  nextWorkout: Workout | null
  nextWorkoutLabel: string | null
  lastCompletedWorkoutName: string | null
  onOpenNextWorkout: () => void
  onOpenPlan: () => void
}) {
  return (
    <Card variant="default" padding="lg">
      <div className="flex flex-col gap-2">
        <CardEyebrow>Dziś bez treningu</CardEyebrow>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-body-m">{description}</CardDescription>
      </div>

      <div className="mt-5 grid gap-3">
        <Card variant="recessed" padding="md">
          <p className="text-label uppercase text-muted-foreground">Ostatni ukończony trening</p>
          <p className="mt-1.5 text-body-m font-medium">
            {lastCompletedWorkoutName ?? 'Jeszcze przed Tobą'}
          </p>
        </Card>
      </div>

      {nextWorkout && (
        <button
          className="mt-4 flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:border-foreground/30 hover:bg-surface-2"
          onClick={onOpenNextWorkout}
        >
          <div className="flex flex-col gap-1">
            <p className="text-label uppercase text-muted-foreground">
              {nextWorkoutLabel ? `Najbliższy trening · ${nextWorkoutLabel}` : 'Najbliższy trening'}
            </p>
            <p className="text-body-m font-medium">{nextWorkout.name}</p>
            <p className="text-body-s text-muted-foreground">
              Około {workoutDisplayDuration(nextWorkout)} min
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <Button
        size="hero"
        variant={nextWorkout ? 'outline' : 'default'}
        className="mt-6 w-full"
        onClick={onOpenPlan}
      >
        Otwórz plan tygodnia
        <ChevronRight className="h-4 w-4" />
      </Button>
    </Card>
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
  const nextWorkout = findNextWorkout(version.workouts, todayDayLabel)
  const nextWorkoutLabel = nextWorkoutDayLabel(todayDayLabel, nextWorkout)

  if (version.view_mode === 'guided_beginner_view' || entryPath === 'guided_beginner') {
    if (!todayWorkout) {
      return (
        <RestDayCard
          title="Dzień regeneracji i oswajania rytmu."
          description={`Dziś nie masz zaplanowanej sesji. ${recoveryRecommendationForPhase(adaptationPhase)}`}
          nextWorkout={nextWorkout}
          nextWorkoutLabel={nextWorkoutLabel}
          lastCompletedWorkoutName={lastCompletedWorkoutName}
          onOpenNextWorkout={() => nextWorkout && router.push(`/app/plan/workout/${nextWorkout.id}`)}
          onOpenPlan={() => router.push('/app/plan')}
        />
      )
    }

    return (
      <Card variant="hero" padding="lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <CardEyebrow>Dziś trenujesz</CardEyebrow>
            </div>
            <CardTitle>{todayWorkout.name}</CardTitle>
            <CardDescription className="text-body-m">
              Masz dziś zaplanowany trening. Otwórz go i skup się na tym, co masz zrobić krok po kroku.
            </CardDescription>
          </div>
          <DurationChip minutes={guidedWorkoutDuration(todayWorkout)} />
        </div>

        {(todayWorkout.confidence_goal || adaptationPhase) && (
          <div className="mt-6 rounded-lg bg-surface-2 p-5">
            <p className="text-label uppercase text-muted-foreground">Cel na dziś</p>
            <p className="mt-2 text-body-l text-foreground text-balance">
              {sessionGoalForPhase(adaptationPhase)}
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card variant="recessed" padding="md">
            <p className="text-label uppercase text-muted-foreground">Ostatni ukończony trening</p>
            <p className="mt-1.5 text-body-m font-medium">
              {lastCompletedWorkoutName ?? 'Jeszcze przed Tobą'}
            </p>
          </Card>
          <Card variant="recessed" padding="md">
            <p className="text-label uppercase text-muted-foreground">Najważniejsze dziś</p>
            <p className="mt-1.5 text-body-m font-medium text-balance">
              {recommendationForPhase(adaptationPhase)}
            </p>
          </Card>
        </div>

        {nextWorkout && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-border p-4">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-label uppercase text-muted-foreground">
                {nextWorkoutLabel ? `Potem · ${nextWorkoutLabel}` : 'Potem'}
              </p>
              <p className="mt-1 text-body-m font-medium">{nextWorkout.name}</p>
            </div>
          </div>
        )}

        <Button
          size="hero"
          className="mt-6 w-full"
          onClick={() => router.push(`/app/plan/workout/${todayWorkout.id}`)}
        >
          Otwórz dzisiejszy trening
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>
    )
  }

  if (!todayWorkout) {
    return (
      <RestDayCard
        title="Dzień regeneracji."
        description="Dzisiaj plan nie przewiduje treningu. To normalna część tygodnia i dobry moment na odpoczynek, sen i lekki ruch."
        nextWorkout={nextWorkout}
        nextWorkoutLabel={nextWorkoutLabel}
        lastCompletedWorkoutName={lastCompletedWorkoutName}
        onOpenNextWorkout={() => nextWorkout && router.push(`/app/plan/workout/${nextWorkout.id}`)}
        onOpenPlan={() => router.push('/app/plan')}
      />
    )
  }

  return (
    <Card variant="hero" padding="lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <CardEyebrow>Dziś trenujesz</CardEyebrow>
          <CardTitle>{todayWorkout.name}</CardTitle>
          <CardDescription className="text-body-m">
            To jest dzień treningowy. Otwórz sesję, żeby zobaczyć ćwiczenia i przejść przez plan bez zgadywania.
          </CardDescription>
        </div>
        <DurationChip minutes={workoutDisplayDuration(todayWorkout)} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Card variant="recessed" padding="md">
          <p className="text-label uppercase text-muted-foreground">Dziś</p>
          <p className="mt-1.5 text-body-m font-medium text-balance">
            Najpierw uruchom trening, a potem skup się na pierwszym ćwiczeniu z listy.
          </p>
        </Card>
        <Card variant="recessed" padding="md">
          <p className="text-label uppercase text-muted-foreground">Ostatni ukończony trening</p>
          <p className="mt-1.5 text-body-m font-medium">
            {lastCompletedWorkoutName ?? 'Jeszcze przed Tobą'}
          </p>
        </Card>
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
        Otwórz dzisiejszy trening
        <ChevronRight className="h-4 w-4" />
      </Button>
    </Card>
  )
}
