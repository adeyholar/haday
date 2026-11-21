import { masteryCount } from "@/lib/paradigm/srs";
import { nfc } from "@/lib/paradigms/nfc";
import {
  CLASS_IDS,
  STANDARD_MARK,
  VERB_FILES,
  type ChartAlternate,
  type ChartCell,
  type ClassId,
  type WeakClassId,
} from "@/lib/verb-lab/data";
import {
  NO_FORM_SQUARES,
  STEM_IDS,
  columnLevel,
  columnSlug,
  isNoFormSquare,
  isStemId,
  parseSquareId,
  pgnRank,
  squareId,
  stemFace,
  type StemId,
  type VerbPath,
} from "@/lib/verb-lab/stems";

export type ChartRow = {
  key: string;
  pgn: string;
  form: string;
  status: string;
  exampleWord?: string;
  exampleRef?: string;
  displayMark?: string;
  parseEligible: boolean;
  subtype?: string;
  note?: string;
  alternates: ChartRow[];
};

export type SquareRecord = {
  id: string;
  stem: StemId;
  column: string;
  noForm: boolean;
  classes: ClassId[];
};

export type ExamDef = {
  id: string;
  /** Square ids, or "Qal.*" for every square of that stem. */
  covers: readonly string[];
  stems: readonly StemId[];
  title: (path: VerbPath) => string;
};

const squares = new Map<string, SquareRecord>();

function touch(id: string, classId: ClassId, noForm: boolean) {
  const parsed = parseSquareId(id);
  if (!parsed) return;
  const current = squares.get(id);
  if (!current) {
    squares.set(id, { id, stem: parsed.stem, column: parsed.column, noForm, classes: noForm ? [] : [classId] });
    return;
  }
  if (!noForm && !current.classes.includes(classId)) current.classes.push(classId);
  if (noForm) current.noForm = true;
}

for (const classId of CLASS_IDS) {
  const file = VERB_FILES[classId];
  for (const cell of file.cells) {
    if (!cell.form) continue;
    touch(squareId(cell.binyan, cell.conjugation), classId, false);
  }
  for (const slot of file.noFormSlots ?? []) {
    touch(squareId(slot.binyan, slot.conjugation), classId, true);
  }
}

for (const id of NO_FORM_SQUARES) touch(id, "strong", true);

function markOf(status: string, displayMark?: string): string | undefined {
  if (displayMark) return displayMark;
  if (status === "paradigm-standard") return STANDARD_MARK;
  return undefined;
}

function eligible(cell: { status: string; exampleWord?: string | null; parseEligible?: boolean }, classId: ClassId): boolean {
  if (typeof cell.parseEligible === "boolean") return cell.parseEligible;
  if (classId !== "strong") return false;
  return cell.status === "attested-example" && Boolean(cell.exampleWord);
}

function toRow(cell: ChartCell | ChartAlternate, classId: ClassId, key: string, subtype?: string, note?: string): ChartRow {
  const row: ChartRow = {
    key,
    pgn: "pgn" in cell ? cell.pgn : "",
    form: nfc(cell.form),
    status: cell.status,
    parseEligible: eligible(cell, classId),
    alternates: [],
  };
  if (cell.exampleWord) row.exampleWord = nfc(cell.exampleWord);
  if (cell.exampleRef) row.exampleRef = cell.exampleRef;
  const mark = markOf(cell.status, cell.displayMark);
  if (mark) row.displayMark = mark;
  if (subtype) row.subtype = subtype;
  if (note) row.note = note;
  return row;
}

export function chartRows(classId: ClassId, id: string): ChartRow[] {
  if (isNoFormSquare(id)) return [];
  const parsed = parseSquareId(id);
  if (!parsed) return [];
  const file = VERB_FILES[classId];
  const rows: ChartRow[] = [];
  for (const cell of file.cells) {
    if (cell.binyan !== parsed.stem || columnSlug(cell.conjugation) !== parsed.column || !cell.form) continue;
    const main = toRow(cell, classId, `${cell.id}:${cell.subtype ?? ""}`, cell.subtype, cell.note);
    main.alternates = (cell.alternates ?? []).filter((alt) => alt.form).map((alt, index) => toRow(alt, classId, `${cell.id}:alt:${index}`));
    rows.push(main);
  }
  rows.sort((a, b) => {
    const sub = (a.subtype ?? "").localeCompare(b.subtype ?? "");
    if (sub !== 0) return sub;
    return pgnRank(a.pgn) - pgnRank(b.pgn);
  });
  return rows;
}

