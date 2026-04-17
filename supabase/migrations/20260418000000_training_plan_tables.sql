-- =============================================================
-- Migration: Training plan tables + AI infrastructure
-- Iteration 4 — Plan treningowy
-- Groups: 6 (exercises), 7 (training plans), 15 (ai_tasks, llm_calls, prompts)
-- =============================================================

-- ---------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE exercise_category AS ENUM (
    'push','pull','legs','core','cardio','mobility','full_body'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE difficulty AS ENUM ('beginner','intermediate','advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_task_type AS ENUM (
    'generate_training_plan','generate_nutrition_plan','analyze_meal_photo',
    'weekly_checkin_analysis','pick_next_question','classify_intent',
    'proactive_nudge','recalculate_targets'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_task_status AS ENUM (
    'queued','running','completed','failed','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- GROUP 15 — AI TASKS, LLM CALLS, PROMPTS
-- (referenced by group 7, so must come first)
-- ---------------------------------------------------------------

-- prompts — versioned prompt templates
CREATE TABLE IF NOT EXISTS public.prompts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text        NOT NULL,
  version        integer     NOT NULL,
  purpose        text,
  system_template text,
  user_template  text,
  output_schema  jsonb,
  tone_preset    tone_preset,
  created_at     timestamptz NOT NULL DEFAULT now(),
  deprecated     boolean     NOT NULL DEFAULT false,

  CONSTRAINT prompts_slug_version_unique UNIQUE (slug, version)
);

-- No RLS on prompts — global catalog, read-only for clients via service role

-- ai_tasks — async task queue records
CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  task_type       ai_task_type  NOT NULL,
  status          ai_task_status NOT NULL DEFAULT 'queued',
  input_payload   jsonb,
  output_payload  jsonb,
  error           text,
  queued_at       timestamptz   NOT NULL DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS ai_tasks_user_type_queued_idx
  ON public.ai_tasks (user_id, task_type, queued_at);
CREATE INDEX IF NOT EXISTS ai_tasks_status_idx
  ON public.ai_tasks (status);

ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_tasks_select_own"
  ON public.ai_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_tasks_insert_own"
  ON public.ai_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- llm_calls — full audit of every LLM invocation
CREATE TABLE IF NOT EXISTS public.llm_calls (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        REFERENCES public.users (id) ON DELETE SET NULL,
  ai_task_id            uuid        REFERENCES public.ai_tasks (id) ON DELETE SET NULL,
  provider              text        NOT NULL,
  model                 text        NOT NULL,
  prompt_id             uuid        REFERENCES public.prompts (id) ON DELETE SET NULL,
  prompt_version        integer,
  tokens_in             integer,
  tokens_out            integer,
  cost_usd              numeric(10,6),
  latency_ms            integer,
  used_structured_output boolean    NOT NULL DEFAULT false,
  output_valid          boolean     NOT NULL DEFAULT true,
  retries               integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS llm_calls_user_created_idx
  ON public.llm_calls (user_id, created_at);
CREATE INDEX IF NOT EXISTS llm_calls_provider_model_idx
  ON public.llm_calls (provider, model, created_at);

ALTER TABLE public.llm_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "llm_calls_select_own"
  ON public.llm_calls FOR SELECT
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- GROUP 6 — EXERCISE CATALOG (global, no RLS)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.exercises (
  id                  uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text              NOT NULL UNIQUE,
  name_pl             text              NOT NULL,
  name_en             text,
  category            exercise_category,
  primary_muscles     text[]            NOT NULL DEFAULT '{}',
  secondary_muscles   text[]            NOT NULL DEFAULT '{}',
  equipment_required  text[]            NOT NULL DEFAULT '{}',
  difficulty          difficulty,
  is_compound         boolean           NOT NULL DEFAULT false,
  technique_notes     text,
  common_mistakes     text,
  video_url           text,
  alternatives_slugs  text[]            NOT NULL DEFAULT '{}',
  tags                text[]            NOT NULL DEFAULT '{}',
  created_at          timestamptz       NOT NULL DEFAULT now(),
  deprecated          boolean           NOT NULL DEFAULT false
);

-- exercises are global — no RLS needed, service role writes, anon can read
-- (enforced by api layer, not RLS)

-- ---------------------------------------------------------------
-- GROUP 7 — TRAINING PLANS (versioned)
-- ---------------------------------------------------------------

-- training_plans container (one active per user)
CREATE TABLE IF NOT EXISTS public.training_plans (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name               text,
  current_version_id uuid,
  started_at         timestamptz NOT NULL DEFAULT now(),
  ended_at           timestamptz,
  is_active          boolean     NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS training_plans_user_active_idx
  ON public.training_plans (user_id, is_active);

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_plans_select_own"
  ON public.training_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "training_plans_insert_own"
  ON public.training_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "training_plans_update_own"
  ON public.training_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- training_plan_versions — immutable snapshots of a plan
CREATE TABLE IF NOT EXISTS public.training_plan_versions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id               uuid        NOT NULL REFERENCES public.training_plans (id) ON DELETE CASCADE,
  version_number        integer     NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  created_by_ai_task_id uuid        REFERENCES public.ai_tasks (id) ON DELETE SET NULL,
  change_reason         text,
  goal_snapshot         jsonb,
  assumptions_snapshot  jsonb,
  progression_rules     jsonb,
  week_structure        jsonb,
  additional_notes      text,
  llm_call_id           uuid        REFERENCES public.llm_calls (id) ON DELETE SET NULL,

  CONSTRAINT plan_versions_plan_version_unique UNIQUE (plan_id, version_number)
);

CREATE INDEX IF NOT EXISTS plan_versions_plan_id_idx
  ON public.training_plan_versions (plan_id, version_number);

ALTER TABLE public.training_plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_versions_select_own"
  ON public.training_plan_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.training_plans tp
      WHERE tp.id = plan_id AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "plan_versions_insert_own"
  ON public.training_plan_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_plans tp
      WHERE tp.id = plan_id AND tp.user_id = auth.uid()
    )
  );

-- FK from training_plans.current_version_id — add after versions table exists
ALTER TABLE public.training_plans
  ADD CONSTRAINT training_plans_current_version_fk
  FOREIGN KEY (current_version_id)
  REFERENCES public.training_plan_versions (id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- plan_workouts — individual sessions within a version
CREATE TABLE IF NOT EXISTS public.plan_workouts (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id       uuid        NOT NULL REFERENCES public.training_plan_versions (id) ON DELETE CASCADE,
  day_label             text,
  order_in_week         integer     NOT NULL DEFAULT 1,
  name                  text,
  duration_min_estimated integer,
  warmup_notes          text,
  cooldown_notes        text
);

CREATE INDEX IF NOT EXISTS plan_workouts_version_idx
  ON public.plan_workouts (plan_version_id, order_in_week);

ALTER TABLE public.plan_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_workouts_select_own"
  ON public.plan_workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.training_plan_versions tpv
      JOIN public.training_plans tp ON tp.id = tpv.plan_id
      WHERE tpv.id = plan_version_id AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "plan_workouts_insert_own"
  ON public.plan_workouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.training_plan_versions tpv
      JOIN public.training_plans tp ON tp.id = tpv.plan_id
      WHERE tpv.id = plan_version_id AND tp.user_id = auth.uid()
    )
  );

