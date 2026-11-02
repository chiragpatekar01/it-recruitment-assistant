"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ORG_COOKIE, audit, canManage, canWrite, requireOrg } from "@/lib/org";
import { PLANS } from "@/lib/plans";
import { assertJobCapacity } from "@/lib/limits";
import { arr, booleansOf, lines, numOrNull, questionsOf, techFromAi, uid } from "@/lib/normalize";
import type { CandidateProfile, JobDetails, Role, TechQuestion } from "@/lib/types";
import { NM, stageIdx } from "@/lib/types";

export type ActionResult = { error?: string; ok?: string } | undefined;

const writer = async () => {
  const ctx = await requireOrg();
  if (!canWrite(ctx.role)) throw new Error("Your role is view-only in this workspace.");
  return ctx;
};
const manager = async () => {
  const ctx = await requireOrg();
  if (!canManage(ctx.role)) throw new Error("Only workspace owners and admins can do this.");
  return ctx;
};
const fail = (e: unknown): ActionResult => ({ error: e instanceof Error ? e.message : "Something went wrong. Try again." });

export async function switchOrg(form: FormData) {
  const ctx = await requireOrg();
  const id = String(form.get("org") ?? "");
  if (ctx.orgs.some((o) => o.id === id)) {
    cookies().set(ORG_COOKIE, id, { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365 });
  }
  redirect("/app");
}



/* ---------------- jobs ---------------- */
export async function createManualJob(form: FormData) {
  const ctx = await writer();
  await assertJobCapacity(ctx.org.id, ctx.billing.plan);
  const { data, error } = await createClient().from("jobs").insert({
    org_id: ctx.org.id, title: "New job", code: String(form.get("code") ?? "").trim() || null,
    jd_text: String(form.get("jd") ?? "").slice(0, 20000) || null, sourced_count: Number(form.get("sourced")) || 0,
    details: { mandatory: [], preferred: [], domainRequired: "none", booleans: [], questions: [], techQs: [] },
  }).select("id").single();
  if (error) throw new Error(error.message);
  await audit(ctx.org.id, ctx.userId, "job.created", "job", data.id);
  redirect(`/app/jobs/${data.id}/edit`);
}

export interface JobEditPayload {
  title: string; code: string; status: "open" | "hold" | "closed"; sourced_count: number;
  details: Record<string, unknown>;
}

export async function saveJob(id: string, p: JobEditPayload): Promise<ActionResult> {
  try {
    const ctx = await writer();
    const supabase = createClient();
    const { data: cur } = await supabase.from("jobs").select("details, status").eq("id", id).eq("org_id", ctx.org.id).single();
    if (!cur) return { error: "Job not found." };
    if (cur.status !== "open" && p.status === "open") await assertJobCapacity(ctx.org.id, ctx.billing.plan);
    const d = p.details;
    const t = (v: unknown) => String(v ?? "").trim();
    const details: JobDetails = {
      ...(cur.details as JobDetails),
      seniority: t(d.seniority) || NM, minYears: numOrNull(d.minYears), maxYears: numOrNull(d.maxYears),
      location: t(d.location) || NM, workMode: t(d.workMode) || NM, budget: t(d.budget) || NM, education: t(d.education) || NM,
      domain: t(d.domain) || NM, domainRequired: (["mandatory", "preferred", "none"].includes(String(d.domainRequired)) ? d.domainRequired : "none") as JobDetails["domainRequired"],
      noticePreferredDays: numOrNull(d.noticePreferredDays), noticeMaxDays: numOrNull(d.noticeMaxDays),
      mandatory: arr(d.mandatory), preferred: arr(d.preferred), keywords: arr(d.keywords), titles: arr(d.titles),
      altTitles: arr(d.altTitles), combos: arr(d.combos), strategy: lines(d.strategy), clarifications: lines(d.clarifications),
      assumptions: lines(d.assumptions), booleans: booleansOf(d.booleans), questions: questionsOf(d.questions),
      techQs: techFromAi({ questions: d.techQs }),
    };
    const { error } = await supabase.from("jobs").update({
      title: t(p.title) || "Untitled role", code: t(p.code) || null,
      status: ["open", "hold", "closed"].includes(p.status) ? p.status : "open",
      sourced_count: Math.max(0, Math.floor(Number(p.sourced_count) || 0)), details,
    }).eq("id", id).eq("org_id", ctx.org.id);
    if (error) return { error: error.message };
    revalidatePath(`/app/jobs/${id}`, "layout");
    return { ok: "Changes saved" };
  } catch (e) { return fail(e); }
}

