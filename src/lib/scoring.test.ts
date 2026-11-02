import { describe, expect, it } from "vitest";
import { score } from "./scoring";
import type { CandidateProfile, JobDetails, Level } from "./types";

const job: JobDetails = {
  mandatory: ["C#", "ASP.NET Core", "REST API", "SQL Server", "Entity Framework Core", "Git"],
  preferred: ["Azure", "Angular/React", "Microservices", "Docker", "CI/CD"],
  minYears: 4, domainRequired: "preferred", education: "B.E./B.Tech/MCA", location: "Mumbai",
  noticePreferredDays: 30, noticeMaxDays: 60,
};
const ev = (pairs: [string, Level][]) => pairs.map(([skill, level]) => ({ skill, level, evidence: "" }));

describe("score", () => {
  it("matches the worked demo example (Candidate A = 92.4, strong)", () => {
    const a: CandidateProfile = {
      mandatory: ev([["C#", "hands-on"], ["ASP.NET Core", "hands-on"], ["REST API", "hands-on"], ["SQL Server", "hands-on"], ["Entity Framework Core", "listed"], ["Git", "hands-on"]]),
      preferred: ev([["Azure", "hands-on"], ["Angular/React", "hands-on"], ["Microservices", "none"], ["Docker", "listed"], ["CI/CD", "hands-on"]]),
      relevantYears: 4.5, projectRelevance: 10, domainMatch: "yes", educationMatch: "meets", locationFit: "fits", noticeDays: 60,
    };
    const s = score(a, job);
    expect(s.total).toBe(92.4);
    expect(s.band).toBe("strong");
    expect(s.next).toBe("Proceed to technical interview");
  });

  it("holds a candidate whose notice exceeds the maximum", () => {
    const s = score({ mandatory: ev(job.mandatory!.map((k) => [k, "hands-on"])), relevantYears: 6, projectRelevance: 10, domainMatch: "yes", educationMatch: "meets", locationFit: "fits", noticeDays: 90 }, job);
    expect(s.next).toBe("Keep on hold");
  });

  it("treats unstated details as half marks and flags them", () => {
    const s = score({ mandatory: [] }, job);
    expect(s.flags).toContain("Notice period not stated");
    expect(s.flags).toContain("Relevant experience not stated");
    expect(s.missing).toHaveLength(6);
    expect(s.band).toBe("low");
  });

  it("matches skills case-insensitively", () => {
    const s = score({ mandatory: ev([["c#", "hands-on"]]) }, { mandatory: ["C#"] });
    expect(s.man[0].level).toBe("hands-on");
  });
});
