import { shownForms, type ShownForm } from "@/lib/paradigms/catalog";
import type { StrongCell } from "@/lib/paradigms/types";

export type CellView = {
  cellId: string;
  main: string;
  mainStandard: boolean;
  also: { form: string; standard: boolean; exampleWord?: string; exampleRef?: string }[];
  example: { word: string; ref: string } | null;
  /** English meaning. This table has none, so the view stays null. */
  gloss: string | null;
  translation: null;
};

function exampleOf(form: ShownForm): { word: string; ref: string } | null {
  if (!form.exampleWord || !form.exampleRef) return null;
  if (form.status !== "attested-example") return null;
  return { word: form.exampleWord, ref: form.exampleRef };
}

export function cellView(cell: StrongCell): CellView {
  const shown = shownForms(cell);
  return {
    cellId: cell.id,
    main: shown.main.form,
    mainStandard: shown.main.status === "paradigm-standard",
    also: shown.also.map((form) => ({
      form: form.form,
      standard: form.status === "paradigm-standard",
      exampleWord: form.exampleWord,
      exampleRef: form.exampleRef,
    })),
    example: exampleOf(shown.main),
    gloss: null,
    translation: null,
  };
}

/** Hebrew lines on the results screen. No English gloss and no grammatical label. */
export function resultsLines(rows: { theirs: string; right: string }[]): { theirs: string; right: string }[] {
  return rows.map((row) => ({ theirs: row.theirs, right: row.right }));
}
