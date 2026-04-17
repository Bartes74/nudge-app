import type {
  ExerciseCatalogEntry,
  GuidedTrainingPlanOutput,
  GuidedWorkoutEntry,
  GuidedWorkoutStep,
  PlannerProfile,
} from './types'

const DEFAULT_STARTING_LOAD_GUIDANCE = [
  'Zacznij od najlżejszego ustawienia.',
  'Zrób próbę 6-8 spokojnych powtórzeń.',
  'Jeśli jest bardzo łatwo, zwiększ o 1 poziom.',
  'Jeśli technika się psuje, zmniejsz obciążenie.',
  'Zostań przy ciężarze, który jest wyraźnie odczuwalny, ale pozwala zachować poprawny ruch.',
].join(' ')

const PHASE_DAY_LABELS: Record<number, string[]> = {
  2: ['mon', 'thu'],
  3: ['mon', 'wed', 'fri'],
}

function guidedDaysPerWeek(daysPerWeek: number | null): number {
  if (daysPerWeek == null) return 2
  return Math.max(2, Math.min(daysPerWeek, 3))
}

function durationForPhase(phase: PlannerProfile['adaptation_phase']): number {
  if (phase === 'phase_0_familiarization') return 20
  if (phase === 'phase_1_adaptation') return 28
  return 32
}

function weekStructureForDays(daysPerWeek: number): Record<string, string> {
  const labels = PHASE_DAY_LABELS[daysPerWeek] ?? PHASE_DAY_LABELS[2]!
  return Object.fromEntries(labels.map((label, index) => [label, `session_${index + 1}`]))
}

function findExercise(
  catalog: ExerciseCatalogEntry[],
  predicates: Array<(exercise: ExerciseCatalogEntry) => boolean>,
): ExerciseCatalogEntry | null {
  return catalog.find((exercise) => predicates.every((predicate) => predicate(exercise))) ?? null
}

function buildCardioStep(orderNum: number, title: string): GuidedWorkoutStep {
  return {
    step_type: 'warmup',
    order_num: orderNum,
    title,
    duration_min: 15,
    exercise_slug: null,
    instruction_text: 'Zacznij spokojnie i trzymaj tempo, przy którym możesz swobodnie mówić pełnymi zdaniami.',
    setup_instructions: 'Ustaw maszynę na najprostszy tryb i sprawdź, gdzie zmienia się prędkość oraz stop.',
    execution_steps: [
      '5 minut: 4.5-5 km/h, nachylenie 0%',
      '5 minut: 5 km/h, nachylenie 3%',
      '5 minut: 4.5 km/h, nachylenie 0%',
    ],
    tempo_hint: 'Spokojne, równe tempo. Bez zadyszki.',
    breathing_hint: 'Oddychaj swobodnie. Jeśli trudno mówić, zwolnij.',
    safety_notes: 'Przerwij, jeśli pojawi się zawrót głowy, ból w klatce piersiowej albo ostry ból stawu.',
    common_mistakes: 'Zbyt szybki start i podkręcanie tempa już w pierwszych minutach.',
    easy_substitution_slug: null,
    machine_busy_substitution_slug: null,
    stop_conditions: ['zawroty głowy', 'ból w klatce piersiowej', 'nietypowa duszność'],
    starting_load_guidance: null,
    machine_settings: 'Prosty tryb ręczny, przycisk start i stop pod ręką.',
    is_new_skill: false,
  }
}

function buildArrivalStep(orderNum: number, equipmentLocation: PlannerProfile['equipment_location']): GuidedWorkoutStep {
  return {
    step_type: 'arrival_prep',
    order_num: orderNum,
    title: 'Wejście i przygotowanie',
    duration_min: 3,
    exercise_slug: null,
    instruction_text: equipmentLocation === 'gym'
      ? 'Wejdź spokojnie, odłóż rzeczy, napij się wody i podejdź do pierwszego stanowiska.'
      : 'Przygotuj miejsce do ruchu, wodę i jeden prosty sprzęt, jeśli go używasz.',
    setup_instructions: equipmentLocation === 'gym'
      ? 'Znajdź bieżnię, rower albo orbitrek. Nie musisz znać całej siłowni.'
      : 'Ustaw matę albo wolną przestrzeń i upewnij się, że nic Ci nie przeszkadza.',
    execution_steps: [
      'Sprawdź, co robimy jako pierwszy krok.',
      'Ustaw wodę i ręcznik w zasięgu ręki.',
      'Nie śpiesz się. To nie jest test sprawności.',
    ],
    tempo_hint: 'Spokojnie, bez pośpiechu.',
    breathing_hint: 'Kilka swobodnych oddechów przed startem.',
    safety_notes: 'Jeśli czujesz się źle już przed treningiem, odpuść i wróć do sesji innego dnia.',
    common_mistakes: 'Próba zrobienia wszystkiego za szybko i bez sprawdzenia kolejnych kroków.',
    easy_substitution_slug: null,
    machine_busy_substitution_slug: null,
    stop_conditions: ['złe samopoczucie przed startem'],
    starting_load_guidance: null,
    machine_settings: null,
    is_new_skill: false,
  }
}

