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
  deck: "chapter" | "supplementary";
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

export type DeckFilter = "chapter" | "memorize" | "supplementary";

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
  for (const root of book.roots) {
    if (deck === "memorize" && !root.memorize) continue;
    if (deck === "chapter" && (root.deck !== "chapter" || root.memorize)) continue;
    if (deck === "supplementary" && root.deck !== "supplementary") continue;
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

/** Chapter 14, including the two roots marked Memorize. Supplementary stays on its own deck. */
export function chapterCells(includeUnverified = false): PracticeCell[] {
  return [...practiceCells("chapter", includeUnverified), ...practiceCells("memorize", includeUnverified)];
}

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
