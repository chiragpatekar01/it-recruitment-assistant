import { redirect } from "next/navigation";
import { canWrite, requireOrg } from "@/lib/org";
import { getJob } from "@/lib/data";
import { Chips } from "@/components/ui";
import { NM } from "@/lib/types";
import { ScreenForm } from "./form";

export default async function Screen({ params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (!canWrite(ctx.role)) redirect(`/app/jobs/${params.id}`);
  const job = await getJob(ctx.org.id, params.id);
  const d = job.details;
  return (
    <div className="grid gap-[18px] lg:grid-cols-2">
      <ScreenForm jobId={job.id} hasSkills={!!d.mandatory?.length} />
      <section className="panel">
        <h2 className="font-bold">Requirements being matched</h2>
        <div className="flex flex-col gap-1.5"><span className="cap">Mandatory · 40%</span><Chips items={d.mandatory} must /></div>
        <div className="flex flex-col gap-1.5"><span className="cap">Preferred · 10%</span><Chips items={d.preferred} /></div>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13.5px] sm:grid-cols-[180px_minmax(0,1fr)]">
          <dt className="text-muted">Experience · 25%</dt><dd>{d.minYears != null ? `${d.minYears}+ relevant years` : NM}</dd>
          <dt className="text-muted">Project / domain · 15%</dt><dd>{d.domain ?? NM}{d.domainRequired && d.domainRequired !== "none" ? ` (${d.domainRequired})` : ""}</dd>
          <dt className="text-muted">Education · 5%</dt><dd>{d.education ?? NM}</dd>
          <dt className="text-muted">Role / location · 5%</dt><dd>{d.location ?? NM}; notice {d.noticeMaxDays != null ? `max ${d.noticeMaxDays} days` : NM}</dd>
        </dl>
      </section>
    </div>
  );
}
