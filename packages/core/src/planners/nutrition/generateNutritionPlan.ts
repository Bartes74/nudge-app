import { callStructured } from '../../llm/client'
import type { LlmCallMeta } from '../../llm/client'
import type {
  NutritionPlannerProfile,
  NutritionPlanOutput,
  LlmNutritionOutput,
  NumericalTargets,
} from './types'

export interface GenerateNutritionPlanResult {
  plan: NutritionPlanOutput
  meta: LlmCallMeta
  promptId: string | null
}

const OUTPUT_SCHEMA = {
  type: 'object',
  required: [
    'meal_distribution',
    'strategy_notes',
    'practical_guidelines',
    'supplement_recommendations',
    'emergency_plan',
  ],
  additionalProperties: false,
  properties: {
    meal_distribution: {
      type: 'array',
      items: {
        type: 'object',
        required: ['meal', 'name', 'kcal_share', 'time'],
        additionalProperties: false,
        properties: {
          meal: { type: 'integer' },
          name: { type: 'string' },
          kcal_share: { type: 'number' },
          time: { type: 'string' },
        },
      },
    },
    strategy_notes: { type: 'string' },
    practical_guidelines: {
      type: 'object',
      required: ['base_products', 'protein_sources', 'limit'],
      additionalProperties: false,
      properties: {
        base_products: { type: 'array', items: { type: 'string' } },
        protein_sources: { type: 'array', items: { type: 'string' } },
        limit: { type: 'array', items: { type: 'string' } },
      },
    },
    supplement_recommendations: {
      type: 'object',
      required: ['sensible', 'optional', 'unnecessary'],
      additionalProperties: false,
      properties: {
        sensible: { type: 'array', items: { type: 'string' } },
        optional: { type: 'array', items: { type: 'string' } },
        unnecessary: { type: 'array', items: { type: 'string' } },
      },
    },
    emergency_plan: {
      type: 'object',
      required: ['no_time', 'party', 'hunger', 'low_energy', 'stagnation'],
      additionalProperties: false,
      properties: {
        no_time: { type: 'string' },
        party: { type: 'string' },
        hunger: { type: 'string' },
        low_energy: { type: 'string' },
        stagnation: { type: 'string' },
      },
    },
  },
} as const

function buildProfileSummary(profile: NutritionPlannerProfile): string {
  return [
    `Cel: ${profile.primary_goal ?? 'nieznany'}`,
    `Poziom: ${profile.experience_level ?? 'nieznany'}`,
    `Płeć: ${profile.gender ?? 'nieznana'}`,
    `Wiek: ${profile.age != null ? `${profile.age} lat` : 'nieznany'}`,
    `Masa: ${profile.weight_kg != null ? `${profile.weight_kg} kg` : 'nieznana'}`,
    `Wzrost: ${profile.height_cm != null ? `${profile.height_cm} cm` : 'nieznany'}`,
    `Aktywność: ${profile.activity_level ?? 'sedentary'}`,
    `Tryb diety: ${profile.nutrition_mode}`,
    profile.dietary_constraints.length > 0
      ? `Ograniczenia dietetyczne: ${profile.dietary_constraints.join(', ')}`
      : '',
    profile.life_context.length > 0
      ? `Kontekst życiowy: ${profile.life_context.join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildNumericalTargetsSummary(targets: NumericalTargets): string {
  return [
    `Kalorie: ${targets.calories_target} kcal/dzień`,
    `Białko: ${targets.protein_g} g/dzień`,
    `Tłuszcze: ${targets.fat_g} g/dzień`,
    `Węglowodany: ${targets.carbs_g} g/dzień`,
    `Błonnik: ${targets.fiber_g} g/dzień`,
    `Woda: ${targets.water_ml} ml/dzień`,
  ].join('\n')
}

export async function generateNutritionPlan(opts: {
  apiKey: string
  model: string
  systemTemplate: string
  userTemplate: string
  profile: NutritionPlannerProfile
  targets: NumericalTargets
  promptId: string | null
}): Promise<GenerateNutritionPlanResult> {
  const profileSummary = buildProfileSummary(opts.profile)
  const numericalTargets = buildNumericalTargetsSummary(opts.targets)

  const userPrompt = opts.userTemplate
    .replace('{{profile_summary}}', profileSummary)
    .replace('{{numerical_targets}}', numericalTargets)

  const { output, meta } = await callStructured<LlmNutritionOutput>({
    apiKey: opts.apiKey,
    model: opts.model,
    systemPrompt: opts.systemTemplate,
    userPrompt,
    jsonSchema: OUTPUT_SCHEMA as unknown as Record<string, unknown>,
    schemaName: 'nutrition_plan_output',
  })

  return {
    plan: { ...opts.targets, ...output },
    meta,
    promptId: opts.promptId,
  }
}
