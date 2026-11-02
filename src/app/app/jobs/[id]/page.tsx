import Link from "next/link";
import { canWrite, requireOrg } from "@/lib/org";
import { getJob } from "@/lib/data";
import { Bullets, Chips } from "@/components/ui";
import { Icon } from "@/components/icons";
import { NM } from "@/lib/types";

export default async function JobDetails({ params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  const job = await getJob(ctx.org.id, params.id);
  const d = job.details;
  const rows: [string, string | number | undefined | null][] = [
    ["Job title", job.title], ["Seniority", d.seniority],
    ["Experience", d.minYears != null || d.maxYears != null ? `${d.minYears ?? "?"}–${d.maxYears ?? "?"} years` : NM],
    ["Location", d.location], ["Work mode", d.workMode], ["Budget", d.budget],
    ["Notice period", d.noticePreferredDays != null || d.noticeMaxDays != null
      ? [d.noticePreferredDays != null ? `≤ ${d.noticePreferredDays} days preferred` : "", d.noticeMaxDays != null ? `${d.noticeMaxDays} days maximum` : ""].filter(Boolean).join("; ") : NM],
    ["Education", d.education], ["Domain", `${d.domain ?? NM}${d.domainRequired && d.domainRequired !== "none" ? ` (${d.domainRequired})` : ""}`],
    ["Candidates sourced", job.sourced_count],
  ];
  return (
    <div className="grid gap-[18px] lg:grid-cols-2">
      <section className="panel">
        <h2 className="font-bold">Job overview</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-[13.5px] sm:grid-cols-[170px_minmax(0,1fr)]">
          {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="mb-1.5 sm:mb-0">{v === null || v === undefined || v === "" ? NM : v}</dd></div>)}
        </dl>
      </section>
      <section className="panel">
        <header className="flex items-center justify-between"><h2 className="font-bold">Skills</h2>
          {canWrite(ctx.role) && <Link href={`/app/jobs/${job.id}/edit`} className="btn btn-sm"><Icon name="edit" className="h-3.5 w-3.5" />Edit</Link>}</header>
        <div className="flex flex-col gap-1.5"><span className="cap">Mandatory · 40% of score</span><Chips items={d.mandatory} must /></div>
        <div className="flex flex-col gap-1.5"><span className="cap">Preferred · 10% of score</span><Chips items={d.preferred} /></div>
        <div className="flex flex-col gap-1.5"><span className="cap">Technical keywords</span><Chips items={d.keywords} /></div>
        {!!d.clarifications?.length && <div className="callout"><b>Ask the hiring manager</b><Bullets items={d.clarifications} /></div>}
        {!!d.assumptions?.length && <div className="callout-info"><b>Assumptions made</b><Bullets items={d.assumptions} /></div>}
      </section>
    </div>
  );
}
