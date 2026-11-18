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

export type SchoolPlace =
  | { kind: "cells"; cells: SchoolCell[] }
  | { kind: "span"; cells: SchoolCell[]; rowSpan: number }
  | { kind: "covered" };

export type SchoolTable = {
  binyanim: string[];
  rows: { key: string; label: string; byBinyan: Record<string, SchoolPlace> }[];
};

function rowKeyFromMergedSlot(slot: string): string {
  const [conjugation, pgn] = slot.split(":");
  return `${conjugation}|${pgn ?? "-"}`;
}

export function schoolTable(page: number): SchoolTable {
  const cells = schoolCells(page);
  const binyanim: string[] = [];
  const order: string[] = [];
  const rowAt = new Map<string, SchoolTable["rows"][number]>();
  const groups = new Map<string, SchoolCell[]>();

  for (const cell of cells) {
    if (!binyanim.includes(cell.binyan)) binyanim.push(cell.binyan);
    const key = slotKey(cell);
    let row = rowAt.get(key);
    if (!row) {
      row = { key, label: rowLabel(cell), byBinyan: {} };
      rowAt.set(key, row);
      order.push(key);
    }
    if (cell.mergedRows?.length) {
      const group = `${cell.binyan}|${cell.mergedRows.join("+")}`;
      const list = groups.get(group) ?? [];
      list.push(cell);
      groups.set(group, list);
      continue;
    }
    const place = row.byBinyan[cell.binyan];
    const stack = place?.kind === "cells" ? place.cells : [];
    stack.push(cell);
    row.byBinyan[cell.binyan] = { kind: "cells", cells: stack };
  }

  for (const list of groups.values()) {
    const covered = list[0]?.mergedRows ?? [];
    const keys = covered.map(rowKeyFromMergedSlot).filter((key) => rowAt.has(key));
    keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const anchorKey = keys[0];
    const anchor = anchorKey ? rowAt.get(anchorKey) : undefined;
    const binyan = list[0]?.binyan;
    if (!anchor || !binyan || !keys.length) continue;
    anchor.byBinyan[binyan] = { kind: "span", cells: [list[0]], rowSpan: covered.length };
    for (const key of keys.slice(1)) {
      const row = rowAt.get(key);
      if (row) row.byBinyan[binyan] = { kind: "covered" };
    }
  }

  for (const row of rowAt.values()) {
    for (const place of Object.values(row.byBinyan)) {
      if (place.kind === "cells") {
        place.cells.sort((a, b) => (a.position?.index ?? 0) - (b.position?.index ?? 0));
      }
    }
  }

  return { binyanim, rows: order.map((key) => rowAt.get(key)).filter((row): row is SchoolTable["rows"][number] => Boolean(row)) };
}

export function scriptureCell(id: string): ScriptureCell | undefined {
  return scriptureById.get(id);
}

export function scriptureExamples(id: string): ScriptureExample[] {
  return (scriptureById.get(id)?.examples ?? []).slice(0, 5);
}