-- plan_exercises — exercises within a workout
CREATE TABLE IF NOT EXISTS public.plan_exercises (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_workout_id         uuid        NOT NULL REFERENCES public.plan_workouts (id) ON DELETE CASCADE,
  exercise_id             uuid        REFERENCES public.exercises (id) ON DELETE SET NULL,
  order_num               integer     NOT NULL DEFAULT 1,
  sets                    integer,
  reps_min                integer,
  reps_max                integer,
  rir_target              numeric(3,1),
  rpe_target              numeric(3,1),
  rest_seconds            integer,
  tempo                   text,
  technique_notes         text,
  substitute_exercise_ids uuid[]      NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS plan_exercises_workout_idx
  ON public.plan_exercises (plan_workout_id, order_num);

ALTER TABLE public.plan_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_exercises_select_own"
  ON public.plan_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.plan_workouts pw
      JOIN public.training_plan_versions tpv ON tpv.id = pw.plan_version_id
      JOIN public.training_plans tp ON tp.id = tpv.plan_id
      WHERE pw.id = plan_workout_id AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "plan_exercises_insert_own"
  ON public.plan_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.plan_workouts pw
      JOIN public.training_plan_versions tpv ON tpv.id = pw.plan_version_id
      JOIN public.training_plans tp ON tp.id = tpv.plan_id
      WHERE pw.id = plan_workout_id AND tp.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- SEED: training_plan_fill prompt v1
-- ---------------------------------------------------------------

INSERT INTO public.prompts (slug, version, purpose, system_template, user_template, output_schema)
VALUES (
  'training_plan_fill',
  1,
  'Fill a training plan template with concrete exercises using LLM structured output.',
  'Jesteś doświadczonym trenerem personalnym i tworzysz plan treningowy dla użytkownika.

ZASADY BEZWZGLĘDNE:
1. Używaj WYŁĄCZNIE ćwiczeń z dostarczonego katalogu (pole exercise_slug musi być jednym z dostępnych slug-ów).
2. Nie halucynuj ćwiczeń spoza katalogu.
3. Dopasuj język techniki do poziomu: dla zero/beginner — proste zdania, zero skrótów (RIR, RPE, TUT). Dla amateur/advanced — można używać terminologii.
4. RIR (Reps In Reserve): beginner 3-4, amateur 2-3, advanced 1-2.
5. Przerwy: ćwiczenia wielostawowe 90-180s, izolacje 60-90s.
6. Seria: zawsze podawaj liczbę serii, min-max repsów, RIR.
7. Każde ćwiczenie musi mieć 1-3 zamienniki z katalogu.
8. technique_notes: 1-2 zdania w języku polskim, konkretne i przyjazne.
9. Plan musi uwzględniać sprzęt dostępny użytkownikowi.
10. Nie przekraczaj czasów sesji podanych w szablonie.',
  'PROFIL UŻYTKOWNIKA:
{{profile_summary}}

SZABLON PLANU (do wypełnienia):
{{template_structure}}

DOSTĘPNE ĆWICZENIA Z KATALOGU (użyj TYLKO tych slug-ów):
{{available_exercises}}

Wygeneruj plan zgodnie ze schematem JSON.',
  '{
  "type": "object",
  "required": ["workouts", "week_structure", "progression_rules", "additional_notes"],
  "properties": {
    "workouts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["day_label", "name", "order_in_week", "duration_min_estimated", "exercises"],
        "properties": {
          "day_label": {"type": "string"},
          "name": {"type": "string"},
          "order_in_week": {"type": "integer"},
          "duration_min_estimated": {"type": "integer"},
          "exercises": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["exercise_slug","order_num","sets","reps_min","reps_max","rir_target","rest_seconds","technique_notes","substitute_exercise_slugs"],
              "properties": {
                "exercise_slug": {"type": "string"},
                "order_num": {"type": "integer"},
                "sets": {"type": "integer"},
                "reps_min": {"type": "integer"},
                "reps_max": {"type": "integer"},
                "rir_target": {"type": "number"},
                "rest_seconds": {"type": "integer"},
                "technique_notes": {"type": "string"},
                "substitute_exercise_slugs": {"type": "array", "items": {"type": "string"}}
              }
            }
          }
        }
      }
    },
    "week_structure": {"type": "object", "additionalProperties": {"type": "string"}},
    "progression_rules": {
      "type": "object",
      "required": ["method", "add_weight_kg", "when"],
      "properties": {
        "method": {"type": "string"},
        "add_weight_kg": {"type": "number"},
        "when": {"type": "string"}
      }
    },
    "additional_notes": {"type": "string"}
  }
}'
)
ON CONFLICT (slug, version) DO NOTHING;

-- =============================================================
-- down:
-- ALTER TABLE public.training_plans DROP CONSTRAINT IF EXISTS training_plans_current_version_fk;
-- DROP TABLE IF EXISTS public.plan_exercises;
-- DROP TABLE IF EXISTS public.plan_workouts;
-- DROP TABLE IF EXISTS public.training_plan_versions;
-- DROP TABLE IF EXISTS public.training_plans;
-- DROP TABLE IF EXISTS public.exercises;
-- DROP TABLE IF EXISTS public.llm_calls;
-- DROP TABLE IF EXISTS public.ai_tasks;
-- DROP TABLE IF EXISTS public.prompts;
-- DROP TYPE IF EXISTS ai_task_status;
-- DROP TYPE IF EXISTS ai_task_type;
-- DROP TYPE IF EXISTS difficulty;
-- DROP TYPE IF EXISTS exercise_category;
-- =============================================================
