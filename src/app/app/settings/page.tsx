import type { Metadata } from "next";
import { canManage, requireOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { PLANS, period } from "@/lib/plans";
import { ConfirmSubmit } from "@/components/client";
import { deleteWorkspace } from "../actions";
import { PageHead } from "../parts";
import { NameForm, WorkspaceNameForm } from "./forms";

export const metadata: Metadata = { title: "Settings" };

export default async function Settings({ searchParams }: { searchParams: { error?: string } }) {
  const ctx = await requireOrg();
  const { data: usage } = await createClient().from("usage_counters").select("*").eq("org_id", ctx.org.id).eq("period", period()).maybeSingle();
  const plan = PLANS[ctx.billing.plan] ?? PLANS.trial;
  const meters: [string, number, number][] = [
    ["Resume screens", usage?.resume_screens ?? 0, plan.resumeScreens],
    ["JD analyses", usage?.jd_analyses ?? 0, plan.jdAnalyses],
    ["Technical question sets", usage?.question_sets ?? 0, plan.questionSets],
  ];
  return (
    <>
      <PageHead title="Settings" sub={`${ctx.org.name} · ${plan.name} plan`} />
      <div className="grid gap-[18px] lg:grid-cols-2">
        <section className="panel"><h2 className="font-bold">Workspace</h2>
          {canManage(ctx.role) ? <WorkspaceNameForm name={ctx.org.name} /> : <p>{ctx.org.name}</p>}</section>
        <section className="panel"><h2 className="font-bold">Your profile</h2><NameForm name={ctx.name} email={ctx.email} /></section>
      </div>
      <section className="panel">
        <h2 className="font-bold">Usage this month</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {meters.map(([l, used, lim]) => (
            <div key={l} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13px]"><span>{l}</span><span className="tabular text-muted">{used} / {lim.toLocaleString("en-IN")}</span></div>
              <div className="h-2 overflow-hidden rounded bg-surface2"><span className={`block h-full rounded ${used >= lim ? "bg-bad" : used / lim > 0.8 ? "bg-warn" : "bg-accent"}`} style={{ width: `${Math.min(100, (100 * used) / Math.max(1, lim))}%` }} /></div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">Counters reset on the 1st of each month.</p>
      </section>
      {ctx.role === "owner" && (
        <section className="panel border-bad/40">
          <h2 className="font-bold text-bad">Delete workspace</h2>
          <p className="text-[13px] text-muted">Permanently deletes every job, candidate and invitation in {ctx.org.name}. Cancel any active subscription first.</p>
          {searchParams.error === "confirm" && <p className="callout-bad">Type the workspace name exactly to confirm.</p>}
          {searchParams.error === "billing" && <p className="callout-bad">Cancel the subscription in Billing before deleting the workspace.</p>}
          <form action={deleteWorkspace} className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-[240px] flex-1 flex-col gap-1"><span className="label">Type <b>{ctx.org.name}</b> to confirm</span><input className="input" name="confirm" autoComplete="off" /></label>
            <ConfirmSubmit label="Delete workspace" confirm="Confirm: delete everything" />
          </form>
        </section>
      )}
    </>
  );
}
