import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  getStripe,
  mapPriceIdToPlan,
  mapPriceIdToCredits,
  getCreditsForPlan,
  grantCredits,
} from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.warn("STRIPE_WEBHOOK_SECRET is not set; webhook will reject.");
}

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Idempotency: if we already processed this event, return 200
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // Insert event first so retries don't double-process
  const { error: insertEventError } = await supabase.from("stripe_events").insert({
    stripe_event_id: event.id,
    type: event.type,
  });
  if (insertEventError) {
    console.error("stripe_events insert error:", insertEventError);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id as string | undefined;
        if (!userId) break;

        if (session.mode === "payment") {
          let priceId: string | undefined;
          const line = session.line_items?.data?.[0];
          if (line) {
            priceId = typeof line.price === "object" ? line.price?.id : line.price;
          }
          if (!priceId && session.id) {
            const stripe = getStripe();
            const expanded = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ["line_items.data.price"],
            });
            const firstLine = expanded.line_items?.data?.[0];
            priceId = firstLine && typeof firstLine.price === "object" ? firstLine.price?.id : undefined;
          }
          const credits = priceId ? mapPriceIdToCredits(priceId) : null;
          if (credits != null && credits > 0) {
            await grantCredits(
              supabase,
              userId,
              credits,
              "credit_pack",
              event.id,
              session.id
            );
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string };
          lines?: { data?: Array<{ price?: string | { id: string } }> };
        };
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const { data: userRow } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (!userRow) break;

        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;
        let plan: string | null = null;
        let currentPeriodEnd: number | null = null;
        let status: string | null = null;

        if (subscriptionId && invoice.lines?.data?.[0]) {
          const firstLine = invoice.lines.data[0];
          const priceId = typeof firstLine.price === "object" ? firstLine.price?.id : firstLine.price;
          plan = priceId ? mapPriceIdToPlan(priceId) : null;
        }

        if (subscriptionId) {
          const stripe = getStripe();
          const subIdStr = typeof subscriptionId === "string" ? subscriptionId : (subscriptionId as { id: string }).id;
          const sub = await stripe.subscriptions.retrieve(subIdStr) as Stripe.Subscription & { current_period_end?: number };
          currentPeriodEnd = sub.current_period_end ?? null;
          status = sub.status ?? null;
          const firstItem = sub.items?.data?.[0];
          const priceId = firstItem && typeof firstItem.price === "object" ? firstItem.price?.id : undefined;
          if (!plan && priceId) plan = mapPriceIdToPlan(priceId);
        }

        if (plan) {
          const credits = getCreditsForPlan(plan);
          if (credits > 0) {
            await grantCredits(
              supabase,
              userRow.id,
              credits,
              "subscription_grant",
              event.id,
              invoice.id
            );
          }
        }

        await supabase
          .from("users")
          .update({
            subscription_status: status ?? "active",
            subscription_plan: plan,
            subscription_current_period_end: currentPeriodEnd
              ? new Date(currentPeriodEnd * 1000).toISOString()
              : null,
            subscription_renewal_date: currentPeriodEnd
              ? new Date(currentPeriodEnd * 1000).toISOString()
              : null,
          })
          .eq("id", userRow.id);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number };
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
        if (!customerId) break;

        const { data: userRow } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (!userRow) break;

        const firstItem = subscription.items?.data?.[0];
        const priceId = firstItem && typeof firstItem.price === "object" ? firstItem.price?.id : undefined;
        const plan = priceId ? mapPriceIdToPlan(priceId) : null;
        const currentPeriodEnd = subscription.current_period_end ?? 0;
        const status = subscription.status ?? "none";

        await supabase
          .from("users")
          .update({
            subscription_status: status,
            subscription_plan: plan,
            subscription_current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
            subscription_renewal_date: new Date(currentPeriodEnd * 1000).toISOString(),
          })
          .eq("id", userRow.id);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
