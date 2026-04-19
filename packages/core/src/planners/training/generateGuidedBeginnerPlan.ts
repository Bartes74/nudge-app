import type {
  ExerciseCatalogEntry,
  GuidedStepSubstitutionPolicy,
  GuidedStepSupportPolicy,
  GuidedStepVariant,
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
  4: ['mon', 'wed', 'fri', 'sun'],
}

function guidedDaysPerWeek(daysPerWeek: number | null): number {
  if (daysPerWeek == null) return 2
  return Math.max(2, Math.min(daysPerWeek, 4))
}

function durationForPhase(phase: PlannerProfile['adaptation_phase']): number {
  if (phase === 'phase_0_familiarization') return 27
  if (phase === 'phase_1_adaptation') return 28
  return 32
}

function weekStructureForDays(daysPerWeek: number): Record<string, string> {
  const labels = PHASE_DAY_LABELS[daysPerWeek] ?? PHASE_DAY_LABELS[2]!
  return Object.fromEntries(labels.map((label, index) => [label, `session_${index + 1}`]))
}

function sumStepDurations(steps: GuidedWorkoutStep[]): number {
  return steps.reduce((total, step) => total + (step.duration_min ?? 0), 0)
}

function findExercise(
  catalog: ExerciseCatalogEntry[],
  predicates: Array<(exercise: ExerciseCatalogEntry) => boolean>,
): ExerciseCatalogEntry | null {
  return catalog.find((exercise) => predicates.every((predicate) => predicate(exercise))) ?? null
}

function buildCardioVariant(
  key: string,
  label: string,
  config: Omit<GuidedStepVariant, 'key' | 'label'>,
): GuidedStepVariant {
  return {
    key,
    label,
    duration_min: null,
    instruction_text: null,
    setup_instructions: null,
    execution_steps: [],
    tempo_hint: null,
    breathing_hint: null,
    safety_notes: null,
    common_mistakes: null,
    machine_settings: null,
    normal_after_effects: [],
    finish_steps: [],
    ...config,
  }
}

function buildArrivalSupport(
  equipmentLocation: PlannerProfile['equipment_location'],
): GuidedStepSupportPolicy {
  if (equipmentLocation === 'gym') {
    return {
      packlist: [
        'Woda albo bidon.',
        'Mały ręcznik.',
        'Wygodne buty i strój, w którym możesz swobodnie chodzić.',
        'Telefon tylko jeśli pomaga Ci spokojnie przejść pierwsze minuty.',
      ],
      reassurance: [
        'Nie musisz znać całej siłowni. Na dziś interesuje Cię tylko bieżnia i jedno spokojne przejście przez plan.',
        'Jeśli czujesz lekki stres przed wejściem, to normalne przy pierwszej wizycie.',
        'Możesz dać sobie minutę na rozejrzenie się i przeczytanie pierwszego kroku w aplikacji.',
      ],
    }
  }

  return {
    packlist: [
      'Woda.',
      'Wygodne buty albo stabilne podłoże.',
      'Miejsce, w którym nic Cię nie rozprasza.',
    ],
    reassurance: [
      'Nie potrzebujesz idealnych warunków. Wystarczy spokojny kawałek przestrzeni.',
      'Dziś liczy się oswojenie planu, nie perfekcja.',
    ],
  }
}

