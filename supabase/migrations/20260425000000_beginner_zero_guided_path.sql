-- =============================================================
-- Migration: Beginner Zero guided path
-- Iteration 10+ — guided beginner path, progression quality, safety audit
-- =============================================================

-- ---------------------------------------------------------------
-- ENUM UPDATES
-- ---------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'experience_level' AND e.enumlabel = 'zero'
  ) THEN
    ALTER TYPE experience_level RENAME VALUE 'zero' TO 'beginner_zero';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'experience_level' AND e.enumlabel = 'amateur'
  ) THEN
    ALTER TYPE experience_level RENAME VALUE 'amateur' TO 'intermediate';
  END IF;
END $$;

-- tone_preset 'calm_guided' is added in 20260424900000_tone_preset_calm_guided.sql
-- (Postgres forbids using a new enum value in the same transaction that adds it)

DO $$ BEGIN
  CREATE TYPE entry_path AS ENUM ('guided_beginner', 'standard_training');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE adaptation_phase AS ENUM (
    'phase_0_familiarization',
    'phase_1_adaptation',
    'phase_2_foundations'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan_view_mode AS ENUM ('guided_beginner_view', 'standard_training_view');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE guided_step_type AS ENUM (
    'arrival_prep',
    'warmup',
    'main_block',
    'cooldown',
    'post_workout_summary'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE substitution_reason AS ENUM (
    'machine_busy',
    'unclear',
    'discomfort',
    'too_hard'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_type AS ENUM (
    'slow_down',
    'repeat_similar_session',
    'show_more_guidance',
    'trainer_consultation',
    'simplify_plan',
    'introduce_new_machine',
    'introduce_strength_basics'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- PROFILE AND SNAPSHOT EXTENSIONS
-- ---------------------------------------------------------------

ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS entry_path entry_path,
  ADD COLUMN IF NOT EXISTS adaptation_phase adaptation_phase,
  ADD COLUMN IF NOT EXISTS needs_guided_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inferred_beginner_status boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inferred_beginner_reason_codes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trainer_consultation_recommended_at timestamptz,
  ADD COLUMN IF NOT EXISTS trainer_consultation_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS trainer_feedback_notes text;

UPDATE public.user_profile
SET
  entry_path = COALESCE(entry_path, 'standard_training'),
  needs_guided_mode = COALESCE(needs_guided_mode, false),
  inferred_beginner_status = COALESCE(inferred_beginner_status, false)
WHERE true;

ALTER TABLE public.user_segment_snapshots
  ADD COLUMN IF NOT EXISTS entry_path entry_path,
  ADD COLUMN IF NOT EXISTS adaptation_phase adaptation_phase;

UPDATE public.user_segment_snapshots
SET segment_key = REPLACE(REPLACE(segment_key, 'zero_', 'beginner_zero_'), 'amateur_', 'intermediate_')
WHERE segment_key IS NOT NULL;

-- ---------------------------------------------------------------
-- MISSING PREFERENCE TABLES
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_training_preferences (
  user_id               uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  days_per_week         integer,
  session_duration_min  integer,
  liked_exercises       text[] NOT NULL DEFAULT '{}',
  disliked_exercises    text[] NOT NULL DEFAULT '{}',
  avoid_exercises       text[] NOT NULL DEFAULT '{}',
  preferred_location    location_type,
  prefers_guided_mode   boolean NOT NULL DEFAULT false,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_training_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_training_preferences_select_own"
  ON public.user_training_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_training_preferences_insert_own"
  ON public.user_training_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_training_preferences_update_own"
  ON public.user_training_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_nutrition_preferences (
  user_id                 uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  nutrition_mode          nutrition_mode,
  prioritize_regular_meals boolean NOT NULL DEFAULT true,
  prioritize_protein      boolean NOT NULL DEFAULT true,
  prioritize_hydration    boolean NOT NULL DEFAULT true,
  preferred_meal_count    integer,
  avoid_foods             text[] NOT NULL DEFAULT '{}',
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_nutrition_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_nutrition_preferences_select_own"
  ON public.user_nutrition_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_nutrition_preferences_insert_own"
  ON public.user_nutrition_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_nutrition_preferences_update_own"
  ON public.user_nutrition_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- AI DECISIONS AND SAFETY AUDIT
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_decisions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ai_task_id           uuid REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  llm_call_id          uuid REFERENCES public.llm_calls(id) ON DELETE SET NULL,
  recommendation_type  recommendation_type NOT NULL,
  entry_path           entry_path,
  adaptation_phase     adaptation_phase,
  input_snapshot       jsonb,
  decision_payload     jsonb,
  rationale            text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_decisions_user_created_idx
  ON public.ai_decisions (user_id, created_at DESC);

ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_decisions_select_own"
  ON public.ai_decisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_decisions_insert_own"
  ON public.ai_decisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.safety_escalations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source              text,
  symptom_codes       text[] NOT NULL DEFAULT '{}',
  severity            severity_level NOT NULL DEFAULT 'warning',
  status              text NOT NULL DEFAULT 'open',
  blocked_progression boolean NOT NULL DEFAULT true,
  recommended_action  text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  resolved_at         timestamptz
);

CREATE INDEX IF NOT EXISTS safety_escalations_user_created_idx
  ON public.safety_escalations (user_id, created_at DESC);

ALTER TABLE public.safety_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "safety_escalations_select_own"
  ON public.safety_escalations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "safety_escalations_insert_own"
  ON public.safety_escalations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "safety_escalations_update_own"
  ON public.safety_escalations FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- TRAINING PLAN EXTENSIONS FOR GUIDED MODE
-- ---------------------------------------------------------------

ALTER TABLE public.training_plan_versions
  ADD COLUMN IF NOT EXISTS guided_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adaptation_phase adaptation_phase,
  ADD COLUMN IF NOT EXISTS view_mode plan_view_mode NOT NULL DEFAULT 'standard_training_view';

ALTER TABLE public.plan_workouts
  ADD COLUMN IF NOT EXISTS confidence_goal text;

CREATE TABLE IF NOT EXISTS public.plan_workout_steps (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_workout_id        uuid NOT NULL REFERENCES public.plan_workouts(id) ON DELETE CASCADE,
  step_type              guided_step_type NOT NULL,
  order_num              integer NOT NULL DEFAULT 1,
  title                  text NOT NULL,
  duration_min           integer,
  exercise_id            uuid REFERENCES public.exercises(id) ON DELETE SET NULL,
  instruction_text       text NOT NULL,
  setup_instructions     text,
  execution_steps        text[] NOT NULL DEFAULT '{}',
  tempo_hint             text,
  breathing_hint         text,
  safety_notes           text,
  common_mistakes        text,
  stop_conditions        text[] NOT NULL DEFAULT '{}',
  machine_settings       text,
  substitution_policy    jsonb,
  starting_load_guidance text,
  is_new_skill           boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS plan_workout_steps_workout_idx
  ON public.plan_workout_steps (plan_workout_id, order_num);

ALTER TABLE public.plan_workout_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_workout_steps_select_own"
  ON public.plan_workout_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.plan_workouts pw
      JOIN public.training_plan_versions tpv ON tpv.id = pw.plan_version_id
      JOIN public.training_plans tp ON tp.id = tpv.plan_id
      WHERE pw.id = plan_workout_id AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "plan_workout_steps_insert_own"
  ON public.plan_workout_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.plan_workouts pw
      JOIN public.training_plan_versions tpv ON tpv.id = pw.plan_version_id
      JOIN public.training_plans tp ON tp.id = tpv.plan_id
      WHERE pw.id = plan_workout_id AND tp.user_id = auth.uid()
    )
  );

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS plain_language_name text,
  ADD COLUMN IF NOT EXISTS simple_goal_description text,
  ADD COLUMN IF NOT EXISTS setup_instructions text,
  ADD COLUMN IF NOT EXISTS execution_steps text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tempo_hint text,
  ADD COLUMN IF NOT EXISTS breathing_hint text,
  ADD COLUMN IF NOT EXISTS safety_notes text,
  ADD COLUMN IF NOT EXISTS easy_substitution_slugs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS machine_busy_substitution_slugs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stop_conditions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS starting_load_guidance text;

-- ---------------------------------------------------------------
-- WORKOUT LOGS AND QUALITY-BASED SIGNALS
-- ---------------------------------------------------------------

ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS clarity_score integer CHECK (clarity_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS confidence_score integer CHECK (confidence_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS felt_safe boolean,
  ADD COLUMN IF NOT EXISTS exercise_confusion_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS machine_confusion_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS too_hard_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pain_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ready_for_next_workout boolean,
  ADD COLUMN IF NOT EXISTS tempo_feedback text;

ALTER TABLE public.behavior_signals
  ADD COLUMN IF NOT EXISTS clarity_score_avg_7d numeric(3,2),
  ADD COLUMN IF NOT EXISTS clarity_score_avg_14d numeric(3,2),
  ADD COLUMN IF NOT EXISTS clarity_score_avg_30d numeric(3,2),
  ADD COLUMN IF NOT EXISTS confidence_score_avg_7d numeric(3,2),
  ADD COLUMN IF NOT EXISTS confidence_score_avg_14d numeric(3,2),
  ADD COLUMN IF NOT EXISTS confidence_score_avg_30d numeric(3,2),
  ADD COLUMN IF NOT EXISTS exercise_confusion_count_7d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exercise_confusion_count_14d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exercise_confusion_count_30d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS machine_confusion_count_7d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS substitution_count_7d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS substitution_count_14d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS substitution_count_30d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aborted_exercise_count_7d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pain_flag_count_7d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pain_flag_count_14d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pain_flag_count_30d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS too_hard_flag_count_7d integer NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------
-- PROMPTS FOR GUIDED BEGINNER MODE
-- ---------------------------------------------------------------

INSERT INTO public.prompts (slug, version, purpose, system_template, user_template, output_schema, tone_preset)
VALUES (
  'guided_beginner_plan_fill',
  1,
  'Guided beginner-zero training plan with step-by-step instructions.',
  'Jesteś spokojnym, bardzo konkretnym trenerem wprowadzającym. Tworzysz plan dla osoby beginner_zero.

PRIORYTETY:
1. Bezpieczeństwo.
2. Zrozumienie.
3. Regularność.
4. Pewność siebie.
5. Dopiero potem progresja.

ZASADY:
- Nie zawstydzaj użytkownika i nie zakładaj wiedzy treningowej.
- Nie używaj żargonu typu RPE, RIR, objętość, split, periodyzacja.
- Każdy trening ma być prowadzony krok po kroku.
- W pierwszych tygodniach ogranicz nowe ruchy do maksimum 1-2 na sesję.
- Preferuj proste cardio, maszyny prowadzone, mobilizację i bardzo proste ćwiczenia.
- Nie proponuj martwego ciągu, przysiadu ze sztangą, wyciskania wolnym ciężarem, podciągania ani złożonych superserii na start.
- Dla ćwiczeń oporowych zawsze podaj jasną instrukcję doboru ciężaru startowego.
- Dla cardio rozpisuj kroki minutowe.
- Każdy krok ma zawierać: co robić teraz, jak ustawić sprzęt, kiedy odpocząć, co dalej.',
  'PROFIL UŻYTKOWNIKA:
{{profile_summary}}

FAZA STARTOWA:
{{adaptation_phase}}

SZKIELET PLANU:
{{template_structure}}

DOSTĘPNE ĆWICZENIA:
{{available_exercises}}',
  '{"type":"object"}'::jsonb,
  'calm_guided'
)
ON CONFLICT (slug, version) DO NOTHING;

INSERT INTO public.prompts (slug, version, purpose, system_template, user_template, output_schema, tone_preset)
VALUES (
  'trainer_consultation_prompt',
  1,
  'Prepare a calm trainer consultation handoff for guided beginner users.',
  'Jesteś wspierającym trenerem. Wyjaśnij po polsku, po co warto porozmawiać z trenerem na siłowni, co powiedzieć o sobie, jakie postępy zgłosić, jakie trudności zgłosić i o co zapytać. Ton: prosty, spokojny, nieoceniający, bardzo konkretny.',
  'KONTEKST UŻYTKOWNIKA:
{{profile_summary}}

POWTARZAJĄCE SIĘ TRUDNOŚCI:
{{difficulty_summary}}',
  '{"type":"object"}'::jsonb,
  'calm_guided'
)
ON CONFLICT (slug, version) DO NOTHING;

-- =============================================================
-- down (manual rollback notes):
-- 1. Drop policies and tables:
--    plan_workout_steps, safety_escalations, ai_decisions,
--    user_nutrition_preferences, user_training_preferences
-- 2. Drop newly added columns from user_profile, user_segment_snapshots,
--    training_plan_versions, plan_workouts, exercises, workout_logs,
--    behavior_signals
-- 3. Rename enum values on experience_level:
--    beginner_zero -> zero, intermediate -> amateur
-- 4. Drop enum values/types:
--    calm_guided from tone_preset cannot be removed without recreating enum;
--    recreate tone_preset, entry_path, adaptation_phase, plan_view_mode,
--    guided_step_type, substitution_reason, recommendation_type if needed.
-- =============================================================
