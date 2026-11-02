import type { CandidateProfile, JobDetails, SkillEvidence } from "./types";
import { NM, NEXT_STEPS } from "./types";

const LV: Record<string, number> = { "hands-on": 1, listed: 0.5, related: 0.5, none: 0 };
const fmt = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "");
const has = (v: unknown) => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));

export interface ScorePart { label: string; w: number; pts: number; how: string }
export type Band = "strong" | "good" | "partial" | "low";
export interface Score {
  total: number;
  parts: ScorePart[];
  band: Band;
  bandLabel: string;
  missing: string[];
  weak: string[];
  man: SkillEvidence[];
  pre: SkillEvidence[];
  flags: string[];
  next: string;
  why: string;
}

/** Lines up candidate evidence with the job's skill list, in the job's order. */
export function align(list: SkillEvidence[] | undefined, skills: string[] | undefined): SkillEvidence[] {
  const by = new Map((list ?? []).map((s) => [String(s.skill ?? "").toLowerCase(), s]));
  return (skills ?? []).map((sk) => by.get(String(sk).toLowerCase()) ?? { skill: sk, level: "none", evidence: "Not assessed" });
}

/**
 * Weighted JD alignment score. Deterministic: the same evidence always gives the same score.
 * Mandatory 40 · Relevant experience 25 · Project/domain 15 · Preferred 10 · Education 5 · Role/location 5.
 */
export function score(c: CandidateProfile, j: JobDetails): Score {
  const man = align(c.mandatory, j.mandatory);
  const pre = align(c.preferred, j.preferred);
  const parts: ScorePart[] = [];
  const flags: string[] = [];

  const mSum = man.reduce((a, s) => a + (LV[s.level] ?? 0), 0);
  parts.push({
    label: "Mandatory technical skills", w: 40, pts: man.length ? (40 * mSum) / man.length : 0,
    how: man.length ? `${man.length} skills × ${fmt(40 / man.length)} pts. Hands-on = full, listed or related = half, not evidenced = 0.` : "No mandatory skills defined on the job.",
  });

  const minY = Number(j.minYears) || 0;
  let ePts = 0, eHow: string;
  if (!has(c.relevantYears)) { eHow = "Relevant experience not mentioned: 0, verify."; flags.push("Relevant experience not stated"); }
  else if (minY > 0) { ePts = 25 * Math.min(Number(c.relevantYears) / minY, 1); eHow = `${fmt(Number(c.relevantYears))} relevant yrs ÷ ${minY} required, capped at 100%.`; }
  else { ePts = Number(c.relevantYears) > 0 ? 25 : 0; eHow = "No minimum set on the job: full marks for any relevant experience."; }
  parts.push({ label: "Relevant experience", w: 25, pts: ePts, how: eHow });

  const proj = Math.max(0, Math.min(10, Number(c.projectRelevance) || 0));
  const domReq = j.domainRequired ?? "none";
  let dPts: number, dHow: string;
  if (domReq === "none") { dPts = 5; dHow = "no domain asked: +5"; }
  else if (c.domainMatch === "yes") { dPts = 5; dHow = "domain matches: +5"; }
  else if (!c.domainMatch || c.domainMatch === "unknown") { dPts = 2.5; dHow = "domain not mentioned: +2.5, verify"; flags.push("Domain experience unclear"); }
  else { dPts = 0; dHow = "different domain: +0"; }
  parts.push({ label: "Project / domain experience", w: 15, pts: proj + dPts, how: `Project relevance ${proj}/10; ${dHow}.` });

  const pSum = pre.reduce((a, s) => a + (LV[s.level] ?? 0), 0);
  parts.push({
    label: "Preferred technical skills", w: 10, pts: pre.length ? (10 * pSum) / pre.length : 10,
    how: pre.length ? `${pre.length} skills × ${fmt(10 / pre.length)} pts, same evidence rule.` : "No preferred skills on the job: full marks.",
  });

  const eduNM = !j.education || j.education === NM;
  let eduPts = eduNM ? 5 : ({ meets: 5, partial: 2.5, unknown: 2.5 } as Record<string, number>)[c.educationMatch ?? ""] ?? 0;
  if (!eduNM && (!c.educationMatch || c.educationMatch === "unknown")) { eduPts = 2.5; flags.push("Education not stated"); }
  parts.push({
    label: "Education / certifications", w: 5, pts: eduPts,
    how: eduNM ? "No requirement on the job: full marks." : `Education ${c.educationMatch ?? "unknown"}: meets 5, partial or not mentioned 2.5, does not meet 0.`,
  });

  const locNM = !j.location || j.location === NM;
  let lPts = locNM ? 2.5 : ({ fits: 2.5, relocation: 1.25, unknown: 1.25 } as Record<string, number>)[c.locationFit ?? ""] ?? 0;
  if (!locNM && (!c.locationFit || c.locationFit === "unknown")) { lPts = 1.25; flags.push("Location not stated"); }
  const nd = c.noticeDays, np = j.noticePreferredDays, nx = j.noticeMaxDays;
  let nPts: number, nHow: string;
  if (!has(nd)) { nPts = 1.25; nHow = "notice not mentioned 1.25"; flags.push("Notice period not stated"); }
  else if (!has(np) && !has(nx)) { nPts = 2.5; nHow = "no notice limit set 2.5"; }
  else if (has(np) && Number(nd) <= Number(np)) { nPts = 2.5; nHow = `${nd}d within preferred ${np}d: 2.5`; }
  else if (has(nx) && Number(nd) <= Number(nx)) { nPts = 1.25; nHow = `${nd}d within max ${nx}d: 1.25`; }
  else if (!has(nx)) { nPts = 1.25; nHow = `${nd}d beyond preferred: 1.25`; }
  else { nPts = 0; nHow = `${nd}d exceeds max ${nx}d: 0`; }
  parts.push({ label: "Role and location requirements", w: 5, pts: lPts + nPts, how: `Location ${c.locationFit ?? "unknown"} ${lPts}; ${nHow}.` });

  const total = Math.round(parts.reduce((a, p) => a + p.pts, 0) * 10) / 10;
  const band: Band = total >= 85 ? "strong" : total >= 70 ? "good" : total >= 55 ? "partial" : "low";
  const bandLabel = { strong: "Strong alignment", good: "Good alignment", partial: "Partial alignment", low: "Low alignment" }[band];
  const missing = man.filter((s) => s.level === "none").map((s) => s.skill);
  const weak = man.filter((s) => s.level === "listed" || s.level === "related").map((s) => s.skill);
  const overNotice = has(nx) && has(nd) && Number(nd) > Number(nx);

  let next: string, why: string;
  if (total >= 85 && !missing.length && !overNotice) { next = NEXT_STEPS[0]; why = "Strong alignment with every mandatory skill evidenced."; }
  else if (total >= 70 && !overNotice) {
    next = NEXT_STEPS[1];
    why = missing.length ? `Good overall, but ${missing.join(", ")} not evidenced.` : weak.length ? `Verify depth in ${weak.join(", ")} before the technical round.` : "Good alignment; confirm details in a short screen.";
  } else if (total >= 55 || (overNotice && total >= 70)) {
    next = NEXT_STEPS[2];
    why = overNotice ? "Notice period exceeds the job's maximum." : `Partial alignment${missing.length ? "; missing " + missing.join(", ") : ""}.`;
  } else { next = NEXT_STEPS[3]; why = `Low alignment${missing.length ? "; missing " + missing.join(", ") : ""}.`; }

  return { total, parts, band, bandLabel, missing, weak, man, pre, flags, next, why };
}

export { fmt };
