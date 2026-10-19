/** Pointed letters for the Verbal System. Letter, then shin/sin, then dagesh, then vowel. */

export const DAG = "\u05BC";
export const SHIN = "\u05C1";
export const SIN = "\u05C2";

export const V = {
  shewa: "\u05B0",
  hatefS: "\u05B1",
  hatef: "\u05B2",
  hatefQ: "\u05B3",
  hireq: "\u05B4",
  tsere: "\u05B5",
  segol: "\u05B6",
  patah: "\u05B7",
  qamets: "\u05B8",
  holem: "\u05B9",
  qibbuts: "\u05BB",
} as const;

export type VowelId = keyof typeof V;

const FINAL: Record<string, string> = { כ: "ך", מ: "ם", נ: "ן", פ: "ף", צ: "ץ" };
const MEDIAL: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

export const BGDKPT = new Set(["ב", "ג", "ד", "כ", "פ", "ת"]);
export const HATEF_LETTER = new Set(["א", "ה", "ח", "ע"]);
export const NO_FORTE = new Set(["א", "ה", "ח", "ע", "ר"]);
const SIBILANT = new Set(["ש", "ס", "צ", "ז"]);
const DENTAL = new Set(["ד", "ט", "ת"]);

export type Dot = "" | "shin" | "sin";

export function medial(ch: string): string {
  return MEDIAL[ch] ?? ch;
}

export function mark(ch: string, vowel = "", dagesh = false, dot: Dot = "", asFinal = false): string {
  const med = medial(ch);
  const base = asFinal ? (FINAL[med] ?? med) : med;
  const point = dot === "shin" ? SHIN : dot === "sin" ? SIN : "";
  return base + point + (dagesh ? DAG : "") + vowel;
}

export function lene(ch: string, afterVowel: boolean): boolean {
  return BGDKPT.has(medial(ch)) && !afterVowel;
}

export function canForte(ch: string): boolean {
  return !NO_FORTE.has(medial(ch));
}

export function isSibilant(ch: string): boolean {
  return SIBILANT.has(medial(ch));
}

export function isDental(ch: string): boolean {
  return DENTAL.has(medial(ch));
}

export const SHUREQ = "ו" + DAG;
export const HOLAM_VAV = "ו" + V.holem;
/** Classroom stress mark. It is not a verse accent from the Tanakh. */
export const OLE = "\u05AB";
/** Keeps a qamets long before a reduced vowel. */
export const METEG = "\u05BD";

export function withTone(word: string, tone: "accent" | "meteg" | "none" | ""): string {
  if (tone !== "accent" && tone !== "meteg") return word;
  const mark = tone === "accent" ? OLE : METEG;
  const at = tone === "accent" ? 1 : 0;
  const parts: string[] = [];
  for (const ch of word) {
    const cp = ch.codePointAt(0) ?? 0;
    if ((cp >= 0x05d0 && cp <= 0x05ea) || parts.length === 0) parts.push(ch);
    else parts[parts.length - 1] += ch;
  }
  if (!parts[at] || [...parts[at]].includes(mark)) return parts.join("");
  parts[at] += mark;
  return parts.join("");
}
