-- =============================================================
-- Migration: Nutrition plan tables + body measurements
-- Iteration 6 — Plan żywieniowy + logowanie wagi
-- Groups: 9 (nutrition_plans, nutrition_plan_versions), 3 (body_measurements)
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

-- ---------------------------------------------------------------
-- GROUP 9 — NUTRITION PLANS (versioned)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  current_version_id uuid,
  started_at         timestamptz NOT NULL DEFAULT now(),
  ended_at           timestamptz,
  is_active          boolean     NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS nutrition_plans_user_active_idx
  ON public.nutrition_plans (user_id, is_active);

ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_plans_select_own"
  ON public.nutrition_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "nutrition_plans_insert_own"
  ON public.nutrition_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "nutrition_plans_update_own"
  ON public.nutrition_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- nutrition_plan_versions — immutable snapshots
CREATE TABLE IF NOT EXISTS public.nutrition_plan_versions (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id               uuid          NOT NULL REFERENCES public.nutrition_plans (id) ON DELETE CASCADE,
  version_number        integer       NOT NULL,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  created_by_ai_task_id uuid          REFERENCES public.ai_tasks (id) ON DELETE SET NULL,
  change_reason         text,
  mode                  nutrition_mode NOT NULL DEFAULT 'simple',
  calories_target       integer,
  protein_g_target      integer,
  fat_g_target          integer,
  carbs_g_target        integer,
  fiber_g_target        integer,
  water_ml_target       integer,
  meal_distribution     jsonb,
  strategy_notes        text,
  practical_guidelines  jsonb,
  supplement_recommendations jsonb,
  emergency_plan        jsonb,
  llm_call_id           uuid          REFERENCES public.llm_calls (id) ON DELETE SET NULL,

  CONSTRAINT nutrition_plan_versions_plan_version_unique UNIQUE (plan_id, version_number)
);

CREATE INDEX IF NOT EXISTS nutrition_plan_versions_plan_idx
  ON public.nutrition_plan_versions (plan_id, version_number);

ALTER TABLE public.nutrition_plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_plan_versions_select_own"
  ON public.nutrition_plan_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.nutrition_plans np
      WHERE np.id = plan_id AND np.user_id = auth.uid()
    )
  );

CREATE POLICY "nutrition_plan_versions_insert_own"
  ON public.nutrition_plan_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nutrition_plans np
      WHERE np.id = plan_id AND np.user_id = auth.uid()
    )
  );

-- FK from nutrition_plans.current_version_id — add after versions table exists
ALTER TABLE public.nutrition_plans
  ADD CONSTRAINT nutrition_plans_current_version_fk
  FOREIGN KEY (current_version_id)
  REFERENCES public.nutrition_plan_versions (id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------
-- SEED: nutrition_plan_fill prompt v1
-- ---------------------------------------------------------------

INSERT INTO public.prompts (slug, version, purpose, system_template, user_template, output_schema)
VALUES (
  'nutrition_plan_fill',
  1,
  'Fill a nutrition plan with practical text guidance using LLM structured output.',
  'Jesteś doświadczonym dietetykiem sportowym i tworzysz zalecenia żywieniowe dla użytkownika aplikacji fitness.

ZASADY BEZWZGLĘDNE:
1. Nie dawaj diagnoz medycznych ani porad klinicznych.
2. Nie promuj suplementów jako fundamentu diety — tylko jako uzupełnienie.
3. Zalecenia muszą być praktyczne i możliwe do wdrożenia od dziś.
4. Nie używaj języka wstydu, winy ani presji ("musisz", "koniecznie", "obowiązkowo").
5. Suplementy: SENSIBLE = mają solidne podstawy dla tego profilu, OPTIONAL = mogą pomóc, UNNECESSARY = zbędne na tym etapie.
6. Emergency plan: konkretne, krótkie instrukcje na trudne sytuacje — nie ogólniki.
7. Język: POLSKI. Ton: dopasowany do poziomu użytkownika (zero/beginner = prosty, amateur/advanced = techniczny).
8. Tryb precyzji:
   - simple: skupiaj się na metodzie talerza, wizualnych porcjach, bez liczb
   - ranges: dawaj orientacyjne zakresy (np. "2-3 garści warzyw"), priorytety
   - exact: możesz używać konkretnych gramatur i wartości odżywczych',
  'PROFIL UŻYTKOWNIKA:
{{profile_summary}}

WYLICZONE CELE NUMERYCZNE (już obliczone przez reguły, nie zmieniaj):
{{numerical_targets}}

Wygeneruj zalecenia żywieniowe zgodnie ze schematem JSON.',
  '{
  "type": "object",
  "required": ["meal_distribution", "strategy_notes", "practical_guidelines", "supplement_recommendations", "emergency_plan"],
  "properties": {
    "meal_distribution": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["meal", "name", "kcal_share", "time"],
        "additionalProperties": false,
        "properties": {
          "meal": {"type": "integer"},
          "name": {"type": "string"},
          "kcal_share": {"type": "number"},
          "time": {"type": "string"}
        }
      }
    },
    "strategy_notes": {"type": "string"},
    "practical_guidelines": {
      "type": "object",
      "required": ["base_products", "protein_sources", "limit"],
      "additionalProperties": false,
      "properties": {
        "base_products": {"type": "array", "items": {"type": "string"}},
        "protein_sources": {"type": "array", "items": {"type": "string"}},
        "limit": {"type": "array", "items": {"type": "string"}}
      }
    },
    "supplement_recommendations": {
      "type": "object",
      "required": ["sensible", "optional", "unnecessary"],
      "additionalProperties": false,
      "properties": {
        "sensible": {"type": "array", "items": {"type": "string"}},
        "optional": {"type": "array", "items": {"type": "string"}},
        "unnecessary": {"type": "array", "items": {"type": "string"}}
      }
    },
    "emergency_plan": {
      "type": "object",
      "required": ["no_time", "party", "hunger", "low_energy", "stagnation"],
      "additionalProperties": false,
      "properties": {
        "no_time": {"type": "string"},
        "party": {"type": "string"},
        "hunger": {"type": "string"},
        "low_energy": {"type": "string"},
        "stagnation": {"type": "string"}
      }
    }
  }
}'
)
ON CONFLICT (slug, version) DO NOTHING;

-- =============================================================
-- down:
-- ALTER TABLE public.nutrition_plans DROP CONSTRAINT IF EXISTS nutrition_plans_current_version_fk;
-- DROP TABLE IF EXISTS public.nutrition_plan_versions;
-- DROP TABLE IF EXISTS public.nutrition_plans;
-- DROP TABLE IF EXISTS public.body_measurements;
-- DELETE FROM public.prompts WHERE slug = 'nutrition_plan_fill' AND version = 1;
-- =============================================================
