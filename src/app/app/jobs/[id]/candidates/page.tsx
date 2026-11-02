import Link from "next/link";
import { canWrite, requireOrg } from "@/lib/org";
import { getJob, listCandidates } from "@/lib/data";
import { toRows } from "@/lib/rows";
import { CandidateTable } from "@/components/candidate-table";
import { Empty } from "@/components/ui";
import { Icon } from "@/components/icons";

export default async function JobCandidates({ params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  const job = await getJob(ctx.org.id, params.id);
  const cands = await listCandidates(ctx.org.id, job.id);
  if (!cands.length) {
    return (
      <Empty title="No candidates screened for this job yet">
        <p>Upload a resume to score it against this job.</p>
        {canWrite(ctx.role) && <Link href={`/app/jobs/${job.id}/screen`} className="btn-primary"><Icon name="scan" />Screen resume</Link>}
      </Empty>
    );
  }
  return <CandidateTable rows={toRows(cands, [job])} />;
}
