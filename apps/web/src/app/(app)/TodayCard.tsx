'use client'

import { useRouter } from 'next/navigation'
import { CalendarDays, Dumbbell, Clock, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react'
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

interface Workout {
  id: string
  day_label: string
  order_in_week: number
  name: string
  duration_min_estimated: number
  exercises: Exercise[]
}

interface PlanVersion {
  id: string
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
}

export function TodayCard({ plan, todayDayLabel, onboardingDone }: TodayCardProps) {
  const router = useRouter()
  const { status, generate, blockedReasons } = useGeneratePlan(() => router.refresh())

  if (!onboardingDone) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          Ukończ onboarding, żeby dostać swój plan treningowy.
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
          <p className="font-medium text-sm">Nie możemy wygenerować planu</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Wykryto flagi bezpieczeństwa: {blockedReasons?.join(', ')}. Skonsultuj się ze specjalistą.
        </p>
      </div>
    )
  }

  if (!plan?.current_version) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
        <Dumbbell className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium">Nie masz jeszcze planu treningowego</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Wygenerujemy go dla Ciebie w mniej niż 30 sekund.
          </p>
        </div>
        <Button
          onClick={generate}
          disabled={status === 'generating'}
          className="w-full max-w-xs"
        >
          {status === 'generating' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generuję plan…
            </>
          ) : (
            'Wygeneruj mój plan'
          )}
        </Button>
        {status === 'failed' && (
          <p className="text-xs text-destructive">Coś poszło nie tak. Spróbuj ponownie.</p>
        )}
      </div>
    )
  }

  const version = plan.current_version
  const todayWorkout = version.workouts.find((w) => w.day_label === todayDayLabel)

  if (!todayWorkout) {
    const nextWorkout = version.workouts
      .sort((a, b) => a.order_in_week - b.order_in_week)
      .find((w) => {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        return days.indexOf(w.day_label) > days.indexOf(todayDayLabel)
      }) ?? version.workouts[0]

    return (
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm font-medium text-muted-foreground">Dziś masz dzień odpoczynku 🛋️</p>
        {nextWorkout && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Następny trening:</p>
            <button
              className="mt-1 flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
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
        {todayWorkout.exercises.slice(0, 4).map((ex) => (
          <li key={ex.id} className="flex items-center justify-between text-sm">
            <span className="font-medium">{ex.exercise?.name_pl ?? '—'}</span>
            <span className="text-muted-foreground">
              {ex.sets} × {ex.reps_min}–{ex.reps_max}
            </span>
          </li>
        ))}
        {todayWorkout.exercises.length > 4 && (
          <li className="text-xs text-muted-foreground">
            +{todayWorkout.exercises.length - 4} więcej…
          </li>
        )}
      </ul>

      <Button
        className="mt-4 w-full"
        onClick={() => router.push(`/app/plan/workout/${todayWorkout.id}`)}
      >
        Zacznij trening
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  )
}
