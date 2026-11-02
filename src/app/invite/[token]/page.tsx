import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/client";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { acceptInvite } from "@/app/onboarding/actions";

export const metadata: Metadata = { title: "Join workspace" };

export default async function Invite({ params, searchParams }: { params: { token: string }; searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data } = await supabase.rpc("invitation_preview", { invite_token: params.token });
  const inv = (data as { org_name: string; role: Role; email: string; expired: boolean; accepted: boolean }[] | null)?.[0];
  const { data: { user } } = await supabase.auth.getUser();
  const next = `/invite/${params.token}`;

  let body: React.ReactNode;
  if (!inv || inv.expired || inv.accepted) {
    body = <><h1 className="text-xl font-bold">This invitation can&apos;t be used</h1><p className="text-[13.5px] text-muted">It has expired, was already used, or the link is incomplete. Ask your workspace admin for a new invitation.</p></>;
  } else if (!user) {
    body = <>
      <h1 className="text-xl font-bold">Join {inv.org_name}</h1>
      <p className="text-[13.5px] text-muted">You&apos;ve been invited as <b className="text-ink">{ROLE_LABEL[inv.role]}</b>. Sign in or create an account with <b className="text-ink">{inv.email}</b> to accept.</p>
      <div className="flex gap-2"><Link className="btn-primary flex-1" href={`/signup?next=${encodeURIComponent(next)}`}>Create account</Link><Link className="btn flex-1" href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link></div>
    </>;
  } else {
    const accept = acceptInvite.bind(null, params.token);
    body = <form action={accept} className="flex flex-col gap-3.5">
      <h1 className="text-xl font-bold">Join {inv.org_name}</h1>
      <p className="text-[13.5px] text-muted">You&apos;ll join as <b className="text-ink">{ROLE_LABEL[inv.role]}</b>.</p>
      {user.email?.toLowerCase() !== inv.email.toLowerCase() && <p className="callout">You&apos;re signed in as {user.email}, but this invitation is for {inv.email}. Log out and sign in with the invited email.</p>}
      {searchParams.error && <p role="alert" className="callout-bad">{searchParams.error}</p>}
      <SubmitButton pending="Joining…">Accept invitation</SubmitButton>
    </form>;
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />
      <div className="flex w-full max-w-[420px] flex-col gap-3.5 rounded-2xl border border-line bg-surface p-6">{body}</div>
    </div>
  );
}
