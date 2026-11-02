"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: string } | undefined;

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
// Only allow redirects to paths inside this app.
const safeNext = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/app";
};

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: error.message === "Email not confirmed" ? "Confirm your email first. Check your inbox for the link." : "Email or password is incorrect." };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const fullName = String(form.get("name") ?? "").trim();
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (!form.get("terms")) return { error: "Accept the terms and privacy policy to continue." };
  const next = safeNext(form.get("next") || "/onboarding");
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect(next); // email confirmation turned off
  return { ok: `We've sent a confirmation link to ${email}. Open it to finish setting up your workspace.` };
}

export async function sendReset(_: FormState, form: FormData): Promise<FormState> {
  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(String(form.get("email") ?? "").trim(), {
    redirectTo: `${appUrl()}/auth/callback?next=/reset-password`,
  });
  // Same answer whether or not the account exists.
  return { ok: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "The reset link has expired. Request a new one." };
  redirect("/app");
}
