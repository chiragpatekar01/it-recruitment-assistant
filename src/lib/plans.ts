export type PlanId = "trial" | "starter" | "growth" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceInr: number | null; // per month, excluding GST
  blurb: string;
  seats: number;
  activeJobs: number;
  resumeScreens: number; // per calendar month
  jdAnalyses: number; // per calendar month
  questionSets: number; // per calendar month
  features: string[];
}

// Prices and limits are examples. Change them here, and create matching plans in Razorpay.
export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: "trial", name: "Free trial", priceInr: 0, blurb: "14 days to try every feature.",
    seats: 2, activeJobs: 3, resumeScreens: 25, jdAnalyses: 5, questionSets: 5,
    features: ["All recruiting features", "2 team members", "3 active jobs", "25 resume screens"],
  },
  starter: {
    id: "starter", name: "Starter", priceInr: 2999, blurb: "For small recruitment teams.",
    seats: 3, activeJobs: 10, resumeScreens: 200, jdAnalyses: 30, questionSets: 30,
    features: ["3 team members", "10 active jobs", "200 resume screens / month", "JD analysis and Boolean strings", "Technical question bank", "Email drafts and reports"],
  },
  growth: {
    id: "growth", name: "Growth", priceInr: 7999, blurb: "For agencies hiring across many roles.",
    seats: 10, activeJobs: 50, resumeScreens: 1000, jdAnalyses: 150, questionSets: 150,
    features: ["10 team members", "50 active jobs", "1,000 resume screens / month", "Everything in Starter", "Roles and permissions", "Priority support"],
  },
  enterprise: {
    id: "enterprise", name: "Enterprise", priceInr: null, blurb: "Custom limits, security review and onboarding.",
    seats: 1000, activeJobs: 10000, resumeScreens: 100000, jdAnalyses: 10000, questionSets: 10000,
    features: ["Custom limits", "SSO on request", "Data processing agreement", "Dedicated onboarding"],
  },
};

export const PAID_PLANS: PlanId[] = ["starter", "growth"];

export function razorpayPlanId(plan: PlanId): string | undefined {
  if (plan === "starter") return process.env.RAZORPAY_PLAN_STARTER;
  if (plan === "growth") return process.env.RAZORPAY_PLAN_GROWTH;
  return undefined;
}

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export interface BillingRow {
  plan: PlanId;
  status: string;
  trial_ends_at: string;
  current_period_end: string | null;
  razorpay_subscription_id: string | null;
  pending_plan: string | null;
}

/** Whether the workspace may use AI features right now, and why not. */
export function access(b: BillingRow | null): { ok: boolean; reason?: string } {
  if (!b) return { ok: false, reason: "Billing information is missing for this workspace." };
  if (b.plan === "trial") {
    return new Date(b.trial_ends_at) > new Date() ? { ok: true } : { ok: false, reason: "Your free trial has ended. Choose a plan to keep screening." };
  }
  if (b.status === "active" || b.status === "authenticated") return { ok: true };
  if (b.status === "cancelled" && b.current_period_end && new Date(b.current_period_end) > new Date()) return { ok: true };
  if (b.status === "pending") return { ok: true }; // Razorpay is retrying a payment; keep access during retries
  return { ok: false, reason: "Your subscription isn't active. Update billing to continue." };
}

export const period = (d = new Date()) => d.toISOString().slice(0, 7);
