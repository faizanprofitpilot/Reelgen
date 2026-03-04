export type SubscriptionPlan = "Starter" | "Growth" | "Pro";

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  { priceMonthlyUsd: number; creditsPerMonth: number }
> = {
  Starter: { priceMonthlyUsd: 29, creditsPerMonth: 100 },
  Growth: { priceMonthlyUsd: 79, creditsPerMonth: 250 },
  Pro: { priceMonthlyUsd: 169, creditsPerMonth: 600 },
};

export const CREDIT_PACKS = {
  "100": { credits: 100, priceUsd: 35 },
} as const;

export function getPlanCredits(plan: string | null | undefined): number | null {
  if (!plan) return null;
  return (SUBSCRIPTION_PLANS as Record<string, { creditsPerMonth: number }>)[plan]
    ?.creditsPerMonth ?? null;
}

