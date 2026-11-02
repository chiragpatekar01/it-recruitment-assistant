import "server-only";
import { NextResponse } from "next/server";
import { AiError } from "@/lib/anthropic";
import { QuotaError } from "@/lib/org";

/** Maps known errors to a JSON response the client can show as-is. */
export function errorResponse(e: unknown) {
  if (e instanceof QuotaError) return NextResponse.json({ error: e.message }, { status: 402 });
  if (e instanceof AiError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e && typeof e === "object" && "digest" in e) throw e; // let Next.js redirects through
  console.error(e);
  return NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong. Try again." }, { status: 500 });
}

export const forbidden = () => NextResponse.json({ error: "Your role is view-only in this workspace." }, { status: 403 });
