"use client";
import Link from "next/link";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/client";
import { sendReset, signIn, signUp, updatePassword, type FormState } from "./actions";

const Msg = ({ s }: { s: FormState }) =>
  s?.error ? <p role="alert" className="callout-bad">{s.error}</p> : s?.ok ? <p role="status" className="callout-info">{s.ok}</p> : null;

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useFormState(signIn, undefined);
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <h1 className="text-xl font-bold">Log in</h1>
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1"><span className="label">Work email</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="flex flex-col gap-1"><span className="label">Password</span><input className="input" name="password" type="password" autoComplete="current-password" required /></label>
      <Msg s={state} />
      <SubmitButton pending="Logging in…">Log in</SubmitButton>
      <div className="flex justify-between text-[13px]">
        <Link href="/forgot-password" className="text-accent">Forgot password?</Link>
        <Link href={`/signup${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-accent">Create an account</Link>
      </div>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action] = useFormState(signUp, undefined);
  if (state?.ok) return <div className="flex flex-col gap-3"><h1 className="text-xl font-bold">Check your email</h1><Msg s={state} /></div>;
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div><h1 className="text-xl font-bold">Start your free trial</h1><p className="mt-1 text-[13px] text-muted">14 days, every feature, no card needed.</p></div>
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1"><span className="label">Your name</span><input className="input" name="name" autoComplete="name" required /></label>
      <label className="flex flex-col gap-1"><span className="label">Work email</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="flex flex-col gap-1"><span className="label">Password</span><input className="input" name="password" type="password" minLength={8} autoComplete="new-password" required /><span className="text-xs text-muted">At least 8 characters</span></label>
      <label className="flex items-start gap-2 text-[13px]"><input type="checkbox" name="terms" className="mt-0.5" required />
        <span>I agree to the <Link href="/terms" className="text-accent">terms</Link> and <Link href="/privacy" className="text-accent">privacy policy</Link>.</span></label>
      <Msg s={state} />
      <SubmitButton pending="Creating account…">Create account</SubmitButton>
      <p className="text-center text-[13px]">Already have an account? <Link href={`/login${next !== "/onboarding" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-accent">Log in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useFormState(sendReset, undefined);
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <h1 className="text-xl font-bold">Reset your password</h1>
      <label className="flex flex-col gap-1"><span className="label">Work email</span><input className="input" name="email" type="email" required /></label>
      <Msg s={state} />
      <SubmitButton pending="Sending…">Send reset link</SubmitButton>
      <Link href="/login" className="text-center text-[13px] text-accent">Back to log in</Link>
    </form>
  );
}

export function ResetForm() {
  const [state, action] = useFormState(updatePassword, undefined);
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <h1 className="text-xl font-bold">Choose a new password</h1>
      <label className="flex flex-col gap-1"><span className="label">New password</span><input className="input" name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
      <Msg s={state} />
      <SubmitButton pending="Saving…">Save password</SubmitButton>
    </form>
  );
}
