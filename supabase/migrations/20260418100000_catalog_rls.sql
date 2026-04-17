-- =============================================================
-- Migration: Enable RLS on global catalog tables with read-all policy
-- exercises and prompts are global catalogs — all authenticated
-- users can read, only service role writes.
-- =============================================================

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_read_all"
  ON public.exercises FOR SELECT
  USING (true);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompts_read_all"
  ON public.prompts FOR SELECT
  USING (true);

-- =============================================================
-- down:
-- DROP POLICY IF EXISTS "exercises_read_all" ON public.exercises;
-- ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "prompts_read_all" ON public.prompts;
-- ALTER TABLE public.prompts DISABLE ROW LEVEL SECURITY;
-- =============================================================
