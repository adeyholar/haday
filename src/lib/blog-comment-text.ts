const MAX = 1500;

/** Keep a comment as plain text. Empty, huge, or control-character notes are refused. */
export function cleanBlogComment(raw: string): { ok: true; body: string } | { ok: false; error: string } {
  const body = raw.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (!body) return { ok: false, error: "Write a comment first." };
  if (body.length > MAX) return { ok: false, error: `Keep it under ${MAX} characters.` };
  if (/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/.test(body)) {
    return { ok: false, error: "That comment has a character this page cannot keep." };
  }
  return { ok: true, body };
}

export function blogCommentName(name: string | null | undefined): string {
  const clean = (name ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return clean || "Classmate";
}
