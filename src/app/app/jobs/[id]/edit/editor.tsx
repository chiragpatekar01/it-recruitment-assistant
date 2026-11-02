"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NM, TQ_LEVELS, type Job } from "@/lib/types";
import { Icon } from "@/components/icons";
import { ConfirmSubmit } from "@/components/client";
import { deleteJob, saveJob } from "../../../actions";

type BoolRow = { label: string; query: string; why: string };
type QRow = { q: string; indicator: string; followUp: string };
type TRow = { id: string; skill: string; level: string; q: string; points: string; redFlags: string; custom: boolean };

function initial(job: Job) {
  const d = job.details;
  const s = (v?: string | null) => (v && v !== NM ? v : "");
  const n = (v?: number | null) => (v === null || v === undefined ? "" : String(v));
  return {
    title: job.title, code: job.code ?? "", status: job.status, sourced: String(job.sourced_count ?? 0),
    seniority: s(d.seniority), minYears: n(d.minYears), maxYears: n(d.maxYears), location: s(d.location), workMode: s(d.workMode),
    budget: s(d.budget), education: s(d.education), domain: s(d.domain), domainRequired: d.domainRequired ?? "none",
    noticePreferredDays: n(d.noticePreferredDays), noticeMaxDays: n(d.noticeMaxDays),
    mandatory: (d.mandatory ?? []).join(", "), preferred: (d.preferred ?? []).join(", "), keywords: (d.keywords ?? []).join(", "),
    titles: (d.titles ?? []).join(", "), altTitles: (d.altTitles ?? []).join(", "), combos: (d.combos ?? []).join(", "),
    strategy: (d.strategy ?? []).join("\n"), clarifications: (d.clarifications ?? []).join("\n"), assumptions: (d.assumptions ?? []).join("\n"),
    booleans: (d.booleans ?? []).map((b) => ({ ...b })) as BoolRow[],
    questions: (d.questions ?? []).map((q) => ({ ...q })) as QRow[],
    techQs: (d.techQs ?? []).map((t) => ({ id: t.id, skill: t.skill, level: t.level, q: t.q, points: t.points.join("\n"), redFlags: t.redFlags.join("\n"), custom: t.custom })) as TRow[],
  };
}
type State = ReturnType<typeof initial>;
const newId = () => Math.random().toString(36).slice(2, 10);

