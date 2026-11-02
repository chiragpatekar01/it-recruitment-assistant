"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/client";
import { createManualJob } from "../../actions";

export function NewJobForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function analyse(form: HTMLFormElement) {
    const fd = new FormData(form);
    const jd = String(fd.get("jd") ?? "").trim();
    if (jd.length < 80) { setError("Paste the full job description first (at least a few lines)."); return; }
    setError(null); setBusy(true);
    ctl.current = new AbortController();
    try {
      const res = await fetch("/api/ai/analyse-jd", {
        method: "POST", headers: { "content-type": "application/json" }, signal: ctl.current.signal,
        body: JSON.stringify({ jd, code: fd.get("code"), sourced: Number(fd.get("sourced")) || 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Analysis failed. Try again.");
      router.push(`/app/jobs/${data.id}`);
      router.refresh();
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} action={createManualJob} className="panel">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1"><span className="label">Job code</span><input className="input" name="code" placeholder="e.g. JAVA-014" /></label>
        <label className="flex flex-col gap-1"><span className="label">Candidates sourced so far</span><input className="input" name="sourced" type="number" min={0} placeholder="0" /></label>
      </div>
      <label className="flex flex-col gap-1"><span className="label">Job description</span>
        <textarea className="input" name="jd" rows={14} placeholder="Paste the full JD: role, experience, must-have and good-to-have skills, location, work mode, budget, notice period…" /></label>
      {busy && (
        <div role="status" className="flex items-center gap-3 rounded-lg bg-accent-soft px-3.5 py-3 font-semibold text-accent">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          <span className="flex-1">Analysing the JD: extracting requirements, Boolean strings and screening questions…</span>
          <button type="button" className="btn btn-sm" onClick={() => ctl.current?.abort()}>Stop</button>
        </div>
      )}
      {error && <p role="alert" className="callout-bad">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => formRef.current && analyse(formRef.current)}>Analyse JD with Claude</button>
        <SubmitButton className="btn" pending="Creating…" disabled={busy}>Enter requirements manually</SubmitButton>
      </div>
      <p className="text-xs text-muted">Analysis usually takes 20–60 seconds and uses one JD analysis from your plan. Review the extracted requirements before screening against them.</p>
    </form>
  );
}
