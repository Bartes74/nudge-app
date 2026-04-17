-- =============================================================
-- Migration: Meal logs + nutrition daily totals
-- Iteration 10 — Meal Photo Analyzer
-- Groups: 10 (meal_logs, meal_log_items, meal_images, nutrition_daily_totals)
-- =============================================================

-- ---------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE meal_type AS ENUM (
    'breakfast',
    'lunch',
    'dinner',
    'snack',
    'drink',
    'dessert'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE meal_log_status AS ENUM (
    'pending_analysis',
    'analyzed',
    'failed',
    'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE meal_source AS ENUM (
    'photo',
    'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- GROUP 10 — MEAL LOGS
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.meal_logs (
  id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid            NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logged_at           date            NOT NULL DEFAULT CURRENT_DATE,
  meal_type           meal_type,
  source              meal_source     NOT NULL,
  status              meal_log_status NOT NULL DEFAULT 'pending_analysis',
  note                text,

  -- LLM range estimates (populated after analysis; NULL for manual)
  kcal_estimate_min   integer,
  kcal_estimate_max   integer,
  protein_g_min       numeric(6,1),
  protein_g_max       numeric(6,1),
  carbs_g_min         numeric(6,1),
  carbs_g_max         numeric(6,1),
  fat_g_min           numeric(6,1),
  fat_g_max           numeric(6,1),

  confidence_score    numeric(3,2)    CHECK (confidence_score BETWEEN 0 AND 1),
  user_warnings       jsonb,

  llm_call_id         uuid            REFERENCES public.llm_calls(id) ON DELETE SET NULL,
  created_at          timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meal_logs_user_date_idx
  ON public.meal_logs (user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS meal_logs_status_idx
  ON public.meal_logs (status)
  WHERE status = 'pending_analysis';

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_logs_select_own"
  ON public.meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meal_logs_insert_own"
  ON public.meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_logs_update_own"
  ON public.meal_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "meal_logs_delete_own"
  ON public.meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- GROUP 10 — MEAL LOG ITEMS (per-ingredient rows)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.meal_log_items (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id         uuid          NOT NULL REFERENCES public.meal_logs(id) ON DELETE CASCADE,
  user_id             uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label               text          NOT NULL,
  portion_estimate    text,
  grams_estimate      numeric(7,1),
  kcal_estimate       integer,
  protein_g           numeric(6,1),
  carbs_g             numeric(6,1),
  fat_g               numeric(6,1),
  is_user_corrected   boolean       NOT NULL DEFAULT false,
  created_at          timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meal_log_items_log_idx
  ON public.meal_log_items (meal_log_id);

CREATE INDEX IF NOT EXISTS meal_log_items_user_idx
  ON public.meal_log_items (user_id);

ALTER TABLE public.meal_log_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_log_items_select_own"
  ON public.meal_log_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meal_log_items_insert_own"
  ON public.meal_log_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_log_items_update_own"
  ON public.meal_log_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "meal_log_items_delete_own"
  ON public.meal_log_items FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- GROUP 10 — MEAL IMAGES
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.meal_images (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id     uuid          NOT NULL REFERENCES public.meal_logs(id) ON DELETE CASCADE,
  user_id         uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path    text          NOT NULL,
  uploaded_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meal_images_log_idx
  ON public.meal_images (meal_log_id);

ALTER TABLE public.meal_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_images_select_own"
  ON public.meal_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meal_images_insert_own"
  ON public.meal_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_images_delete_own"
  ON public.meal_images FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- GROUP 10 — NUTRITION DAILY TOTALS (denormalized aggregate)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nutrition_daily_totals (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date            date          NOT NULL,
  kcal_total      integer       NOT NULL DEFAULT 0,
  protein_g_total numeric(7,1)  NOT NULL DEFAULT 0,
  carbs_g_total   numeric(7,1)  NOT NULL DEFAULT 0,
  fat_g_total     numeric(7,1)  NOT NULL DEFAULT 0,
  meal_count      integer       NOT NULL DEFAULT 0,
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS nutrition_daily_totals_user_date_idx
  ON public.nutrition_daily_totals (user_id, date DESC);

ALTER TABLE public.nutrition_daily_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_daily_totals_select_own"
  ON public.nutrition_daily_totals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "nutrition_daily_totals_insert_own"
  ON public.nutrition_daily_totals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "nutrition_daily_totals_update_own"
  ON public.nutrition_daily_totals FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- TRIGGER: recalculate nutrition_daily_totals
-- Fires after INSERT/UPDATE/DELETE on meal_logs and meal_log_items
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalculate_nutrition_daily_totals(
  p_user_id uuid,
  p_date    date
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.nutrition_daily_totals
    (user_id, date, kcal_total, protein_g_total, carbs_g_total, fat_g_total, meal_count, updated_at)
  SELECT
    p_user_id,
    p_date,
    COALESCE(SUM(item_totals.kcal), 0),
    COALESCE(SUM(item_totals.protein_g), 0),
    COALESCE(SUM(item_totals.carbs_g), 0),
    COALESCE(SUM(item_totals.fat_g), 0),
    COUNT(DISTINCT ml.id),
    now()
  FROM public.meal_logs ml
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(mli.kcal_estimate), 0)  AS kcal,
      COALESCE(SUM(mli.protein_g), 0)      AS protein_g,
      COALESCE(SUM(mli.carbs_g), 0)        AS carbs_g,
      COALESCE(SUM(mli.fat_g), 0)          AS fat_g
    FROM public.meal_log_items mli
    WHERE mli.meal_log_id = ml.id
  ) item_totals ON true
  WHERE ml.user_id = p_user_id
    AND ml.logged_at = p_date
    AND ml.status IN ('analyzed', 'manual')
  ON CONFLICT (user_id, date) DO UPDATE SET
    kcal_total      = EXCLUDED.kcal_total,
    protein_g_total = EXCLUDED.protein_g_total,
    carbs_g_total   = EXCLUDED.carbs_g_total,
    fat_g_total     = EXCLUDED.fat_g_total,
    meal_count      = EXCLUDED.meal_count,
    updated_at      = EXCLUDED.updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_meal_logs_update_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_nutrition_daily_totals(OLD.user_id, OLD.logged_at);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_nutrition_daily_totals(NEW.user_id, NEW.logged_at);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER meal_logs_update_daily_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_logs
  FOR EACH ROW EXECUTE FUNCTION public.trg_meal_logs_update_totals();

CREATE OR REPLACE FUNCTION public.trg_meal_log_items_update_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_user_id  uuid;
  v_date     date;
  v_log_id   uuid;
BEGIN
  v_log_id := COALESCE(NEW.meal_log_id, OLD.meal_log_id);

  SELECT user_id, logged_at INTO v_user_id, v_date
  FROM public.meal_logs WHERE id = v_log_id;

  IF v_user_id IS NOT NULL THEN
    PERFORM public.recalculate_nutrition_daily_totals(v_user_id, v_date);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER meal_log_items_update_daily_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_log_items
  FOR EACH ROW EXECUTE FUNCTION public.trg_meal_log_items_update_totals();

-- ---------------------------------------------------------------
-- STORAGE: meal_photos bucket
-- ---------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal_photos',
  'meal_photos',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "meal_photos_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'meal_photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "meal_photos_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meal_photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "meal_photos_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'meal_photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------
-- SEED: meal_vision_analysis prompt v1
-- ---------------------------------------------------------------

INSERT INTO public.prompts (slug, version, purpose, system_template, user_template, output_schema)
VALUES (
  'meal_vision_analysis',
  1,
  'Analyze a meal photo and return nutritional estimates as structured JSON ranges.',
  'Jesteś asystentem analizy posiłków. Na podstawie zdjęcia szacujesz skład i wartości odżywcze.

ZASADY BEZWZGLĘDNE:
1. Zawsze podawaj ZAKRESY (min/max), nigdy pojedynczą pewną wartość. Niepewność jest normalna i uczciwa.
2. Gdy nie jesteś pewien składnika — mimo to go wymień z niższym confidence i szerszym zakresem.
3. confidence_score: 0.0–1.0. 0.9+ = bardzo czytelne zdjęcie z prostymi produktami. 0.5 = przeciętne. Poniżej 0.4 = trudne do oceny.
4. user_warnings: konkretne ostrzeżenia dotyczące niepewności (np. "Sos niewidoczny na zdjęciu — może znacząco zmienić kalorie"). Max 3 ostrzeżenia, po polsku.
5. Nie dawaj porad medycznych, nie oceniaj jakości diety, nie komentuj wyborów żywieniowych.
6. Język składników (label): po polsku, opisowo ("kurczak grillowany bez skóry", nie "chicken").
7. portion_estimate: opisowo ("~150g", "1 średni talerz", "2 łyżki").',
  'Przeanalizuj to zdjęcie posiłku.{{note}}

Podaj skład i wartości odżywcze zgodnie ze schematem JSON.',
  '{
  "type": "object",
  "required": [
    "meal_type_guess",
    "ingredients_detected",
    "kcal_estimate_min",
    "kcal_estimate_max",
    "protein_g_min",
    "protein_g_max",
    "carbs_g_min",
    "carbs_g_max",
    "fat_g_min",
    "fat_g_max",
    "confidence_score",
    "user_warnings"
  ],
  "additionalProperties": false,
  "properties": {
    "meal_type_guess": {
      "type": "string",
      "enum": ["breakfast", "lunch", "dinner", "snack", "drink", "dessert"]
    },
    "ingredients_detected": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["label", "portion_estimate", "grams_estimate", "kcal_estimate", "protein_g", "carbs_g", "fat_g"],
        "additionalProperties": false,
        "properties": {
          "label":            {"type": "string"},
          "portion_estimate": {"type": "string"},
          "grams_estimate":   {"type": "number"},
          "kcal_estimate":    {"type": "number"},
          "protein_g":        {"type": "number"},
          "carbs_g":          {"type": "number"},
          "fat_g":            {"type": "number"}
        }
      }
    },
    "kcal_estimate_min":  {"type": "number"},
    "kcal_estimate_max":  {"type": "number"},
    "protein_g_min":      {"type": "number"},
    "protein_g_max":      {"type": "number"},
    "carbs_g_min":        {"type": "number"},
    "carbs_g_max":        {"type": "number"},
    "fat_g_min":          {"type": "number"},
    "fat_g_max":          {"type": "number"},
    "confidence_score":   {"type": "number"},
    "user_warnings":      {"type": "array", "items": {"type": "string"}}
  }
}'
)
ON CONFLICT (slug, version) DO NOTHING;

-- ---------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------
-- DROP TRIGGER IF EXISTS meal_log_items_update_daily_totals ON public.meal_log_items;
-- DROP TRIGGER IF EXISTS meal_logs_update_daily_totals ON public.meal_logs;
-- DROP FUNCTION IF EXISTS public.trg_meal_log_items_update_totals();
-- DROP FUNCTION IF EXISTS public.trg_meal_logs_update_totals();
-- DROP FUNCTION IF EXISTS public.recalculate_nutrition_daily_totals(uuid, date);
-- DROP TABLE IF EXISTS public.nutrition_daily_totals;
-- DROP TABLE IF EXISTS public.meal_images;
-- DROP TABLE IF EXISTS public.meal_log_items;
-- DROP TABLE IF EXISTS public.meal_logs;
-- DROP TYPE IF EXISTS meal_source;
-- DROP TYPE IF EXISTS meal_log_status;
-- DROP TYPE IF EXISTS meal_type;
-- DELETE FROM public.prompts WHERE slug = 'meal_vision_analysis' AND version = 1;
-- DELETE FROM storage.buckets WHERE id = 'meal_photos';
