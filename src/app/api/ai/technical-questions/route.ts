import { NextResponse } from "next/server";
import { z } from "zod";
import { askClaudeJson } from "@/lib/anthropic";
import { techPrompt } from "@/lib/prompts";
import { techFromAi } from "@/lib/normalize";
import { canWrite, checkQuota, recordUsage, requireOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/types";
import { errorResponse, forbidden } from "../_shared";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const ctx = await requireOrg();
    if (!canWrite(ctx.role)) return forbidden();
    const parsed = z.object({ jobId: z.string().uuid() }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Missing job." }, { status: 400 });

    const supabase = createClient();
    const { data } = await supabase.from("jobs").select("*").eq("id", parsed.data.jobId).eq("org_id", ctx.org.id).maybeSingle();
    const job = data as Job | null;
    if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
    if (!job.details.mandatory?.length) return NextResponse.json({ error: "Add mandatory skills to this job first (Edit tab)." }, { status: 400 });

    await checkQuota(ctx, "questions");
    const generated = techFromAi(await askClaudeJson(techPrompt(job), 12000));
    if (!generated.length) throw new Error("No questions came back. Try again.");

    // Keep the recruiter's own questions; replace the generated ones.
    const { data: fresh } = await supabase.from("jobs").select("details").eq("id", job.id).single();
    const details = (fresh?.details ?? job.details) as Job["details"];
    details.techQs = [...generated, ...(details.techQs ?? []).filter((t) => t.custom)];
    const { error } = await supabase.from("jobs").update({ details }).eq("id", job.id).eq("org_id", ctx.org.id);
    if (error) throw new Error(error.message);

    await recordUsage(ctx.org.id, "questions");
    return NextResponse.json({ count: generated.length });
  } catch (e) {
    return errorResponse(e);
  }
}
