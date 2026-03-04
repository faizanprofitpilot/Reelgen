"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/DashboardNav";
import { SUBSCRIPTION_PLANS, CREDIT_PACKS } from "@/lib/billing/plans";

interface BillingPageViewProps {
  userEmail: string | undefined;
  billing: {
    credits_balance: number;
    subscription_plan: string | null;
    subscription_renewal_date: string | null;
    subscription_status?: string | null;
    stripe_customer_id?: string | null;
  } | null;
  stripePriceIds: {
    starter: string;
    growth: string;
    pro: string;
    pack100: string;
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function BillingPageView({ userEmail, billing, stripePriceIds }: BillingPageViewProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const planName = billing?.subscription_plan
    ? capitalize(billing.subscription_plan)
    : "Free";
  const creditsRemaining = billing?.credits_balance ?? 0;
  const hasStripeCustomer = Boolean(billing?.stripe_customer_id);
  const hasStripePrices =
    Boolean(stripePriceIds.starter) &&
    Boolean(stripePriceIds.growth) &&
    Boolean(stripePriceIds.pro) &&
    Boolean(stripePriceIds.pack100);

  useEffect(() => {
    if (searchParams.get("success") === "1") setShowSuccess(true);
  }, [searchParams]);

  async function handleCheckout(mode: "subscription" | "payment", priceId: string) {
    if (!priceId) return;
    setError(null);
    setLoading(`${mode}-${priceId}`);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, priceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.url) window.location.href = data.url;
      else setError("No redirect URL received");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setError(null);
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/create-portal-session", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.url) window.location.href = data.url;
      else setError("No redirect URL received");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        userEmail={userEmail}
        currentView="dashboard"
        onViewChange={() => {}}
        variant="billing"
      />

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-2xl font-semibold text-white">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your plan and credits</p>

        {showSuccess && (
          <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            Payment successful. Your credits have been added.
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current plan</p>
          <p className="mt-1 text-lg font-semibold text-white">{planName}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Credits remaining: <span className="font-medium text-white tabular-nums">{creditsRemaining}</span>
          </p>
          {billing?.subscription_renewal_date && (
            <p className="mt-1 text-xs text-muted-foreground">
              Renews {new Date(billing.subscription_renewal_date).toLocaleDateString()}
            </p>
          )}
          {hasStripeCustomer && (
            <Button
              variant="outline"
              className="mt-4 border-white/10 hover:bg-white/10 hover:text-white"
              onClick={handlePortal}
              disabled={loading !== null}
            >
              {loading === "portal" ? "Redirecting…" : "Manage billing"}
            </Button>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-white">Plans</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Upgrade to get more credits per month</p>
          <div className="mt-4 flex flex-col gap-2">
            {Object.entries(SUBSCRIPTION_PLANS).map(([name, plan]) => {
              const priceId =
                name === "Starter"
                  ? stripePriceIds.starter
                  : name === "Growth"
                    ? stripePriceIds.growth
                    : stripePriceIds.pro;
              const isLoading = loading === `subscription-${priceId}`;
              return (
                <div
                  key={name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div>
                    <p className="font-medium text-white">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${plan.priceMonthlyUsd}/mo · {plan.creditsPerMonth} credits
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/10 hover:text-white"
                    disabled={!hasStripePrices || loading !== null}
                    onClick={() => handleCheckout("subscription", priceId)}
                  >
                    {isLoading ? "Redirecting…" : `Subscribe ${name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-white">Credit packs</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">One-time credit purchases</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">100 credits</p>
              <p className="text-sm text-muted-foreground">${CREDIT_PACKS["100"].priceUsd} one-time</p>
            </div>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!hasStripePrices || loading !== null}
              onClick={() => handleCheckout("payment", stripePriceIds.pack100)}
            >
              {loading === `payment-${stripePriceIds.pack100}` ? "Redirecting…" : "Buy 100 credits"}
            </Button>
          </div>
        </div>

        {!hasStripePrices && (
          <p className="mt-6 text-xs text-muted-foreground">
            Stripe price IDs are not configured. Set STRIPE_PRICE_* in your environment.
          </p>
        )}
      </div>
    </div>
  );
}
