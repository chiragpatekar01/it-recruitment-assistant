import Link from "next/link";
import type { Metadata } from "next";
import { requireOrg, canWrite } from "@/lib/org";
import { listCandidates, listJobs } from "@/lib/data";
import { score, fmt } from "@/lib/scoring";
import { Icon } from "@/components/icons";
import { Empty, fdate } from "@/components/ui";
import { PageHead, StatusPill } from "../parts";

export const metadata: Metadata = { title: "Jobs" };

export default async function Jobs() {
  const ctx = await requireOrg();
  const [jobs, cands] = await Promise.all([listJobs(ctx.org.id), listCandidates(ctx.org.id)]);
  return (
    <>
      <PageHead title="Jobs" sub={`${jobs.filter((j) => j.status === "open").length} active · ${jobs.length} total`}>
        {canWrite(ctx.role) && <Link href="/app/jobs/new" className="btn-primary"><Icon name="plus" />New job</Link>}
      </PageHead>
      {!jobs.length ? (
        <Empty title="No jobs yet"><p>Create a job from a job description to start sourcing and screening.</p>
          {canWrite(ctx.role) && <Link href="/app/jobs/new" className="btn-primary"><Icon name="plus" />New job</Link>}</Empty>
      ) : (
        <div className="card overflow-x-auto"><table className="tbl">
          <thead><tr><th>Job</th><th>Status</th><th>Location</th><th>Experience</th><th>Posted</th><th className="text-right">Applicants</th><th className="text-right">Top score</th></tr></thead>
          <tbody>{jobs.map((j) => {
            const sc = cands.filter((c) => c.job_id === j.id).map((c) => score(c.profile, j.details).total);
            const d = j.details;
            return (
              <tr key={j.id} className="hover:bg-surface2">
                <td><Link href={`/app/jobs/${j.id}`} className="font-semibold hover:text-accent">{j.title}</Link>{j.code && <><br /><small className="text-muted">{j.code}</small></>}</td>
                <td><StatusPill status={j.status} /></td><td>{d.location ?? "Not Mentioned"}</td>
                <td>{d.minYears != null ? `${d.minYears}${d.maxYears != null ? "–" + d.maxYears : "+"} yrs` : "—"}</td>
                <td className="tabular">{fdate(j.created_at)}</td><td className="text-right tabular">{sc.length}</td>
                <td className="text-right tabular">{sc.length ? fmt(Math.max(...sc)) : "—"}</td>
              </tr>);
          })}</tbody>
        </table></div>
      )}
    </>
  );
}
