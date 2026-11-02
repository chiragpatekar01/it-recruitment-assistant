import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSubscription } from "@/lib/razorpay";
import { razorpayPlanId } from "@/lib/plans";

export async function POST(req: Request) {
  try {
    const ctx = await requireOrg();
    if (ctx.role !== "owner") return NextResponse.json({ error: "Only the workspace owner can change the plan." }, { status: 403 });
    const parsed = z.object({ plan: z.enum(["starter", "growth"]) }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Choose a plan." }, { status: 400 });
    if (["active", "authenticated"].includes(ctx.billing.status) && ctx.billing.plan !== "trial") {
      return NextResponse.json({ error: "You already have an active subscription. Cancel it first to switch plans, or contact support to change plan mid-cycle." }, { status: 409 });
    }
    const planId = razorpayPlanId(parsed.data.plan);
    if (!planId) return NextResponse.json({ error: "This plan isn't set up in Razorpay yet." }, { status: 500 });

    const sub = await createSubscription(planId, { org_id: ctx.org.id, plan: parsed.data.plan });
    const admin = createAdminClient();
    await admin.from("org_billing").update({ razorpay_subscription_id: sub.id, pending_plan: parsed.data.plan, updated_at: new Date().toISOString() }).eq("org_id", ctx.org.id);

    return NextResponse.json({ subscriptionId: sub.id, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, email: ctx.email, name: ctx.name, orgName: ctx.org.name });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't start checkout." }, { status: 500 });
  }
}
