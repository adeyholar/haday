/** Open Scriptures lemma codes on a Reading Lab word. Pure: no fetch. */

export const OSHB_PREFIX: Record<string, string> = {
  b: "in",
  c: "and",
  d: "the",
  i: "question",
  k: "like",
  l: "to",
  m: "from",
  s: "that",
};

/** The consonant only. The vowel changes on the word (וַ, הָ, בַּ, מֵ), so a fixed vowel would contradict it. */
export const OSHB_PREFIX_MARK: Record<string, string> = {
  b: "ב",
  c: "ו",
  d: "ה",
  i: "ה",
  k: "כ",
  l: "ל",
  m: "מ",
  s: "ש",
};

export type OshbPart = { strong: string; aug: string | null };

export type OshbLemma = { prefixes: string[]; parts: OshbPart[] };

const PART = /^(\d+)(?:\s+([a-z]))?(\+)?$/;
const PREFIX = /^[bcdiklms]$/;

/** A known prefix letter, or a Strong's number. A trailing + on a name is kept as that number. */
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

export function prefixChip(letter: string): string {
  const mark = OSHB_PREFIX_MARK[letter];
  const name = OSHB_PREFIX[letter];
  if (mark && name) return `${mark} ${name}`;
  return name ?? letter;
}
