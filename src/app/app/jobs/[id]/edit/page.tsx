import { canManage, canWrite, requireOrg } from "@/lib/org";
import { getJob } from "@/lib/data";
import { ViewOnly } from "../../../parts";
import { JobEditor } from "./editor";

export default async function Edit({ params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  const job = await getJob(ctx.org.id, params.id);
  if (!canWrite(ctx.role)) return <ViewOnly />;
  return <JobEditor job={job} canDelete={canManage(ctx.role)} />;
}
