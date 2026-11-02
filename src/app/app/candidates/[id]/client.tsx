"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmSubmit } from "@/components/client";
import { ALL_STAGES, LEVELS, NEXT_STEPS, NM, SOURCES, type Level, type SkillEvidence } from "@/lib/types";
import { deleteCandidate, updateCandidate, type CandidatePatch } from "../../actions";

interface Init {
  name: string; stage: string; source: string; decision: string; notes: string; designation: string; location: string; expectedCtc: string;
  relevantYears: number | null; projectRelevance: number; noticeDays: number | null; domainMatch: string; educationMatch: string; locationFit: string;
}

export function Evaluation({ id, canEdit, suggested, why, initial, evidence }: {
  id: string; canEdit: boolean; suggested: string; why: string; initial: Init; evidence: { mandatory: SkillEvidence[]; preferred: SkillEvidence[] };
}) {
  const [notes, setNotes] = useState(initial.notes);
  const [ev, setEv] = useState(evidence);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (patch: CandidatePatch, label = "Saved") => start(async () => {
    const r = await updateCandidate(id, patch);
    setStatus(r?.error ?? label);
    setTimeout(() => setStatus(null), 2500);
  });
  const num = (v: string) => (v === "" ? null : Number(v));
  const setLevel = (grp: "mandatory" | "preferred", skill: string, level: Level) => {
    const list = ev[grp].map((x) => (x.skill === skill ? { ...x, level, evidence: x.evidence === "Not assessed" || !x.evidence ? "Set by recruiter" : x.evidence } : x));
    setEv({ ...ev, [grp]: list });
    save({ profile: { [grp]: list } }, "Score updated");
  };
  const dis = !canEdit || pending;

  return (
    <>
      <section className="panel">
        <header className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Decision and details</h2>
          <span role="status" className={`text-[13px] ${status && status !== "Saved" && status !== "Score updated" ? "text-bad" : "text-muted"}`}>{pending ? "Saving…" : status}</span></header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1"><span className="label">Current stage</span>
            <select className="input" disabled={dis} defaultValue={initial.stage} onChange={(e) => save({ stage: e.target.value })}>{ALL_STAGES.map((s) => <option key={s.k} value={s.k}>{s.l}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="label">Recruiter&apos;s next step</span>
            <select className="input" disabled={dis} defaultValue={initial.decision} onChange={(e) => save({ decision: e.target.value })}>
              <option value="">Not decided (suggested: {suggested})</option>{NEXT_STEPS.map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="label">Candidate name</span><input className="input" disabled={dis} defaultValue={initial.name} onBlur={(e) => e.target.value !== initial.name && save({ name: e.target.value })} /></label>
          <label className="flex flex-col gap-1"><span className="label">Source</span>
            <select className="input" disabled={dis} defaultValue={initial.source} onChange={(e) => save({ source: e.target.value })}>{SOURCES.map((s) => <option key={s.k} value={s.k}>{s.l}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="label">Current designation</span><input className="input" disabled={dis} defaultValue={initial.designation} placeholder={NM} onBlur={(e) => save({ profile: { designation: e.target.value.trim() || NM } })} /></label>
          <label className="flex flex-col gap-1"><span className="label">Current location</span><input className="input" disabled={dis} defaultValue={initial.location} placeholder={NM} onBlur={(e) => save({ profile: { location: e.target.value.trim() || NM } })} /></label>
          <label className="flex flex-col gap-1"><span className="label">Expected CTC</span><input className="input" disabled={dis} defaultValue={initial.expectedCtc} placeholder={NM} onBlur={(e) => save({ profile: { expectedCtc: e.target.value.trim() || NM } })} /></label>
          <label className="flex flex-col gap-1"><span className="label">Notice (days)</span><input className="input" type="number" min={0} disabled={dis} defaultValue={initial.noticeDays ?? ""} onBlur={(e) => save({ profile: { noticeDays: num(e.target.value) } }, "Score updated")} /></label>
          <label className="flex flex-col gap-1"><span className="label">Relevant years</span><input className="input" type="number" step="0.5" min={0} disabled={dis} defaultValue={initial.relevantYears ?? ""} onBlur={(e) => save({ profile: { relevantYears: num(e.target.value) } }, "Score updated")} /></label>
          <label className="flex flex-col gap-1"><span className="label">Project relevance (0–10)</span><input className="input" type="number" min={0} max={10} disabled={dis} defaultValue={initial.projectRelevance} onBlur={(e) => save({ profile: { projectRelevance: Math.max(0, Math.min(10, Math.round(Number(e.target.value) || 0))) } }, "Score updated")} /></label>
          <label className="flex flex-col gap-1"><span className="label">Domain match</span>
            <select className="input" disabled={dis} defaultValue={initial.domainMatch} onChange={(e) => save({ profile: { domainMatch: e.target.value as "yes" } }, "Score updated")}>{["yes", "no", "unknown"].map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="label">Education</span>
            <select className="input" disabled={dis} defaultValue={initial.educationMatch} onChange={(e) => save({ profile: { educationMatch: e.target.value as "meets" } }, "Score updated")}>{["meets", "partial", "does-not-meet", "unknown"].map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="label">Location fit</span>
            <select className="input" disabled={dis} defaultValue={initial.locationFit} onChange={(e) => save({ profile: { locationFit: e.target.value as "fits" } }, "Score updated")}>{["fits", "relocation", "mismatch", "unknown"].map((o) => <option key={o}>{o}</option>)}</select></label>
        </div>
        <p className="text-[13px] text-muted"><b>Why suggested:</b> {why} The final decision is yours.</p>
      </section>

      {canEdit && (
        <section className="panel">
          <header className="flex items-center justify-between"><h2 className="font-bold">Correct the evidence</h2><span className="text-xs text-muted">Changing a level recalculates the score</span></header>
          <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
            {(["mandatory", "preferred"] as const).flatMap((grp) => ev[grp].map((x) => (
              <label key={grp + x.skill} className="flex items-center justify-between gap-3 border-b border-line2 py-1.5 text-[13px]">
                <span>{x.skill} <small className="text-muted">({grp === "mandatory" ? "must-have" : "nice-to-have"})</small></span>
                <select className="input w-auto py-1" disabled={pending} value={x.level} onChange={(e) => setLevel(grp, x.skill, e.target.value as Level)} aria-label={`Evidence level for ${x.skill}`}>
                  {LEVELS.map((l) => <option key={l.k} value={l.k}>{l.l}</option>)}</select>
              </label>
            )))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2 className="font-bold">Recruiter screening notes</h2>
        <textarea className="input" rows={5} disabled={!canEdit} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes from your screening call…" />
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" disabled={pending || notes === initial.notes} onClick={() => save({ notes }, "Notes saved")}>Save notes</button>
            <Link href={`/app/messages?candidate=${id}`} className="btn">Draft a message</Link>
            <span className="flex-1" />
            <form action={deleteCandidate.bind(null, id)}><ConfirmSubmit label="Delete candidate" confirm="Confirm delete" /></form>
          </div>
        )}
      </section>
    </>
  );
}
