-- =============================================================
-- Migration: Workout logs + behavior signals
-- Iteration 5 — Workout Logger
-- Groups: 8 (workout_logs, workout_log_exercises, workout_log_sets),
--         12 (behavior_signals)
-- =============================================================

-- ---------------------------------------------------------------
-- ENUMS (new ones for this migration)
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE pre_mood AS ENUM ('bad', 'ok', 'good', 'great');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE energy_level AS ENUM ('low', 'moderate', 'high', 'variable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- GROUP 8 — WORKOUT LOGS
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  plan_workout_id   uuid        REFERENCES public.plan_workouts (id) ON DELETE SET NULL,
  started_at        timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz,
  duration_min      integer,
  pre_mood          pre_mood,
  pre_energy        energy_level,
  overall_rating    integer     CHECK (overall_rating BETWEEN 1 AND 5),
  went_well         text,
  went_poorly       text,
  what_to_improve   text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_logs_user_started_idx
  ON public.workout_logs (user_id, started_at DESC);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_logs_select_own"
  ON public.workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "workout_logs_insert_own"
  ON public.workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_logs_update_own"
  ON public.workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- workout_log_exercises — which exercises were done in a session
CREATE TABLE IF NOT EXISTS public.workout_log_exercises (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id        uuid    NOT NULL REFERENCES public.workout_logs (id) ON DELETE CASCADE,
  exercise_id           uuid    REFERENCES public.exercises (id) ON DELETE SET NULL,
  plan_exercise_id      uuid    REFERENCES public.plan_exercises (id) ON DELETE SET NULL,
  order_num             integer NOT NULL DEFAULT 1,
  notes                 text,
  was_substituted       boolean NOT NULL DEFAULT false,
  original_exercise_id  uuid    REFERENCES public.exercises (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS workout_log_exercises_log_idx
  ON public.workout_log_exercises (workout_log_id, order_num);

CREATE INDEX IF NOT EXISTS workout_log_exercises_exercise_idx
  ON public.workout_log_exercises (exercise_id);

ALTER TABLE public.workout_log_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_log_exercises_select_own"
  ON public.workout_log_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_log_exercises_insert_own"
  ON public.workout_log_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_log_exercises_update_own"
  ON public.workout_log_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()
    )
  );

-- workout_log_sets — individual sets: weight, reps, RIR
CREATE TABLE IF NOT EXISTS public.workout_log_sets (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_exercise_id   uuid        NOT NULL REFERENCES public.workout_log_exercises (id) ON DELETE CASCADE,
  set_number                integer     NOT NULL,
  weight_kg                 numeric(5,2),
  reps                      integer,
  rir                       numeric(3,1),
  to_failure                boolean     NOT NULL DEFAULT false,
  duration_sec              integer,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_log_sets_exercise_idx
  ON public.workout_log_sets (workout_log_exercise_id, set_number);

ALTER TABLE public.workout_log_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_log_sets_select_own"
  ON public.workout_log_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_log_exercises wle
      JOIN public.workout_logs wl ON wl.id = wle.workout_log_id
      WHERE wle.id = workout_log_exercise_id AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_log_sets_insert_own"
  ON public.workout_log_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workout_log_exercises wle
      JOIN public.workout_logs wl ON wl.id = wle.workout_log_id
      WHERE wle.id = workout_log_exercise_id AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_log_sets_update_own"
  ON public.workout_log_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_log_exercises wle
      JOIN public.workout_logs wl ON wl.id = wle.workout_log_id
      WHERE wle.id = workout_log_exercise_id AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_log_sets_delete_own"
  ON public.workout_log_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_log_exercises wle
      JOIN public.workout_logs wl ON wl.id = wle.workout_log_id
      WHERE wle.id = workout_log_exercise_id AND wl.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- GROUP 12 — BEHAVIOR SIGNALS
-- One row per user, updated in-place after each relevant event.
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.behavior_signals (
  user_id                       uuid        PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  days_since_last_workout_log   integer,
  workout_completion_rate_7d    numeric(3,2),
  workout_completion_rate_30d   numeric(3,2),
  meal_logs_per_day_7d          numeric(4,2),
  photo_vs_text_ratio           numeric(3,2),
  onboarding_fields_skipped     integer     NOT NULL DEFAULT 0,
  weight_log_regularity_score   numeric(3,2),
  avg_session_length_sec        integer,
  last_question_answered_at     timestamptz,
  coach_messages_sent_7d        integer     NOT NULL DEFAULT 0,
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.behavior_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "behavior_signals_select_own"
  ON public.behavior_signals FOR SELECT
  USING (auth.uid() = user_id);

-- Only backend (service role) writes behavior_signals — no INSERT/UPDATE policy for anon/authenticated

-- =============================================================
-- down:
-- DROP TABLE IF EXISTS public.behavior_signals;
-- DROP TABLE IF EXISTS public.workout_log_sets;
-- DROP TABLE IF EXISTS public.workout_log_exercises;
-- DROP TABLE IF EXISTS public.workout_logs;
-- DROP TYPE IF EXISTS energy_level;
-- DROP TYPE IF EXISTS pre_mood;
-- =============================================================
