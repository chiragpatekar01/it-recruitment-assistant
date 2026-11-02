import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhook } from "@/lib/razorpay";

export const runtime = "nodejs";

type SubEntity = { id: string; status: string; current_end?: number | null; notes?: Record<string, string> };

/** Razorpay → subscription lifecycle. Authenticated by signature over the raw body. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let evt: { event?: string; payload?: { subscription?: { entity?: SubEntity } } };
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad payload" }, { status: 400 }); }

  const sub = evt.payload?.subscription?.entity;
  if (!evt.event?.startsWith("subscription.") || !sub?.id) return NextResponse.json({ ok: true, ignored: true });

  const admin = createAdminClient();
  const { data: row } = await admin.from("org_billing").select("org_id, pending_plan, plan").eq("razorpay_subscription_id", sub.id).maybeSingle();
  const orgId = row?.org_id ?? sub.notes?.org_id;
  if (!orgId) return NextResponse.json({ ok: true, ignored: true });

  const update: Record<string, unknown> = { status: sub.status, updated_at: new Date().toISOString() };
  if (sub.current_end) update.current_period_end = new Date(sub.current_end * 1000).toISOString();
  if (["subscription.activated", "subscription.charged", "subscription.authenticated", "subscription.resumed"].includes(evt.event)) {
    const plan = sub.notes?.plan ?? row?.pending_plan;
    if (plan === "starter" || plan === "growth") update.plan = plan;
  }
  await admin.from("org_billing").update(update).eq("org_id", orgId);
  return NextResponse.json({ ok: true });
}
