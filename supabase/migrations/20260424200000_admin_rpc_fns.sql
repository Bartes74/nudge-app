-- =============================================================
-- Migration: Admin RPC functions for dashboard metrics
-- Iteration 10 — Monetization + Retention
-- =============================================================

-- Returns count per subscription status
CREATE OR REPLACE FUNCTION public.admin_subscription_counts()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status::text, COUNT(*) AS count
  FROM public.subscriptions
  GROUP BY status;
$$;

-- Returns current MRR in PLN (active monthly × 49 + active yearly / 12 × 349)
-- Uses price_amount from subscriptions (stored in grosze)
CREATE OR REPLACE FUNCTION public.admin_mrr()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN plan = 'monthly' THEN price_amount::numeric / 100
      WHEN plan = 'yearly'  THEN price_amount::numeric / 100 / 12
      ELSE 0
    END
  ), 0)
  FROM public.subscriptions
  WHERE status = 'active'
    AND price_amount IS NOT NULL;
$$;

-- =============================================================
-- down:
-- DROP FUNCTION IF EXISTS public.admin_subscription_counts();
-- DROP FUNCTION IF EXISTS public.admin_mrr();
-- =============================================================
