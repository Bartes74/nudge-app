import { callStructured, type LlmCallMeta } from '../../llm/client'
import type {
  ExerciseCatalogEntry,
  GuidedTrainingPlanOutput,
  GuidedWorkoutContent,
  PreparedWorkoutBrief,
  TrainingPlanOutput,
  TrainingPlannerContext,
} from './types'

interface PreparedGuidedWorkoutContentResponse {
  workouts: GuidedWorkoutContent[]
}

interface PreparedStandardWorkoutBriefResponse {
  workouts: PreparedWorkoutBrief[]
}

export interface PrepareGuidedPlanContentResult {
  workouts: GuidedWorkoutContent[]
  meta: LlmCallMeta
}

export interface PrepareStandardPlanContentResult {
  workouts: PreparedWorkoutBrief[]
  meta: LlmCallMeta
}

const GUIDED_CONTENT_SCHEMA = {
  type: 'object',
  required: ['workouts'],
  additionalProperties: false,
  properties: {
    workouts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['day_label', 'order_in_week', 'confidence_goal', 'steps'],
        additionalProperties: false,
        properties: {
          day_label: { type: 'string' },
          order_in_week: { type: 'integer' },
          confidence_goal: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              required: [
                'order_num',
                'title',
                'instruction_text',
                'setup_instructions',
                'execution_steps',
                'tempo_hint',
                'breathing_hint',
                'safety_notes',
                'common_mistakes',
                'stop_conditions',
                'machine_settings',
                'starting_load_guidance',
              ],
              additionalProperties: false,
              properties: {
                order_num: { type: 'integer' },
                title: { type: 'string' },
                instruction_text: { type: 'string' },
                setup_instructions: { type: ['string', 'null'] },
                execution_steps: { type: 'array', items: { type: 'string' } },
                tempo_hint: { type: ['string', 'null'] },
                breathing_hint: { type: ['string', 'null'] },
                safety_notes: { type: ['string', 'null'] },
                common_mistakes: { type: ['string', 'null'] },
                stop_conditions: { type: 'array', items: { type: 'string' } },
                machine_settings: { type: ['string', 'null'] },
                starting_load_guidance: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
    },
  },
} as const

const STANDARD_CONTENT_SCHEMA = {
  type: 'object',
  required: ['workouts'],
  additionalProperties: false,
  properties: {
    workouts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['day_label', 'order_in_week', 'confidence_goal', 'warmup_notes', 'cooldown_notes'],
        additionalProperties: false,
        properties: {
          day_label: { type: 'string' },
          order_in_week: { type: 'integer' },
          confidence_goal: { type: ['string', 'null'] },
          warmup_notes: { type: ['string', 'null'] },
          cooldown_notes: { type: ['string', 'null'] },
        },
      },
    },
  },
} as const

function serializeContext(context: TrainingPlannerContext): string {
  return JSON.stringify(
    {
      adaptation: context.adaptation,
      communication: context.communication,
      recent_workouts: context.recent_workouts.slice(0, 6),
      recent_feedback: context.recent_feedback.slice(0, 4),
      muscle_balance: context.muscle_balance,
      behavior_signals: context.behavior_signals,
      plan_adherence: context.plan_adherence,
    },
    null,
    2,
  )
}

function serializeGuidedPlan(plan: GuidedTrainingPlanOutput): string {
  return JSON.stringify(
    {
      adaptation_phase: plan.adaptation_phase,
      workouts: plan.workouts.map((workout) => ({
        day_label: workout.day_label,
        order_in_week: workout.order_in_week,
        name: workout.name,
        duration_min_estimated: workout.duration_min_estimated,
        confidence_goal: workout.confidence_goal,
        steps: workout.steps.map((step) => ({
          order_num: step.order_num,
          step_type: step.step_type,
          title: step.title,
          duration_min: step.duration_min,
          exercise_slug: step.exercise_slug,
          instruction_text: step.instruction_text,
          setup_instructions: step.setup_instructions,
          execution_steps: step.execution_steps,
          tempo_hint: step.tempo_hint,
          breathing_hint: step.breathing_hint,
          safety_notes: step.safety_notes,
          common_mistakes: step.common_mistakes,
          stop_conditions: step.stop_conditions,
          machine_settings: step.machine_settings,
          starting_load_guidance: step.starting_load_guidance,
          is_new_skill: step.is_new_skill,
          substitution_policy: step.substitution_policy,
        })),
      })),
    },
    null,
    2,
  )
}

