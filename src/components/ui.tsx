import type { ReactNode } from "react";
import { SOURCES, stageLabel } from "@/lib/types";
import type { Band } from "@/lib/scoring";

const initials = (n: string) =>
  n.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const AV = ["bg-[#F3E3D3]", "bg-[#DCEBE4]", "bg-[#E0E7F6]", "bg-[#F2DEE4]", "bg-[#E9E4F5]", "bg-[#F1ECD2]"];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length;
  return (
    <span aria-hidden className={`grid flex-none place-items-center rounded-full text-[11px] font-bold text-[#2B3138] ${AV[i]}`} style={{ width: size, height: size }}>
      {initials(name)}
    </span>
  );
}

const STAGE_CLS: Record<string, string> = {
  sourced: "bg-good-soft text-good", screened: "bg-good-soft text-good", shortlisted: "bg-warn-soft text-warn",
  interview_scheduled: "bg-info-soft text-info", interview_done: "bg-info-soft text-info", selected: "bg-teal-soft text-teal",
  offered: "bg-violet-soft text-violet", joined: "bg-accent-soft text-accent", on_hold: "bg-grey text-muted", rejected: "bg-bad-soft text-bad",
};
export const StagePill = ({ stage }: { stage: string }) => <span className={`pill ${STAGE_CLS[stage] ?? STAGE_CLS.screened}`}>{stageLabel(stage)}</span>;

const SRC_CLS: Record<string, string> = { linkedin: "bg-[#2E68B0]", naukri: "bg-[#3A79C9]", referral: "bg-violet", website: "bg-accent", portal: "bg-warn", other: "bg-muted" };
export function SourceTag({ source }: { source: string }) {
  const s = SOURCES.find((x) => x.k === source) ?? SOURCES[5];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium">
      <i className={`grid h-[18px] w-[18px] place-items-center rounded not-italic text-[10px] font-bold text-white ${SRC_CLS[s.k]}`}>{s.s}</i>{s.l}
    </span>
  );
}

const BAND_CLS: Record<Band, string> = { strong: "bg-good-soft text-good", good: "bg-info-soft text-info", partial: "bg-warn-soft text-warn", low: "bg-bad-soft text-bad" };
const BAR_CLS: Record<Band, string> = { strong: "bg-good", good: "bg-info", partial: "bg-warn", low: "bg-bad" };
export const BandPill = ({ band, label }: { band: Band; label: string }) => <span className={`pill rounded-full ${BAND_CLS[band]}`}>{label}</span>;
export function ScoreBar({ total, band }: { total: number; band: Band }) {
  return (
    <div className="flex min-w-[96px] items-center gap-2">
      <b className="w-9 font-semibold tabular">{Math.round(total)}%</b>
      <span className="h-[5px] min-w-[40px] flex-1 overflow-hidden rounded bg-surface2"><i className={`block h-full rounded ${BAR_CLS[band]}`} style={{ width: `${total}%` }} /></span>
    </div>
  );
}
export function ScoreRing({ total, band }: { total: number; band: Band }) {
  const color = { strong: "rgb(var(--good))", good: "rgb(var(--info))", partial: "rgb(var(--warn))", low: "rgb(var(--bad))" }[band];
  return (
    <div className="grid h-20 w-20 flex-none place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${total}%, rgb(var(--surface-2)) 0)` }}>
      <div className="grid h-16 w-16 place-items-center rounded-full bg-surface text-xl font-bold tabular">{Math.round(total * 10) / 10}</div>
    </div>
  );
}

export function Chips({ items, must }: { items?: string[]; must?: boolean }) {
  if (!items?.length) return <span className="text-muted">Not Mentioned</span>;
  return <div className="flex flex-wrap gap-1.5">{items.map((x) => <span key={x} className={must ? "chip-must" : "chip"}>{x}</span>)}</div>;
}
export function Bullets({ items, empty = "None noted" }: { items?: string[]; empty?: string }) {
  if (!items?.length) return <span className="text-muted">{empty}</span>;
  return <ul className="m-0 flex list-disc flex-col gap-1 pl-[18px]">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-line p-8 text-center text-muted">
      <h2 className="text-base font-bold text-ink">{title}</h2>{children}
    </div>
  );
}
export const Fictional = () => <span className="ml-1 rounded bg-grey px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-muted">Fictional</span>;
export const fdate = (t?: string | null) => (t ? new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—");
