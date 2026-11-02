import Link from "next/link";
import { requireOrg } from "@/lib/org";
import { access, PLANS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ROLE_LABEL } from "@/lib/types";
import { SideNav } from "./nav";
import { switchOrg } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrg();
  const supabase = createClient();
  const [{ count: jobs }, { count: candidates }] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("org_id", ctx.org.id),
    supabase.from("candidates").select("id", { count: "exact", head: true }).eq("org_id", ctx.org.id),
  ]);
  const b = ctx.billing;
  const a = access(b);
  const trialDays = b.plan === "trial" ? Math.max(0, Math.ceil((new Date(b.trial_ends_at).getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="min-h-screen md:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-40px)] max-w-[1440px] overflow-hidden bg-bg md:grid-cols-[236px_minmax(0,1fr)] md:rounded-2xl md:border md:border-line">
        <aside className="flex flex-col gap-1 border-b border-line bg-side px-3 py-3 md:border-b-0 md:border-r md:py-4">
          <div className="flex items-center gap-2.5 px-2 pb-2 md:pb-3">
            <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px] bg-accent text-[13px] font-bold text-accent-ink">IT</span>
            <div className="min-w-0 flex-1">
              {ctx.orgs.length > 1 ? (
                <form action={switchOrg}>
                  <select name="org" defaultValue={ctx.org.id} aria-label="Switch workspace" className="w-full truncate rounded-md border-0 bg-transparent p-0 text-[13.5px] font-bold text-ink">
                    {ctx.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  <button className="text-[11px] text-accent">Switch</button>
                </form>
              ) : <b className="block truncate text-[13.5px]">{ctx.org.name}</b>}
              <small className="block text-[11.5px] text-muted">{PLANS[b.plan]?.name ?? "Trial"} · {ROLE_LABEL[ctx.role]}</small>
            </div>
          </div>
          <SideNav counts={{ jobs: jobs ?? 0, candidates: candidates ?? 0 }} />
          <div className="mt-auto hidden items-center gap-2.5 border-t border-line px-2 pt-3 md:flex">
            <Avatar name={ctx.name} />
            <div className="min-w-0 flex-1"><b className="block truncate text-[13px]">{ctx.name}</b><small className="block truncate text-[11.5px] text-muted">{ctx.email}</small></div>
            <form action="/auth/signout" method="post"><button className="btn-ghost btn-sm" aria-label="Log out" title="Log out"><Icon name="logout" /></button></form>
          </div>
        </aside>
        <div className="flex min-w-0 flex-col">
          {!a.ok ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bad-soft px-5 py-2.5 text-[13px]">
              <span>{a.reason}</span><Link href="/app/settings/billing" className="btn-primary btn-sm">Choose a plan</Link>
            </div>
          ) : trialDays !== null && trialDays <= 7 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-warn-soft px-5 py-2.5 text-[13px]">
              <span>Your free trial ends in {trialDays} {trialDays === 1 ? "day" : "days"}.</span><Link href="/app/settings/billing" className="btn btn-sm">See plans</Link>
            </div>
          ) : null}
          <main className="flex min-w-0 flex-col gap-[18px] px-4 pb-12 pt-5 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