function buildCooldownStep(orderNum: number): GuidedWorkoutStep {
  return {
    step_type: 'cooldown',
    order_num: orderNum,
    title: 'Wyciszenie',
    duration_min: 4,
    exercise_slug: null,
    instruction_text: 'Zwolnij tempo i daj organizmowi chwilę na spokojne wyjście z treningu.',
    setup_instructions: 'Zejdź z maszyny albo stań w spokojnym miejscu.',
    execution_steps: [
      '2 minuty spokojnego marszu albo bardzo lekkiego pedałowania.',
      '2 minuty prostych ruchów: krążenia barków, spokojne wyprosty bioder, oddech.',
    ],
    tempo_hint: 'Coraz spokojniej z każdą minutą.',
    breathing_hint: 'Dłuższy wydech niż wdech pomoże się uspokoić.',
    safety_notes: 'Jeśli po treningu pojawia się nietypowa duszność lub ból, zakończ i odpocznij.',
    common_mistakes: 'Kończenie treningu nagle bez chwili wyciszenia.',
    easy_substitution_slug: null,
    machine_busy_substitution_slug: null,
    stop_conditions: ['nietypowa duszność', 'ból w klatce piersiowej'],
    starting_load_guidance: null,
    machine_settings: null,
    is_new_skill: false,
  }
}

function buildSummaryStep(orderNum: number): GuidedWorkoutStep {
  return {
    step_type: 'post_workout_summary',
    order_num: orderNum,
    title: 'Krótkie podsumowanie',
    duration_min: 2,
    exercise_slug: null,
    instruction_text: 'Sprawdź po treningu, czy wszystko było jasne i czy czujesz się gotowy/a wrócić.',
    setup_instructions: 'Usiądź albo stań spokojnie i odpowiedz sobie na kilka prostych pytań.',
    execution_steps: [
      'Czy wiedziałeś/aś, co robić?',
      'Czy coś było niejasne?',
      'Czy coś bolało?',
      'Czy wrócisz spokojnie na kolejny trening?',
    ],
    tempo_hint: 'Bez pośpiechu.',
    breathing_hint: 'Kilka spokojnych oddechów.',
    safety_notes: 'Jeśli pojawił się ból lub nietypowe objawy, zaznacz to w check-inie.',
    common_mistakes: 'Pomijanie podsumowania i wracanie do planu bez sprawdzenia, jak się czułeś/aś.',
    easy_substitution_slug: null,
    machine_busy_substitution_slug: null,
    stop_conditions: ['ból po treningu'],
    starting_load_guidance: null,
    machine_settings: null,
    is_new_skill: false,
  }
}

function buildExerciseStep(
  orderNum: number,
  exercise: ExerciseCatalogEntry,
  stepType: GuidedWorkoutStep['step_type'],
  isNewSkill: boolean,
): GuidedWorkoutStep {
  return {
    step_type: stepType,
    order_num: orderNum,
    title: exercise.plain_language_name ?? exercise.name_pl,
    duration_min: 6,
    exercise_slug: exercise.slug,
    instruction_text:
      exercise.simple_goal_description ??
      `Zrób to ćwiczenie spokojnie i skup się na jednym dobrym ruchu na raz.`,
    setup_instructions:
      exercise.setup_instructions ??
      exercise.technique_notes ??
      'Ustaw sprzęt tak, żeby start był wygodny i stabilny.',
    execution_steps:
      exercise.execution_steps && exercise.execution_steps.length > 0
        ? exercise.execution_steps
        : [
            'Ustaw się spokojnie do pierwszego powtórzenia.',
            'Zrób 1 krótką próbę bez pośpiechu.',
            'Jeśli ruch jest jasny i wygodny, zrób właściwą serię.',
          ],
    tempo_hint: exercise.tempo_hint ?? 'Spokojnie, bez szarpania.',
    breathing_hint: exercise.breathing_hint ?? 'Nie wstrzymuj oddechu.',
    safety_notes:
      exercise.safety_notes ??
      'Przerwij i wybierz łatwiejszą wersję, jeśli ruch robi się niejasny albo bolesny.',
    common_mistakes: exercise.common_mistakes ?? null,
    easy_substitution_slug:
      exercise.easy_substitution_slugs?.[0] ?? exercise.alternatives_slugs[0] ?? null,
    machine_busy_substitution_slug:
      exercise.machine_busy_substitution_slugs?.[0] ??
      exercise.alternatives_slugs[1] ??
      exercise.alternatives_slugs[0] ??
      null,
    stop_conditions:
      exercise.stop_conditions && exercise.stop_conditions.length > 0
        ? exercise.stop_conditions
        : ['ból', 'niejasny ruch', 'utrata kontroli nad tempem'],
    starting_load_guidance:
      exercise.starting_load_guidance ?? DEFAULT_STARTING_LOAD_GUIDANCE,
    machine_settings: null,
    is_new_skill: isNewSkill,
  }
}

