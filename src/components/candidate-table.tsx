"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "./icons";
import { Avatar, BandPill, ScoreBar, SourceTag, StagePill, fdate } from "./ui";
import { SOURCES } from "@/lib/types";
import type { Band } from "@/lib/scoring";

export interface CandRow {
  id: string; name: string; designation: string; stage: string; source: string; created_at: string;
  jobTitle?: string; total: number; band: Band; bandLabel: string; parts: number[]; missing: string[];
  handsOn: string[]; relevantYears: number | null; noticeDays: number | null; expectedCtc: string; next: string; decided: boolean;
}

const TABS: [string, string][] = [["all", "All"], ["screened", "Screened"], ["shortlisted", "Shortlisted"], ["interview", "Interviewing"], ["selected", "Selected"], ["offered", "Offer / Joined"], ["on_hold", "On hold"], ["rejected", "Rejected"]];
const inTab = (s: string, t: string) =>
  t === "all" || (t === "interview" ? s === "interview_scheduled" || s === "interview_done" : t === "offered" ? s === "offered" || s === "joined" : t === "screened" ? s === "screened" || s === "sourced" : s === t);
const PER = 15;

export function CandidateTable({ rows, showJob = false }: { rows: CandRow[]; showJob?: boolean }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [src, setSrc] = useState("");
  const [sort, setSort] = useState("score");
  const [layout, setLayout] = useState<"list" | "compare">("list");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => Object.fromEntries(TABS.map(([k]) => [k, rows.filter((r) => inTab(r.stage, k)).length])), [rows]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = rows.filter((r) => inTab(r.stage, tab) && (!src || r.source === src) && (!t || [r.name, r.designation, r.jobTitle ?? "", ...r.handsOn].join(" ").toLowerCase().includes(t)));
    out.sort(sort === "date" ? (a, b) => b.created_at.localeCompare(a.created_at) : sort === "name" ? (a, b) => a.name.localeCompare(b.name) : (a, b) => b.total - a.total);
    return out;
  }, [rows, q, tab, src, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const p = Math.min(page, pages);
  const shown = list.slice((p - 1) * PER, p * PER);

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5">
        <label className="relative min-w-[180px] max-w-[340px] flex-1">
          <Icon name="search" className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by name or skill…" aria-label="Search candidates" className="input bg-surface2 pl-8" />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input w-auto" value={src} onChange={(e) => { setSrc(e.target.value); setPage(1); }} aria-label="Filter by source">
            <option value="">All sources</option>{SOURCES.map((s) => <option key={s.k} value={s.k}>{s.l}</option>)}
          </select>
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="score">Highest score</option><option value="date">Newest first</option><option value="name">Name A–Z</option>
          </select>
          <span className="inline-flex rounded-[9px] border border-line bg-surface2 p-[3px]">
            {(["list", "compare"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLayout(l)} aria-pressed={layout === l} aria-label={l === "list" ? "List view" : "Score comparison"} title={l === "list" ? "List view" : "Score comparison"}
                className={`rounded-[7px] px-2.5 py-1.5 ${layout === l ? "bg-surface text-ink shadow-sm" : "text-muted"}`}><Icon name={l === "list" ? "rows" : "cols"} /></button>
            ))}
          </span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-line px-1.5" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setPage(1); }}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] ${tab === k ? "border-accent font-semibold text-accent" : "border-transparent text-muted"}`}>{l} ({counts[k]})</button>
        ))}
      </div>
      {!list.length ? <p className="p-8 text-center text-muted">{rows.length ? "No candidates match these filters." : "No candidates yet."}</p> : (
        <div className="overflow-x-auto">
          {layout === "list" ? (
            <table className="tbl">
              <thead><tr><th>#No</th><th>Applicant name</th>{showJob && <th>Job</th>}<th>Screened on</th><th>Match score</th><th>Current stage</th><th>Skills</th><th>Source</th><th aria-label="Open" /></tr></thead>
              <tbody>{shown.map((r, i) => (
                <tr key={r.id} className="group hover:bg-surface2">
                  <td className="text-muted tabular">#{String((p - 1) * PER + i + 1).padStart(2, "0")}</td>
                  <td><Link href={`/app/candidates/${r.id}`} className="flex min-w-[180px] items-center gap-2.5"><Avatar name={r.name} /><span className="min-w-0"><b className="block font-semibold group-hover:text-accent">{r.name}</b><small className="block max-w-[240px] truncate text-muted">{r.designation}</small></span></Link></td>
                  {showJob && <td className="max-w-[200px] truncate">{r.jobTitle}</td>}
                  <td className="tabular">{fdate(r.created_at)}</td>
                  <td><ScoreBar total={r.total} band={r.band} /></td>
                  <td><StagePill stage={r.stage} /></td>
                  <td><div className="flex gap-1">{r.handsOn.slice(0, 2).map((t) => <span key={t} className="whitespace-nowrap rounded border border-line px-2 py-0.5 text-xs">{t}</span>)}{!r.handsOn.length && <span className="text-muted">—</span>}</div></td>
                  <td><SourceTag source={r.source} /></td>
                  <td className="text-right"><Link href={`/app/candidates/${r.id}`} aria-label={`Open ${r.name}`} className="inline-flex text-muted group-hover:text-accent"><Icon name="chevR" /></Link></td>
                </tr>))}
              </tbody>
            </table>
          ) : (
            <table className="tbl">
              <thead><tr><th>Applicant</th>{showJob && <th>Job</th>}<th className="text-right">Score</th><th>Alignment</th><th className="text-right">Mand. /40</th><th className="text-right">Exp. /25</th><th className="text-right">Proj. /15</th><th className="text-right">Pref. /10</th><th className="text-right">Edu. /5</th><th className="text-right">Role /5</th><th>Missing mandatory</th><th className="text-right">Rel. yrs</th><th className="text-right">Notice</th><th>Expected CTC</th><th>Next step</th></tr></thead>
              <tbody>{shown.map((r) => (
                <tr key={r.id} className="hover:bg-surface2">
                  <td><Link href={`/app/candidates/${r.id}`} className="font-semibold hover:text-accent">{r.name}</Link></td>
                  {showJob && <td>{r.jobTitle}</td>}
                  <td className="text-right font-bold tabular">{Math.round(r.total * 10) / 10}</td><td><BandPill band={r.band} label={r.bandLabel} /></td>
                  {r.parts.map((n, k) => <td key={k} className="text-right tabular">{Math.round(n * 10) / 10}</td>)}
                  <td>{r.missing.length ? r.missing.join(", ") : <span className="text-muted">None</span>}</td>
                  <td className="text-right tabular">{r.relevantYears ?? "—"}</td><td className="text-right tabular">{r.noticeDays != null ? `${r.noticeDays}d` : "—"}</td>
                  <td>{r.expectedCtc}</td><td>{r.next}{!r.decided && <small className="text-muted"> (suggested)</small>}</td>
                </tr>))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-line2 p-3.5">
          <button type="button" className="btn btn-sm" disabled={p === 1} onClick={() => setPage(p - 1)}><Icon name="chevL" className="h-3.5 w-3.5" />Previous</button>
          {Array.from({ length: pages }, (_, i) => <button key={i} type="button" onClick={() => setPage(i + 1)} aria-current={p === i + 1} className={`btn btn-sm min-w-8 ${p === i + 1 ? "border-accent bg-accent-soft text-accent" : ""}`}>{i + 1}</button>)}
          <button type="button" className="btn btn-sm" disabled={p === pages} onClick={() => setPage(p + 1)}>Next<Icon name="chevR" className="h-3.5 w-3.5" /></button>
        </div>
      )}
      <p className="border-t border-line2 px-3.5 py-2.5 text-xs text-muted">Match score is a preliminary JD alignment measure from resume evidence, not a prediction of performance or a hiring decision.</p>
    </section>
  );
}
