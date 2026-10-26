/* eslint-disable no-misleading-character-class -- Hebrew combining marks, same classes as hebrew.ts */
import { foldShureq } from "@/lib/hebrew";

/**
 * Strict paradigm spelling. Same folds as vocab, but the classroom stress
 * mark stays. Vocab spelling must keep using normalizeHebrewFull, which
 * strips ole so a typed מֶלֶךְ still matches a stressed lemma.
 */
export function normalizeParadigm(s: string): string {
  return foldJerusalem(
    canonMarks(
      foldBareShin(
        foldShureq(
          s
            .normalize("NFC")
            .replace(/[\u0591-\u05AA\u05AC-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C5\u05C6\u05C7]/g, "")
            .replace(/[\u05F3\u05F4\u05BE]/g, "")
            .replace(/[־–—]/g, "")
            .replace(/\s+/g, ""),
        ).replace(/[^\u05D0-\u05EA\u05AB\u05B0-\u05BC\u05C1\u05C2]/g, ""),
      ),
    ),
  );
}

function foldJerusalem(s: string): string {
  return s.replace(
    /(\u05D9\u05B0\u05E8\u05BB\u05E9[\u05B0-\u05C2]*\u05DC)[\u05B4\u05B7\u05B8]*(\u05D9\u05B4?)?\u05DD\u05B4?/g,
    "$1\u05B7\u05DD",
  );
}

function foldBareShin(s: string): string {
  const cons = /[\u05D0-\u05EA]/;
  const chars = [...s];
  let out = "";
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch !== "ש") {
      out += ch;
      i += 1;
      continue;
    }
    i += 1;
    const marks: string[] = [];
    while (i < chars.length && !cons.test(chars[i])) {
      marks.push(chars[i]);
      i += 1;
    }
    if (!marks.includes("\u05C1") && !marks.includes("\u05C2")) marks.push("\u05C1");
    out += ch + marks.join("");
  }
  return out;
}

function canonMarks(s: string): string {
  const cons = /[\u05D0-\u05EA]/;
  const chars = [...s];
  let out = "";
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (!cons.test(ch)) {
      out += ch;
      i += 1;
      continue;
    }
    i += 1;
    const marks: string[] = [];
    while (i < chars.length && !cons.test(chars[i])) {
      marks.push(chars[i]);
      i += 1;
    }
    marks.sort();
    out += ch + marks.join("");
  }
  return out;
}
