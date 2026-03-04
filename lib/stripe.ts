import Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  console.warn("STRIPE_SECRET_KEY is not set; Stripe APIs will throw.");
}

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is required");
    stripeInstance = new Stripe(stripeSecret);
  }
  return stripeInstance;
}

const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  growth: process.env.STRIPE_PRICE_GROWTH ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  pack100: process.env.STRIPE_PRICE_PACK_100 ?? "",
} as const;

export function mapPriceIdToPlan(priceId: string): "starter" | "growth" | "pro" | null {
  if (priceId === PRICE_IDS.starter) return "starter";
  if (priceId === PRICE_IDS.growth) return "growth";
  if (priceId === PRICE_IDS.pro) return "pro";
  return null;
}

export function mapPriceIdToCredits(priceId: string): number | null {
  if (priceId === PRICE_IDS.pack100) return 100;
  return null;
}

const PLAN_CREDITS: Record<string, number> = {
  starter: 100,
  growth: 250,
  pro: 600,
};

export function getCreditsForPlan(plan: string): number {
  return PLAN_CREDITS[plan] ?? 0;
}

export function getStripePriceIds() {
  return {
    starter: PRICE_IDS.starter,
    growth: PRICE_IDS.growth,
    pro: PRICE_IDS.pro,
    pack100: PRICE_IDS.pack100,
  };
}

/**
 * Ensure user has a billing row and a Stripe customer ID.
 * Creates Stripe customer if needed and updates public.users.
 */
export async function getOrCreateCustomer(
  supabaseAdmin: SupabaseClient,
  user: User
): Promise<string> {
  const { data: row } = await supabaseAdmin
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (row?.stripe_customer_id) return row.stripe_customer_id;

  await supabaseAdmin.rpc("ensure_billing_row", { p_user_id: user.id });

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: { supabase_user_id: user.id },
  });

  await supabaseAdmin
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id);

  return customer.id;
}

/**
 * Grant credits to a user: insert into credit_ledger and update users.credits_balance.
 * Call with service role client. Idempotency is enforced by stripe_events at the webhook layer.
 */
export async function grantCredits(
  supabaseAdmin: SupabaseClient,
  userId: string,
  delta: number,
  reason: "subscription_grant" | "credit_pack" | "refund" | "admin_adjust" | "generation_deduct",
  stripeEventId?: string | null,
  stripeRef?: string | null
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("grant_credits_from_stripe", {
    p_user_id: userId,
    p_delta: delta,
    p_reason: reason,
    p_stripe_event_id: stripeEventId ?? null,
    p_stripe_ref: stripeRef ?? null,
  });
  if (error) throw error;
  return data as number;
}
