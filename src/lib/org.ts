import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import type { Role } from "./types";
import { PLANS, access, period, type BillingRow, type PlanId } from "./plans";

export const ORG_COOKIE = "ira_org";

export interface OrgContext {
  userId: string;
  email: string;
  name: string;
  org: { id: string; name: string };
  role: Role;
  orgs: { id: string; name: string; role: Role }[];
  billing: BillingRow;
}

/** Signed-in user + their current workspace. Redirects to login or onboarding when needed. */
export async function requireOrg(): Promise<OrgContext> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("memberships")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const orgs = (rows ?? [])
    .map((r) => {
      const o = r.organizations as unknown as { id: string; name: string } | null;
      return o ? { id: o.id, name: o.name, role: r.role as Role } : null;
    })
    .filter((x): x is { id: string; name: string; role: Role } => !!x);
  if (!orgs.length) redirect("/onboarding");

  const wanted = cookies().get(ORG_COOKIE)?.value;
  const current = orgs.find((o) => o.id === wanted) ?? orgs[0];

  const { data: billing } = await supabase.from("org_billing").select("*").eq("org_id", current.id).single();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  return {
    userId: user.id,
    email: user.email ?? "",
    name: profile?.full_name || user.email?.split("@")[0] || "You",
    org: { id: current.id, name: current.name },
    role: current.role,
    orgs,
    billing: billing as BillingRow,
  };
}

export const canWrite = (r: Role) => r === "owner" || r === "admin" || r === "recruiter";
export const canManage = (r: Role) => r === "owner" || r === "admin";

export type UsageKind = "jd" | "resume" | "questions";
const LIMIT_KEY = { jd: "jdAnalyses", resume: "resumeScreens", questions: "questionSets" } as const;
const COUNTER_KEY = { jd: "jd_analyses", resume: "resume_screens", questions: "question_sets" } as const;
const KIND_LABEL = { jd: "JD analyses", resume: "resume screens", questions: "technical question sets" } as const;

/** Throws a user-facing message if the workspace can't run this AI action. */
export async function checkQuota(ctx: OrgContext, kind: UsageKind) {
  const a = access(ctx.billing);
  if (!a.ok) throw new QuotaError(a.reason!);
  const plan = PLANS[ctx.billing.plan as PlanId] ?? PLANS.trial;
  const admin = createAdminClient();
  const { data } = await admin.from("usage_counters").select("*").eq("org_id", ctx.org.id).eq("period", period()).maybeSingle();
  const used = (data?.[COUNTER_KEY[kind]] as number | undefined) ?? 0;
  if (used >= plan[LIMIT_KEY[kind]]) {
    throw new QuotaError(`You've used all ${plan[LIMIT_KEY[kind]]} ${KIND_LABEL[kind]} in your ${plan.name} plan this month. Upgrade in Settings → Billing.`);
  }
}

export async function recordUsage(orgId: string, kind: UsageKind) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("increment_usage", { p_org: orgId, p_period: period(), p_kind: kind });
  if (error) console.error("usage increment failed", error.message);
}

export class QuotaError extends Error { status = 402; }

export async function audit(orgId: string, userId: string, action: string, entity?: string, entityId?: string) {
  const supabase = createClient();
  await supabase.from("audit_log").insert({ org_id: orgId, user_id: userId, action, entity, entity_id: entityId });
}