function buildArrivalStep(
  orderNum: number,
  equipmentLocation: PlannerProfile['equipment_location'],
): GuidedWorkoutStep {
  return {
    step_type: 'arrival_prep',
    order_num: orderNum,
    title: 'Wejście i przygotowanie',
    duration_min: 4,
    exercise_slug: null,
    instruction_text:
      equipmentLocation === 'gym'
        ? 'Wejdź spokojnie, odłóż rzeczy, napij się wody i podejdź do bieżni. Na tym treningu niczego nie musisz robić szybko.'
        : 'Przygotuj miejsce do ruchu, wodę i upewnij się, że nic Cię nie rozprasza.',
    setup_instructions:
      equipmentLocation === 'gym'
        ? 'Na początek wystarczy bieżnia, woda i chwila na spokojne przeczytanie pierwszego kroku.'
        : 'Ustaw wodę i zostaw sobie trochę miejsca na swobodny ruch.',
    execution_steps: [
      'Daj sobie chwilę na wejście i nie porównuj się do nikogo obok.',
      'Sprawdź w aplikacji, że zaczynamy od bardzo spokojnej rozgrzewki.',
      'Ustaw wodę i ręcznik tak, żeby były pod ręką.',
    ],
    tempo_hint: null,
    breathing_hint: null,
    safety_notes:
      'Jeśli jeszcze przed startem czujesz zawroty głowy, ostry ból albo wyraźnie gorsze samopoczucie, odpuść trening na dziś.',
    common_mistakes:
      'Próba ogarnięcia całej siłowni naraz albo zaczynanie z pośpiechem tylko dlatego, że inni już ćwiczą.',
    easy_substitution_slug: null,
    machine_busy_substitution_slug: null,
    substitution_policy: {
      hide_actions: true,
      support: buildArrivalSupport(equipmentLocation),
    },
    stop_conditions: ['złe samopoczucie przed startem', 'zawroty głowy przed startem'],
    starting_load_guidance: null,
    machine_settings: null,
    is_new_skill: false,
  }
}

