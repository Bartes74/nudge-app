-- =============================================================
-- Migration: Body measurements
-- Iteration 6 — Logowanie wagi i obwodów
-- Group: 3 (body_measurements)
-- =============================================================

-- ---------------------------------------------------------------
-- GROUP 3 — BODY MEASUREMENTS
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.body_measurements (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  measured_at   timestamptz   NOT NULL,
  weight_kg     numeric(5,2),
  waist_cm      numeric(5,2),
  hips_cm       numeric(5,2),
  chest_cm      numeric(5,2),
  thigh_cm      numeric(5,2),
  arm_cm        numeric(5,2),
  neck_cm       numeric(5,2),
  body_fat_pct  numeric(4,2),
  notes         text,
  source        fact_source   NOT NULL DEFAULT 'user_input',
  created_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS body_measurements_user_measured_idx
  ON public.body_measurements (user_id, measured_at DESC);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "body_measurements_select_own"
  ON public.body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "body_measurements_insert_own"
  ON public.body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "body_measurements_update_own"
  ON public.body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "body_measurements_delete_own"
  ON public.body_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- down:
-- DROP TABLE IF EXISTS public.body_measurements;
-- =============================================================
