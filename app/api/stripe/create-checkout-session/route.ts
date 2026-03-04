import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe, getOrCreateCustomer, getStripePriceIds } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mode, priceId } = body as { mode?: string; priceId?: string };

    if (!mode || !priceId) {
      return NextResponse.json(
        { error: "Missing mode or priceId" },
        { status: 400 }
      );
    }
    if (mode !== "subscription" && mode !== "payment") {
      return NextResponse.json(
        { error: "Invalid mode; use subscription or payment" },
        { status: 400 }
      );
    }

    const priceIds = getStripePriceIds();
    const validPriceIds = Object.values(priceIds).filter(Boolean);
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: "Invalid priceId" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();
    const customerId = await getOrCreateCustomer(supabaseAdmin, user);
    const stripe = getStripe();

    const sessionParams: {
      customer: string;
      mode: "subscription" | "payment";
      line_items: { price: string; quantity: number }[];
      success_url: string;
      cancel_url: string;
      metadata: { user_id: string };
      subscription_data?: { metadata: { user_id: string } };
    } = {
      customer: customerId,
      mode: mode as "subscription" | "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/billing?success=1`,
      cancel_url: `${APP_URL}/billing?canceled=1`,
      metadata: { user_id: user.id },
    };
    if (mode === "subscription") {
      sessionParams.subscription_data = { metadata: { user_id: user.id } };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session URL" },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
