-- Stripe billing: extend users, add stripe_events (idempotency), credit_ledger (audit)
-- Run after 005_credits_billing.sql

-- ---------------------------------------------------------------------------
-- Extend public.users with Stripe fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- subscription_plan already exists; keep subscription_renewal_date for display (sync from current_period_end in app)
COMMENT ON COLUMN public.users.subscription_status IS 'Stripe subscription status: active|trialing|past_due|canceled|incomplete|none';
COMMENT ON COLUMN public.users.subscription_plan IS 'Plan slug: starter|growth|pro (lowercase)';

-- ---------------------------------------------------------------------------
-- Idempotency: store processed Stripe event IDs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id BIGSERIAL PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_event_id ON public.stripe_events(stripe_event_id);

-- Only backend (service role) writes/reads; no policies so authenticated has no access; service_role bypasses RLS
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Credit ledger for Stripe grants and audit (subscription_grant, credit_pack, refund, admin_adjust, generation_deduct)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('subscription_grant', 'credit_pack', 'refund', 'admin_adjust', 'generation_deduct')),
  stripe_event_id TEXT,
  stripe_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id_created_at ON public.credit_ledger(user_id, created_at DESC);

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Users can read their own ledger rows only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'credit_ledger' AND policyname = 'Users can view their own credit ledger'
  ) THEN
    CREATE POLICY "Users can view their own credit ledger"
      ON public.credit_ledger
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Inserts/updates only via service role (no INSERT policy for authenticated)
-- So: SELECT for own user_id; INSERT/UPDATE/DELETE only by service role (bypasses RLS).

-- ---------------------------------------------------------------------------
-- Atomic grant credits (used by webhook via service role)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_credits_from_stripe(
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT,
  p_stripe_event_id TEXT DEFAULT NULL,
  p_stripe_ref TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  IF p_delta IS NULL OR p_delta <= 0 THEN
    RAISE EXCEPTION 'grant_credits_from_stripe: delta must be positive';
  END IF;
  IF p_reason IS NULL OR p_reason NOT IN ('subscription_grant', 'credit_pack', 'refund', 'admin_adjust', 'generation_deduct') THEN
    RAISE EXCEPTION 'grant_credits_from_stripe: invalid reason';
  END IF;

  INSERT INTO public.credit_ledger (user_id, delta, reason, stripe_event_id, stripe_ref)
  VALUES (p_user_id, p_delta, p_reason, p_stripe_event_id, p_stripe_ref);

  UPDATE public.users
  SET credits_balance = credits_balance + p_delta
  WHERE id = p_user_id
  RETURNING credits_balance INTO new_balance;

  RETURN new_balance;
END;
$$;
