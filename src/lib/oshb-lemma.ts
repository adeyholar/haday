/** Open Scriptures lemma codes on a Reading Lab word. Pure: no fetch. */

export const OSHB_PREFIX: Record<string, string> = {
  b: "in",
  c: "and",
  d: "the",
  i: "question",
  k: "like",
  l: "to",
  m: "from",
  s: "which",
};

export type OshbPart = { strong: string; aug: string | null };

export type OshbLemma = { prefixes: string[]; parts: OshbPart[] };

const PART = /^(\d+)(?:\s+([a-z]))?$/;
const PREFIX = /^[a-z]$/;

/** A single letter is a prefix. A number, with an optional augment, is a Strong's part. */
export function parseOshbLemma(code: string): OshbLemma {
  const raw = code.trim();
  if (!raw) return { prefixes: [], parts: [] };
  const prefixes: string[] = [];
  const parts: OshbPart[] = [];
  for (const segment of raw.split("/")) {
    const piece = segment.trim();
    if (!piece) continue;
    const part = PART.exec(piece);
    if (part) {
      parts.push({ strong: `H${part[1]}`, aug: part[2] ?? null });
      continue;
    }
    if (PREFIX.test(piece)) prefixes.push(piece);
  }
  return { prefixes, parts };
}

export function prefixLabel(letter: string): string {
  return OSHB_PREFIX[letter] ?? letter;
}
