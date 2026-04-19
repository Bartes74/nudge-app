-- =============================================================
-- Migration: Remove deprecated nutrition plan generator
-- Cleanup after removing the old nutrition plan flow from product and code
-- =============================================================

-- ---------------------------------------------------------------
-- PRESERVE COST HISTORY BEFORE DELETING TASKS
-- ---------------------------------------------------------------

UPDATE public.llm_calls
SET ai_task_id = NULL
WHERE ai_task_id IN (
  SELECT id
  FROM public.ai_tasks
  WHERE task_type::text = 'generate_nutrition_plan'
);

DELETE FROM public.ai_tasks
WHERE task_type::text = 'generate_nutrition_plan';

DELETE FROM public.prompts
WHERE slug = 'nutrition_plan_fill';

-- ---------------------------------------------------------------
-- DROP DEPRECATED NUTRITION PLAN TABLES
-- ---------------------------------------------------------------

ALTER TABLE IF EXISTS public.nutrition_plans
  DROP CONSTRAINT IF EXISTS nutrition_plans_current_version_fk;

DROP TABLE IF EXISTS public.nutrition_plan_versions;
DROP TABLE IF EXISTS public.nutrition_plans;

-- ---------------------------------------------------------------
-- RECREATE ai_task_type WITHOUT generate_nutrition_plan
-- ---------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ai_task_type'
      AND e.enumlabel = 'generate_nutrition_plan'
  ) THEN
    ALTER TYPE public.ai_task_type RENAME TO ai_task_type_old;

    CREATE TYPE public.ai_task_type AS ENUM (
      'generate_training_plan',
      'analyze_meal_photo',
      'weekly_checkin_analysis',
      'pick_next_question',
      'classify_intent',
      'proactive_nudge',
      'recalculate_targets'
    );

    ALTER TABLE public.ai_tasks
      ALTER COLUMN task_type TYPE public.ai_task_type
      USING task_type::text::public.ai_task_type;

    DROP TYPE public.ai_task_type_old;
  END IF;
END $$;

-- =============================================================
-- down (manual rollback notes):
-- 1. Recreate public.ai_task_type with the removed value
--    generate_nutrition_plan, then cast ai_tasks.task_type back.
-- 2. Recreate public.nutrition_plans and public.nutrition_plan_versions
--    from migration 20260420000000_nutrition_plan_tables.sql.
-- 3. Reinsert prompt slug nutrition_plan_fill from
--    20260420000000_nutrition_plan_tables.sql.
-- 4. Restore deleted ai_tasks rows only from a database backup.
--    This migration intentionally preserves llm_calls cost history,
--    but deleted nutrition-plan tasks and plan rows are not recoverable.
-- =============================================================
