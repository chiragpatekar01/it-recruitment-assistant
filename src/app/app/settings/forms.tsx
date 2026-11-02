"use client";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/client";
import { inviteMember, renameWorkspace, updateMyName, type ActionResult } from "../actions";

const Msg = ({ s }: { s: ActionResult }) => s?.error ? <p role="alert" className="callout-bad">{s.error}</p> : s?.ok ? <p role="status" className="text-[13px] text-good">{s.ok}</p> : null;

export function WorkspaceNameForm({ name }: { name: string }) {
  const [s, a] = useFormState(renameWorkspace, undefined);
  return (
    <form action={a} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1"><span className="label">Workspace name</span><input className="input" name="name" defaultValue={name} minLength={2} maxLength={80} required /></label>
      <Msg s={s} /><div><SubmitButton pending="Saving…">Save</SubmitButton></div>
    </form>
  );
}

export function NameForm({ name, email }: { name: string; email: string }) {
  const [s, a] = useFormState(updateMyName, undefined);
  return (
    <form action={a} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1"><span className="label">Your name (used in email signatures)</span><input className="input" name="name" defaultValue={name} maxLength={80} /></label>
      <p className="text-[13px] text-muted">Signed in as {email}</p>
      <Msg s={s} /><div><SubmitButton pending="Saving…">Save</SubmitButton></div>
    </form>
  );
}

export function InviteForm({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const [s, a] = useFormState(inviteMember, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (s?.ok) ref.current?.reset(); }, [s]);
  return (
    <form ref={ref} action={a} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
        <label className="flex flex-col gap-1"><span className="label">Email</span><input className="input" name="email" type="email" placeholder="colleague@company.com" required /></label>
        <label className="flex flex-col gap-1"><span className="label">Role</span>
          <select className="input" name="role" defaultValue="recruiter">{canInviteAdmin && <option value="admin">Admin</option>}<option value="recruiter">Recruiter</option><option value="viewer">Viewer</option></select></label>
        <SubmitButton pending="Inviting…">Invite</SubmitButton>
      </div>
      <Msg s={s} />
    </form>
  );
}
