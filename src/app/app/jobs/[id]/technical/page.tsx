import { canWrite, requireOrg } from "@/lib/org";
import { getJob } from "@/lib/data";
import { TechQuestions } from "./client";

export default async function Technical({ params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  const job = await getJob(ctx.org.id, params.id);
  return <TechQuestions jobId={job.id} title={job.title} list={job.details.techQs ?? []} mandatory={job.details.mandatory ?? []} preferred={job.details.preferred ?? []} canEdit={canWrite(ctx.role)} />;
}
