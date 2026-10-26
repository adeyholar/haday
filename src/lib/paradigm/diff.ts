import { buildForm, expectedThird, FORMS, needsTone, type PgnKey } from "@/lib/qal-perfect-builder";
import { normalizeParadigm } from "@/lib/paradigm/normalize";

const STRONG = { c: "קטל", gloss: "kill", lvl: 1 as const };

export function strongPerfect(pgn: string): string {
  const form = FORMS.find((row) => row.k === pgn);
  if (!form) return "";
  return (
    buildForm(
      STRONG,
      {
        v1: form.v1,
        v2: form.v2,
        v3: expectedThird(STRONG, form),
        end: form.end,
        merge: false,
        tone: needsTone(form.k),
      },
      form.k as PgnKey,
    ) ?? ""
  );
}

export type DiffPiece = { ch: string; changed: boolean };

/** Marks on the weak form that are not in the strong form. */
export function highlightWeak(pgn: string, weak: string): DiffPiece[] {
  const left = [...normalizeParadigm(strongPerfect(pgn))];
  const right = [...normalizeParadigm(weak)];
  const matched = lcs(left, right);
  let at = 0;
  return right.map((ch) => {
    if (matched[at] === ch) {
      at += 1;
      return { ch, changed: false };
    }
    return { ch, changed: true };
  });
}

function lcs(left: string[], right: string[]): string[] {
  const rows = Array.from({ length: left.length + 1 }, () => new Array<number>(right.length + 1).fill(0));
  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      rows[i][j] =
        left[i - 1] === right[j - 1] ? rows[i - 1][j - 1] + 1 : Math.max(rows[i - 1][j], rows[i][j - 1]);
    }
  }
  const out: string[] = [];
  let i = left.length;
  let j = right.length;
  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      out.push(left[i - 1]);
      i -= 1;
      j -= 1;
    } else if (rows[i - 1][j] >= rows[i][j - 1]) i -= 1;
    else j -= 1;
  }
  return out.reverse();
}
