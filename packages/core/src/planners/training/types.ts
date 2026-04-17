import type { ExperienceLevel, PrimaryGoal, LocationType } from '../../domain/profile'

// ─── Template (input to LLM) ────────────────────────────────────────────────

export type SplitType = 'fbw' | 'upper_lower' | 'ppl' | 'split'

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

// ─── Catalog entry (from DB) ─────────────────────────────────────────────────

export interface ExerciseCatalogEntry {
  id: string
  slug: string
  name_pl: string
  category: string
  primary_muscles: string[]
  equipment_required: string[]
  difficulty: string
  is_compound: boolean
  alternatives_slugs: string[]
}

// ─── Profile subset needed by planner ───────────────────────────────────────

export interface PlannerProfile {
  user_id: string
  experience_level: ExperienceLevel | null
  primary_goal: PrimaryGoal | null
  days_per_week: number | null
  equipment_location: LocationType | null
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
