const HIDDEN = new Set(["__noidea__", "__miss__", "__nudge__"]);

/** What to print once a card is marked. Try again is not a mark, so it gets nothing. */
export function markedLines(
  ok: boolean,
  given: string | null | undefined,
  answer: string,
): { wrote?: string; answer: string } {
  const right = answer.trim();
  const raw = given?.trim() ?? "";
  const wrote = !ok && raw && !HIDDEN.has(raw) ? raw : undefined;
  return { wrote, answer: right };
}
