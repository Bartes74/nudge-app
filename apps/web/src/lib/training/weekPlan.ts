export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export type DayLabel = (typeof DAY_ORDER)[number]

export const DAY_LABELS: Record<DayLabel, string> = {
  mon: 'Poniedziałek',
  tue: 'Wtorek',
  wed: 'Środa',
  thu: 'Czwartek',
  fri: 'Piątek',
  sat: 'Sobota',
  sun: 'Niedziela',
}

export const DAY_SHORT: Record<DayLabel, string> = {
  mon: 'Pon',
  tue: 'Wt',
  wed: 'Śr',
  thu: 'Czw',
  fri: 'Pt',
  sat: 'Sb',
  sun: 'Nd',
}

type GuidedStepLike = {
  step_type: string
  duration_min: number | null
}

type ExerciseLike = {
  id: string
}

type WorkoutLike = {
  order_in_week: number
  duration_min_estimated: number
  steps?: GuidedStepLike[] | null
  exercises?: ExerciseLike[] | null
}

type ProgressionRulesLike = {
  method: string
  add_weight_kg: number
  when: string
} | null

type WeekAssignmentLike = {
  workoutId: string | null
}

export function isDayLabel(value: string): value is DayLabel {
  return DAY_ORDER.includes(value as DayLabel)
}

export function normalizeGuidedSteps<T extends { step_type: string }>(
  steps: T[] | null | undefined,
  workoutOrderInWeek: number,
): T[] {
  const safeSteps = steps ?? []
  if (workoutOrderInWeek <= 1) return safeSteps
  return safeSteps.filter((step) => step.step_type !== 'arrival_prep')
}

export function workoutDisplayCount(workout: WorkoutLike): {
  count: number
  label: string
} {
  const guidedSteps = normalizeGuidedSteps(workout.steps, workout.order_in_week)

  if (guidedSteps.length > 0) {
    return {
      count: guidedSteps.length,
      label: guidedSteps.length === 1 ? 'krok' : guidedSteps.length < 5 ? 'kroki' : 'kroków',
    }
  }

  const exerciseCount = workout.exercises?.length ?? 0
  return {
    count: exerciseCount,
    label: exerciseCount === 1 ? 'ćwiczenie' : exerciseCount < 5 ? 'ćwiczenia' : 'ćwiczeń',
  }
}

export function workoutDisplayDuration(workout: WorkoutLike): number {
  const guidedSteps = normalizeGuidedSteps(workout.steps, workout.order_in_week)
  const guidedDuration = guidedSteps.reduce((sum, step) => sum + (step.duration_min ?? 0), 0)
  return guidedDuration > 0 ? guidedDuration : workout.duration_min_estimated
}

function prettifyProgressionMethod(method: string): string {
  return method
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function progressionCopy(rules: ProgressionRulesLike): {
  title: string
  body: string
  meta: string | null
} | null {
  if (!rules) return null

  if (rules.method === 'quality_gated_guided_progression') {
    return {
      title: 'Spokojna progresja',
      body: 'Na początku nie dokładamy ciężaru. Najpierw liczy się jasność kroków, poczucie bezpieczeństwa i regularność.',
      meta: null,
    }
  }

  const addWeight =
    rules.add_weight_kg > 0 ? `+${rules.add_weight_kg} kg, gdy plan staje się za lekki.` : null

  return {
    title: prettifyProgressionMethod(rules.method),
    body: rules.when,
    meta: addWeight,
  }
}

export function guidedWeekExplanation(adaptationPhase: string | null): string {
  if (adaptationPhase === 'phase_1_adaptation') {
    return 'Na tym etapie część sesji nadal jest podobna celowo. Dzięki temu utrwalasz spokojny rytm, a dokładamy tylko tyle nowości, ile naprawdę pomoże Ci wejść w regularność.'
  }

  if (adaptationPhase === 'phase_2_foundations') {
    return 'Plan nadal prowadzi Cię spokojnie, ale pojawia się już więcej samodzielności. Jeśli sesje wyglądają podobnie, to dlatego, że budujemy powtarzalny rytm zamiast co tydzień zmieniać wszystko od nowa.'
  }

  return 'Na początku część sesji wygląda podobnie celowo. Dzięki temu oswajasz miejsce, tempo i prostą kolejność kroków. Osobne przygotowanie do wejścia na siłownię pojawia się tylko w pierwszym treningu tygodnia.'
}

export function longestTrainingStreak(assignments: WeekAssignmentLike[]): number {
  let current = 0
  let longest = 0

  for (const assignment of assignments) {
    if (assignment.workoutId) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }

  return longest
}

export function trainingStreakWarning(assignments: WeekAssignmentLike[]): string | null {
  const longest = longestTrainingStreak(assignments)

  if (longest < 3) return null

  return 'Masz tu co najmniej 3 treningi pod rząd. Dla regeneracji lepiej zostawić między nimi dzień lżejszy albo wolny.'
}