export function allSquares(): SquareRecord[] {
  return [...squares.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function squareRecord(id: string): SquareRecord | undefined {
  return squares.get(id);
}

export function openSquares(classId: ClassId): SquareRecord[] {
  return allSquares().filter((square) => !square.noForm && square.classes.includes(classId) && chartRows(classId, square.id).length > 0);
}

export function classHasChart(classId: ClassId, id: string): boolean {
  return chartRows(classId, id).length > 0;
}

/** A paradigm-standard form is never a verse to parse. Attested examples are. */
export function verseRows(classId: ClassId, id: string): ChartRow[] {
  const out: ChartRow[] = [];
  for (const row of chartRows(classId, id)) {
    if (row.parseEligible && row.exampleWord) out.push(row);
    for (const alt of row.alternates) {
      if (alt.parseEligible && alt.exampleWord) out.push(alt);
    }
  }
  return out;
}

export function teachingCite(classId: ClassId): string {
  const file = VERB_FILES[classId];
  const head = file.cells.find((cell) => cell.binyan === "Qal" && cell.conjugation === "qatal" && cell.pgn === "3ms" && cell.form);
  return nfc(head?.form ?? file.root);
}

export function rootNote(classId: ClassId): string {
  return VERB_FILES[classId].rootNote ?? "";
}

export function columnNotes(classId: ClassId, column: string): string[] {
  const notes = VERB_FILES[classId].notes ?? {};
  const out: string[] = [];
  if (column === "qatal" && notes.weqatal) out.push(notes.weqatal);
  if ((column === "yiqtol" || column === "jussive") && notes.cohortative) out.push(notes.cohortative);
  if ((column === "yiqtol" || column === "jussive") && notes.jussive) out.push(notes.jussive);
  return out;
}

function stemTitle(path: VerbPath, stem: StemId): string {
  return stemFace(path, stem).en;
}

export const EXAMS: readonly ExamDef[] = [
  {
    id: "qal-perfect",
    covers: ["Qal.qatal"],
    stems: ["Qal"],
    title: (path) => `${stemTitle(path, "Qal")} perfect test`,
  },
  ...STEM_IDS.map(
    (stem): ExamDef => ({
      id: `stem-${stem.toLowerCase()}`,
      covers: [`${stem}.*`],
      stems: [stem],
      title: (path) => `${stemTitle(path, stem)} exam`,
    }),
  ),
  {
    id: "pair-hiphil-hophal",
    covers: ["Hiphil.*", "Hophal.*"],
    stems: ["Hiphil", "Hophal"],
    title: (path) => `${stemTitle(path, "Hiphil")} and ${stemTitle(path, "Hophal")} exam`,
  },
  {
    id: "pair-piel-pual",
    covers: ["Piel.*", "Pual.*"],
    stems: ["Piel", "Pual"],
    title: (path) => `${stemTitle(path, "Piel")} and ${stemTitle(path, "Pual")} exam`,
  },
];

export function examById(id: string): ExamDef | undefined {
  return EXAMS.find((exam) => exam.id === id);
}

export function examCovers(exam: ExamDef, id: string): boolean {
  const parsed = parseSquareId(id);
  if (!parsed) return false;
  return exam.covers.some((cover) => cover === id || (cover.endsWith(".*") && cover.slice(0, -2) === parsed.stem));
}

export function examsForStem(stem: StemId, classId: ClassId): ExamDef[] {
  if (classId !== "strong") return [];
  return EXAMS.filter((exam) => exam.stems.includes(stem));
}

export function examsForSquare(id: string, classId: ClassId): ExamDef[] {
  if (classId !== "strong" || isNoFormSquare(id)) return [];
  return EXAMS.filter((exam) => examCovers(exam, id));
}

export function coveredSquareIds(exam: ExamDef, classId: ClassId, path: VerbPath, taught: number): string[] {
  return openSquares(classId)
    .filter((square) => examCovers(exam, square.id) && taught >= columnLevel(square.stem, square.column, path))
    .map((square) => square.id);
}

/**
 * The paradigm practice book calls a card mastered at Leitner box 5
 * (`masteryCount` in src/lib/paradigm/srs.ts). That is "Ready for the exam".
 */
export function practiceIsStrong(box: number | undefined): boolean {
  return masteryCount(["square"], { square: { box: box ?? 0, due: 0 } }) === 1;
}

export function auditOpenSquares(): string[] {
  const problems: string[] = [];
  for (const classId of CLASS_IDS) {
    for (const square of openSquares(classId)) {
      const rows = chartRows(classId, square.id);
      if (rows.length === 0) problems.push(`${classId} ${square.id} has no chart`);
      if (rows.some((row) => !row.form.trim())) problems.push(`${classId} ${square.id} has an empty form`);
    }
  }
  return problems;
}

export function recordedNoFormIds(): string[] {
  const ids = new Set<string>();
  for (const classId of CLASS_IDS) {
    for (const slot of VERB_FILES[classId].noFormSlots ?? []) {
      if (isStemId(slot.binyan)) ids.add(squareId(slot.binyan, slot.conjugation));
    }
  }
  return [...ids].sort();
}

export function weakClassOrder(): readonly WeakClassId[] {
  return CLASS_IDS.filter((id): id is WeakClassId => id !== "strong");
}
