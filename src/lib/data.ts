import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Candidate, Job } from "./types";
import { stageIdx } from "./types";
import { score } from "./scoring";

export async function listJobs(orgId: string): Promise<Job[]> {
  const { data } = await createClient().from("jobs").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
  return (data ?? []) as Job[];
}

export async function getJob(orgId: string, id: string): Promise<Job> {
  const { data } = await createClient().from("jobs").select("*").eq("org_id", orgId).eq("id", id).maybeSingle();
  if (!data) notFound();
  return data as Job;
}

export async function listCandidates(orgId: string, jobId?: string): Promise<Candidate[]> {
  let q = createClient().from("candidates").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
  if (jobId) q = q.eq("job_id", jobId);
  const { data } = await q;
  return (data ?? []) as Candidate[];
}

export async function getCandidate(orgId: string, id: string): Promise<Candidate> {
  const { data } = await createClient().from("candidates").select("*").eq("org_id", orgId).eq("id", id).maybeSingle();
  if (!data) notFound();
  return data as Candidate;
}

/** Pipeline counts. A candidate counts toward every stage they have reached. */
export function metrics(jobs: Job[], cands: Candidate[]) {
  const ids = new Set(jobs.map((j) => j.id));
  const cs = cands.filter((c) => ids.has(c.job_id));
  const reached = (k: string) => cs.filter((c) => (c.furthest ?? Math.max(stageIdx(c.stage), 1)) >= stageIdx(k)).length;
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const bands = { strong: 0, good: 0, partial: 0, low: 0 };
  cs.forEach((c) => { const j = byId.get(c.job_id); if (j) bands[score(c.profile, j.details).band]++; });
  return {
    sourced: Math.max(jobs.reduce((a, j) => a + (j.sourced_count || 0), 0), cs.length),
    screened: cs.length,
    shortlisted: reached("shortlisted"),
    iSched: reached("interview_scheduled"),
    iDone: reached("interview_done"),
    selected: reached("selected"),
    offered: reached("offered"),
    joined: reached("joined"),
    onHold: cs.filter((c) => c.stage === "on_hold").length,
    rejected: cs.filter((c) => c.stage === "rejected").length,
    pending: cs.filter((c) => c.stage === "screened" || c.stage === "on_hold").length,
    bands,
  };
}
export const ratio = (a: number, b: number) => (b > 0 ? ((100 * a) / b).toFixed(1) + "%" : "No data yet");
