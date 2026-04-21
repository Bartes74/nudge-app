import { callStructured } from '../../llm/client'
import type {
  PlanTemplate,
  ExerciseCatalogEntry,
  TrainingPlanOutput,
  PlannerProfile,
  TrainingPlannerContext,
} from './types'
import type { LlmCallMeta } from '../../llm/client'

export interface FillTemplateResult {
  plan: TrainingPlanOutput
  meta: LlmCallMeta
  promptId: string | null
}

function buildProfileSummary(profile: PlannerProfile): string {
  const equipment: string[] = []
  if (profile.has_barbell) equipment.push('sztanga')
  if (profile.has_dumbbells) equipment.push('hantle')
  if (profile.has_machines) equipment.push('maszyny')
  if (profile.has_cables) equipment.push('wyciągi')
  if (profile.has_pullup_bar) equipment.push('drążek')
  if (profile.has_bench) equipment.push('ławka')
  if (profile.equipment_location === 'home' && equipment.length === 0) equipment.push('brak sprzętu')

  return [
    `Poziom: ${profile.experience_level ?? 'nieznany'}`,
    `Cel: ${profile.primary_goal ?? 'nieznany'}`,
    `Dni treningowe/tydzień: ${profile.days_per_week ?? 3}`,
    `Lokalizacja: ${profile.equipment_location ?? 'siłownia'}`,
    `Dostępny sprzęt: ${equipment.join(', ') || 'standardowa siłownia'}`,
    profile.session_duration_min ? `Czas sesji: do ${profile.session_duration_min} minut` : '',
    profile.injuries.length > 0 ? `Kontuzje/ograniczenia: ${profile.injuries.join(', ')}` : '',
    profile.avoid_exercises.length > 0 ? `Ćwiczenia do unikania: ${profile.avoid_exercises.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildCatalogList(catalog: ExerciseCatalogEntry[]): string {
  return catalog
    .map((e) =>
      `- ${e.slug} (${e.name_pl}, ${e.category}, sprzęt: ${e.equipment_required.join('+') || 'brak'}, poziom: ${e.difficulty})`,
    )
    .join('\n')
}

function buildContextSummary(context: TrainingPlannerContext | undefined): string {
  if (!context) return 'Brak dodatkowego kontekstu adaptacji.'

  return [
    `Ukończone treningi (ostatnie 24): ${context.recent_workouts.length}`,
    `Frekwencja 7d: ${context.behavior_signals.workout_completion_rate_7d ?? 'brak danych'}`,
    `Frekwencja 30d: ${context.behavior_signals.workout_completion_rate_30d ?? 'brak danych'}`,
    `Dni od ostatniego treningu: ${context.behavior_signals.days_since_last_workout_log ?? 'brak danych'}`,
    context.plan_adherence.past_due_workouts > 0
      ? `Domknięte treningi z minionych dni: ${context.plan_adherence.completed_past_due_workouts}/${context.plan_adherence.past_due_workouts}`
      : 'Brak minionych treningów do rozliczenia w aktywnym tygodniu.',
    context.plan_adherence.blocks_progression_until_plan_completed
      ? 'Nie wolno progresować planu, dopóki wszystkie treningi z minionych dni nie zostaną ukończone z podsumowaniem.'
      : '',
    `Maturity treningowa: ${context.adaptation.training_maturity}`,
    `Maturity komunikacyjna: ${context.adaptation.communication_maturity}`,
    `Bias progresji: ${context.adaptation.progression_bias}`,
    `Potrzeba większego prowadzenia: ${context.adaptation.requires_more_guidance ? 'tak' : 'nie'}`,
    `Można dodać nowe umiejętności: ${context.adaptation.can_introduce_new_skills ? 'tak' : 'nie'}`,
    context.adaptation.latest_feedback_themes.length > 0
      ? `Ostatnie sygnały feedbacku: ${context.adaptation.latest_feedback_themes.join(', ')}`
      : '',
    context.adaptation.avoid_exercise_slugs.length > 0
      ? `Ćwiczenia do unikania po feedbacku: ${context.adaptation.avoid_exercise_slugs.join(', ')}`
      : '',
    context.adaptation.preferred_focus.length > 0
      ? `Preferowane obszary na kolejny plan: ${context.adaptation.preferred_focus.join(', ')}`
      : '',
    context.adaptation.progress_ready_exercises.length > 0
      ? `Ćwiczenia gotowe do progresji: ${context.adaptation.progress_ready_exercises.join(', ')}`
      : '',
    context.adaptation.deload_exercises.length > 0
      ? `Ćwiczenia wymagające cofnięcia lub łatwiejszego wariantu: ${context.adaptation.deload_exercises.join(', ')}`
      : '',
    context.adaptation.repeatable_exercises.length > 0
      ? `Ćwiczenia warte powtórzenia w podobnej formie: ${context.adaptation.repeatable_exercises.join(', ')}`
      : '',
    context.muscle_balance.undertrained_categories.length > 0
      ? `Niedotrenowane kategorie: ${context.muscle_balance.undertrained_categories.join(', ')}`
      : '',
    context.muscle_balance.overtrained_categories.length > 0
      ? `Przeciążone kategorie: ${context.muscle_balance.overtrained_categories.join(', ')}`
      : '',
    context.muscle_balance.undertrained_muscles.length > 0
      ? `Niedotrenowane partie: ${context.muscle_balance.undertrained_muscles.join(', ')}`
      : '',
    context.communication.guidance_level
      ? `Styl prowadzenia: ${context.communication.guidance_level}, techniczność: ${context.communication.technicality}`
      : '',
    context.exercise_history.length > 0
      ? `Skrót historii ćwiczeń: ${context.exercise_history
          .slice(0, 8)
          .map(
            (summary) =>
              `${summary.exercise_slug} [${summary.category ?? 'brak kategorii'}]: ${summary.progression_action}, sesje=${summary.sessions_completed}, zamiany=${summary.substitutions}`,
          )
          .join(' | ')}`
      : '',
    context.adaptation.rationale.length > 0
      ? `Uzasadnienie adaptacji: ${context.adaptation.rationale.join(' | ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const OUTPUT_SCHEMA = {
  type: 'object',
  required: ['workouts', 'week_structure', 'progression_rules', 'additional_notes'],
  additionalProperties: false,
  properties: {
    workouts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['day_label', 'name', 'order_in_week', 'duration_min_estimated', 'exercises'],
        additionalProperties: false,
        properties: {
          day_label: { type: 'string' },
          name: { type: 'string' },
          order_in_week: { type: 'integer' },
          duration_min_estimated: { type: 'integer' },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              required: ['exercise_slug', 'order_num', 'sets', 'reps_min', 'reps_max', 'rir_target', 'rest_seconds', 'technique_notes', 'substitute_exercise_slugs'],
              additionalProperties: false,
              properties: {
                exercise_slug: { type: 'string' },
                order_num: { type: 'integer' },
                sets: { type: 'integer' },
                reps_min: { type: 'integer' },
                reps_max: { type: 'integer' },
                rir_target: { type: 'number' },
                rest_seconds: { type: 'integer' },
                technique_notes: { type: 'string' },
                substitute_exercise_slugs: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    week_structure: { type: 'object', additionalProperties: { type: 'string' } },
    progression_rules: {
      type: 'object',
      required: ['method', 'add_weight_kg', 'when'],
      additionalProperties: false,
      properties: {
        method: { type: 'string' },
        add_weight_kg: { type: 'number' },
        when: { type: 'string' },
      },
    },
    additional_notes: { type: 'string' },
  },
} as const

export async function fillTemplate(opts: {
  apiKey: string
  model: string
  systemTemplate: string
  userTemplate: string
  template: PlanTemplate
  profile: PlannerProfile
  catalog: ExerciseCatalogEntry[]
  context?: TrainingPlannerContext
  promptId: string | null
}): Promise<FillTemplateResult> {
  const profileSummary = buildProfileSummary(opts.profile)
  const contextSummary = buildContextSummary(opts.context)
  const templateStructure = JSON.stringify(opts.template, null, 2)
  const availableExercises = buildCatalogList(opts.catalog)
  const planningDirectives =
    opts.template.planning_directives && opts.template.planning_directives.length > 0
      ? opts.template.planning_directives.map((directive) => `- ${directive}`).join('\n')
      : '- Brak dodatkowych dyrektyw.'

  const userPrompt = opts.userTemplate
    .replace('{{profile_summary}}', profileSummary)
    .replace('{{template_structure}}', templateStructure)
    .replace('{{available_exercises}}', availableExercises)
    .concat(`\n\n# ADAPTATION CONTEXT\n${contextSummary}`)
    .concat(`\n\n# PLANNING DIRECTIVES\n${planningDirectives}`)
    .concat(
      '\n\n# HARD RULES\n' +
        '- Zamroź liczbę sesji, day_label i week_structure z template.\n' +
        '- Wykorzystaj historię ćwiczeń oraz balans partii do doboru ćwiczeń i objętości.\n' +
        '- Jeśli ćwiczenie jest gotowe do progresji, zachowaj tę samą rodzinę ruchu i zaplanuj progres w realistyczny sposób.\n' +
        '- Jeśli ćwiczenie jest oznaczone do deloadu lub uproszczenia, nie zwiększaj mu trudności.\n' +
        '- Jeśli użytkownik potrzebuje więcej prowadzenia, preferuj znajome ćwiczenia i mniejszą liczbę nowości.\n' +
        '- Każdy plan ma realizować cel użytkownika, ale stawiać ambitne i osiągalne cele bez zniechęcania.',
    )

  const { output, meta } = await callStructured<TrainingPlanOutput>({
    apiKey: opts.apiKey,
    model: opts.model,
    systemPrompt: opts.systemTemplate,
    userPrompt,
    jsonSchema: OUTPUT_SCHEMA as unknown as Record<string, unknown>,
    schemaName: 'training_plan_output',
  })

  return { plan: output, meta, promptId: opts.promptId }
}