export async function deleteJob(id: string) {
  const ctx = await manager();
  await createClient().from("jobs").delete().eq("id", id).eq("org_id", ctx.org.id);
  await audit(ctx.org.id, ctx.userId, "job.deleted", "job", id);
  revalidatePath("/app", "layout");
  redirect("/app/jobs");
}

async function mutateTechQs(jobId: string, fn: (list: TechQuestion[]) => TechQuestion[]) {
  const ctx = await writer();
  const supabase = createClient();
  const { data } = await supabase.from("jobs").select("details").eq("id", jobId).eq("org_id", ctx.org.id).single();
  if (!data) throw new Error("Job not found.");
  const details = data.details as JobDetails;
  details.techQs = fn(details.techQs ?? []);
  const { error } = await supabase.from("jobs").update({ details }).eq("id", jobId).eq("org_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/jobs/${jobId}`, "layout");
}

export async function addTechQuestion(jobId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const q = String(form.get("q") ?? "").trim();
    if (!q) return { error: "Write the question first." };
    const item: TechQuestion = {
      id: uid(), skill: String(form.get("skill") || "General"), q, custom: true,
      level: (["basic", "intermediate", "advanced", "scenario"].includes(String(form.get("level"))) ? form.get("level") : "intermediate") as TechQuestion["level"],
      points: lines(form.get("points")), redFlags: lines(form.get("redFlags")),
    };
    await mutateTechQs(jobId, (l) => [...l, item]);
    return { ok: "Question added" };
  } catch (e) { return fail(e); }
}

export async function deleteTechQuestion(jobId: string, qid: string) {
  await mutateTechQs(jobId, (l) => l.filter((t) => t.id !== qid));
}

