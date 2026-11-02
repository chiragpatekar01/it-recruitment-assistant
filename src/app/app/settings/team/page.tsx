import type { Metadata } from "next";
import { canManage, requireOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { Avatar, fdate } from "@/components/ui";
import { ConfirmSubmit, CopyButton, SubmitButton } from "@/components/client";
import { changeRole, removeMember, revokeInvite } from "../../actions";
import { PageHead } from "../../parts";
import { InviteForm } from "../forms";

export const metadata: Metadata = { title: "Team" };

const ROLE_HELP: Record<Role, string> = {
  owner: "Everything, including billing and deleting the workspace",
  admin: "Manage team and jobs, delete jobs",
  recruiter: "Create jobs, screen resumes, update candidates",
  viewer: "Read-only access",
};

export default async function Team() {
  const ctx = await requireOrg();
  const supabase = createClient();
  const { data: members } = await supabase.from("memberships").select("user_id, role, created_at, profiles(full_name, email)").eq("org_id", ctx.org.id).order("created_at");
  const manage = canManage(ctx.role);
  const { data: invites } = manage
    ? await supabase.from("invitations").select("*").eq("org_id", ctx.org.id).is("accepted_at", null).order("created_at", { ascending: false })
    : { data: [] as { id: string; email: string; role: Role; token: string; expires_at: string }[] };
  const seats = PLANS[ctx.billing.plan]?.seats ?? 2;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const live = (invites ?? []).filter((i) => new Date(i.expires_at) > new Date());

  return (
    <>
      <PageHead title="Team" sub={`${members?.length ?? 0} members · ${live.length} pending · ${seats} seats on your plan`} />
      {manage && (
        <section className="panel">
          <h2 className="font-bold">Invite a teammate</h2>
          <InviteForm canInviteAdmin={ctx.role === "owner"} />
          <p className="text-xs text-muted">Invitations are valid for 7 days. Send the invite link yourself by email or chat.</p>
        </section>
      )}
      <section className="card">
        <h2 className="p-4 font-bold">Members</h2>
        <div className="overflow-x-auto"><table className="tbl">
          <thead><tr><th>Member</th><th>Role</th><th>Joined</th><th aria-label="Actions" /></tr></thead>
          <tbody>{(members ?? []).map((m) => {
            const p = m.profiles as unknown as { full_name: string | null; email: string } | null;
            const nm = p?.full_name || p?.email || "Member";
            const me = m.user_id === ctx.userId;
            const editable = manage && !me && (ctx.role === "owner" || m.role !== "owner");
            return (
              <tr key={m.user_id}>
                <td><div className="flex items-center gap-2.5"><Avatar name={nm} /><div><b className="font-semibold">{nm}{me && <span className="text-muted"> (you)</span>}</b><small className="block text-muted">{p?.email}</small></div></div></td>
                <td>
                  {editable ? (
                    <form action={changeRole.bind(null, m.user_id)} className="flex items-center gap-1.5">
                      <select className="input w-auto py-1" name="role" defaultValue={m.role}>{(ctx.role === "owner" ? ["owner", "admin", "recruiter", "viewer"] : ["admin", "recruiter", "viewer"]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>)}</select>
                      <SubmitButton className="btn btn-sm" pending="…">Update</SubmitButton>
                    </form>
                  ) : <span title={ROLE_HELP[m.role as Role]}>{ROLE_LABEL[m.role as Role]}</span>}
                </td>
                <td className="tabular">{fdate(m.created_at)}</td>
                <td className="text-right">
                  {(editable || (me && m.role !== "owner")) && (
                    <form action={removeMember.bind(null, m.user_id)}><ConfirmSubmit className="btn-danger btn-sm" label={me ? "Leave" : "Remove"} confirm="Confirm" /></form>
                  )}
                </td>
              </tr>);
          })}</tbody>
        </table></div>
      </section>
      {manage && !!live.length && (
        <section className="card">
          <h2 className="p-4 font-bold">Pending invitations</h2>
          <div className="overflow-x-auto"><table className="tbl">
            <thead><tr><th>Email</th><th>Role</th><th>Expires</th><th aria-label="Actions" /></tr></thead>
            <tbody>{live.map((i) => (
              <tr key={i.id}>
                <td>{i.email}</td><td>{ROLE_LABEL[i.role as Role]}</td><td className="tabular">{fdate(i.expires_at)}</td>
                <td><div className="flex justify-end gap-1.5"><CopyButton text={`${appUrl}/invite/${i.token}`} label="Copy invite link" />
                  <form action={revokeInvite.bind(null, i.id)}><ConfirmSubmit className="btn-danger btn-sm" label="Revoke" confirm="Confirm" /></form></div></td>
              </tr>))}</tbody>
          </table></div>
        </section>
      )}
      <section className="panel">
        <h2 className="font-bold">What each role can do</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-[13.5px] sm:grid-cols-[120px_minmax(0,1fr)]">
          {(Object.keys(ROLE_HELP) as Role[]).map((r) => <div key={r} className="contents"><dt className="font-semibold">{ROLE_LABEL[r]}</dt><dd className="mb-1.5 text-muted sm:mb-0">{ROLE_HELP[r]}</dd></div>)}
        </dl>
      </section>
    </>
  );
}
