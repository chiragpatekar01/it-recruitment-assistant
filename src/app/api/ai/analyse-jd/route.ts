import { NextResponse } from "next/server";
import { z } from "zod";
import { askClaudeJson } from "@/lib/anthropic";
import { jdPrompt } from "@/lib/prompts";
import { jobFromAi } from "@/lib/normalize";
import { QuotaError, audit, canWrite, checkQuota, recordUsage, requireOrg } from "@/lib/org";
import { assertJobCapacity } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, forbidden } from "../_shared";

export const maxDuration = 60;

const Body = z.object({ jd: z.string().min(80).max(40000), code: z.string().max(40).nullish(), sourced: z.number().int().min(0).max(100000).optional() });

export async function POST(req: Request) {
  try {
    const ctx = await requireOrg();
    if (!canWrite(ctx.role)) return forbidden();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Paste the full job description (at least a few lines)." }, { status: 400 });
    const { jd, code, sourced } = parsed.data;

    await assertJobCapacity(ctx.org.id, ctx.billing.plan).catch((e: Error) => { throw new QuotaError(e.message); });
    await checkQuota(ctx, "jd");

    const { title, details } = jobFromAi(await askClaudeJson(jdPrompt(jd)));
    const { data, error } = await createClient().from("jobs").insert({
      org_id: ctx.org.id, title, code: code?.trim() || null, jd_text: jd.slice(0, 20000), sourced_count: sourced ?? 0, details,
    }).select("id").single();
    if (error) throw new Error(error.message);

    await recordUsage(ctx.org.id, "jd");
    await audit(ctx.org.id, ctx.userId, "job.analysed", "job", data.id);
    return NextResponse.json({ id: data.id });
  } catch (e) {
    return errorResponse(e);
  }
}
