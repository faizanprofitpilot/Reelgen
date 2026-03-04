-- Free plan: give 10 credits to new signups and existing free accounts with 0 balance
-- 1) New users get 10 credits when their billing row is first created
-- 2) One-time: existing free users (no plan, 0 balance) get 10 credits

-- ---------------------------------------------------------------------------
-- Update ensure_billing_row so new users get 10 credits
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_billing_row(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, credits_balance)
  VALUES (p_user_id, 10)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- ---------------------------------------------------------------------------
-- One-time: grant 10 credits to existing free accounts with 0 balance
-- (subscription_plan IS NULL or empty = free; leave subscribed users unchanged)
-- ---------------------------------------------------------------------------
UPDATE public.users
SET credits_balance = 10
WHERE (subscription_plan IS NULL OR subscription_plan = '')
  AND credits_balance = 0;
