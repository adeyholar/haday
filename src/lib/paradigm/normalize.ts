/* eslint-disable no-misleading-character-class -- Hebrew combining marks, same classes as hebrew.ts */
import { canonMarks, foldBareShin, foldJerusalem, foldShureq, matchClusters } from "@/lib/hebrew";

/**
 * Strict paradigm spelling. Same folds as vocab, but classroom ole stays.
 * Meteg stays only when a strong-root grade asks for it. Vocab spelling
 * must keep using normalizeHebrewFull, which strips both.
 */
export function normalizeParadigm(s: string, options?: { meteg?: boolean }): string {
  const keepMeteg = options?.meteg === true;
  const stripped = keepMeteg
    ? /[\u0591-\u05AA\u05AC-\u05AF\u05BF\u05C0\u05C3-\u05C5\u05C6\u05C7]/g
    : /[\u0591-\u05AA\u05AC-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C5\u05C6\u05C7]/g;
  const kept = keepMeteg
    ? /[^\u05D0-\u05EA\u05AB\u05BD\u05B0-\u05BC\u05C1\u05C2]/g
    : /[^\u05D0-\u05EA\u05AB\u05B0-\u05BC\u05C1\u05C2]/g;
  return foldJerusalem(
    canonMarks(
      foldBareShin(
        foldShureq(
          s
            .normalize("NFC")
            .replace(stripped, "")
            .replace(/[\u05F3\u05F4\u05BE]/g, "")
            .replace(/[־–—]/g, "")
            .replace(/\s+/g, ""),
        ).replace(kept, ""),
      ),
    ),
  );
}

/** Same walk as a vocab word, but a missing accent stays “right so far,” not “wrong.” An accent on the wrong letter is wrong at once. */
export function liveMatchParadigm(expected: string, typed: string): "empty" | "prefix" | "exact" | "off" {
  const want = normalizeParadigm(expected);
  const got = normalizeParadigm(typed);
  const body = matchClusters(want.replaceAll("\u05AB", ""), got.replaceAll("\u05AB", ""));
  if (body === "off" || body === "empty") return body;
  const wantAt = oleAt(want);
  const gotAt = oleAt(got);
  if (gotAt.some((place) => !wantAt.includes(place))) return "off";
  if (body === "prefix") return "prefix";
  return wantAt.some((place) => !gotAt.includes(place)) ? "prefix" : "exact";
}

function oleAt(s: string): number[] {
  const cons = /[\u05D0-\u05EA]/;
  const at: number[] = [];
  let letter = -1;
  for (const ch of s) {
    if (cons.test(ch)) letter += 1;
    else if (ch === "\u05AB" && letter >= 0) at.push(letter);
  }
  return at;
}

/** Vowels are in. The accent is the only piece still open. */
export function accentStillOpen(expected: string, typed: string): boolean {
  const want = normalizeParadigm(expected);
  const got = normalizeParadigm(typed);
  return want.includes("\u05AB") && !got.includes("\u05AB") && want.replaceAll("\u05AB", "") === got;
}
