import type { CandRow } from "@/components/candidate-table";
import type { Candidate, Job } from "./types";
import { NM } from "./types";
import { score } from "./scoring";

export function toRows(cands: Candidate[], jobs: Job[]): CandRow[] {
  const byId = new Map(jobs.map((j) => [j.id, j]));
  return cands.flatMap((c) => {
    const j = byId.get(c.job_id);
    if (!j) return [];
    const s = score(c.profile, j.details);
    return [{
      id: c.id, name: c.name, designation: c.profile.designation ?? NM, stage: c.stage, source: c.source, created_at: c.created_at,
      jobTitle: j.title, total: s.total, band: s.band, bandLabel: s.bandLabel, parts: s.parts.map((p) => p.pts), missing: s.missing,
      handsOn: s.man.filter((x) => x.level === "hands-on").map((x) => x.skill),
      relevantYears: c.profile.relevantYears ?? null, noticeDays: c.profile.noticeDays ?? null, expectedCtc: c.profile.expectedCtc ?? NM,
      next: c.decision || s.next, decided: !!c.decision,
    }];
  });
}
