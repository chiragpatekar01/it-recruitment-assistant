import Link from "next/link";
import type { Metadata } from "next";
import { canWrite, requireOrg } from "@/lib/org";
import { getCandidate, getJob } from "@/lib/data";
import { score, fmt } from "@/lib/scoring";
import { Avatar, BandPill, Bullets, Chips, ScoreRing, SourceTag, StagePill } from "@/components/ui";
import { CopyButton } from "@/components/client";
import { NM, LEVELS } from "@/lib/types";
import { Evaluation } from "./client";

export const metadata: Metadata = { title: "Candidate evaluation" };

export default async function CandidatePage({ params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  const c = await getCandidate(ctx.org.id, params.id);
  const job = await getJob(ctx.org.id, c.job_id);
  const p = c.profile;
  const s = score(p, job.details);
  const lvl = (k: string) => LEVELS.find((l) => l.k === k)?.l ?? k;
  const LV_CLS: Record<string, string> = { "hands-on": "bg-good-soft text-good", listed: "bg-warn-soft text-warn", related: "bg-warn-soft text-warn", none: "bg-bad-soft text-bad" };

  const report = `Candidate Name: ${c.name}
Job Title: ${job.title}
Total Experience: ${p.totalYears != null ? p.totalYears + " years" : NM}
Relevant Experience: ${p.relevantYears != null ? p.relevantYears + " years" : NM}
Technical Skills: ${(p.skills ?? []).join(", ") || NM}
JD Match Score: ${fmt(s.total)} / 100 (${s.bandLabel}; preliminary JD alignment, not a hiring decision)
${s.parts.map((x) => `  - ${x.label}: ${fmt(x.pts)} / ${x.w}`).join("\n")}
Strong Matching Areas: ${s.man.filter((x) => x.level === "hands-on").map((x) => x.skill).join(", ") || "None evidenced"}
Missing Skills: ${s.missing.join(", ") || "None"}${s.weak.length ? "\nNeeds verification: " + s.weak.join(", ") : ""}
Technical Concerns: ${(p.concerns ?? []).join("; ") || "None noted"}
Verify: ${(p.verify ?? []).join("; ") || "None noted"}
Recruiter Screening Notes: ${c.notes || NM}
Notice Period: ${p.noticeDays != null ? p.noticeDays + " days" : NM}
Compensation Details: Current ${p.currentCtc ?? NM}; Expected ${p.expectedCtc ?? NM}
Location: ${p.location ?? NM}
Recommended Next Step: ${c.decision || s.next + " (suggested)"}
Reason: ${s.why}`;

  const skillTable = (list: typeof s.man, title: string) => (
    <div className="card overflow-x-auto"><table className="tbl">
      <thead><tr><th>{title}</th><th>Evidence</th><th>From the resume</th></tr></thead>
      <tbody>{list.map((x) => <tr key={x.skill}><td>{x.skill}</td><td><span className={`pill ${LV_CLS[x.level]}`}>{lvl(x.level)}</span></td><td>{x.evidence || NM}</td></tr>)}</tbody>
    </table></div>
  );

  return (
    <>
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <Link href="/app/jobs" className="hover:text-ink">Jobs</Link><span>/</span>
        <Link href={`/app/jobs/${job.id}/candidates`} className="truncate hover:text-ink">{job.title}</Link><span>/</span><b className="truncate font-semibold text-ink">{c.name}</b>
      </div>
      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4">
        <ScoreRing total={s.total} band={s.band} />
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2.5"><Avatar name={c.name} /><h1 className="text-[1.2rem] font-bold">{c.name}</h1></div>
          <span className="text-[13px] text-muted">{p.designation ?? NM} · {job.title}</span>
          <div className="flex flex-wrap items-center gap-2"><BandPill band={s.band} label={s.bandLabel} /><StagePill stage={c.stage} /><SourceTag source={c.source} /></div>
        </div>
        <CopyButton text={report} label="Copy report" className="btn" />
      </section>

      <Evaluation id={c.id} canEdit={canWrite(ctx.role)} suggested={s.next} why={s.why}
        initial={{ name: c.name, stage: c.stage, source: c.source, decision: c.decision ?? "", notes: c.notes ?? "", designation: p.designation === NM ? "" : p.designation ?? "",
          location: p.location === NM ? "" : p.location ?? "", expectedCtc: p.expectedCtc === NM ? "" : p.expectedCtc ?? "",
          relevantYears: p.relevantYears ?? null, projectRelevance: p.projectRelevance ?? 0, noticeDays: p.noticeDays ?? null,
          domainMatch: p.domainMatch ?? "unknown", educationMatch: p.educationMatch ?? "unknown", locationFit: p.locationFit ?? "unknown" }}
        evidence={{ mandatory: s.man, preferred: s.pre }} />

      <section className="panel">
        <h2 className="font-bold">Evaluation report</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-[13.5px] sm:grid-cols-[180px_minmax(0,1fr)]">
          <dt className="text-muted">Total experience</dt><dd>{p.totalYears != null ? `${p.totalYears} years` : NM}</dd>
          <dt className="text-muted">Relevant experience</dt><dd>{p.relevantYears != null ? `${p.relevantYears} years` : NM}{p.relevantBasis && <small className="block text-muted">{p.relevantBasis}</small>}</dd>
          <dt className="text-muted">Technical skills</dt><dd><Chips items={p.skills} /></dd>
          <dt className="text-muted">Projects</dt><dd><Bullets items={p.projects} /></dd>
          <dt className="text-muted">Domain</dt><dd>{p.domainExperience ?? NM}</dd>
          <dt className="text-muted">Education</dt><dd>{p.education ?? NM}{!!p.certifications?.length && <small className="block">{p.certifications.join(", ")}</small>}</dd>
          <dt className="text-muted">Missing mandatory skills</dt><dd className={s.missing.length ? "text-bad" : ""}>{s.missing.join(", ") || "None"}</dd>
          <dt className="text-muted">Notice period</dt><dd>{p.noticeDays != null ? `${p.noticeDays} days` : NM}</dd>
          <dt className="text-muted">Compensation</dt><dd>Current: {p.currentCtc ?? NM} · Expected: {p.expectedCtc ?? NM}</dd>
          <dt className="text-muted">Location</dt><dd>{p.location ?? NM} <small className="text-muted">({p.locationFit ?? "unknown"})</small></dd>
          <dt className="text-muted">Achievements</dt><dd><Bullets items={p.achievements} /></dd>
        </dl>
      </section>

      <section className="panel">
        <h2 className="font-bold">Score breakdown</h2>
        <div className="card overflow-x-auto"><table className="tbl">
          <thead><tr><th>Parameter</th><th className="text-right">Weight</th><th className="text-right">Points</th><th>How it was calculated</th></tr></thead>
          <tbody>
            {s.parts.map((x) => <tr key={x.label}><td>{x.label}</td><td className="text-right tabular">{x.w}</td><td className="text-right font-bold tabular">{fmt(x.pts)}</td><td>{x.how}</td></tr>)}
            <tr><td className="font-bold">Total</td><td className="text-right tabular">100</td><td className="text-right font-bold tabular">{fmt(s.total)}</td><td>{s.bandLabel}. Bands: 85+ strong, 70–84 good, 55–69 partial, below 55 low.</td></tr>
          </tbody>
        </table></div>
        {!!s.flags.length && <p className="callout">Not stated on the resume, scored as half or zero: {s.flags.join("; ")}.</p>}
        {p.projectReason && <p className="text-[13px] text-muted"><b>Project relevance:</b> {p.projectReason}</p>}
      </section>

      <section className="panel"><h2 className="font-bold">Skill matching</h2>{skillTable(s.man, "Mandatory skill")}{!!s.pre.length && skillTable(s.pre, "Preferred skill")}</section>

      <section className="panel"><h2 className="font-bold">Concerns and verification</h2>
        <div className="grid gap-4 sm:grid-cols-2"><div><span className="cap">Technical concerns</span><div className="mt-1"><Bullets items={p.concerns} /></div></div>
          <div><span className="cap">Verify with candidate</span><div className="mt-1"><Bullets items={p.verify} /></div></div></div>
      </section>

      {!!p.questions?.length && (
        <section className="card">
          <header className="flex items-center justify-between p-4"><h2 className="font-bold">Screening questions</h2>
            <CopyButton text={p.questions.map((q, i) => `${i + 1}. ${q.q}\n   Good answer: ${q.indicator}\n   Follow-up: ${q.followUp}`).join("\n\n")} /></header>
          <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>#</th><th>Question</th><th>Good answer indicators</th><th>Follow-up</th></tr></thead>
            <tbody>{p.questions.map((q, i) => <tr key={i}><td className="text-muted tabular">{i + 1}</td><td>{q.q}</td><td>{q.indicator}</td><td>{q.followUp}</td></tr>)}</tbody></table></div>
        </section>
      )}
    </>
  );
}
