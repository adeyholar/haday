import schoolFile from "../../../data/paradigms/school-paradigm.json";
import scriptureFile from "../../../data/paradigms/scripture-examples.json";

export type SchoolStatus =
  | "transcribed"
  | "shaded-like-strong"
  | "blank"
  | "dash-no-form"
  | "footnote-box-area";

export type SchoolCell = {
  id: string;
  page: number;
  verbClass: string;
  binyan: string;
  conjugation: string;
  pgn: string;
  form: string | null;
  forms: string[];
  status: SchoolStatus;
  root?: string;
};

export type SchoolNote = { page: number; marker: string; text: string };

export type SchoolPage = { page: number; verbClass: string; title: string; roots: string[] };

export type ScriptureExample = {
  ref: string;
  osis: string;
  wordIndex: number;
  word: string;
};

export type ScriptureCell = {
  id: string;
  examples: ScriptureExample[];
  flag?: string;
};

type SchoolFile = { pages: SchoolPage[]; notes: SchoolNote[]; cells: SchoolCell[] };
type ScriptureFile = { cells: ScriptureCell[] };

const school = schoolFile as SchoolFile;
const scripture = scriptureFile as ScriptureFile;

const scriptureById = new Map(scripture.cells.map((cell) => [cell.id, cell]));

export function schoolPages(): SchoolPage[] {
  return school.pages;
}

export function schoolNotes(page: number): SchoolNote[] {
  return school.notes.filter((note) => note.page === page);
}

export function schoolCells(page: number): SchoolCell[] {
  return school.cells.filter((cell) => cell.page === page);
}

/** Strings the School view may render for this cell. All of them come from the file. */
export function schoolShownForms(cell: SchoolCell): string[] {
  if (cell.status === "dash-no-form" && cell.form) return [cell.form];
  if (cell.status !== "transcribed") return [];
  if (cell.forms.length) return cell.forms;
  return cell.form ? [cell.form] : [];
}

export function rowKey(cell: SchoolCell): string {
  const mark = cell.id.includes("#") ? cell.id.slice(cell.id.indexOf("#")) : "";
  return `${cell.conjugation}|${cell.pgn}|${mark}`;
}

export function rowLabel(cell: SchoolCell): string {
  if (cell.pgn === "-") return cell.conjugation;
  return `${cell.conjugation} ${cell.pgn}`;
}

export type SchoolTable = {
  binyanim: string[];
  rows: { key: string; label: string; byBinyan: Record<string, SchoolCell | undefined> }[];
};

export function schoolTable(page: number): SchoolTable {
  const cells = schoolCells(page);
  const binyanim: string[] = [];
  const rows: SchoolTable["rows"] = [];
  const rowAt = new Map<string, SchoolTable["rows"][number]>();
  for (const cell of cells) {
    if (!binyanim.includes(cell.binyan)) binyanim.push(cell.binyan);
    const key = rowKey(cell);
    let row = rowAt.get(key);
    if (!row) {
      row = { key, label: rowLabel(cell), byBinyan: {} };
      rowAt.set(key, row);
      rows.push(row);
    }
    row.byBinyan[cell.binyan] = cell;
  }
  return { binyanim, rows };
}

export function scriptureCell(id: string): ScriptureCell | undefined {
  return scriptureById.get(id);
}

export function scriptureExamples(id: string): ScriptureExample[] {
  return (scriptureById.get(id)?.examples ?? []).slice(0, 5);
}
