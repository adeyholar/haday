import { levelsFileData, strongVerb } from "@/lib/paradigms/data";
import { nfc } from "@/lib/paradigms/nfc";
import {
  isLevelId,
  type CellAlternate,
  type CellStatus,
  type LevelId,
  type LevelRow,
  type StrongCell,
} from "@/lib/paradigms/types";

export type ShownForm = {
  form: string;
  status: CellStatus;
  exampleWord?: string;
  exampleRef?: string;
};

export type ConjugationBlock = {
  id: string;
  label: string;
  conjugations: readonly string[];
};

/**
 * Phone cards and the wide grid share these blocks. Jussive is only filled
 * for Hiphil; empty blocks are omitted per binyan.
 */
export const CONJUGATION_BLOCKS: readonly ConjugationBlock[] = [
  { id: "qatal", label: "qatal", conjugations: ["qatal"] },
  { id: "yiqtol", label: "yiqtol", conjugations: ["yiqtol"] },
  { id: "wayyiqtol", label: "wayyiqtol", conjugations: ["wayyiqtol"] },
  { id: "jussive", label: "jussive", conjugations: ["jussive"] },
  { id: "imperative", label: "imperative", conjugations: ["imperative"] },
  { id: "infinitives", label: "infinitives", conjugations: ["infinitive construct", "infinitive absolute"] },
  {
    id: "participles",
    label: "participles",
    conjugations: ["participle", "participle active", "participle passive"],
  },
];

const PGN_ORDER = [
  "3ms",
  "3fs",
  "2ms",
  "2fs",
  "1cs",
  "3cp",
  "3mp",
  "3fp",
  "2mp",
  "2fp",
  "1cp",
  "ms",
  "fs",
  "mp",
  "fp",
  "-",
];

/**
 * Piel infinitive absolute stores the unattested spelling as `form` and the
 * attested spelling as the first alternate. v1 leads with that alternate.
 * The strings still come from the file; this set only names the cell id.
 */
const LEAD_WITH_FIRST_ALTERNATE = new Set(["Piel.infinitive-absolute"]);

const byId = new Map<string, StrongCell>();
for (const cell of strongVerb.cells) byId.set(cell.id, cell);

const binyanOrder: string[] = [];
for (const cell of strongVerb.cells) {
  if (!binyanOrder.includes(cell.binyan)) binyanOrder.push(cell.binyan);
}

export function cellById(id: string): StrongCell | undefined {
  return byId.get(id);
}

export function allCells(): StrongCell[] {
  return strongVerb.cells;
}

export function binyanim(): string[] {
  return binyanOrder;
}

export function teachingRoot(): string {
  return nfc(strongVerb.root);
}

export function strongLevels(): LevelRow[] {
  return levelsFileData.levels.filter((level) => level.phase === 1 && isLevelId(level.id) && (level.cells?.length ?? 0) > 0);
}

export function levelRow(id: LevelId): LevelRow | undefined {
  return strongLevels().find((level) => level.id === id);
}

export function earlierLevelIds(id: LevelId): LevelId[] {
  const ids = strongLevels().map((level) => level.id).filter(isLevelId);
  const at = ids.indexOf(id);
  return at <= 0 ? [] : ids.slice(0, at);
}

export function cellsInLevel(id: LevelId): StrongCell[] {
  const row = levelRow(id);
  if (!row?.cells) return [];
  return row.cells.map((cellId) => byId.get(cellId)).filter((cell): cell is StrongCell => Boolean(cell));
}

export function isParseCandidate(cell: StrongCell): boolean {
  if (cell.status !== "attested-example" || !cell.exampleWord) return false;
  return strongLevels().some((level) => (level.parseItemCells ?? []).includes(cell.id));
}

function fromAlternate(alt: CellAlternate): ShownForm {
  const shown: ShownForm = { form: nfc(alt.form), status: alt.status };
  if (alt.exampleWord) shown.exampleWord = nfc(alt.exampleWord);
  if (alt.exampleRef) shown.exampleRef = alt.exampleRef;
  return shown;
}

function fromCell(cell: StrongCell): ShownForm {
  const shown: ShownForm = { form: nfc(cell.form), status: cell.status };
  if (cell.exampleWord) shown.exampleWord = nfc(cell.exampleWord);
  if (cell.exampleRef) shown.exampleRef = cell.exampleRef;
  return shown;
}

/** Main line, then alternates. Piel infinitive absolute leads with its first alternate. */
export function shownForms(cell: StrongCell): { main: ShownForm; also: ShownForm[] } {
  const main = fromCell(cell);
  const also = (cell.alternates ?? []).map(fromAlternate);
  const lead = also[0];
  if (LEAD_WITH_FIRST_ALTERNATE.has(cell.id) && lead) {
    return { main: lead, also: [main, ...also.slice(1)] };
  }
  return { main, also };
}

/** Every spelling the file stores for this cell, NFC. Grading accepts all of them. */
export function acceptedForms(cell: StrongCell): string[] {
  const forms = [nfc(cell.form), ...(cell.alternates ?? []).map((alt) => nfc(alt.form))];
  return [...new Set(forms)];
}

export function grammaticalLabel(cell: StrongCell): string {
  if (cell.pgn === "-") return `${cell.binyan} ${cell.conjugation}`;
  return `${cell.binyan} ${cell.conjugation} ${cell.pgn}`;
}

export function rowKey(cell: StrongCell): string {
  return `${cell.conjugation}.${cell.pgn}`;
}

export function rowLabel(cell: StrongCell): string {
  if (cell.pgn === "-") return cell.conjugation;
  if (cell.conjugation.startsWith("participle ") && cell.conjugation !== "participle") {
    return `${cell.conjugation} ${cell.pgn}`;
  }
  return cell.pgn;
}

function pgnRank(pgn: string): number {
  const at = PGN_ORDER.indexOf(pgn);
  return at === -1 ? PGN_ORDER.length : at;
}

export function cellsForBinyan(binyan: string): StrongCell[] {
  return strongVerb.cells.filter((cell) => cell.binyan === binyan);
}

export function blockHasCells(binyan: string, block: ConjugationBlock): boolean {
  return cellsForBinyan(binyan).some((cell) => block.conjugations.includes(cell.conjugation));
}

export function blocksFor(binyan: string): ConjugationBlock[] {
  return CONJUGATION_BLOCKS.filter((block) => blockHasCells(binyan, block));
}

export function rowsInBlock(binyan: string, block: ConjugationBlock): StrongCell[] {
  const allowed = new Map(block.conjugations.map((name, index) => [name, index]));
  return cellsForBinyan(binyan)
    .filter((cell) => allowed.has(cell.conjugation))
    .sort((a, b) => {
      const conj = (allowed.get(a.conjugation) ?? 0) - (allowed.get(b.conjugation) ?? 0);
      if (conj !== 0) return conj;
      return pgnRank(a.pgn) - pgnRank(b.pgn);
    });
}

export type GridRow = {
  key: string;
  label: string;
  byBinyan: Record<string, StrongCell | undefined>;
};

/** One row across all seven binyanim for the wide grid. */
export function gridRows(block: ConjugationBlock): GridRow[] {
  const rows = new Map<string, GridRow>();
  for (const binyan of binyanOrder) {
    for (const cell of rowsInBlock(binyan, block)) {
      const key = rowKey(cell);
      const row = rows.get(key) ?? { key, label: rowLabel(cell), byBinyan: {} };
      row.byBinyan[binyan] = cell;
      rows.set(key, row);
    }
  }
  return [...rows.values()];
}

export function checkMix(): { currentLevel: number; earlierLevels: number } {
  return levelsFileData.checkMix;
}