function serializeStandardPlan(
  plan: TrainingPlanOutput,
  catalogBySlug: Map<string, ExerciseCatalogEntry>,
): string {
  return JSON.stringify(
    {
      workouts: plan.workouts.map((workout) => ({
        day_label: workout.day_label,
        order_in_week: workout.order_in_week,
        name: workout.name,
        duration_min_estimated: workout.duration_min_estimated,
        exercises: workout.exercises.map((exercise) => {
          const catalogEntry = catalogBySlug.get(exercise.exercise_slug)
          return {
            order_num: exercise.order_num,
            exercise_slug: exercise.exercise_slug,
            sets: exercise.sets,
            reps_min: exercise.reps_min,
            reps_max: exercise.reps_max,
            rir_target: exercise.rir_target,
            rest_seconds: exercise.rest_seconds,
            category: catalogEntry?.category ?? null,
            primary_muscles: catalogEntry?.primary_muscles ?? [],
            plain_language_name: catalogEntry?.plain_language_name ?? catalogEntry?.name_pl ?? null,
          }
        }),
      })),
    },
    null,
    2,
  )
}

export async function prepareGuidedPlanContent(opts: {
  apiKey: string
  model: string
  context: TrainingPlannerContext
  plan: GuidedTrainingPlanOutput
}): Promise<PrepareGuidedPlanContentResult> {
  const systemPrompt = [
    'You generate the final Polish copy for a guided workout app after the workout graph is already frozen.',
    'You must not change workout count, step count, step order, exercise choices, durations, or progression logic.',
    'Only rewrite the user-facing copy fields.',
    'Keep language simple, direct and adequate to the user maturity in the context.',
    'Safety copy must only reflect the structured safety inputs already present in the plan data.',
    'Do not invent medical warnings or symptoms that are not supported by the input.',
    'For advanced users be shorter and less hand-holding. For novice users be more guided but still concise.',
  ].join(' ')

  const userPrompt = [
    'Adaptation and communication context:',
    serializeContext(opts.context),
    '',
    'Frozen guided workout graph:',
    serializeGuidedPlan(opts.plan),
    '',
    'Return the same workout and step structure with better Polish copy only.',
  ].join('\n')

  const { output, meta } = await callStructured<PreparedGuidedWorkoutContentResponse>({
    apiKey: opts.apiKey,
    model: opts.model,
    systemPrompt,
    userPrompt,
    jsonSchema: GUIDED_CONTENT_SCHEMA as unknown as Record<string, unknown>,
    schemaName: 'guided_workout_content',
  })

  if (output.workouts.length !== opts.plan.workouts.length) {
    throw new Error('Guided content pass returned a different workout count.')
  }

  for (const workout of output.workouts) {
    const originalWorkout = opts.plan.workouts.find(
      (candidate) =>
        candidate.day_label === workout.day_label &&
        candidate.order_in_week === workout.order_in_week,
    )
    if (!originalWorkout) {
      throw new Error('Guided content pass returned an unknown workout.')
    }
    if (workout.steps.length !== originalWorkout.steps.length) {
      throw new Error('Guided content pass returned a different step count.')
    }
  }

  return { workouts: output.workouts, meta }
}

export async function prepareStandardPlanContent(opts: {
  apiKey: string
  model: string
  context: TrainingPlannerContext
  plan: TrainingPlanOutput
  catalog: ExerciseCatalogEntry[]
}): Promise<PrepareStandardPlanContentResult> {
  const catalogBySlug = new Map(opts.catalog.map((exercise) => [exercise.slug, exercise]))

  const systemPrompt = [
    'You generate preparation copy for a finished training plan.',
    'The exercise graph is already frozen. Do not change exercises, sets, reps, order or progression.',
    'Return only short Polish user-facing copy for confidence_goal, warmup_notes and cooldown_notes.',
    'The wording must reflect user maturity and recent feedback from context.',
    'For novice users use plain Polish. For advanced users use shorter and slightly more technical language.',
    'Do not invent unsupported warnings.',
  ].join(' ')

  const userPrompt = [
    'Adaptation and communication context:',
    serializeContext(opts.context),
    '',
    'Frozen standard training plan:',
    serializeStandardPlan(opts.plan, catalogBySlug),
    '',
    'Generate short preparation and cooldown notes for each workout.',
  ].join('\n')

  const { output, meta } = await callStructured<PreparedStandardWorkoutBriefResponse>({
    apiKey: opts.apiKey,
    model: opts.model,
    systemPrompt,
    userPrompt,
    jsonSchema: STANDARD_CONTENT_SCHEMA as unknown as Record<string, unknown>,
    schemaName: 'prepared_workout_briefs',
  })

  if (output.workouts.length !== opts.plan.workouts.length) {
    throw new Error('Standard content pass returned a different workout count.')
  }

  return { workouts: output.workouts, meta }
}