/* ---------------- candidates ---------------- */
export async function createManualCandidate(jobId: string, form: FormData) {
  const ctx = await writer();
  const supabase = createClient();
  const { data: job } = await supabase.from("jobs").select("details").eq("id", jobId).eq("org_id", ctx.org.id).single();
  if (!job) throw new Error("Job not found.");
  const d = job.details as JobDetails;
  const ev = (list?: string[]) => (list ?? []).map((skill) => ({ skill, level: "none" as const, evidence: NM }));
  const profile: CandidateProfile = {
    designation: NM, mandatory: ev(d.mandatory), preferred: ev(d.preferred), projectRelevance: 0,
    domainMatch: "unknown", educationMatch: "unknown", locationFit: "unknown", verify: ["Profile entered manually: confirm all details"],
  };
  const { data, error } = await supabase.from("candidates").insert({
    org_id: ctx.org.id, job_id: jobId, name: String(form.get("name") || "New candidate").slice(0, 120),
    source: String(form.get("source") || "other"), profile,
  }).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/app/candidates/${data.id}`);
}

export interface CandidatePatch {
  name?: string; stage?: string; source?: string; decision?: string | null; notes?: string | null;
  profile?: Partial<CandidateProfile>;
}

export async function updateCandidate(id: string, patch: CandidatePatch): Promise<ActionResult> {
  try {
    const ctx = await writer();
    const supabase = createClient();
    const { data: cur } = await supabase.from("candidates").select("profile, furthest, job_id").eq("id", id).eq("org_id", ctx.org.id).single();
    if (!cur) return { error: "Candidate not found." };
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name.trim().slice(0, 120) || "Unnamed candidate";
    if (patch.source !== undefined) row.source = patch.source;
    if (patch.decision !== undefined) row.decision = patch.decision || null;
    if (patch.notes !== undefined) row.notes = (patch.notes ?? "").slice(0, 10000);
    if (patch.stage !== undefined) {
      row.stage = patch.stage;
      const i = stageIdx(patch.stage);
      if (i > (cur.furthest ?? 1)) row.furthest = i;
    }
    if (patch.profile) row.profile = { ...(cur.profile as CandidateProfile), ...patch.profile };
    const { error } = await supabase.from("candidates").update(row).eq("id", id).eq("org_id", ctx.org.id);
    if (error) return { error: error.message };
    revalidatePath(`/app/candidates/${id}`);
    revalidatePath(`/app/jobs/${cur.job_id}`, "layout");
    return { ok: "Saved" };
  } catch (e) { return fail(e); }
}

export async function deleteCandidate(id: string) {
  const ctx = await writer();
  const supabase = createClient();
  const { data } = await supabase.from("candidates").select("job_id").eq("id", id).eq("org_id", ctx.org.id).single();
  await supabase.from("candidates").delete().eq("id", id).eq("org_id", ctx.org.id);
  await audit(ctx.org.id, ctx.userId, "candidate.deleted", "candidate", id);
  redirect(data ? `/app/jobs/${data.job_id}/candidates` : "/app/candidates");
}

/* ---------------- workspace & team ---------------- */
export async function renameWorkspace(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const ctx = await manager();
    const name = String(form.get("name") ?? "").trim();
    if (name.length < 2 || name.length > 80) return { error: "Use a name between 2 and 80 characters." };
    const { error } = await createClient().from("organizations").update({ name }).eq("id", ctx.org.id);
    if (error) return { error: error.message };
    revalidatePath("/app", "layout");
    return { ok: "Workspace renamed" };
  } catch (e) { return fail(e); }
}

export async function updateMyName(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const ctx = await requireOrg();
    const { error } = await createClient().from("profiles").update({ full_name: String(form.get("name") ?? "").trim().slice(0, 80) || null }).eq("id", ctx.userId);
    if (error) return { error: error.message };
    revalidatePath("/app", "layout");
    return { ok: "Name updated" };
  } catch (e) { return fail(e); }
}

export async function inviteMember(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const ctx = await manager();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const role = String(form.get("role") ?? "recruiter") as Role;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
    if (!["admin", "recruiter", "viewer"].includes(role)) return { error: "Choose a role." };
    if (role === "admin" && ctx.role !== "owner") return { error: "Only owners can invite admins." };
    const supabase = createClient();
    const [{ count: members }, { count: pending }] = await Promise.all([
      supabase.from("memberships").select("user_id", { count: "exact", head: true }).eq("org_id", ctx.org.id),
      supabase.from("invitations").select("id", { count: "exact", head: true }).eq("org_id", ctx.org.id).is("accepted_at", null).gt("expires_at", new Date().toISOString()),
    ]);
    const seats = PLANS[ctx.billing.plan]?.seats ?? PLANS.trial.seats;
    if ((members ?? 0) + (pending ?? 0) >= seats) return { error: `Your plan includes ${seats} team members. Upgrade in Billing to add more.` };
    const { error } = await supabase.from("invitations").insert({ org_id: ctx.org.id, email, role, invited_by: ctx.userId });
    if (error) return { error: error.message };
    await audit(ctx.org.id, ctx.userId, "member.invited");
    revalidatePath("/app/settings/team");
    return { ok: `Invitation created for ${email}. Copy the link below and send it to them.` };
  } catch (e) { return fail(e); }
}

export async function revokeInvite(id: string) {
  const ctx = await manager();
  await createClient().from("invitations").delete().eq("id", id).eq("org_id", ctx.org.id);
  revalidatePath("/app/settings/team");
}

export async function changeRole(userId: string, form: FormData) {
  const ctx = await manager();
  const role = String(form.get("role")) as Role;
  if (!["owner", "admin", "recruiter", "viewer"].includes(role)) return;
  const { error } = await createClient().from("memberships").update({ role }).eq("org_id", ctx.org.id).eq("user_id", userId);
  if (error) throw new Error(error.message.includes("owner") ? error.message : "Couldn't change the role.");
  await audit(ctx.org.id, ctx.userId, "member.role_changed", "user", userId);
  revalidatePath("/app/settings/team");
}

export async function removeMember(userId: string) {
  const ctx = await requireOrg();
  if (userId !== ctx.userId && !canManage(ctx.role)) throw new Error("Only owners and admins can remove members.");
  const { error } = await createClient().from("memberships").delete().eq("org_id", ctx.org.id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  await audit(ctx.org.id, ctx.userId, "member.removed", "user", userId);
  if (userId === ctx.userId) { cookies().delete(ORG_COOKIE); redirect("/app"); }
  revalidatePath("/app/settings/team");
}

export async function deleteWorkspace(form: FormData) {
  const ctx = await requireOrg();
  if (ctx.role !== "owner") throw new Error("Only owners can delete the workspace.");
  if (String(form.get("confirm") ?? "").trim() !== ctx.org.name) redirect("/app/settings?error=confirm");
  if (ctx.billing.razorpay_subscription_id && ["active", "authenticated", "pending"].includes(ctx.billing.status)) redirect("/app/settings?error=billing");
  await createClient().from("organizations").delete().eq("id", ctx.org.id);
  cookies().delete(ORG_COOKIE);
  redirect("/app");
}
