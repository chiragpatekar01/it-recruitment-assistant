import { NextResponse } from "next/server";
import { z } from "zod";
import { askClaude } from "@/lib/anthropic";
import { polishPrompt } from "@/lib/prompts";
import { requireOrg } from "@/lib/org";
import { access } from "@/lib/plans";
import { errorResponse } from "../_shared";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const ctx = await requireOrg();
    const a = access(ctx.billing);
    if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 402 });
    const parsed = z.object({ body: z.string().min(10).max(8000) }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "The draft is empty or too long." }, { status: 400 });
    const text = await askClaude(polishPrompt(parsed.data.body), { maxTokens: 2000 });
    return NextResponse.json({ text: text.trim() });
  } catch (e) {
    return errorResponse(e);
  }
}
