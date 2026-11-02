"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ORG_COOKIE } from "@/lib/org";

export async function createWorkspace(_: { error?: string } | undefined, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return { error: "Use a workspace name between 2 and 80 characters." };
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_organization", { org_name: name });
  if (error || !data) return { error: error?.message ?? "Couldn't create the workspace. Try again." };
  cookies().set(ORG_COOKIE, String(data), { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365 });
  redirect("/app?welcome=1");
}

export async function acceptInvite(token: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("accept_invitation", { invite_token: token });
  if (error || !data) redirect(`/invite/${token}?error=${encodeURIComponent(error?.message ?? "Couldn't accept the invitation.")}`);
  cookies().set(ORG_COOKIE, String(data), { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365 });
  redirect("/app");
}
