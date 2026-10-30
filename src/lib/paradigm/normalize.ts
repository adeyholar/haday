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

const OLE = "\u05AB";
const DAGESH = "\u05BC";
const CONS = /[\u05D0-\u05EA]/;
const FULL_VOWEL = /[\u05B1-\u05BB]/;
const BEGAD = new Set(["ב", "ג", "ד", "כ", "פ", "ת", "ך", "ף"]);

type Cluster = { letter: string; marks: string[] };

function clustersOf(s: string): Cluster[] {
  const chars = [...s];
  const out: Cluster[] = [];
  let i = 0;
  while (i < chars.length) {
    if (!CONS.test(chars[i])) {
      i += 1;
      continue;
    }
    const letter = chars[i];
    i += 1;
    const marks: string[] = [];
    while (i < chars.length && !CONS.test(chars[i])) {
      marks.push(chars[i]);
      i += 1;
    }
    out.push({ letter, marks });
  }
  return out;
}

/** A dagesh lene the signed form does not write is not a miss. Forte, and a lene the form already has, still count. */
export function dropExtraLene(want: string, got: string): string {
  const wc = clustersOf(want);
  const gc = clustersOf(got);
  let out = "";
  for (let i = 0; i < gc.length; i++) {
    const g = gc[i];
    const w = wc[i];
    let marks = g.marks;
    const prev = i > 0 ? gc[i - 1] : undefined;
    const lene = BEGAD.has(g.letter) && !(prev && FULL_VOWEL.test(prev.marks.join("")));
    if (lene && w && g.letter === w.letter && marks.includes(DAGESH) && !w.marks.includes(DAGESH)) {
      marks = marks.filter((mark) => mark !== DAGESH);
    }
    out += g.letter + marks.join("");
  }
  return out;
}

/** Same walk as a vocab word, but a missing accent stays “right so far,” not “wrong.” An accent on the wrong letter is wrong at once. */
export function liveMatchParadigm(expected: string, typed: string): "empty" | "prefix" | "exact" | "off" {
  const want = normalizeParadigm(expected);
  const got = dropExtraLene(want, normalizeParadigm(typed));
  const body = matchClusters(want.replaceAll(OLE, ""), got.replaceAll(OLE, ""));
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
  const got = dropExtraLene(want, normalizeParadigm(typed));
  return want.includes(OLE) && !got.includes(OLE) && want.replaceAll(OLE, "") === got.replaceAll(OLE, "");
}
