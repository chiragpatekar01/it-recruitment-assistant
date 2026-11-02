import { NextResponse } from "next/server";
import { askClaudeJson } from "@/lib/anthropic";
import { resumePrompt } from "@/lib/prompts";
import { candidateFromAi } from "@/lib/normalize";
import { audit, canWrite, checkQuota, recordUsage, requireOrg } from "@/lib/org";
import { resumeText } from "@/lib/resume";
import { createClient } from "@/lib/supabase/server";
import { SOURCES, type Job } from "@/lib/types";
import { errorResponse, forbidden } from "../_shared";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ctx = await requireOrg();
    if (!canWrite(ctx.role)) return forbidden();
    const form = await req.formData();
    const jobId = String(form.get("jobId") ?? "");
    const source = String(form.get("source") ?? "other");
    const file = form.get("file");

    const supabase = createClient();
    const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).eq("org_id", ctx.org.id).maybeSingle();
    if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
    if (!(job as Job).details?.mandatory?.length) return NextResponse.json({ error: "This job has no mandatory skills yet. Add them in the Edit tab first." }, { status: 400 });

    let text = String(form.get("text") ?? "").trim();
    if (!text && file instanceof File && file.size > 0) text = (await resumeText(file)).trim();
    if (text.length < 80) return NextResponse.json({ error: "Paste the resume text or upload a file. Scanned PDFs without text need the text pasted in." }, { status: 400 });

    await checkQuota(ctx, "resume");
    const { name, profile } = candidateFromAi(await askClaudeJson(resumePrompt(job as Job, text.slice(0, 40000))), (job as Job).details);

    const { data, error } = await supabase.from("candidates").insert({
      org_id: ctx.org.id, job_id: job.id, name, profile,
      source: SOURCES.some((s) => s.k === source) ? source : "other", stage: "screened", furthest: 1,
    }).select("id").single();
    if (error) throw new Error(error.message);

    await recordUsage(ctx.org.id, "resume");
    await audit(ctx.org.id, ctx.userId, "candidate.screened", "candidate", data.id);
    return NextResponse.json({ id: data.id });
  } catch (e) {
    return errorResponse(e);
  }
}
