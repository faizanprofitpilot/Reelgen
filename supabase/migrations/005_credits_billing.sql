-- Credits-based billing (internal, no Stripe yet)
--
-- Business rules:
-- - 1 credit = 1 second of video generation
-- - Credits are charged at generation start
-- - If generation fails (project becomes FAILED), charged credits are refunded

-- ---------------------------------------------------------------------------
-- Users billing/credits table (public.users)
-- Note: We keep this in public (not auth.users) for safer app-level access + RLS.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  subscription_plan TEXT,
  subscription_renewal_date TIMESTAMPTZ
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits/plan info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can view their own billing row'
  ) THEN
    CREATE POLICY "Users can view their own billing row"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Credit transactions ledger (for auditing + idempotent refund/charge)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- negative = debit, positive = credit
  kind TEXT NOT NULL CHECK (kind IN ('debit', 'refund', 'grant', 'renewal', 'purchase')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id_created_at
  ON public.credit_transactions(user_id, created_at DESC);

-- Ensure a project can only be charged once, and refunded once (idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_credit_debit_per_project
  ON public.credit_transactions(project_id)
  WHERE kind = 'debit';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_credit_refund_per_project
  ON public.credit_transactions(project_id)
  WHERE kind = 'refund';

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own ledger (optional but useful for future billing UI)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'credit_transactions'
      AND policyname = 'Users can view their own credit transactions'
  ) THEN
    CREATE POLICY "Users can view their own credit transactions"
      ON public.credit_transactions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Helpers: ensure billing row exists + atomic charge/refund
-- These functions are SECURITY DEFINER so the API can call them safely.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ensure_billing_row(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (p_user_id)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Charge credits for a project (durationSeconds) at generation start.
-- - Idempotent: if a debit already exists for this project, no extra charge occurs.
-- - Raises an exception if credits are insufficient.
CREATE OR REPLACE FUNCTION public.charge_credits(
  p_user_id UUID,
  p_project_id UUID,
  p_seconds INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  IF p_seconds IS NULL OR p_seconds <= 0 THEN
    RAISE EXCEPTION 'Invalid credit charge amount: %', p_seconds;
  END IF;

  PERFORM public.ensure_billing_row(p_user_id);

  -- If already charged for this project, return current balance (idempotent).
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE project_id = p_project_id AND kind = 'debit'
  ) THEN
    SELECT credits_balance INTO current_balance
    FROM public.users
    WHERE id = p_user_id;
    RETURN current_balance;
  END IF;

  -- Lock the row to avoid race conditions when multiple generations start.
  SELECT credits_balance INTO current_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_balance < p_seconds THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.users
  SET credits_balance = credits_balance - p_seconds
  WHERE id = p_user_id
  RETURNING credits_balance INTO new_balance;

  INSERT INTO public.credit_transactions (user_id, project_id, amount, kind)
  VALUES (p_user_id, p_project_id, -p_seconds, 'debit');

  RETURN new_balance;
END;
$$;

-- Refund credits for a FAILED project.
-- - Idempotent: if already refunded, no extra refund occurs.
CREATE OR REPLACE FUNCTION public.refund_project_credits(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  debit_row RECORD;
  user_balance INTEGER;
  refund_amount INTEGER;
BEGIN
  -- No-op if already refunded.
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE project_id = p_project_id AND kind = 'refund'
  ) THEN
    SELECT u.credits_balance INTO user_balance
    FROM public.credit_transactions t
    JOIN public.users u ON u.id = t.user_id
    WHERE t.project_id = p_project_id AND t.kind = 'debit'
    LIMIT 1;
    RETURN user_balance;
  END IF;

  SELECT user_id, amount INTO debit_row
  FROM public.credit_transactions
  WHERE project_id = p_project_id AND kind = 'debit'
  LIMIT 1;

  -- If we never charged, nothing to refund.
  IF debit_row.user_id IS NULL THEN
    RETURN NULL;
  END IF;

  refund_amount := -debit_row.amount; -- debit amount is negative

  -- Lock user row, then credit back.
  SELECT credits_balance INTO user_balance
  FROM public.users
  WHERE id = debit_row.user_id
  FOR UPDATE;

  UPDATE public.users
  SET credits_balance = credits_balance + refund_amount
  WHERE id = debit_row.user_id
  RETURNING credits_balance INTO user_balance;

  INSERT INTO public.credit_transactions (user_id, project_id, amount, kind)
  VALUES (debit_row.user_id, p_project_id, refund_amount, 'refund');

  RETURN user_balance;
END;
$$;

