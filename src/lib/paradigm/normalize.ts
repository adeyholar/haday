/* eslint-disable no-misleading-character-class -- Hebrew combining marks, same classes as hebrew.ts */
import { canonMarks, foldBareShin, foldJerusalem, foldShureq } from "@/lib/hebrew";

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
