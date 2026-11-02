import type { BooleanString, CandidateProfile, JobDetails, Level, ScreeningQuestion, SkillEvidence, TechQuestion, TqLevel } from "./types";
import { NM } from "./types";

type Any = Record<string, unknown>;
const obj = (v: unknown): Any => (v && typeof v === "object" && !Array.isArray(v) ? (v as Any) : {});
export const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean)
  : typeof v === "string" && v.trim() ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
export const lines = (v: unknown): string[] => String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
export const numOrNull = (v: unknown): number | null => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : NM);
const pick = <T extends string>(v: unknown, allowed: readonly T[], dflt: T): T => (allowed.includes(v as T) ? (v as T) : dflt);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const questionsOf = (v: unknown): ScreeningQuestion[] =>
  (Array.isArray(v) ? v : []).map(obj).filter((q) => q.q).map((q) => ({ q: String(q.q), indicator: String(q.indicator ?? ""), followUp: String(q.followUp ?? "") }));

export const booleansOf = (v: unknown): BooleanString[] =>
  (Array.isArray(v) ? v : []).map(obj).filter((b) => b.query).map((b) => ({ label: String(b.label || "Search string"), query: String(b.query), why: String(b.why ?? "") }));

export function jobFromAi(raw: unknown): { title: string; details: JobDetails } {
  const r = obj(raw);
  return {
    title: str(r.title) === NM ? "Untitled role" : str(r.title),
    details: {
      seniority: str(r.seniority), minYears: numOrNull(r.minYears), maxYears: numOrNull(r.maxYears),
      mandatory: arr(r.mandatory), preferred: arr(r.preferred), education: str(r.education), domain: str(r.domain),
      domainRequired: pick(r.domainRequired, ["mandatory", "preferred", "none"] as const, "none"),
      location: str(r.location), workMode: str(r.workMode), budget: str(r.budget),
      noticePreferredDays: numOrNull(r.noticePreferredDays), noticeMaxDays: numOrNull(r.noticeMaxDays),
      keywords: arr(r.keywords), titles: arr(r.titles), altTitles: arr(r.altTitles), combos: arr(r.combos),
      booleans: booleansOf(r.booleans), strategy: arr(r.strategy), questions: questionsOf(r.questions),
      assumptions: arr(r.assumptions), clarifications: arr(r.clarifications), techQs: [],
    },
  };
}

const LEVELS: Level[] = ["hands-on", "listed", "related", "none"];
export function evidenceFor(list: unknown, skills: string[] = []): SkillEvidence[] {
  const items = (Array.isArray(list) ? list : []).map(obj);
  return skills.map((sk) => {
    const f = items.find((x) => String(x.skill ?? "").toLowerCase() === sk.toLowerCase());
    return { skill: sk, level: pick(f?.level, LEVELS, "none"), evidence: f ? String(f.evidence || NM) : NM };
  });
}

export function candidateFromAi(raw: unknown, job: JobDetails): { name: string; profile: CandidateProfile } {
  const r = obj(raw);
  const name = str(r.name);
  return {
    name: name === NM ? "Unnamed candidate" : name,
    profile: {
      designation: str(r.designation), totalYears: numOrNull(r.totalYears), relevantYears: numOrNull(r.relevantYears),
      relevantBasis: String(r.relevantBasis ?? ""), skills: arr(r.skills), projects: arr(r.projects),
      domainExperience: str(r.domainExperience), education: str(r.education), certifications: arr(r.certifications),
      location: str(r.location), noticeDays: numOrNull(r.noticeDays), noticeText: str(r.noticeText),
      currentCtc: str(r.currentCtc), expectedCtc: str(r.expectedCtc), achievements: arr(r.achievements),
      mandatory: evidenceFor(r.mandatory, job.mandatory), preferred: evidenceFor(r.preferred, job.preferred),
      projectRelevance: Math.max(0, Math.min(10, Math.round(Number(r.projectRelevance) || 0))), projectReason: String(r.projectReason ?? ""),
      domainMatch: pick(r.domainMatch, ["yes", "no", "unknown"] as const, "unknown"),
      educationMatch: pick(r.educationMatch, ["meets", "partial", "does-not-meet", "unknown"] as const, "unknown"),
      locationFit: pick(r.locationFit, ["fits", "relocation", "mismatch", "unknown"] as const, "unknown"),
      concerns: arr(r.concerns), verify: arr(r.verify), questions: questionsOf(r.questions),
    },
  };
}

const TQ: TqLevel[] = ["basic", "intermediate", "advanced", "scenario"];
export function techFromAi(raw: unknown, custom = false): TechQuestion[] {
  const r = obj(raw);
  const list = Array.isArray(raw) ? raw : Array.isArray(r.questions) ? r.questions : [];
  return list.map(obj).filter((t) => t.q).map((t) => ({
    id: String(t.id || uid()), skill: String(t.skill || "General").trim() || "General", level: pick(t.level, TQ, "intermediate"),
    q: String(t.q).trim(), points: arr(t.points), redFlags: arr(t.redFlags), custom: !!(custom || t.custom),
  }));
}

export { uid };
