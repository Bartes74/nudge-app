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
import { useGeneratePlan } from '@/hooks/useGeneratePlan'

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
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          Ukończ onboarding, żeby dostać swój pierwszy spokojny plan.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push('/onboarding')}>
          Wróć do onboardingu
        </Button>
      </div>
    )
  }

  if (status === 'blocked') {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">Nie możemy jeszcze wygenerować planu</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Wykryliśmy kwestie bezpieczeństwa: {blockedReasons?.join(', ')}.
        </p>
      </div>
    )
  }

  if (!plan?.current_version) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium">Nie masz jeszcze planu</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Przygotujemy dla Ciebie pierwszy krok i pokażemy, co robić dzisiaj.
          </p>
        </div>
        <Button onClick={generate} disabled={status === 'generating'} className="w-full max-w-xs">
          {status === 'generating' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Przygotowuję plan…
            </>
          ) : (
            'Przygotuj mój plan'
          )}
        </Button>
      </div>
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
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Dziś spokojniejszy dzień
          </div>
          <p className="mt-3 text-lg font-semibold">Twoim zadaniem jest po prostu wrócić do rytmu.</p>
          <p className="mt-2 text-sm text-muted-foreground">{recommendationForPhase(adaptationPhase)}</p>
          {nextWorkout && (
            <button
              className="mt-4 flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors hover:bg-muted/40"
              onClick={() => router.push(`/app/plan/workout/${nextWorkout.id}`)}
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Najbliższy trening</p>
                <p className="mt-1 font-medium">{nextWorkout.name}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )
    }

    const currentStep = [...(todayWorkout.steps ?? [])].sort((left, right) => left.order_num - right.order_num)[0]

    return (
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Dzisiejszy krok</p>
            <h2 className="mt-1 text-xl font-semibold">{todayWorkout.name}</h2>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {todayWorkout.duration_min_estimated} min
          </Badge>
        </div>

        {todayWorkout.confidence_goal && (
          <div className="mt-4 rounded-xl bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cel tej sesji</p>
            <p className="mt-1 text-sm font-medium">{todayWorkout.confidence_goal}</p>
          </div>
        )}

        {currentStep && (
          <div className="mt-4 rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Co robimy teraz</p>
            <p className="mt-1 text-lg font-semibold">{currentStep.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{currentStep.instruction_text}</p>
            {currentStep.duration_min != null && (
              <p className="mt-3 text-sm">
                <span className="font-medium">Ile to trwa:</span> około {currentStep.duration_min} min
              </p>
            )}
            {currentStep.setup_instructions && (
              <p className="mt-2 text-sm">
                <span className="font-medium">Jak się ustawić:</span> {currentStep.setup_instructions}
              </p>
            )}
            {currentStep.tempo_hint && (
              <p className="mt-2 text-sm">
                <span className="font-medium">Tempo:</span> {currentStep.tempo_hint}
              </p>
            )}
            {currentStep.machine_settings && (
              <p className="mt-2 text-sm">
                <span className="font-medium">Sprzęt:</span> {currentStep.machine_settings}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ostatni ukończony trening</p>
            <p className="mt-1 text-sm font-medium">{lastCompletedWorkoutName ?? 'Jeszcze przed Tobą'}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Najważniejsza rekomendacja</p>
            <p className="mt-1 text-sm font-medium">{recommendationForPhase(adaptationPhase)}</p>
          </div>
        </div>

        {nextWorkout && (
          <div className="mt-4 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Najbliższy trening</p>
                <p className="mt-1 text-sm font-medium">{nextWorkout.name}</p>
              </div>
            </div>
          </div>
        )}

        <Button className="mt-4 w-full" onClick={() => router.push(`/app/plan/workout/${todayWorkout.id}`)}>
          Otwórz dzisiejszy spokojny trening
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (!todayWorkout) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm font-medium text-muted-foreground">Dziś masz dzień odpoczynku.</p>
        {nextWorkout && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Następny trening:</p>
            <button
              className="mt-1 flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
              onClick={() => router.push(`/app/plan/workout/${nextWorkout.id}`)}
            >
              <span className="font-medium text-sm">{nextWorkout.name}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dzisiejszy trening</p>
          <h2 className="mt-1 text-xl font-semibold">{todayWorkout.name}</h2>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {todayWorkout.duration_min_estimated} min
        </Badge>
      </div>

      <ul className="mt-4 space-y-2">
        {todayWorkout.exercises.slice(0, 4).map((exercise) => (
          <li key={exercise.id} className="flex items-center justify-between text-sm">
            <span className="font-medium">{exercise.exercise?.name_pl ?? '—'}</span>
            <span className="text-muted-foreground">
              {exercise.sets} × {exercise.reps_min}–{exercise.reps_max}
            </span>
          </li>
        ))}
        {todayWorkout.exercises.length > 4 && (
          <li className="text-xs text-muted-foreground">+{todayWorkout.exercises.length - 4} więcej…</li>
        )}
      </ul>

      <Button className="mt-4 w-full" onClick={() => router.push(`/app/plan/workout/${todayWorkout.id}`)}>
        Zacznij trening
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  )
}
