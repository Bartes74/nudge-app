-- =============================================================
-- Migration: increment_ai_usage RPC function
-- Iteration 10 — Monetization + Retention
-- Atomic upsert for user_ai_usage counters (no read-modify-write race).
-- =============================================================

CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  p_user_id   uuid,
  p_month_key text,
  p_cost_usd  numeric,
  p_tokens_in integer,
  p_tokens_out integer,
  p_is_photo  boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_ai_usage (
    user_id,
    month_key,
    llm_calls_count,
    photo_analysis_count,
    tokens_in_total,
    tokens_out_total,
    cost_usd_total,
    updated_at
  ) VALUES (
    p_user_id,
    p_month_key,
    1,
    CASE WHEN p_is_photo THEN 1 ELSE 0 END,
    p_tokens_in,
    p_tokens_out,
    p_cost_usd,
    now()
  )
  ON CONFLICT (user_id, month_key) DO UPDATE SET
    llm_calls_count      = public.user_ai_usage.llm_calls_count + 1,
    photo_analysis_count = public.user_ai_usage.photo_analysis_count + CASE WHEN p_is_photo THEN 1 ELSE 0 END,
    tokens_in_total      = public.user_ai_usage.tokens_in_total + p_tokens_in,
    tokens_out_total     = public.user_ai_usage.tokens_out_total + p_tokens_out,
    cost_usd_total       = public.user_ai_usage.cost_usd_total + p_cost_usd,
    updated_at           = now();
END;
$$;

COMMENT ON FUNCTION public.increment_ai_usage IS 'Atomic upsert of AI usage counters per user per month. Called after every LLM invocation.';

-- =============================================================
-- down:
-- DROP FUNCTION IF EXISTS public.increment_ai_usage(uuid, text, numeric, integer, integer, boolean);
-- =============================================================
