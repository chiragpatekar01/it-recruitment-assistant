import Link from "next/link";
import { canWrite, requireOrg } from "@/lib/org";
import { getJob } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { score } from "@/lib/scoring";
import { Icon } from "@/components/icons";
import { fdate } from "@/components/ui";
import { NM } from "@/lib/types";
import { Stat, StatusPill } from "../../parts";
import { JobTabs } from "../../nav";

export default async function JobLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const ctx = await requireOrg();
  const job = await getJob(ctx.org.id, params.id);
  const { data: cands } = await createClient().from("candidates").select("profile").eq("job_id", job.id);
  const d = job.details;
  const matched = (cands ?? []).filter((c) => score(c.profile, d).total >= 70).length;
  const exp = d.minYears != null || d.maxYears != null ? `${d.minYears ?? "?"}${d.maxYears != null ? "–" + d.maxYears : "+"} yrs` : NM;
  const notice = d.noticeMaxDays != null ? `≤ ${d.noticePreferredDays ?? d.noticeMaxDays}d (max ${d.noticeMaxDays}d)` : d.noticePreferredDays != null ? `≤ ${d.noticePreferredDays} days` : NM;

  return (
    <>
      <div className="flex items-center gap-2 text-[13px] text-muted"><Link href="/app/jobs" className="hover:text-ink">Jobs</Link><span>/</span><b className="truncate font-semibold text-ink">{job.title}</b></div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.35rem] font-bold">{job.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <StatusPill status={job.status} />{job.code && <span>{job.code}</span>}<span>·</span>
            <span>{cands?.length ?? 0} applicants</span><span>·</span><span>{matched} matched (70+)</span>
          </div>
        </div>
        {canWrite(ctx.role) && (
          <div className="flex gap-2">
            <Link href={`/app/jobs/${job.id}/screen`} className="btn-primary"><Icon name="scan" />Screen resume</Link>
            <Link href={`/app/jobs/${job.id}/edit`} className="btn"><Icon name="edit" />Edit job</Link>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Posted date" icon="cal" value={fdate(job.created_at)} />
        <Stat label="Work mode" icon="home" value={d.workMode ?? NM} />
        <Stat label="Location" icon="pin" value={d.location ?? NM} />
        <Stat label="Experience" icon="award" value={exp} />
        <Stat label="Budget" icon="rupee" value={d.budget ?? NM} />
        <Stat label="Notice" icon="clock" value={notice} />
      </div>
      <JobTabs id={job.id} counts={{ candidates: cands?.length ?? 0, tech: d.techQs?.length ?? 0 }} />
      {children}
    </>
  );
}
