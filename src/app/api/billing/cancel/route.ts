import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelSubscription } from "@/lib/razorpay";

export async function POST() {
  try {
    const ctx = await requireOrg();
    if (ctx.role !== "owner") return NextResponse.json({ error: "Only the workspace owner can cancel the plan." }, { status: 403 });
    const id = ctx.billing.razorpay_subscription_id;
    if (!id) return NextResponse.json({ error: "There's no subscription to cancel." }, { status: 400 });
    const sub = await cancelSubscription(id);
    await createAdminClient().from("org_billing").update({
      status: "cancelled",
      current_period_end: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : ctx.billing.current_period_end,
      updated_at: new Date().toISOString(),
    }).eq("org_id", ctx.org.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't cancel." }, { status: 500 });
  }
}
