"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/client";
import { MSG_TYPES, draftMessage, type MsgType } from "@/lib/messages";
import type { Candidate, Job } from "@/lib/types";

export function Composer({ jobs, cands, recruiter, orgName, initialJob, initialCand }: { jobs: Job[]; cands: Candidate[]; recruiter: string; orgName: string; initialJob: string; initialCand: string }) {
  const [type, setType] = useState<MsgType>("outreach");
  const [jobId, setJobId] = useState(initialJob);
  const [candId, setCandId] = useState(initialCand);
  const [name, setName] = useState(recruiter);
  const [override, setOverride] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const job = jobs.find((j) => j.id === jobId) ?? null;
  const forJob = useMemo(() => cands.filter((c) => c.job_id === jobId), [cands, jobId]);
  const cand = forJob.find((c) => c.id === candId) ?? null;
  const text = override ?? draftMessage(type, cand, job, name, orgName);

  async function polish() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/ai/polish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: text }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't tighten the draft.");
      setOverride(data.text);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="grid items-start gap-[18px] md:grid-cols-[300px_minmax(0,1fr)]">
      <section className="panel">
        <label className="flex flex-col gap-1"><span className="label">Message type</span>
          <select className="input" value={type} onChange={(e) => { setType(e.target.value as MsgType); setOverride(null); }}>{MSG_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="flex flex-col gap-1"><span className="label">Job</span>
          <select className="input" value={jobId} onChange={(e) => { setJobId(e.target.value); setCandId(""); setOverride(null); }}>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}{!jobs.length && <option value="">No jobs yet</option>}</select></label>
        <label className="flex flex-col gap-1"><span className="label">Candidate</span>
          <select className="input" value={candId} onChange={(e) => { setCandId(e.target.value); setOverride(null); }}><option value="">No candidate (placeholders)</option>{forJob.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="flex flex-col gap-1"><span className="label">Your name (signature)</span><input className="input" value={name} onChange={(e) => { setName(e.target.value); setOverride(null); }} /></label>
        <p className="text-xs text-muted">Fill the [bracketed] placeholders before sending. Drafts never promise salary, selection or terms that aren&apos;t confirmed.</p>
      </section>
      <section className="panel">
        <header className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{MSG_TYPES.find(([k]) => k === type)?.[1]}</h2>
          <div className="flex gap-2">
            <button type="button" className="btn btn-sm" onClick={() => setOverride(null)}>Reset</button>
            <button type="button" className="btn btn-sm" disabled={busy} onClick={polish}>{busy ? "Tightening…" : "Tighten with Claude"}</button>
            <CopyButton text={text} className="btn-primary btn-sm" />
          </div></header>
        {error && <p role="alert" className="callout-bad">{error}</p>}
        <textarea className="input min-h-[320px]" rows={18} value={text} onChange={(e) => setOverride(e.target.value)} aria-label="Message draft" />
      </section>
    </div>
  );
}
