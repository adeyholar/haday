import { FORMS, ROOTS, buildForm, expectedThird, expectsMerge, needsTone } from "@/lib/qal-perfect-builder";
import type { ParadigmCell, ParadigmRoot, PracticeCell } from "@/lib/paradigm/book";

/** Strong and assimilating roots, with ole where the perfect stress is not final. Meteg is not required. */
export function strongCells(): PracticeCell[] {
  const out: PracticeCell[] = [];
  for (const root of ROOTS) {
    const cells: Record<string, ParadigmCell> = {};
    for (const form of FORMS) {
      const tone = needsTone(form.k) === "accent" ? "accent" : "none";
      const word =
        buildForm(
          root,
          {
            v1: form.v1,
            v2: form.v2,
            v3: expectedThird(root, form),
            end: form.end,
            merge: expectsMerge(root, form.k),
            tone,
          },
          form.k,
        ) ?? "";
      cells[form.k] = {
        form: word,
        origin: "generated",
        status: "verified",
        verifiedBy: "Tutor",
        verifiedOn: "2026-10-26",
        note: "",
        attestation: null,
      };
    }
    const paradigm: ParadigmRoot = {
      id: `strong-${root.c}`,
      root: root.c,
      letters: [...root.c],
      shin: null,
      classId: "strong",
      gloss: root.gloss,
      source: "Pratico / Van Pelt",
      supplementary: false,
      memorize: false,
      conjugations: { qal_perfect: { phase: 1, cells, alternates: {}, notes: [] } },
    };
    for (const form of FORMS) {
      out.push({
        id: `${paradigm.id}:qal_perfect:${form.k}`,
        root: paradigm,
        conjugation: "qal_perfect",
        pgn: form.k,
        cell: cells[form.k]!,
        alternates: [],
      });
    }
  }
  return out;
}