function buildWarmupCardioStep(orderNum: number): GuidedWorkoutStep {
  const treadmillDefault = buildCardioVariant('treadmill_default', 'Bieżnia', {
    duration_min: 10,
    instruction_text:
      'Potraktuj ten krok jako oswojenie bieżni i spokojne rozruszanie ciała. Masz czuć, że możesz normalnie mówić.',
    setup_instructions:
      'Podejdź do bieżni, ustaw prosty tryb ręczny i najpierw znajdź przycisk start oraz stop.',
    execution_steps: [
      '3 minuty: 4.0-4.3 km/h, nachylenie 0%.',
      '4 minuty: 4.3-4.7 km/h, nachylenie 0-1%.',
      '3 minuty: 4.2-4.5 km/h, nachylenie 0%.',
    ],
    tempo_hint:
      'Dobre tempo to takie, przy którym możesz spokojnie powiedzieć pełne zdanie. Jeśli zaczynasz łapać oddech, zwolnij o 0.3-0.5 km/h.',
    breathing_hint: 'Oddychaj swobodnie. Jeśli trudno mówić, zwolnij.',
    safety_notes:
      'Na końcu nie schodź od razu. Zwolnij, trzymaj poręcze przez kilka sekund i dopiero wtedy zejdź z bieżni.',
    common_mistakes:
      'Zbyt szybki start, patrzenie cały czas pod nogi i schodzenie z bieżni w chwili, gdy pas właśnie się zatrzymał.',
    machine_settings:
      'Tryb ręczny, prędkość zmieniaj małymi krokami, nachylenie maksymalnie 1%.',
    normal_after_effects: [
      'Przez kilka-kilkanaście sekund po zatrzymaniu bieżni możesz mieć wrażenie, że podłoga lekko „płynie”.',
      'Nogi mogą być trochę cięższe, ale nie powinno być ostrego bólu ani silnych zawrotów głowy.',
    ],
    finish_steps: [
      'Przed zatrzymaniem zwalniaj stopniowo przez 30-60 sekund.',
      'Po zatrzymaniu stań chwilę na bieżni i trzymaj poręcze, aż poczujesz stabilne nogi.',
      'Dopiero potem zejdź i napij się kilku łyków wody.',
    ],
  })

  const treadmillEasy = buildCardioVariant('treadmill_easy', 'Spokojniejsza bieżnia', {
    duration_min: 8,
    instruction_text:
      'To spokojniejsza wersja tego samego kroku. Ma Ci pomóc wejść w trening bez poczucia presji.',
    setup_instructions:
      'Zostajemy przy bieżni, ale cały krok będzie krótszy i wolniejszy.',
    execution_steps: [
      '3 minuty: 3.8-4.1 km/h, nachylenie 0%.',
      '3 minuty: 4.1-4.4 km/h, nachylenie 0%.',
      '2 minuty: 3.8-4.1 km/h, nachylenie 0%.',
    ],
    tempo_hint:
      'Masz czuć pełną kontrolę. Jeśli nadal jest za szybko, zwolnij jeszcze o 0.2-0.3 km/h.',
    breathing_hint: 'Nos lub usta — ważne, żeby oddech był spokojny i bez zadyszki.',
    safety_notes:
      'Jeśli już w tej wersji pojawiają się zawroty głowy albo niestabilność, przerwij krok i odpocznij.',
    machine_settings: 'Tryb ręczny, nachylenie 0%.',
  })

  const bikeVariant = buildCardioVariant('bike_warmup', 'Rower stacjonarny', {
    duration_min: 10,
    instruction_text:
      'Jeśli bieżnia jest zajęta, zacznij od spokojnego roweru. Ten krok ma rozgrzać, nie zmęczyć.',
    setup_instructions:
      'Ustaw siodełko tak, żeby przy dolnym położeniu pedału noga była lekko ugięta, a nie całkiem prosta.',
    execution_steps: [
      '3 minuty: bardzo lekki opór, 50-60 obrotów na minutę.',
      '4 minuty: lekki opór, 55-65 obrotów na minutę.',
      '3 minuty: bardzo lekki opór, 50-55 obrotów na minutę.',
    ],
    tempo_hint:
      'Jeśli oddech przyspiesza za bardzo, zmniejsz opór albo jedź wolniej. Nadal masz móc mówić pełnym zdaniem.',
    breathing_hint: 'Oddychaj równo, barki trzymaj luźno.',
    safety_notes:
      'Nie wciskaj od razu mocnego oporu. Ten krok ma być spokojny dla kolan i oddechu.',
    machine_settings: 'Lekki opór, wygodna pozycja, stopy ustawione stabilnie na pedałach.',
  })

  const ellipticalVariant = buildCardioVariant('elliptical_warmup', 'Orbitrek', {
    duration_min: 10,
    instruction_text:
      'Orbitrek jest dobrą alternatywą, jeśli chcesz płynnego ruchu bez uderzenia stopy o podłoże.',
    setup_instructions:
      'Wejdź na orbitrek dopiero, gdy czujesz stabilne stopy. Złap uchwyty i zacznij od bardzo wolnego ruchu.',
    execution_steps: [
      '3 minuty: najlżejszy opór, spokojny rytm.',
      '4 minuty: lekki opór, trochę dłuższy krok.',
      '3 minuty: najlżejszy opór, wyciszenie ruchu.',
    ],
    tempo_hint:
      'Ruch ma być płynny, bez szarpania. Jeśli tętno szybko rośnie, skróć krok i zwolnij.',
    breathing_hint: 'Oddychaj równo, nie unosząc barków.',
    safety_notes:
      'Jeśli czujesz niestabilność na orbitreku, zejdź spokojnie i wybierz prostszy rower.',
    machine_settings: 'Najlżejszy lub lekki opór, chwyt dla równowagi na początku.',
  })

  return {
    step_type: 'warmup',
    order_num: orderNum,
    title: 'Rozgrzewka',
    duration_min: treadmillDefault.duration_min ?? 10,
    exercise_slug: null,
    instruction_text: treadmillDefault.instruction_text ?? '',
    setup_instructions: treadmillDefault.setup_instructions ?? null,
    execution_steps: treadmillDefault.execution_steps ?? [],
    tempo_hint: treadmillDefault.tempo_hint ?? null,
    breathing_hint: treadmillDefault.breathing_hint ?? null,
    safety_notes: treadmillDefault.safety_notes ?? null,
    common_mistakes: treadmillDefault.common_mistakes ?? null,
    easy_substitution_slug: null,
    machine_busy_substitution_slug: null,
    substitution_policy: {
      auto_variant: 'easy_when_low_readiness',
      easy: treadmillEasy,
      machine_busy: {
        prompt: 'Jeśli bieżnia jest zajęta, wybierz sprzęt, który jest wolny.',
        options: [bikeVariant, ellipticalVariant],
      },
      support: {
        normal_after_effects: treadmillDefault.normal_after_effects,
        finish_steps: treadmillDefault.finish_steps,
      },
    },
    stop_conditions: ['zawroty głowy', 'ból w klatce piersiowej', 'nietypowa duszność'],
    starting_load_guidance: null,
    machine_settings: treadmillDefault.machine_settings ?? null,
    is_new_skill: false,
  }
}

