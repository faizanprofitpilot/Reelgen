import { createServiceRoleClient } from "@/lib/supabase/server";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/billing/plans";

/**
 * Admin utility: grant credits to a user.
 * Uses service role; do not call from untrusted client code.
 */
export async function grantCredits(userId: string, amount: number) {
  if (!userId) throw new Error("userId is required");
  if (!Number.isFinite(amount) || amount === 0) throw new Error("amount must be a non-zero number");

  const supabase = createServiceRoleClient();

  // Ensure billing row exists
  await supabase.rpc("ensure_billing_row", { p_user_id: userId });

  // Update balance (read-modify-write). If you need stronger atomicity, add a SQL function later.
  const { data: row, error: readError } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", userId)
    .single();
  if (readError) throw readError;

  const next = (row.credits_balance ?? 0) + amount;
  if (next < 0) throw new Error("Resulting credits_balance would be negative");

  const { error: updateError } = await supabase
    .from("users")
    .update({ credits_balance: next })
    .eq("id", userId);
  if (updateError) throw updateError;

  // Optional ledger entry
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount,
    kind: "grant",
  });

  return { credits_balance: next };
}

/**
 * Admin utility: set a subscription plan for a user.
 * For now, this also sets credits_balance to the plan's monthly credits (simple internal model).
 */
export async function setPlan(userId: string, planName: SubscriptionPlan) {
  if (!userId) throw new Error("userId is required");
  const plan = SUBSCRIPTION_PLANS[planName];
  if (!plan) throw new Error(`Unknown plan: ${planName}`);

  const supabase = createServiceRoleClient();
  await supabase.rpc("ensure_billing_row", { p_user_id: userId });

  const renewal = new Date();
  renewal.setMonth(renewal.getMonth() + 1);

  const { error } = await supabase
    .from("users")
    .update({
      subscription_plan: planName,
      subscription_renewal_date: renewal.toISOString(),
      credits_balance: plan.creditsPerMonth,
    })
    .eq("id", userId);
  if (error) throw error;

  // Optional ledger entry
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: plan.creditsPerMonth,
    kind: "renewal",
  });

  return {
    subscription_plan: planName,
    subscription_renewal_date: renewal.toISOString(),
    credits_balance: plan.creditsPerMonth,
  };
}

