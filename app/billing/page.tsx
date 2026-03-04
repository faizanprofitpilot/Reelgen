import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingPageView } from "@/components/BillingPageView";
import { getStripePriceIds } from "@/lib/stripe";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: billing } = await supabase
    .from("users")
    .select("credits_balance, subscription_plan, subscription_renewal_date, subscription_status, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const stripePriceIds = getStripePriceIds();

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading…</div>}>
      <BillingPageView
        userEmail={user.email}
        billing={billing ?? null}
        stripePriceIds={stripePriceIds}
      />
    </Suspense>
  );
}
