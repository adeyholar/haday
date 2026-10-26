import raw from "@/lib/paradigm/qal-perfect.json";

export const PGN_PERFECT = ["3ms", "3fs", "2ms", "2fs", "1cs", "3cp", "2mp", "2fp", "1cp"] as const;
export const PGN_IMPERFECT = ["3ms", "3fs", "2ms", "2fs", "1cs", "3mp", "3fp", "2mp", "2fp", "1cp"] as const;

export type Pgn = string;

export type CellStatus = "to_verify" | "verified" | "rejected";

export type ParadigmCell = {
  form: string;
  origin: "override" | "generated";
  status: CellStatus;
  verifiedBy: string;
  verifiedOn: string;
  note: string;
  attestation: { ref: string; surface: string } | null;
};

export type Conjugation = {
  phase: 1 | 2 | 3;
  cells: Record<string, ParadigmCell>;
  alternates: Record<string, string[]>;
  notes: string[];
};

export type ParadigmRoot = {
  id: string;
  root: string;
  letters: string[];
  shin: "shin" | "sin" | null;
  classId: string;
  gloss: string;
  source: string;
  supplementary: boolean;
  memorize: boolean;
  conjugations: Record<string, Conjugation>;
};

export type ParadigmClass = { id: string; hint: string };

export type ParadigmBook = {
  schemaVersion: number;
  verifiedBy: string;
  verifiedOn: string;
  classes: ParadigmClass[];
  roots: ParadigmRoot[];
};

export type PracticeCell = {
  id: string;
  root: ParadigmRoot;
  conjugation: string;
  pgn: string;
  cell: ParadigmCell;
  alternates: string[];
};

export type DeckFilter = "all" | "memorize" | `class:${string}`;

export const book = raw as unknown as ParadigmBook;

export const PGN_LONG: Record<string, string> = {
  "3ms": "3rd masc. sing.",
  "3fs": "3rd fem. sing.",
  "2ms": "2nd masc. sing.",
  "2fs": "2nd fem. sing.",
  "1cs": "1st common sing.",
  "3cp": "3rd common plural",
  "2mp": "2nd masc. plural",
  "2fp": "2nd fem. plural",
  "1cp": "1st common plural",
  "3mp": "3rd masc. plural",
  "3fp": "3rd fem. plural",
};

export function shownInPractice(status: CellStatus, phase: number, includeUnverified = false): boolean {
  if (phase !== 1) return false;
  if (!includeUnverified && status !== "verified") return false;
  return true;
}

export function classHint(classId: string): string {
  return book.classes.find((row) => row.id === classId)?.hint ?? "";
}

export function practiceCells(deck: DeckFilter, includeUnverified = false): PracticeCell[] {
  const out: PracticeCell[] = [];
  const classId = deck.startsWith("class:") ? deck.slice("class:".length) : "";
  for (const root of book.roots) {
    if (deck === "memorize" && !root.memorize) continue;
    if (deck === "all" && root.supplementary) continue;
    if (classId && root.classId !== classId) continue;
    for (const [conjugation, table] of Object.entries(root.conjugations)) {
      if (table.phase !== 1) continue;
      for (const [pgn, cell] of Object.entries(table.cells)) {
        if (!shownInPractice(cell.status, table.phase, includeUnverified)) continue;
        out.push({
          id: `${root.id}:${conjugation}:${pgn}`,
          root,
          conjugation,
          pgn,
          cell,
          alternates: table.alternates[pgn] ?? [],
        });
      }
    }
  }
  return out;
}

/** Every signed perfect, including נתן and היה. Imperfect and imperative stay out. */
export function perfectCells(includeUnverified = false): PracticeCell[] {
  const out: PracticeCell[] = [];
  for (const root of book.roots) {
    const table = root.conjugations.qal_perfect;
    if (!table || table.phase !== 1) continue;
    for (const [pgn, cell] of Object.entries(table.cells)) {
      if (!shownInPractice(cell.status, table.phase, includeUnverified)) continue;
      out.push({
        id: `${root.id}:qal_perfect:${pgn}`,
        root,
        conjugation: "qal_perfect",
        pgn,
        cell,
        alternates: table.alternates[pgn] ?? [],
      });
    }
  }
  return out;
}

/** The twelve weak roots, including the two marked Memorize. נתן and היה stay on their class tabs. */
export function allCells(includeUnverified = false): PracticeCell[] {
  return practiceCells("all", includeUnverified);
}

export const HOLLOW_STRESS_NOTE =
  "Participles such as קָמָ֫ה and קָמִ֫ים take final stress. The perfect קָ֫מָה is penultimate.";

export function siblings(cell: PracticeCell): PracticeCell[] {
  const table = cell.root.conjugations[cell.conjugation];
  if (!table) return [];
  return Object.entries(table.cells)
    .filter(([pgn, row]) => pgn !== cell.pgn && row.status === "verified")
    .map(([pgn, row]) => ({
      id: `${cell.root.id}:${cell.conjugation}:${pgn}`,
      root: cell.root,
      conjugation: cell.conjugation,
      pgn,
      cell: row,
      alternates: table.alternates[pgn] ?? [],
    }));
}

export function renderCell(cell: ParadigmCell): string {
  return cell.form;
}
