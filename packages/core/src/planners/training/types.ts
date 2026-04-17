import type {
  AdaptationPhase,
  EntryPath,
  ExperienceLevel,
  LocationType,
  PrimaryGoal,
} from '../../domain/profile'

// ─── Template (input to LLM) ────────────────────────────────────────────────

export type SplitType = 'fbw' | 'upper_lower' | 'ppl' | 'split'

export type PlanViewMode = 'guided_beginner_view' | 'standard_training_view'

export type GuidedStepType =
  | 'arrival_prep'
  | 'warmup'
  | 'main_block'
  | 'cooldown'
  | 'post_workout_summary'

export type SubstitutionReason = 'machine_busy' | 'unclear' | 'discomfort' | 'too_hard'

export interface TemplateWorkout {
  day_label: string
  name: string
  order_in_week: number
  duration_min_estimated: number
  /** Muscle groups / categories the LLM must fill for this session. */
  focus: string[]
}

export interface PlanTemplate {
  split_type: SplitType
  workouts_per_week: number
  workouts: TemplateWorkout[]
  week_structure: Record<string, string>
  notes_for_llm: string
}

// ─── LLM output schema (mirrors the JSON schema in migration) ───────────────

export interface LlmExerciseEntry {
  exercise_slug: string
  order_num: number
  sets: number
  reps_min: number
  reps_max: number
  rir_target: number
  rest_seconds: number
  technique_notes: string
  substitute_exercise_slugs: string[]
}

export interface LlmWorkoutEntry {
  day_label: string
  name: string
  order_in_week: number
  duration_min_estimated: number
  exercises: LlmExerciseEntry[]
}

export interface LlmProgressionRules {
  method: string
  add_weight_kg: number
  when: string
}

export interface TrainingPlanOutput {
  workouts: LlmWorkoutEntry[]
  week_structure: Record<string, string>
  progression_rules: LlmProgressionRules
  additional_notes: string
}

export interface GuidedWorkoutStep {
  step_type: GuidedStepType
  order_num: number
  title: string
  duration_min: number | null
  exercise_slug: string | null
  instruction_text: string
  setup_instructions: string | null
  execution_steps: string[]
  tempo_hint: string | null
  breathing_hint: string | null
  safety_notes: string | null
  common_mistakes: string | null
  easy_substitution_slug: string | null
  machine_busy_substitution_slug: string | null
  stop_conditions: string[]
  starting_load_guidance: string | null
  machine_settings: string | null
  is_new_skill: boolean
}

export interface GuidedWorkoutEntry {
  day_label: string
  name: string
  order_in_week: number
  duration_min_estimated: number
  confidence_goal: string
  steps: GuidedWorkoutStep[]
}

export interface GuidedTrainingPlanOutput {
  guided_mode: true
  view_mode: 'guided_beginner_view'
  adaptation_phase: AdaptationPhase
  workouts: GuidedWorkoutEntry[]
  week_structure: Record<string, string>
  progression_rules: LlmProgressionRules
  additional_notes: string
}

export type TrainingPlannerOutput = TrainingPlanOutput | GuidedTrainingPlanOutput

// ─── Catalog entry (from DB) ─────────────────────────────────────────────────

export interface ExerciseCatalogEntry {
  id: string
  slug: string
  name_pl: string
  plain_language_name?: string | null
  simple_goal_description?: string | null
  category: string
  primary_muscles: string[]
  equipment_required: string[]
  difficulty: string
  is_compound: boolean
  alternatives_slugs: string[]
  technique_notes?: string | null
  setup_instructions?: string | null
  execution_steps?: string[] | null
  tempo_hint?: string | null
  breathing_hint?: string | null
  safety_notes?: string | null
  common_mistakes?: string | null
  easy_substitution_slugs?: string[] | null
  machine_busy_substitution_slugs?: string[] | null
  stop_conditions?: string[] | null
  starting_load_guidance?: string | null
}

// ─── Profile subset needed by planner ───────────────────────────────────────

export interface PlannerProfile {
  user_id: string
  experience_level: ExperienceLevel | null
  primary_goal: PrimaryGoal | null
  days_per_week: number | null
  equipment_location: LocationType | null
  entry_path?: EntryPath | null
  adaptation_phase?: AdaptationPhase | null
  needs_guided_mode?: boolean
  clarity_score?: number | null
  confidence_score?: number | null
  trainer_consultation_completed_at?: string | null
  has_barbell: boolean
  has_dumbbells: boolean
  has_machines: boolean
  has_cables: boolean
  has_pullup_bar: boolean
  has_bench: boolean
  session_duration_min: number | null
  avoid_exercises: string[]
  injuries: string[]
}
