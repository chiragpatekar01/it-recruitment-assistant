import "server-only";

const MAX_BYTES = 5 * 1024 * 1024;

/** Extracts plain text from an uploaded resume. The file itself is never stored. */
export async function resumeText(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("The file is larger than 5 MB. Upload a smaller file or paste the text.");
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    // Import the library entry directly: the package index runs a debug script on import.
    const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default as (b: Buffer, o?: { max?: number }) => Promise<{ text: string }>;
    const out = await pdf(buf, { max: 15 });
    return out.text;
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const out = await mammoth.extractRawText({ buffer: buf });
    return out.value;
  }
  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) return buf.toString("utf8");
  throw new Error("Use a .pdf, .docx or .txt file, or paste the resume text.");
}
