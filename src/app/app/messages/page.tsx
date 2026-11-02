import type { Metadata } from "next";
import { requireOrg } from "@/lib/org";
import { listCandidates, listJobs } from "@/lib/data";
import { PageHead } from "../parts";
import { Composer } from "./composer";

export const metadata: Metadata = { title: "Messages" };

export default async function Messages({ searchParams }: { searchParams: { candidate?: string } }) {
  const ctx = await requireOrg();
  const [jobs, cands] = await Promise.all([listJobs(ctx.org.id), listCandidates(ctx.org.id)]);
  const pre = cands.find((c) => c.id === searchParams.candidate);
  return (
    <>
      <PageHead title="Messages" sub="Stage 7: candidate communication drafts. Nothing is sent from here. Copy the draft into your email or messaging tool." />
      <Composer jobs={jobs} cands={cands} recruiter={ctx.name} orgName={ctx.org.name} initialJob={pre?.job_id ?? jobs[0]?.id ?? ""} initialCand={pre?.id ?? ""} />
    </>
  );
}
