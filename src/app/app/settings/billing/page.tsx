import type { Metadata } from "next";
import { requireOrg } from "@/lib/org";
import { PLANS, access, inr } from "@/lib/plans";
import { Icon } from "@/components/icons";
import { fdate } from "@/components/ui";
import { PageHead } from "../../parts";
import { CancelButton, CheckoutButton } from "./client";

export const metadata: Metadata = { title: "Billing" };

const STATUS: Record<string, string> = {
  trialing: "Free trial", created: "Awaiting payment", authenticated: "Active", active: "Active", pending: "Payment retrying",
  halted: "Payment failed", cancelled: "Cancelled", completed: "Ended", expired: "Expired",
};

export default async function Billing() {
  const ctx = await requireOrg();
  const b = ctx.billing;
  const plan = PLANS[b.plan] ?? PLANS.trial;
  const a = access(b);
  const owner = ctx.role === "owner";
  const subscribed = b.plan !== "trial" && ["active", "authenticated", "pending"].includes(b.status);

  return (
    <>
      <PageHead title="Billing" sub="Plans are billed monthly through Razorpay. Card, UPI AutoPay and e-mandate are supported. Prices exclude GST." />
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="cap">Current plan</span>
            <h2 className="text-lg font-bold">{plan.name} <span className={`pill ml-1 align-middle ${a.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>{STATUS[b.status] ?? b.status}</span></h2>
            <p className="text-[13px] text-muted">
              {b.plan === "trial" ? `Trial ends ${fdate(b.trial_ends_at)}.`
                : b.status === "cancelled" ? `Cancelled. Access continues until ${fdate(b.current_period_end)}.`
                : b.current_period_end ? `Renews ${fdate(b.current_period_end)}.` : ""}
            </p>
          </div>
          {owner && subscribed && <CancelButton />}
        </div>
        {!a.ok && <p className="callout-bad">{a.reason}</p>}
        {!owner && <p className="callout-info">Only the workspace owner can change the plan.</p>}
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {[PLANS.starter, PLANS.growth, PLANS.enterprise].map((p) => {
          const current = p.id === b.plan && subscribed;
          return (
            <div key={p.id} className={`panel ${current ? "border-accent ring-1 ring-accent" : ""}`}>
              <div className="flex items-center justify-between"><h3 className="text-base font-bold">{p.name}</h3>{current && <span className="pill bg-accent-soft text-accent">Current</span>}</div>
              <p className="text-2xl font-extrabold tabular">{p.priceInr === null ? "Custom" : inr(p.priceInr)}<span className="text-xs font-medium text-muted">{p.priceInr === null ? "" : " / month + GST"}</span></p>
              <ul className="flex flex-col gap-1.5 text-[13px]">{p.features.map((f) => <li key={f} className="flex items-start gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 text-good" />{f}</li>)}</ul>
              <div className="mt-auto">
                {p.id === "enterprise" ? <a className="btn w-full" href="mailto:[sales email]">Contact sales</a>
                  : current ? <span className="btn w-full opacity-60">Your plan</span>
                  : owner && !subscribed ? <CheckoutButton plan={p.id} label={`Choose ${p.name}`} primary={p.id === "growth"} />
                  : <span className="btn w-full opacity-60">{subscribed ? "Cancel current plan to switch" : "Owner only"}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
