import Link from "next/link";
import { requireOrg } from "@/lib/org";
import { listCandidates, listJobs, metrics, ratio } from "@/lib/data";
import { score, fmt } from "@/lib/scoring";
import { Icon } from "@/components/icons";
import { CopyButton } from "@/components/client";
import { Empty, fdate } from "@/components/ui";
import { PageHead, Stat, StatusPill } from "./parts";

export default async function Dashboard({ searchParams }: { searchParams: { welcome?: string } }) {
  const ctx = await requireOrg();
  const [jobs, cands] = await Promise.all([listJobs(ctx.org.id), listCandidates(ctx.org.id)]);
  const m = metrics(jobs, cands);

  if (!jobs.length) {
    return (
      <>
        <PageHead title={searchParams.welcome ? `Welcome to ${ctx.org.name}` : "Dashboard"} sub="Your hiring pipeline will appear here." />
        <Empty title="Add your first job">
          <p className="max-w-[52ch]">Paste a job description and Claude pulls out the requirements, writes Boolean search strings and drafts screening questions.</p>
          <Link href="/app/jobs/new" className="btn-primary"><Icon name="plus" />New job</Link>
        </Empty>
      </>
    );
  }

  const steps: [string, number][] = [["Sourced", m.sourced], ["Screened", m.screened], ["Shortlisted", m.shortlisted], ["Interview scheduled", m.iSched], ["Interview completed", m.iDone], ["Selected", m.selected], ["Offer made", m.offered], ["Joined", m.joined]];
  const max = Math.max(1, ...steps.map((s) => s[1]));
  const ratios: [string, number, number][] = [["Screened / sourced", m.screened, m.sourced], ["Shortlisted / screened", m.shortlisted, m.screened], ["Interview / shortlisted", m.iSched, m.shortlisted], ["Selected / interviewed", m.selected, m.iDone], ["Joined / offered", m.joined, m.offered]];
  const report = `${ctx.org.name}: recruitment status\nDate: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}\n\n` +
    steps.map(([l, n]) => `${l}: ${n}`).join("\n") + `\nOn hold: ${m.onHold}\nRejected: ${m.rejected}\n\nConversion\n` + ratios.map(([l, a, b]) => `${l}: ${ratio(a, b)}`).join("\n");

  return (
    <>
      <PageHead title="Dashboard" sub={`${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} · ${cands.length} candidates screened`}>
        <CopyButton text={report} label="Copy status report" className="btn" />
      </PageHead>
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-3 lg:grid-cols-6">
        {([["Sourced", m.sourced, "users"], ["Screened", m.screened, "scan"], ["Shortlisted", m.shortlisted, "list"], ["Interviews", m.iSched, "cal"], ["Selected", m.selected, "award"], ["Joined", m.joined, "home"]] as const)
          .map(([l, n, i]) => <Stat key={l} label={l} icon={i} value={n} big />)}
      </div>
      <div className="grid gap-[18px] lg:grid-cols-2">
        <section className="panel">
          <header className="flex items-center justify-between"><h2 className="font-bold">Pipeline funnel</h2><span className="text-xs text-muted">Counts every stage a candidate has reached</span></header>
          <div className="flex flex-col gap-2">
            {[...steps, ["On hold", m.onHold] as [string, number], ["Rejected", m.rejected] as [string, number]].map(([l, n], i) => (
              <div key={l} className="grid grid-cols-[120px_minmax(0,1fr)_36px] items-center gap-2.5 text-[13px] sm:grid-cols-[150px_minmax(0,1fr)_40px]">
                <span>{l}</span>
                <div className="h-[18px] overflow-hidden rounded bg-surface2"><span className={`block h-full rounded ${i >= 8 ? "bg-muted" : "bg-accent"}`} style={{ width: `${(100 * n) / max}%` }} /></div>
                <span className="text-right tabular">{n}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2 className="font-bold">Conversion ratios</h2>
          <div className="card overflow-x-auto">
            <table className="tbl"><thead><tr><th>Step</th><th className="text-right">Count</th><th className="text-right">Ratio</th></tr></thead>
              <tbody>{ratios.map(([l, a, b]) => <tr key={l}><td>{l}</td><td className="text-right tabular">{a} / {b}</td><td className={`text-right tabular ${b ? "" : "text-muted"}`}>{ratio(a, b)}</td></tr>)}</tbody></table>
          </div>
          <h3 className="text-sm font-semibold">JD alignment of screened candidates</h3>
          <div className="flex flex-wrap gap-1.5">
            <span className="pill rounded-full bg-good-soft text-good">Strong {m.bands.strong}</span><span className="pill rounded-full bg-info-soft text-info">Good {m.bands.good}</span>
            <span className="pill rounded-full bg-warn-soft text-warn">Partial {m.bands.partial}</span><span className="pill rounded-full bg-bad-soft text-bad">Low {m.bands.low}</span>
          </div>
        </section>
      </div>
      <section className="card">
        <header className="flex items-center justify-between p-4"><h2 className="font-bold">Jobs</h2><Link href="/app/jobs/new" className="btn-primary btn-sm"><Icon name="plus" className="h-3.5 w-3.5" />New job</Link></header>
        <div className="overflow-x-auto"><table className="tbl">
          <thead><tr><th>Job</th><th>Status</th><th>Location</th><th>Posted</th><th className="text-right">Applicants</th><th className="text-right">Matched (70+)</th><th className="text-right">Top score</th></tr></thead>
          <tbody>{jobs.map((j) => {
            const sc = cands.filter((c) => c.job_id === j.id).map((c) => score(c.profile, j.details).total);
            return (
              <tr key={j.id} className="hover:bg-surface2">
                <td><Link href={`/app/jobs/${j.id}`} className="font-semibold hover:text-accent">{j.title}</Link><br /><small className="text-muted">{j.code}</small></td>
                <td><StatusPill status={j.status} /></td><td>{j.details.location ?? "Not Mentioned"}</td><td className="tabular">{fdate(j.created_at)}</td>
                <td className="text-right tabular">{sc.length}</td><td className="text-right tabular">{sc.filter((x) => x >= 70).length}</td><td className="text-right tabular">{sc.length ? fmt(Math.max(...sc)) : "—"}</td>
              </tr>);
          })}</tbody>
        </table></div>
      </section>
    </>
  );
}
