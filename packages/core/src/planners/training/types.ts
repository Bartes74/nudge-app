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
export type CommunicationMaturity = 'novice' | 'developing' | 'independent' | 'advanced'
export type TrainingMaturity = 'novice' | 'building' | 'progressing' | 'advanced'
export type ProgressionBias = 'slow_down' | 'hold' | 'progress'
export type FeedbackTheme =
  | 'clarity_issue'
  | 'tempo_issue'
  | 'equipment_issue'
  | 'confidence_drop'
  | 'too_hard'
  | 'recovery_issue'
  | 'exercise_disliked'
  | 'pain_or_red_flag'

export type GuidedStepType =
  | 'arrival_prep'
  | 'warmup'
  | 'main_block'
  | 'cooldown'
  | 'post_workout_summary'

export type SubstitutionReason = 'machine_busy' | 'unclear' | 'discomfort' | 'too_hard'

export interface GuidedStepVariant {
  key: string
  label: string
  duration_min?: number | null
  instruction_text?: string | null
  setup_instructions?: string | null
  execution_steps?: string[]
  tempo_hint?: string | null
  breathing_hint?: string | null
  safety_notes?: string | null
  common_mistakes?: string | null
  machine_settings?: string | null
  normal_after_effects?: string[]
  finish_steps?: string[]
}

export interface GuidedStepMachineBusyPolicy {
  prompt: string
  options: GuidedStepVariant[]
}

export interface GuidedStepSupportPolicy {
  packlist?: string[]
  reassurance?: string[]
  normal_after_effects?: string[]
  finish_steps?: string[]
}

export interface GuidedStepSubstitutionPolicy {
  hide_actions?: boolean
  auto_variant?: 'easy_when_low_readiness' | null
  easy?: GuidedStepVariant | string | null
  machine_busy?: GuidedStepMachineBusyPolicy | string | null
  support?: GuidedStepSupportPolicy | null
}

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
  substitution_policy?: GuidedStepSubstitutionPolicy | null
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

export interface RecentWorkoutSummary {
  workout_log_id: string
  started_at: string
  ended_at: string | null
  duration_min: number | null
  overall_rating: number | null
  clarity_score: number | null
  confidence_score: number | null
  felt_safe: boolean | null
  exercise_confusion_flag: boolean
  machine_confusion_flag: boolean
  too_hard_flag: boolean
  pain_flag: boolean
  ready_for_next_workout: boolean | null
  went_well: string | null
  went_poorly: string | null
  what_to_improve: string | null
}

export interface ExerciseHistorySession {
  exercise_slug: string
  exercise_name: string | null
  category: string | null
  primary_muscles: string[]
  started_at: string
  was_substituted: boolean
  max_weight_kg: number | null
  total_reps: number
  target_total_reps: number | null
  hit_top_of_range: boolean
}

export interface ExerciseHistorySummary {
  exercise_slug: string
  exercise_name: string | null
  category: string | null
  primary_muscles: string[]
  sessions_completed: number
  last_started_at: string | null
  substitutions: number
  last_weight_kg: number | null
  max_weight_kg: number | null
  avg_total_reps: number | null
  progression_action: 'weight' | 'reps' | 'deload' | 'hold' | 'none'
  progression_reason: string | null
  hit_top_recently: boolean
}

export interface MuscleBalanceSummary {
  category_counts: Record<string, number>
  primary_muscle_counts: Record<string, number>
  undertrained_categories: string[]
  overtrained_categories: string[]
  undertrained_muscles: string[]
  overtrained_muscles: string[]
}

export interface PlannerBehaviorSignals {
  workout_completion_rate_7d: number | null
  workout_completion_rate_30d: number | null
  clarity_score_avg_7d: number | null
  confidence_score_avg_7d: number | null
  substitution_count_7d: number | null
  substitution_count_30d: number | null
  pain_flag_count_7d: number | null
  too_hard_flag_count_7d: number | null
  days_since_last_workout_log: number | null
  avg_session_length_sec: number | null
}

export interface WorkoutFeedbackInsight {
  workout_log_id: string | null
  summary: string | null
  themes: FeedbackTheme[]
  recommended_focus: string | null
  needs_more_guidance: boolean
  needs_lower_intensity: boolean
  confidence_drop: boolean
  recovery_issue: boolean
  exercise_slugs_to_avoid: string[]
}

export interface CommunicationProfile {
  guidance_level: 'full' | 'supported' | 'concise'
  technicality: 'plain' | 'balanced' | 'technical'
  tone_preset:
    | 'warm_encouraging'
    | 'partnering'
    | 'factual_technical'
    | 'calm_guided'
  explanation_depth: 'high' | 'medium' | 'low'
}

export interface AdaptationSnapshot {
  training_maturity: TrainingMaturity
  communication_maturity: CommunicationMaturity
  progression_bias: ProgressionBias
  requires_more_guidance: boolean
  can_introduce_new_skills: boolean
  should_reduce_novelty: boolean
  latest_feedback_themes: FeedbackTheme[]
  avoid_exercise_slugs: string[]
  preferred_focus: string[]
  rationale: string[]
}

export interface TrainingPlannerContext {
  profile: PlannerProfile
  recent_workouts: RecentWorkoutSummary[]
  exercise_history: ExerciseHistorySummary[]
  muscle_balance: MuscleBalanceSummary
  recent_feedback: WorkoutFeedbackInsight[]
  behavior_signals: PlannerBehaviorSignals
  communication: CommunicationProfile
  adaptation: AdaptationSnapshot
}

export interface StandardWorkoutPreparationCopy {
  day_label: string
  order_in_week: number
  confidence_goal: string | null
  warmup_notes: string | null
  cooldown_notes: string | null
}

export interface PreparedWorkoutBrief extends StandardWorkoutPreparationCopy {}

export interface PreparedGuidedStepContent {
  order_num: number
  title: string
  instruction_text: string
  setup_instructions: string | null
  execution_steps: string[]
  tempo_hint: string | null
  breathing_hint: string | null
  safety_notes: string | null
  common_mistakes: string | null
  stop_conditions: string[]
  machine_settings: string | null
  starting_load_guidance: string | null
}

export interface GuidedWorkoutContent {
  day_label: string
  order_in_week: number
  confidence_goal: string
  steps: PreparedGuidedStepContent[]
}
