import "server-only";
import { createClient } from "./supabase/server";
import { PLANS, type PlanId } from "./plans";

export async function assertJobCapacity(orgId: string, plan: PlanId) {
  const { count } = await createClient().from("jobs").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "open");
  const limit = PLANS[plan]?.activeJobs ?? PLANS.trial.activeJobs;
  if ((count ?? 0) >= limit) throw new Error(`Your plan allows ${limit} active jobs. Close a job or upgrade in Settings → Billing.`);
}