function buildIntroCardioStep(orderNum: number): GuidedWorkoutStep {
  const treadmillDefault = buildCardioVariant('treadmill_progress', 'Bieżnia', {
    duration_min: 7,
    instruction_text:
      'Teraz przechodzimy o pół kroku dalej. Nadal spokojnie, ale środkowy fragment będzie trochę żywszy niż w rozgrzewce.',
    setup_instructions:
      'Zostań przy tej samej bieżni. Zmieniamy tylko tempo i ewentualnie lekkie nachylenie.',
    execution_steps: [
      '2 minuty: 4.4-4.7 km/h, nachylenie 0-1%.',
      '3 minuty: 4.8-5.2 km/h, nachylenie 1-2%.',
      '2 minuty: 4.3-4.6 km/h, nachylenie 0-1%.',
    ],
    tempo_hint:
      'To nadal nie ma być zadyszka. Masz czuć, że pracujesz trochę mocniej niż przed chwilą, ale wciąż kontrolujesz oddech.',
    breathing_hint: 'Wdech spokojny, wydech trochę dłuższy, jeśli chcesz się uspokoić.',
    safety_notes:
      'Jeśli po szybszym fragmencie czujesz niestabilność albo „odpływające” nogi, od razu wróć do spokojniejszego tempa.',
    common_mistakes:
      'Podkręcanie prędkości za mocno tylko dlatego, że czujesz się pewniej niż kilka minut temu.',
    machine_settings: 'Tryb ręczny, nachylenie maksymalnie 2%, zmieniaj tempo małymi krokami.',
    normal_after_effects: [
      'Po tym kroku możesz czuć wyraźniejsze ciepło w nogach i szybszy oddech, ale powinieneś szybko wrócić do spokoju.',
      'Po bieżni nadal może pojawić się krótkie uczucie „płynącej” podłogi — dlatego kończymy go stopniowo.',
    ],
    finish_steps: [
      'Na ostatniej minucie wyraźnie zwolnij.',
      'Po zatrzymaniu potrzymaj poręcze 10-15 sekund.',
      'Zejdź dopiero, gdy czujesz stabilny krok.',
      'Napij się kilku łyków wody przed następnym krokiem.',
    ],
  })

  const treadmillEasy = buildCardioVariant('treadmill_progress_easy', 'Łagodniejsza wersja', {
    duration_min: 6,
    instruction_text:
      'Jeśli dziś masz mniej energii albo czujesz napięcie, wybierz tę łagodniejszą wersję i dalej zachowaj ciągłość treningu.',
    setup_instructions:
      'Zostajemy przy bieżni, ale skracamy środkowy fragment i nie dokładamy nachylenia.',
    execution_steps: [
      '2 minuty: 4.1-4.3 km/h, nachylenie 0%.',
      '2 minuty: 4.4-4.6 km/h, nachylenie 0-1%.',
      '2 minuty: 4.0-4.2 km/h, nachylenie 0%.',
    ],
    tempo_hint:
      'To ma być odrobina progresu, nie walka. Jeśli czujesz niepewność, trzymaj dolny zakres prędkości.',
    breathing_hint: 'Oddychaj tak, żebyś mógł powiedzieć 1-2 zdania bez przerywania.',
    safety_notes:
      'Jeśli i ta wersja jest za mocna, wróć do tempa z rozgrzewki i zakończ krok wcześniej.',
    machine_settings: 'Tryb ręczny, nachylenie 0-1%.',
  })

  const bikeVariant = buildCardioVariant('bike_progress', 'Rower stacjonarny', {
    duration_min: 7,
    instruction_text:
      'Na rowerze dokładamy odrobinę pracy przez środkowy fragment, ale dalej bez mocnego zadyszania.',
    setup_instructions:
      'Zostań przy lekkim oporze i dopiero w środku kroku podbij go o jeden poziom, jeśli czujesz się stabilnie.',
    execution_steps: [
      '2 minuty: lekki opór, 55-60 obrotów na minutę.',
      '3 minuty: lekki do umiarkowanego oporu, 60-70 obrotów na minutę.',
      '2 minuty: lekki opór, 55-60 obrotów na minutę.',
    ],
    tempo_hint:
      'Masz czuć, że nogi pracują trochę mocniej niż wcześniej, ale wciąż bez pieczenia i bez mocnego sapnięcia.',
    breathing_hint: 'Równy oddech, luźne barki i chwyt kierownicy bez zaciskania dłoni.',
    safety_notes:
      'Jeśli czujesz dyskomfort w kolanie, zmniejsz opór zamiast cisnąć mocniej.',
    machine_settings: 'Lekki lub lekko podniesiony opór, wygodna wysokość siodełka.',
  })

  const ellipticalVariant = buildCardioVariant('elliptical_progress', 'Orbitrek', {
    duration_min: 7,
    instruction_text:
      'Na orbitreku wydłuż delikatnie krok i utrzymaj płynny rytm przez środkowy fragment.',
    setup_instructions:
      'Zostań przy lekkim oporze. Jeśli chcesz, tylko minimalnie go podnieś w środku kroku.',
    execution_steps: [
      '2 minuty: lekki opór, spokojny ruch.',
      '3 minuty: lekki do umiarkowanego oporu, dłuższy krok.',
      '2 minuty: lekki opór, wyciszenie.',
    ],
    tempo_hint:
      'To ma być płynny ruch, nie przyspieszony sprint. Jeśli tracisz rytm, wróć do spokojniejszego kroku.',
    breathing_hint: 'Wydech wydłużaj wtedy, gdy chcesz uspokoić tętno.',
    safety_notes:
      'Jeśli czujesz się niepewnie na orbitreku, trzymaj krótszy krok i nie puszczaj od razu uchwytów.',
    machine_settings: 'Lekki lub lekko podniesiony opór, stabilny chwyt na początku.',
  })

  return {
    step_type: 'main_block',
    order_num: orderNum,
    title: 'Spokojne cardio krok dalej',
    duration_min: treadmillDefault.duration_min ?? 7,
    exercise_slug: null,
    instruction_text: treadmillDefault.instruction_text ?? '',
    setup_instructions: treadmillDefault.setup_instructions ?? null,
    execution_steps: treadmillDefault.execution_steps ?? [],
    tempo_hint: treadmillDefault.tempo_hint ?? null,
    breathing_hint: treadmillDefault.breathing_hint ?? null,
    safety_notes: treadmillDefault.safety_notes ?? null,
    common_mistakes: treadmillDefault.common_mistakes ?? null,
    easy_substitution_slug: null,
    machine_busy_substitution_slug: null,
    substitution_policy: {
      auto_variant: 'easy_when_low_readiness',
      easy: treadmillEasy,
      machine_busy: {
        prompt: 'Jeśli bieżnia jest zajęta, wybierz wolny rower albo orbitrek.',
        options: [bikeVariant, ellipticalVariant],
      },
      support: {
        normal_after_effects: treadmillDefault.normal_after_effects,
        finish_steps: treadmillDefault.finish_steps,
      },
    },
    stop_conditions: ['zawroty głowy', 'ból w klatce piersiowej', 'uczucie niestabilności mimo zwolnienia'],
    starting_load_guidance: null,
    machine_settings: treadmillDefault.machine_settings ?? null,
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
    instruction_text:
      'Teraz schodzimy z wysiłku spokojnie. Ten krok pomaga wrócić do normalnego oddechu i stabilnego czucia nóg.',
    setup_instructions: 'Jeśli kończysz na bieżni, zwalniaj stopniowo zamiast zatrzymywać się nagle.',
    execution_steps: [
      '2 minuty spokojnego marszu albo bardzo lekkiego pedałowania.',
      '1 minuta stania lub wolnego chodzenia po zatrzymaniu sprzętu.',
      '1 minuta: kilka spokojnych oddechów i łyk wody.',
    ],
    tempo_hint: 'Z każdą minutą trochę spokojniej.',
    breathing_hint: 'Wydech może być trochę dłuższy niż wdech — to pomaga się uspokoić.',
    safety_notes:
      'Jeśli po zatrzymaniu dalej mocno kręci Ci się w głowie albo trudno ustać, usiądź i poproś kogoś o pomoc.',
    common_mistakes:
      'Zatrzymanie się od razu po szybszym fragmencie i szybkie zejście ze sprzętu bez chwili stabilizacji.',
    easy_substitution_slug: null,
    machine_busy_substitution_slug: null,
    substitution_policy: {
      support: {
        normal_after_effects: [
          'Przez chwilę możesz czuć szybszy oddech albo lekko „miękkie” nogi.',
          'Po bieżni może pojawić się krótkie wrażenie, że podłoga jeszcze lekko pracuje pod stopami.',
        ],
        finish_steps: [
          'Zwolnij przed zatrzymaniem sprzętu.',
          'Po zatrzymaniu złap poręcze albo oprzyj dłonie na udach i daj sobie kilka sekund.',
          'Dopiero potem rusz dalej albo usiądź.',
        ],
      },
    },
    stop_conditions: ['ból w klatce piersiowej', 'silne zawroty głowy', 'nietypowa duszność'],
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
    instruction_text:
      'Sprawdź po treningu, czy wszystko było jasne i czy czujesz się na tyle spokojnie, żeby wrócić na kolejny trening.',
    setup_instructions:
      'Usiądź albo stań spokojnie i odpowiedz sobie na kilka prostych pytań o jasność planu i samopoczucie.',
    execution_steps: [
      'Czy wiedziałeś/aś, co robić w każdym kroku?',
      'Czy coś było niejasne albo zbyt szybkie?',
      'Czy pojawił się ból albo niepokojące objawy?',
      'Czy wrócisz spokojnie na kolejny trening?',
    ],
    tempo_hint: null,
    breathing_hint: 'Kilka spokojnych oddechów i łyk wody wystarczą.',
    safety_notes:
      'Jeśli pojawił się ból albo objaw, który Cię zaniepokoił, zaznacz to w podsumowaniu i nie ignoruj tego przy następnym treningu.',
    common_mistakes:
      'Zamykanie treningu bez krótkiego sprawdzenia, co było jasne, a co warto uprościć następnym razem.',
    easy_substitution_slug: null,
    machine_busy_substitution_slug: null,
    substitution_policy: {
      hide_actions: true,
    },
    stop_conditions: ['ból po treningu', 'objawy utrzymujące się po odpoczynku'],
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
      'Zrób to ćwiczenie spokojnie i skup się na jednym dobrym ruchu na raz.',
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
    return [buildIntroCardioStep(3)]
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
  const includeArrivalPrep = orderInWeek === 1
  const steps: GuidedWorkoutStep[] = [
    ...(includeArrivalPrep ? [buildArrivalStep(1, profile.equipment_location)] : []),
    buildWarmupCardioStep(2),
    ...buildMainBlockExercises(profile, catalog, orderInWeek - 1),
    buildCooldownStep(50),
    buildSummaryStep(60),
  ]
    .sort((left, right) => left.order_num - right.order_num)
    .map((step, index) => ({ ...step, order_num: index + 1 }))
  const calculatedDuration = sumStepDurations(steps)

  return {
    day_label: dayLabel,
    name: workoutName(orderInWeek - 1, phase),
    order_in_week: orderInWeek,
    duration_min_estimated: Math.max(
      profile.session_duration_min ?? durationForPhase(phase),
      calculatedDuration,
    ),
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
