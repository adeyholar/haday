import { foldFinals, lettersOnly, stripNiqqud } from "@/lib/hebrew";
import { shuffle } from "@/lib/vocab";

export type FormMcKind = "choose" | "hard";

const LOOK: [string, string][] = [
  ["ב", "כ"],
  ["כ", "פ"],
  ["ב", "פ"],
  ["ד", "ר"],
  ["ה", "ח"],
  ["ו", "ז"],
  ["ס", "ם"],
  ["ע", "א"],
  ["ש", "ס"],
];

const FINAL_TO_REG: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
const REG_TO_FINAL: Record<string, string> = { כ: "ך", מ: "ם", נ: "ן", פ: "ף", צ: "ץ" };

const NIKKUD_SWAPS: [string, string][] = [
  ["\u05B8", "\u05B7"],
  ["\u05B5", "\u05B6"],
  ["\u05B4", "\u05B5"],
  ["\u05B9", "\u05B8"],
  ["\u05BB", "\u05B9"],
  ["\u05B0", "\u05B7"],
];

function uniqueForms(correct: string, forms: string[]): string[] {
  const seen = new Set([correct]);
  const out: string[] = [];
  for (const f of forms) {
    if (!f || seen.has(f)) continue;
    seen.add(f);
    out.push(f);
  }
  return out;
}

/** Confusable Hebrew: ב/כ/פ, ד/ר, finals, wrong nikkud, near neighbors. */
export function hardTraps(correct: string): string[] {
  const traps: string[] = [];
  const chars = [...correct];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    for (const [a, b] of LOOK) {
      if (ch === a) {
        const next = [...chars];
        next[i] = b;
        traps.push(next.join(""));
      }
      if (ch === b) {
        const next = [...chars];
        next[i] = a;
        traps.push(next.join(""));
      }
    }
    if (FINAL_TO_REG[ch]) {
      const next = [...chars];
      next[i] = FINAL_TO_REG[ch]!;
      traps.push(next.join(""));
    }
    if (REG_TO_FINAL[ch]) {
      const next = [...chars];
      next[i] = REG_TO_FINAL[ch]!;
      traps.push(next.join(""));
    }
  }
  for (const [a, b] of NIKKUD_SWAPS) {
    if (correct.includes(a)) traps.push(correct.replace(a, b));
    if (correct.includes(b)) traps.push(correct.replace(b, a));
  }
  return uniqueForms(correct, traps);
}

function neighborScore(correct: string, other: string): number {
  let s = 0;
  const a = lettersOnly(correct);
  const b = lettersOnly(other);
  if (!b || b === a) return -1;
  if (Math.abs(a.length - b.length) <= 1) s += 4;
  if (a[0] && a[0] === b[0]) s += 5;
  if (foldFinals(a) === foldFinals(b)) s += 18;
  const stripped = stripNiqqud(correct);
  if (stripNiqqud(other) === stripped && other !== correct) s += 22;
  for (const [x, y] of LOOK) {
    if (a.includes(x) && b.includes(y)) s += 12;
    if (a.includes(y) && b.includes(x)) s += 12;
  }
  return s;
}

/**
 * Four Hebrew forms. Prompt stays English; student picks the Hebrew.
 * choose = same-pool neighbors. hard = lookalikes + nikkud/final traps first.
 */
export function hebrewFormChoices(correct: string, pool: string[], kind: FormMcKind, n = 4): string[] {
  const need = Math.max(1, n - 1);
  const neighbors = uniqueForms(
    correct,
    [...pool].sort((a, b) => neighborScore(correct, b) - neighborScore(correct, a)),
  );
  const traps = kind === "hard" ? hardTraps(correct) : [];
  const distractors: string[] = [];
  const source = kind === "hard" ? [...traps, ...neighbors] : neighbors;
  for (const f of source) {
    if (distractors.length >= need) break;
    distractors.push(f);
  }
  if (distractors.length < need) {
    for (const f of uniqueForms(correct, [...traps, ...pool, ...hardTraps(correct)])) {
      if (distractors.length >= need) break;
      if (!distractors.includes(f)) distractors.push(f);
    }
  }
  return shuffle([correct, ...distractors.slice(0, need)]);
}
