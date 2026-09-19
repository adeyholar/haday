export const TYPE_PASS = 95;

export function units(s: string): string[] {
  return [...s.normalize("NFC")];
}

export function nextExpected(target: string, typed: string): string | null {
  const t = units(target);
  const g = units(typed);
  return t[g.length] ?? null;
}

export function isComplete(target: string, typed: string): boolean {
  return units(typed).join("") === units(target).join("");
}

export type KeyResult = { typed: string; hit: boolean; done: boolean };

export function applyTypeKey(target: string, typed: string, key: string): KeyResult {
  if (key === "Backspace") {
    const g = units(typed);
    g.pop();
    return { typed: g.join(""), hit: true, done: false };
  }
  const expect = nextExpected(target, typed);
  if (!expect) return { typed, hit: false, done: true };
  if (key === expect) {
    const next = typed + key;
    return { typed: next, hit: true, done: isComplete(target, next) };
  }
  return { typed, hit: false, done: false };
}

export function accuracyPct(hits: number, misses: number): number {
  const n = hits + misses;
  if (n <= 0) return 100;
  return Math.round((hits / n) * 100);
}

/** Vanity only. Five correct keys ≈ one “word”. */
export function wpmFrom(hits: number, ms: number): number {
  if (ms <= 0 || hits <= 0) return 0;
  const minutes = ms / 60000;
  return Math.round((hits / 5 / minutes) * 10) / 10;
}

export function passedBatch(pct: number): boolean {
  return pct >= TYPE_PASS;
}

import { CUE_NOT_YET, CUE_TRY_AGAIN, feedbackForWrong, feedbackLabel } from "@/lib/try-again";

export { CUE_NOT_YET, CUE_TRY_AGAIN };

/** Word-level miss ladder: first wrong = Try again (not weak). Second = Not yet + weak. */
export type MissCue = "retry" | "fail";
export type Strength = "strong" | "ok" | "weak";

export function missCueFor(wordMissesBefore: number): MissCue {
  return feedbackForWrong(wordMissesBefore);
}

export function missCueLabel(cue: MissCue): string {
  return feedbackLabel(cue);
}

export function strengthFromMisses(wordMisses: number): Strength {
  if (wordMisses <= 0) return "strong";
  if (wordMisses >= 2) return "weak";
  return "ok";
}
