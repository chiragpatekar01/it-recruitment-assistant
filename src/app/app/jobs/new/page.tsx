import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canWrite, requireOrg } from "@/lib/org";
import { PageHead } from "../../parts";
import { NewJobForm } from "./form";

export const metadata: Metadata = { title: "New job" };

export default async function NewJob() {
  const ctx = await requireOrg();
  if (!canWrite(ctx.role)) redirect("/app/jobs");
  return (
    <>
      <PageHead title="New job" sub="Stage 1: paste the job description. Claude extracts the requirements, sourcing strings and screening questions." />
      <NewJobForm />
    </>
  );
}
