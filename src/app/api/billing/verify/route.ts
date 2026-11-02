import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSubscription, verifyCheckout } from "@/lib/razorpay";

const Body = z.object({ razorpay_payment_id: z.string(), razorpay_subscription_id: z.string(), razorpay_signature: z.string() });

/** Called by the browser right after checkout. The webhook confirms the same state independently. */
export async function POST(req: Request) {
  const ctx = await requireOrg();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  const subId = ctx.billing.razorpay_subscription_id;
  // Use the subscription id we stored, not the one the browser sent.
  if (!subId || !verifyCheckout(parsed.data.razorpay_payment_id, subId, parsed.data.razorpay_signature)) {
    return NextResponse.json({ error: "We couldn't verify this payment. If you were charged, contact support." }, { status: 400 });
  }
  const sub = await fetchSubscription(subId).catch(() => null);
  const admin = createAdminClient();
  await admin.from("org_billing").update({
    plan: ctx.billing.pending_plan ?? "starter",
    status: sub?.status ?? "authenticated",
    current_period_end: sub?.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("org_id", ctx.org.id);
  return NextResponse.json({ ok: true });
}
