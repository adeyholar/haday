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
  position?: { index: number; of: number; order: string } | null;
  schoolMarks?: string[];
  mergedRows?: string[];
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

/** One conjugation+PGN slot. The #1 / #2 suffix is a split inside that slot, not a new row. */
export function slotKey(cell: SchoolCell): string {
  return `${cell.conjugation}|${cell.pgn}`;
}

export function rowLabel(cell: SchoolCell): string {
  if (cell.pgn === "-") return cell.conjugation;
  return `${cell.conjugation} ${cell.pgn}`;
}

/** The * or ** printed next to a form. The full note stays in the list under the table. */
export function schoolMark(cell: SchoolCell): string {
  const raw = cell.schoolMarks?.[0] ?? "";
  if (raw.startsWith("**")) return "**";
  if (raw.startsWith("*")) return "*";
  return "";
}

function mergeKey(rows: string[]): string {
  return `M:${rows.join("+")}`;
}

function labelForKey(key: string, cell: SchoolCell): string {
  if (!key.startsWith("M:")) return rowLabel(cell);
  return key
    .slice(2)
    .split("+")
    .map((slot) => {
      const [conjugation, pgn] = slot.split(":");
      if (!pgn || pgn === "-") return conjugation ?? slot;
      return `${conjugation} ${pgn}`;
    })
    .join(" / ");
}

export type SchoolTable = {
  binyanim: string[];
  rows: { key: string; label: string; byBinyan: Record<string, SchoolCell[]> }[];
};

export function schoolTable(page: number): SchoolTable {
  const cells = schoolCells(page);
  const groupForSlot = new Map<string, string>();
  for (const cell of cells) {
    if (!cell.mergedRows?.length) continue;
    const key = mergeKey(cell.mergedRows);
    for (const slot of cell.mergedRows) groupForSlot.set(slot, key);
  }
  const binyanim: string[] = [];
  const rows: SchoolTable["rows"] = [];
  const rowAt = new Map<string, SchoolTable["rows"][number]>();
  for (const cell of cells) {
    if (!binyanim.includes(cell.binyan)) binyanim.push(cell.binyan);
    const slot = `${cell.conjugation}:${cell.pgn}`;
    const key = groupForSlot.get(slot) ?? slotKey(cell);
    let row = rowAt.get(key);
    if (!row) {
      row = { key, label: labelForKey(key, cell), byBinyan: {} };
      rowAt.set(key, row);
      rows.push(row);
    }
    const list = row.byBinyan[cell.binyan] ?? [];
    list.push(cell);
    row.byBinyan[cell.binyan] = list;
  }
  for (const row of rows) {
    for (const list of Object.values(row.byBinyan)) {
      list.sort((a, b) => (a.position?.index ?? 0) - (b.position?.index ?? 0));
    }
  }
  return { binyanim, rows };
}

export function scriptureCell(id: string): ScriptureCell | undefined {
  return scriptureById.get(id);
}

export function scriptureExamples(id: string): ScriptureExample[] {
  return (scriptureById.get(id)?.examples ?? []).slice(0, 5);
}
