import "server-only";

export class AiError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

const SYSTEM = "You are an assistant inside an IT recruitment platform. You help recruiters; recruiters make every hiring decision. Follow the user's output format exactly.";

/** Calls the Claude Messages API with the platform's server-side key. */
export async function askClaude(prompt: string, opts: { maxTokens?: number; json?: boolean } = {}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AiError("AI analysis isn't configured. Set ANTHROPIC_API_KEY on the server.", 500);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: opts.maxTokens ?? 8000,
      system: SYSTEM + (opts.json ? " Reply with JSON only, no prose and no code fences." : ""),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (res.status === 429) throw new AiError("The AI service is busy. Wait a minute and try again.", 429);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Claude API error", res.status, detail.slice(0, 500));
    throw new AiError("The AI service returned an error. Try again shortly.");
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[]; stop_reason?: string };
  const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  if (data.stop_reason === "max_tokens" && opts.json) throw new AiError("The text was too long to analyse in one go. Trim it to the relevant sections.", 413);
  if (!text.trim()) throw new AiError("The AI returned an empty answer. Try again.");
  return text;
}

/** Tolerant JSON read: whole reply, else a fenced block, else first { or [ to the last } or ]. */
export function parseJson(text: string): unknown {
  const t = text.trim();
  try { return JSON.parse(t); } catch { /* fall through */ }
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch { /* fall through */ } }
  const start = t.search(/[{[]/);
  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (start >= 0 && end > start) { try { return JSON.parse(t.slice(start, end + 1)); } catch { /* fall through */ } }
  throw new AiError("The AI reply couldn't be read as structured data. Try again.");
}

export async function askClaudeJson(prompt: string, maxTokens?: number) {
  return parseJson(await askClaude(prompt, { json: true, maxTokens }));
}
