"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { CopyButton, SubmitButton } from "@/components/client";
import { Bullets } from "@/components/ui";
import { TQ_LEVELS, type TechQuestion } from "@/lib/types";
import { addTechQuestion, deleteTechQuestion } from "../../../actions";

const LVL_CLS: Record<string, string> = { basic: "bg-good-soft text-good", intermediate: "bg-info-soft text-info", advanced: "bg-violet-soft text-violet", scenario: "bg-warn-soft text-warn" };
const lvlLabel = (k: string) => TQ_LEVELS.find((l) => l.k === k)?.l ?? k;

export function TechQuestions({ jobId, title, list, mandatory, preferred, canEdit }: { jobId: string; title: string; list: TechQuestion[]; mandatory: string[]; preferred: string[]; canEdit: boolean }) {
  const router = useRouter();
  const [skill, setSkill] = useState("all");
  const [level, setLevel] = useState("all");
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const ctl = useRef<AbortController | null>(null);
  const [addState, addAction] = useFormState(addTechQuestion.bind(null, jobId), undefined);
  const addRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (addState?.ok) addRef.current?.reset(); }, [addState]);

  const order = useMemo(() => [...mandatory, ...preferred, "Scenario"], [mandatory, preferred]);
  const skills = useMemo(() => [...new Set([...order, ...list.map((t) => t.skill)])], [order, list]);
  const groups = useMemo(() => {
    const f = list.filter((t) => (skill === "all" || t.skill.toLowerCase() === skill.toLowerCase()) && (level === "all" || t.level === level));
    const by = new Map<string, TechQuestion[]>();
    f.forEach((t) => { const k = order.find((o) => o.toLowerCase() === t.skill.toLowerCase()) ?? t.skill; by.set(k, [...(by.get(k) ?? []), t]); });
    const li = (t: TechQuestion) => TQ_LEVELS.findIndex((l) => l.k === t.level);
    const oi = (k: string) => { const i = order.indexOf(k); return i < 0 ? 99 : i; };
    return [...by.entries()].sort((a, b) => oi(a[0]) - oi(b[0])).map(([k, v]) => [k, v.sort((a, b) => li(a) - li(b))] as const);
  }, [list, skill, level, order]);

  const text = `Technical questions: ${title}\n\n` + groups.map(([k, qs]) => `== ${k} ==\n` + qs.map((t, i) =>
    `${i + 1}. [${lvlLabel(t.level)}] ${t.q}\n   Good answer mentions: ${t.points.join("; ") || "—"}\n   Red flags: ${t.redFlags.join("; ") || "—"}`).join("\n\n")).join("\n\n");

  async function generate() {
    if (list.some((t) => !t.custom) && armed !== "gen") { setArmed("gen"); return; }
    setArmed(null); setError(null); setBusy(true);
    ctl.current = new AbortController();
    try {
      const res = await fetch("/api/ai/technical-questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId }), signal: ctl.current.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't generate questions. Try again.");
      setSkill("all"); setLevel("all"); router.refresh();
    } catch (e) { if ((e as Error).name !== "AbortError") setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const counts = Object.fromEntries(TQ_LEVELS.map((l) => [l.k, list.filter((t) => t.level === l.k).length]));
  return (
    <>
      <section className="panel">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-bold">Technical questions</h2><p className="mt-0.5 text-[13px] text-muted">For the technical round. Each question lists what a good answer should mention, so you can judge it without being a developer.</p></div>
          <div className="flex gap-2">
            {!!list.length && <CopyButton text={text} label="Copy all" className="btn" />}
            {canEdit && <button type="button" className={list.length ? "btn" : "btn-primary"} disabled={busy} onClick={generate} onBlur={() => setArmed(null)}>
              {list.length ? (armed === "gen" ? "Confirm: replace generated questions" : "Regenerate") : "Generate with Claude"}</button>}
          </div>
        </header>
        {armed === "gen" && <p className="callout">Regenerating replaces the questions Claude made. Questions you added yourself are kept.</p>}
        {busy && <div role="status" className="flex items-center gap-3 rounded-lg bg-accent-soft px-3.5 py-3 font-semibold text-accent"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /><span className="flex-1">Writing technical questions for each skill…</span><button type="button" className="btn btn-sm" onClick={() => ctl.current?.abort()}>Stop</button></div>}
        {error && <p role="alert" className="callout-bad">{error}</p>}
        {!!list.length && (
          <div className="flex flex-wrap gap-2">
            <select className="input w-auto" value={skill} onChange={(e) => setSkill(e.target.value)} aria-label="Filter by skill"><option value="all">All skills</option>{skills.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            <select className="input w-auto" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by level"><option value="all">All levels ({list.length})</option>{TQ_LEVELS.map((l) => <option key={l.k} value={l.k}>{l.l} ({counts[l.k]})</option>)}</select>
          </div>
        )}
      </section>

      {!list.length ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-muted">No technical questions yet. Claude writes 3 per must-have skill (basic, intermediate, advanced), 1 per nice-to-have skill, and 4 real-world scenarios for this role.</div>
      ) : !groups.length ? <p className="p-6 text-center text-muted">No questions match these filters.</p> : groups.map(([k, qs]) => (
        <section key={k} className="panel">
          <header className="flex items-center justify-between"><h3 className="font-semibold">{k} <span className="font-medium text-muted">· {qs.length}</span></h3>
            {mandatory.some((m) => m.toLowerCase() === k.toLowerCase()) ? <span className="chip-must">Must-have</span> : preferred.some((m) => m.toLowerCase() === k.toLowerCase()) ? <span className="chip">Nice-to-have</span> : null}</header>
          {qs.map((t) => (
            <div key={t.id} className="flex flex-col gap-2.5 rounded-lg border border-line2 bg-surface2 px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5"><span className={`pill mt-px flex-none text-[11px] ${LVL_CLS[t.level]}`}>{lvlLabel(t.level)}</span><b className="font-semibold leading-snug">{t.q}</b></div>
                <div className="flex flex-none items-center gap-1">
                  {t.custom && <span className="rounded bg-grey px-1.5 text-[10px] font-semibold uppercase text-muted">Yours</span>}
                  {canEdit && <button type="button" className="btn-ghost btn-sm" onBlur={() => setArmed(null)} onClick={() => {
                    if (armed !== t.id) { setArmed(t.id); return; }
                    setArmed(null); startTransition(async () => { await deleteTechQuestion(jobId, t.id); router.refresh(); });
                  }}>{armed === t.id ? "Confirm delete" : "Delete"}</button>}
                </div>
              </div>
              <div className="grid gap-x-5 gap-y-2.5 text-[13px] sm:grid-cols-2">
                <div><span className="cap text-good">Good answer mentions</span><div className="mt-1"><Bullets items={t.points} /></div></div>
                <div><span className="cap text-bad">Red flags</span><div className="mt-1"><Bullets items={t.redFlags} /></div></div>
              </div>
            </div>
          ))}
        </section>
      ))}

      {canEdit && (
        <form ref={addRef} action={addAction} className="panel">
          <h2 className="font-bold">Add your own question</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1"><span className="label">Skill</span><select className="input" name="skill">{[...skills, "General"].filter((v, i, a) => a.indexOf(v) === i).map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="flex flex-col gap-1"><span className="label">Level</span><select className="input" name="level" defaultValue="intermediate">{TQ_LEVELS.map((l) => <option key={l.k} value={l.k}>{l.l}</option>)}</select></label>
          </div>
          <label className="flex flex-col gap-1"><span className="label">Question</span><textarea className="input" name="q" rows={2} required /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1"><span className="label">Good answer mentions · one per line</span><textarea className="input" name="points" rows={3} /></label>
            <label className="flex flex-col gap-1"><span className="label">Red flags · one per line</span><textarea className="input" name="redFlags" rows={3} /></label>
          </div>
          {addState?.error && <p role="alert" className="callout-bad">{addState.error}</p>}
          <div><SubmitButton pending="Adding…">Add question</SubmitButton></div>
        </form>
      )}
    </>
  );
}
