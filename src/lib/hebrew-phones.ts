/** Phoneme / syllable-cluster timing for Biblical Hebrew follow-along.

Niqqud is the best forced-align signal we have without a speech model:
shewa is short, tsere is long, letter-count treated them as equal.
*/
const CONS = /[\u05D0-\u05EA]/;
const SHEVA = "\u05B0";
const HATEF = new Set(["\u05B1", "\u05B2", "\u05B3"]);
const SHORT = new Set(["\u05B4", "\u05B6", "\u05B7", "\u05BB", "\u05C7"]);
const LONG = new Set(["\u05B5", "\u05B8", "\u05B9", "\u05BA"]);
const DAGESH = "\u05BC";
const METEG = "\u05BD";
const MATRES = new Set(["א", "ה", "ו", "י"]);
const VOWELS = new Set([SHEVA, ...HATEF, ...SHORT, ...LONG]);

export type PhoneCluster = { glyph: string; weight: number; vowel: boolean };

export function hebrewClusters(word: string): PhoneCluster[] {
  const chars = [...word.normalize("NFC")];
  type Raw = { glyph: string; cons: string; vowels: string[]; dagesh: boolean; marks: string };
  const raw: Raw[] = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i]!;
    if (!CONS.test(ch)) {
      i += 1;
      continue;
    }
    i += 1;
    const marks: string[] = [];
    while (i < chars.length && !CONS.test(chars[i]!)) {
      marks.push(chars[i]!);
      i += 1;
    }
    raw.push({
      glyph: ch + marks.join(""),
      cons: ch,
      vowels: marks.filter((m) => VOWELS.has(m)),
      dagesh: marks.includes(DAGESH),
      marks: marks.join(""),
    });
  }
  const out: PhoneCluster[] = [];
  for (let n = 0; n < raw.length; n++) {
    const c = raw[n]!;
    const prev = out.at(-1);
    const shureq = c.cons === "ו" && c.dagesh && c.vowels.length === 0;
    const holemVav = c.cons === "ו" && c.vowels.some((v) => LONG.has(v)) && c.vowels.length === 1;
    if (c.vowels.length === 0 && !shureq) {
      if (prev) {
        prev.glyph += c.glyph;
        prev.weight += MATRES.has(c.cons) ? 0.08 : 0.28;
      } else {
        out.push({ glyph: c.glyph, weight: 0.34, vowel: false });
      }
      continue;
    }
    let w = 0.34;
    if (shureq) w = 1.18;
    else if (holemVav) w = 1.28;
    else {
      const v = c.vowels[0]!;
      if (v === SHEVA) {
        const prevShort = n > 0 && raw[n - 1]!.vowels.some((x) => SHORT.has(x) || x === SHEVA);
        w += prevShort && n > 0 ? 0 : 0.42;
      } else if (HATEF.has(v)) w += 0.52;
      else if (SHORT.has(v)) w += 0.88;
      else if (LONG.has(v)) w += 1.22 + (c.marks.includes(METEG) ? 0.12 : 0);
    }
    if (c.dagesh && !shureq) w += MATRES.has(c.cons) ? 0.08 : 0.22;
    out.push({ glyph: c.glyph, weight: Math.max(0.12, w), vowel: true });
  }
  return out.length ? out : [{ glyph: word, weight: 1, vowel: false }];
}

export function clusterWeight(word: string): number {
  return hebrewClusters(word).reduce((s, c) => s + c.weight, 0);
}

/** Cluster index inside a word window [t0, t1). */
export function clusterAtTime(word: string, t0: number, t1: number, time: number): number {
  const parts = hebrewClusters(word);
  if (parts.length <= 1) return 0;
  const span = Math.max(0.08, t1 - t0);
  const total = parts.reduce((s, p) => s + p.weight, 0) || 1;
  let acc = t0;
  let idx = 0;
  for (let i = 0; i < parts.length; i++) {
    const end = i === parts.length - 1 ? t1 : acc + (parts[i]!.weight / total) * span;
    if (time + 0.02 >= acc) idx = i;
    if (time + 0.02 < end) break;
    acc = end;
  }
  return idx;
}
