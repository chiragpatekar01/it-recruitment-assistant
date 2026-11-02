export type Role = "owner" | "admin" | "recruiter" | "viewer";
export type Level = "hands-on" | "listed" | "related" | "none";
export type TqLevel = "basic" | "intermediate" | "advanced" | "scenario";

export interface SkillEvidence { skill: string; level: Level; evidence: string }
export interface BooleanString { label: string; query: string; why: string }
export interface ScreeningQuestion { q: string; indicator: string; followUp: string }
export interface TechQuestion { id: string; skill: string; level: TqLevel; q: string; points: string[]; redFlags: string[]; custom: boolean }

export interface JobDetails {
  seniority?: string;
  minYears?: number | null;
  maxYears?: number | null;
  mandatory?: string[];
  preferred?: string[];
  education?: string;
  domain?: string;
  domainRequired?: "mandatory" | "preferred" | "none";
  location?: string;
  workMode?: string;
  budget?: string;
  noticePreferredDays?: number | null;
  noticeMaxDays?: number | null;
  keywords?: string[];
  titles?: string[];
  altTitles?: string[];
  combos?: string[];
  booleans?: BooleanString[];
  strategy?: string[];
  questions?: ScreeningQuestion[];
  techQs?: TechQuestion[];
  assumptions?: string[];
  clarifications?: string[];
}

export interface Job {
  id: string;
  org_id: string;
  code: string | null;
  title: string;
  status: "open" | "hold" | "closed";
  jd_text: string | null;
  sourced_count: number;
  details: JobDetails;
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile {
  designation?: string;
  totalYears?: number | null;
  relevantYears?: number | null;
  relevantBasis?: string;
  skills?: string[];
  projects?: string[];
  domainExperience?: string;
  education?: string;
  certifications?: string[];
  location?: string;
  noticeDays?: number | null;
  noticeText?: string;
  currentCtc?: string;
  expectedCtc?: string;
  achievements?: string[];
  mandatory?: SkillEvidence[];
  preferred?: SkillEvidence[];
  projectRelevance?: number;
  projectReason?: string;
  domainMatch?: "yes" | "no" | "unknown";
  educationMatch?: "meets" | "partial" | "does-not-meet" | "unknown";
  locationFit?: "fits" | "relocation" | "mismatch" | "unknown";
  concerns?: string[];
  verify?: string[];
  questions?: ScreeningQuestion[];
}

export interface Candidate {
  id: string;
  org_id: string;
  job_id: string;
  name: string;
  stage: string;
  furthest: number;
  source: string;
  decision: string | null;
  notes: string | null;
  profile: CandidateProfile;
  created_at: string;
  updated_at: string;
}

export const NM = "Not Mentioned";

export const STAGES = [
  { k: "sourced", l: "Sourced" }, { k: "screened", l: "Screened" }, { k: "shortlisted", l: "Shortlisted" },
  { k: "interview_scheduled", l: "Interview scheduled" }, { k: "interview_done", l: "Interview completed" },
  { k: "selected", l: "Selected" }, { k: "offered", l: "Offer made" }, { k: "joined", l: "Joined" },
] as const;
export const SIDE_STAGES = [{ k: "on_hold", l: "On hold" }, { k: "rejected", l: "Rejected" }] as const;
export const ALL_STAGES = [...STAGES, ...SIDE_STAGES];
export const stageLabel = (k: string) => ALL_STAGES.find((s) => s.k === k)?.l ?? "Screened";
export const stageIdx = (k: string) => STAGES.findIndex((s) => s.k === k);

export const SOURCES = [
  { k: "linkedin", l: "LinkedIn", s: "in" }, { k: "naukri", l: "Naukri", s: "N" }, { k: "referral", l: "Referral", s: "R" },
  { k: "website", l: "Website", s: "W" }, { k: "portal", l: "Other job portal", s: "P" }, { k: "other", l: "Other", s: "·" },
] as const;

export const NEXT_STEPS = ["Proceed to technical interview", "Conduct additional screening", "Keep on hold", "Not aligned with current JD"] as const;
export const LEVELS: { k: Level; l: string }[] = [
  { k: "hands-on", l: "Hands-on" }, { k: "listed", l: "Listed only" }, { k: "related", l: "Related tech" }, { k: "none", l: "Not evidenced" },
];
export const TQ_LEVELS: { k: TqLevel; l: string }[] = [
  { k: "basic", l: "Basic" }, { k: "intermediate", l: "Intermediate" }, { k: "advanced", l: "Advanced" }, { k: "scenario", l: "Scenario" },
];
export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", recruiter: "Recruiter", viewer: "Viewer" };
