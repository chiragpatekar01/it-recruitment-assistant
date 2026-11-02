import type { Metadata } from "next";
import { requireOrg } from "@/lib/org";
import { listCandidates, listJobs } from "@/lib/data";
import { toRows } from "@/lib/rows";
import { CandidateTable } from "@/components/candidate-table";
import { Empty } from "@/components/ui";
import { PageHead } from "../parts";

export const metadata: Metadata = { title: "Candidates" };

export default async function AllCandidates() {
  const ctx = await requireOrg();
  const [jobs, cands] = await Promise.all([listJobs(ctx.org.id), listCandidates(ctx.org.id)]);
  return (
    <>
      <PageHead title="Candidates" sub="Everyone screened across all jobs in this workspace." />
      {cands.length ? <CandidateTable rows={toRows(cands, jobs)} showJob /> : <Empty title="No candidates yet"><p>Open a job and use Screen resume to add candidates.</p></Empty>}
    </>
  );
}
