"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/client";
import { SOURCES } from "@/lib/types";
import { createManualCandidate } from "../../../actions";

export function ScreenForm({ jobId, hasSkills }: { jobId: string; hasSkills: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const ctl = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const manual = createManualCandidate.bind(null, jobId);

  async function screen() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    fd.set("jobId", jobId);
    const text = String(fd.get("text") ?? "").trim();
    const file = fd.get("file");
    if (!text && !(file instanceof File && file.size)) { setError("Paste the resume text or upload a file first."); return; }
    setError(null); setBusy(true);
    ctl.current = new AbortController();
    try {
      const res = await fetch("/api/ai/screen-resume", { method: "POST", body: fd, signal: ctl.current.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Screening failed. Try again.");
      router.push(`/app/candidates/${data.id}`);
      router.refresh();
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} action={manual} className="panel">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">Resume</h2>
        <label className="btn btn-sm cursor-pointer">{fileName || "Upload .pdf / .docx / .txt"}
          <input type="file" name="file" accept=".pdf,.docx,.txt,.md,text/plain,application/pdf" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
        </label>
      </header>
      <label className="flex flex-col gap-1"><span className="label">Or paste the resume text</span><textarea className="input" name="text" rows={14} placeholder="Paste the resume text here…" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1"><span className="label">Source</span>
          <select className="input" name="source" defaultValue="linkedin">{SOURCES.map((s) => <option key={s.k} value={s.k}>{s.l}</option>)}</select></label>
        <label className="flex flex-col gap-1"><span className="label">Name (manual entry only)</span><input className="input" name="name" placeholder="Used if you add the candidate manually" /></label>
      </div>
      {!hasSkills && <p className="callout">This job has no mandatory skills yet. Add them in the Edit tab before screening.</p>}
      {busy && (
        <div role="status" className="flex items-center gap-3 rounded-lg bg-accent-soft px-3.5 py-3 font-semibold text-accent">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          <span className="flex-1">Screening the resume against the job…</span>
          <button type="button" className="btn btn-sm" onClick={() => ctl.current?.abort()}>Stop</button>
        </div>
      )}
      {error && <p role="alert" className="callout-bad">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy || !hasSkills} onClick={screen}>Screen against JD</button>
        <SubmitButton className="btn" pending="Adding…" disabled={busy}>Add candidate manually</SubmitButton>
      </div>
      <p className="text-xs text-muted">Only the extracted screening profile is saved, not the resume. Age, gender, photos and other personal details are ignored and never used in scoring. Each screen uses one resume screen from your plan.</p>
    </form>
  );
}