export function JobEditor({ job, canDelete }: { job: Job; canDelete: boolean }) {
  const router = useRouter();
  const base = useMemo(() => initial(job), [job]);
  const [e, setE] = useState<State>(base);
  const [msg, setMsg] = useState<{ error?: string; ok?: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(e) !== JSON.stringify(base);

  const set = <K extends keyof State>(k: K, v: State[K]) => setE((x) => ({ ...x, [k]: v }));
  const setRow = <K extends "booleans" | "questions" | "techQs">(k: K, i: number, f: string, v: string) =>
    setE((x) => ({ ...x, [k]: (x[k] as Record<string, unknown>[]).map((r, j) => (j === i ? { ...r, [f]: v } : r)) }));
  const delRow = (k: "booleans" | "questions" | "techQs", i: number) => setE((x) => ({ ...x, [k]: (x[k] as unknown[]).filter((_, j) => j !== i) }));
  const moveQ = (i: number, d: number) => setE((x) => { const q = [...x.questions]; const k = i + d; if (k < 0 || k >= q.length) return x; [q[i], q[k]] = [q[k], q[i]]; return { ...x, questions: q }; });

  const save = () => start(async () => {
    const r = await saveJob(job.id, {
      title: e.title, code: e.code, status: e.status, sourced_count: Number(e.sourced) || 0,
      details: {
        seniority: e.seniority, minYears: e.minYears, maxYears: e.maxYears, location: e.location, workMode: e.workMode, budget: e.budget,
        education: e.education, domain: e.domain, domainRequired: e.domainRequired, noticePreferredDays: e.noticePreferredDays, noticeMaxDays: e.noticeMaxDays,
        mandatory: e.mandatory, preferred: e.preferred, keywords: e.keywords, titles: e.titles, altTitles: e.altTitles, combos: e.combos,
        strategy: e.strategy, clarifications: e.clarifications, assumptions: e.assumptions, booleans: e.booleans, questions: e.questions,
        techQs: e.techQs.filter((t) => t.q.trim()).map((t) => ({ ...t, points: t.points.split("\n").filter(Boolean), redFlags: t.redFlags.split("\n").filter(Boolean) })),
      },
    });
    setMsg(r ?? null);
    if (r?.ok) router.refresh();
  });

  const F = ({ k, label, type = "text", ph = "" }: { k: keyof State; label: string; type?: string; ph?: string }) => (
    <label className="flex flex-col gap-1"><span className="label">{label}</span>
      <input className="input" type={type} value={String(e[k] ?? "")} placeholder={ph} onChange={(ev) => set(k, ev.target.value as never)} /></label>
  );
  const T = ({ k, label, rows = 2, hint }: { k: keyof State; label: string; rows?: number; hint?: string }) => (
    <label className="flex flex-col gap-1"><span className="label">{label}{hint && <span className="text-muted"> · {hint}</span>}</span>
      <textarea className="input" rows={rows} value={String(e[k] ?? "")} onChange={(ev) => set(k, ev.target.value as never)} /></label>
  );

  return (
    <div className="flex flex-col gap-[18px]">
      <section className="panel"><h2 className="font-bold">Job details</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {F({ k: "title", label: "Job title" })}{F({ k: "code", label: "Job code" })}{F({ k: "seniority", label: "Seniority" })}
          {F({ k: "minYears", label: "Min. experience (years)", type: "number" })}{F({ k: "maxYears", label: "Max. experience (years)", type: "number" })}{F({ k: "location", label: "Location" })}
          {F({ k: "workMode", label: "Work mode", ph: "e.g. Hybrid, 3 days in office" })}{F({ k: "budget", label: "Budget", ph: "e.g. ₹12–18 LPA" })}{F({ k: "education", label: "Education" })}
          {F({ k: "noticePreferredDays", label: "Preferred notice (days)", type: "number" })}{F({ k: "noticeMaxDays", label: "Max. notice (days)", type: "number" })}{F({ k: "domain", label: "Domain / industry" })}
          <label className="flex flex-col gap-1"><span className="label">Domain experience is</span>
            <select className="input" value={e.domainRequired} onChange={(ev) => set("domainRequired", ev.target.value as State["domainRequired"])}>
              <option value="none">Not required</option><option value="preferred">Preferred</option><option value="mandatory">Mandatory</option></select></label>
          {F({ k: "sourced", label: "Candidates sourced", type: "number" })}
          <label className="flex flex-col gap-1"><span className="label">Status</span>
            <select className="input" value={e.status} onChange={(ev) => set("status", ev.target.value as State["status"])}>
              <option value="open">Active</option><option value="hold">On hold</option><option value="closed">Closed</option></select></label>
        </div>
      </section>

      <section className="panel"><header className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Skills and keywords</h2><span className="text-xs text-muted">Separate with commas. Changing skills re-scores every candidate for this job.</span></header>
        {T({ k: "mandatory", label: "Mandatory skills (40% of score)" })}{T({ k: "preferred", label: "Preferred skills (10% of score)" })}{T({ k: "keywords", label: "Technical keywords" })}
      </section>

      <section className="panel"><header className="flex items-center justify-between"><h2 className="font-bold">Boolean search strings</h2>
        <button type="button" className="btn btn-sm" onClick={() => set("booleans", [...e.booleans, { label: "", query: "", why: "" }])}><Icon name="plus" className="h-3.5 w-3.5" />Add string</button></header>
        {e.booleans.map((b, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-line2 bg-surface2 p-3">
            <div className="flex gap-2"><input className="input max-w-[360px]" value={b.label} placeholder="Label, e.g. Primary" aria-label="String label" onChange={(ev) => setRow("booleans", i, "label", ev.target.value)} />
              <span className="flex-1" /><button type="button" className="btn-danger btn-sm" onClick={() => delRow("booleans", i)}>Remove</button></div>
            <textarea className="input font-mono text-[12.5px]" rows={3} value={b.query} aria-label="Boolean string" onChange={(ev) => setRow("booleans", i, "query", ev.target.value)} />
            <input className="input" value={b.why} placeholder="Why this string is useful" aria-label="Why this string" onChange={(ev) => setRow("booleans", i, "why", ev.target.value)} />
          </div>
        ))}
        {!e.booleans.length && <p className="text-muted">No search strings yet.</p>}
      </section>

      <section className="panel"><h2 className="font-bold">Sourcing</h2>
        <div className="grid gap-3 sm:grid-cols-2">{T({ k: "titles", label: "Job titles" })}{T({ k: "altTitles", label: "Alternative titles" })}</div>
        {T({ k: "combos", label: "Technology combinations" })}{T({ k: "strategy", label: "Sourcing strategy", rows: 4, hint: "one step per line" })}
      </section>

      <section className="panel"><header className="flex items-center justify-between"><h2 className="font-bold">Screening questions</h2>
        <button type="button" className="btn btn-sm" onClick={() => set("questions", [...e.questions, { q: "", indicator: "", followUp: "" }])}><Icon name="plus" className="h-3.5 w-3.5" />Add question</button></header>
        {e.questions.map((q, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-line2 bg-surface2 p-3">
            <div className="flex items-center justify-between"><span className="cap">Question {i + 1}</span><div className="flex gap-1">
              <button type="button" className="btn btn-sm" disabled={i === 0} onClick={() => moveQ(i, -1)} aria-label="Move up">↑</button>
              <button type="button" className="btn btn-sm" disabled={i === e.questions.length - 1} onClick={() => moveQ(i, 1)} aria-label="Move down">↓</button>
              <button type="button" className="btn-danger btn-sm" onClick={() => delRow("questions", i)}>Remove</button></div></div>
            <textarea className="input" rows={2} value={q.q} placeholder="Question" aria-label="Question" onChange={(ev) => setRow("questions", i, "q", ev.target.value)} />
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="input" value={q.indicator} placeholder="Good answer indicators" aria-label="Good answer indicators" onChange={(ev) => setRow("questions", i, "indicator", ev.target.value)} />
              <input className="input" value={q.followUp} placeholder="Follow-up question" aria-label="Follow-up" onChange={(ev) => setRow("questions", i, "followUp", ev.target.value)} />
            </div>
          </div>
        ))}
      </section>

      <section className="panel"><header className="flex items-center justify-between"><h2 className="font-bold">Technical questions</h2>
        <button type="button" className="btn btn-sm" onClick={() => set("techQs", [...e.techQs, { id: newId(), skill: "", level: "intermediate", q: "", points: "", redFlags: "", custom: true }])}><Icon name="plus" className="h-3.5 w-3.5" />Add question</button></header>
        {e.techQs.map((t, i) => (
          <div key={t.id} className="flex flex-col gap-2 rounded-lg border border-line2 bg-surface2 p-3">
            <div className="flex flex-wrap gap-2">
              <input className="input w-48" value={t.skill} placeholder="Skill" aria-label="Skill" onChange={(ev) => setRow("techQs", i, "skill", ev.target.value)} />
              <select className="input w-auto" value={t.level} aria-label="Level" onChange={(ev) => setRow("techQs", i, "level", ev.target.value)}>{TQ_LEVELS.map((l) => <option key={l.k} value={l.k}>{l.l}</option>)}</select>
              <span className="flex-1" /><button type="button" className="btn-danger btn-sm" onClick={() => delRow("techQs", i)}>Remove</button>
            </div>
            <textarea className="input" rows={2} value={t.q} placeholder="Question" aria-label="Question" onChange={(ev) => setRow("techQs", i, "q", ev.target.value)} />
            <div className="grid gap-2 sm:grid-cols-2">
              <textarea className="input" rows={3} value={t.points} placeholder="Good answer mentions (one per line)" aria-label="Good answer mentions" onChange={(ev) => setRow("techQs", i, "points", ev.target.value)} />
              <textarea className="input" rows={3} value={t.redFlags} placeholder="Red flags (one per line)" aria-label="Red flags" onChange={(ev) => setRow("techQs", i, "redFlags", ev.target.value)} />
            </div>
          </div>
        ))}
        {!e.techQs.length && <p className="text-muted">No technical questions yet. Generate them in the Technical questions tab.</p>}
      </section>

      <section className="panel"><h2 className="font-bold">Notes for the hiring manager</h2>
        <div className="grid gap-3 sm:grid-cols-2">{T({ k: "clarifications", label: "Questions to ask", rows: 4, hint: "one per line" })}{T({ k: "assumptions", label: "Assumptions made", rows: 4, hint: "one per line" })}</div>
      </section>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 shadow-[0_6px_24px_rgba(20,28,36,.1)]">
        <span className={`text-[13px] ${msg?.error ? "text-bad" : "text-muted"}`}>{msg?.error ?? (dirty ? "You have unsaved changes" : msg?.ok ?? "No changes yet")}</span>
        <span className="flex-1" />
        {canDelete && <form action={deleteJob.bind(null, job.id)}><ConfirmSubmit label="Delete job" confirm="Confirm: delete job and its candidates" /></form>}
        <button type="button" className="btn" disabled={!dirty || pending} onClick={() => { setE(base); setMsg(null); }}>Discard changes</button>
        <button type="button" className="btn-primary" disabled={!dirty || pending} onClick={save}>{pending ? "Saving…" : "Save changes"}</button>
      </div>
    </div>
  );
}