function workoutName(index: number, phase: PlannerProfile['adaptation_phase']): string {
  if (phase === 'phase_0_familiarization') return `Spokojny trening wprowadzający ${index + 1}`
  if (phase === 'phase_1_adaptation') return `Lekki trening adaptacyjny ${index + 1}`
  return `Proste podstawy siłowe ${index + 1}`
}

function confidenceGoalForPhase(phase: PlannerProfile['adaptation_phase']): string {
  if (phase === 'phase_0_familiarization') {
    return 'Poczuć się swobodniej z miejscem, tempem wizyty i prostą kolejnością kroków.'
  }
  if (phase === 'phase_1_adaptation') {
    return 'Zbudować regularność i zrozumieć 1-2 proste ruchy bez pośpiechu.'
  }
  return 'Wejść spokojnie w podstawy siłowe bez presji i z jasnymi instrukcjami.'
}

function buildMainBlockExercises(
  profile: PlannerProfile,
  catalog: ExerciseCatalogEntry[],
  index: number,
): GuidedWorkoutStep[] {
  const phase = profile.adaptation_phase ?? 'phase_0_familiarization'
  if (phase === 'phase_0_familiarization') {
    return [
      {
        ...buildCardioStep(2, profile.equipment_location === 'gym' ? 'Spokojne cardio na start' : 'Spokojny marsz na start'),
        step_type: 'main_block',
      },
    ]
  }

  const gymPush = findExercise(catalog, [
    (exercise) => ['machines', 'cables'].some((equipment) => exercise.equipment_required.includes(equipment)),
    (exercise) => exercise.difficulty === 'beginner',
    (exercise) => ['push', 'legs', 'pull'].includes(exercise.category),
  ])

  const gymPull = findExercise(catalog, [
    (exercise) => exercise.slug === 'lat_pulldown' || exercise.slug === 'cable_row',
  ])

  const homeLower = findExercise(catalog, [
    (exercise) => exercise.slug === 'goblet_squat' || exercise.slug === 'pushups',
  ])

  const homeUpper = findExercise(catalog, [
    (exercise) => exercise.slug === 'pushups' || exercise.slug === 'dumbbell_row',
  ])

  const mainExercises: ExerciseCatalogEntry[] =
    profile.equipment_location === 'gym'
      ? [gymPush, gymPull].filter((exercise): exercise is ExerciseCatalogEntry => exercise != null)
      : [homeLower, homeUpper].filter((exercise): exercise is ExerciseCatalogEntry => exercise != null)

  const limitedExercises =
    phase === 'phase_1_adaptation' ? mainExercises.slice(0, 2) : mainExercises.slice(0, 3)

  return limitedExercises.map((exercise, exerciseIndex) =>
    buildExerciseStep(3 + exerciseIndex, exercise, 'main_block', exerciseIndex < 2 && index === 0),
  )
}

function buildWorkout(
  profile: PlannerProfile,
  catalog: ExerciseCatalogEntry[],
  dayLabel: string,
  orderInWeek: number,
): GuidedWorkoutEntry {
  const phase = profile.adaptation_phase ?? 'phase_0_familiarization'
  const steps: GuidedWorkoutStep[] = [
    buildArrivalStep(1, profile.equipment_location),
    buildCardioStep(2, 'Rozgrzewka'),
    ...buildMainBlockExercises(profile, catalog, orderInWeek - 1),
    buildCooldownStep(50),
    buildSummaryStep(60),
  ]
    .sort((left, right) => left.order_num - right.order_num)
    .map((step, index) => ({ ...step, order_num: index + 1 }))

  return {
    day_label: dayLabel,
    name: workoutName(orderInWeek - 1, phase),
    order_in_week: orderInWeek,
    duration_min_estimated: profile.session_duration_min ?? durationForPhase(phase),
    confidence_goal: confidenceGoalForPhase(phase),
    steps,
  }
}

export function generateGuidedBeginnerPlan(opts: {
  profile: PlannerProfile
  catalog: ExerciseCatalogEntry[]
}): GuidedTrainingPlanOutput {
  const phase = opts.profile.adaptation_phase ?? 'phase_0_familiarization'
  const daysPerWeek = guidedDaysPerWeek(opts.profile.days_per_week)
  const dayLabels = PHASE_DAY_LABELS[daysPerWeek] ?? PHASE_DAY_LABELS[2]!

  return {
    guided_mode: true,
    view_mode: 'guided_beginner_view',
    adaptation_phase: phase,
    workouts: dayLabels.map((dayLabel, index) =>
      buildWorkout(opts.profile, opts.catalog, dayLabel, index + 1),
    ),
    week_structure: weekStructureForDays(daysPerWeek),
    progression_rules: {
      method: 'quality_gated_guided_progression',
      add_weight_kg: 0,
      when: 'Advance only after enough clarity, confidence and no pain flags.',
    },
    additional_notes:
      'Ten plan ma prowadzić krok po kroku. Najpierw bezpieczeństwo i zrozumienie, potem regularność, a dopiero później trudniejsze ruchy.',
  }
}
