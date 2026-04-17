-- =============================================================
-- Migration: Check-in sessions + user_question_asks extension
-- Iteration 9 — Weekly Check-in + Adaptive Layer
-- Groups: 11 (checkin_sessions), 13 (user_question_asks extension)
-- =============================================================

-- ---------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE checkin_verdict AS ENUM (
    'on_track',
    'needs_adjustment',
    'plan_change_recommended'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_source AS ENUM (
    'contextual',
    'proactive',
    'checkin',
    'onboarding'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- GROUP 11 — CHECKIN SESSIONS
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.checkin_sessions (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_of               date          NOT NULL,

  -- Auto-aggregates from workout_logs (computed on GET /checkin/current)
  workouts_completed    integer,
  workouts_planned      integer,
  avg_workout_rating    numeric(3,1),

  -- Auto-aggregates from body_measurements
  weight_measurements   integer,
  weight_start_kg       numeric(5,2),
  weight_end_kg         numeric(5,2),
  weight_delta_kg       numeric(5,2),

  -- Subjective sliders 1-5
  subjective_energy     integer       CHECK (subjective_energy BETWEEN 1 AND 5),
  subjective_recovery   integer       CHECK (subjective_recovery BETWEEN 1 AND 5),
  subjective_motivation integer       CHECK (subjective_motivation BETWEEN 1 AND 5),
  subjective_stress     integer       CHECK (subjective_stress BETWEEN 1 AND 5),
  subjective_sleep      integer       CHECK (subjective_sleep BETWEEN 1 AND 5),

  -- Free text (3 fields)
  wins_text             text,
  struggles_text        text,
  focus_next_week       text,

  -- LLM Analysis output
  verdict               checkin_verdict,
  verdict_summary       text,
  recommended_action    text,
  plan_change_needed    boolean       NOT NULL DEFAULT false,
  plan_change_details   jsonb,

  -- Meta
  submitted_at          timestamptz,
  analysis_at           timestamptz,
  llm_call_id           uuid          REFERENCES public.llm_calls(id) ON DELETE SET NULL,

  created_at            timestamptz   NOT NULL DEFAULT now(),

  UNIQUE (user_id, week_of)
);

CREATE INDEX IF NOT EXISTS checkin_sessions_user_week_idx
  ON public.checkin_sessions (user_id, week_of DESC);

ALTER TABLE public.checkin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkin_sessions_select_own"
  ON public.checkin_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "checkin_sessions_insert_own"
  ON public.checkin_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkin_sessions_update_own"
  ON public.checkin_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- GROUP 13 — user_question_asks extension
-- Add source + checkin_session_id for contextual tracking
-- ---------------------------------------------------------------

ALTER TABLE public.user_question_asks
  ADD COLUMN IF NOT EXISTS source         question_source,
  ADD COLUMN IF NOT EXISTS checkin_session_id uuid REFERENCES public.checkin_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_question_asks_session_idx
  ON public.user_question_asks (checkin_session_id)
  WHERE checkin_session_id IS NOT NULL;

-- ---------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------
-- ALTER TABLE public.user_question_asks DROP COLUMN IF EXISTS checkin_session_id;
-- ALTER TABLE public.user_question_asks DROP COLUMN IF EXISTS source;
-- DROP INDEX IF EXISTS public.checkin_sessions_user_week_idx;
-- DROP TABLE IF EXISTS public.checkin_sessions;
-- DROP TYPE IF EXISTS question_source;
-- DROP TYPE IF EXISTS checkin_verdict;
