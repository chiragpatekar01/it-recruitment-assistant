"use client";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/client";
import { createWorkspace } from "./actions";

export function WorkspaceForm() {
  const [state, action] = useFormState(createWorkspace, undefined);
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div><h1 className="text-xl font-bold">Name your workspace</h1>
        <p className="mt-1 text-[13px] text-muted">Usually your company or agency name. Your team, jobs and candidates live here.</p></div>
      <label className="flex flex-col gap-1"><span className="label">Workspace name</span><input className="input" name="name" placeholder="e.g. Acme Talent Partners" required minLength={2} maxLength={80} autoFocus /></label>
      {state?.error && <p role="alert" className="callout-bad">{state.error}</p>}
      <SubmitButton pending="Creating…">Create workspace and start trial</SubmitButton>
      <p className="text-xs text-muted">Joining a colleague&apos;s workspace? Open the invitation link from your email instead.</p>
    </form>
  );
}
