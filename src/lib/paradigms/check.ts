import {
  acceptedForms,
  cellById,
  cellsInLevel,
  checkMix,
  earlierLevelIds,
  grammaticalLabel,
  isParseCandidate,
  shownForms,
} from "@/lib/paradigms/catalog";
import { boxWeight, pickWeighted } from "@/lib/paradigms/leitner";
import { nfc } from "@/lib/paradigms/nfc";
import type { LevelId, StrongCell } from "@/lib/paradigms/types";

export const CHECK_MIN = 5;
export const CHECK_MAX = 8;

export type ParseChoice = { cellId: string; label: string };

export type CheckItem =
  | {
      kind: "parse";
      id: string;
      cellId: string;
      prompt: string;
      ref: string;
      choices: ParseChoice[];
      answerCellId: string;
    }
  | {
      kind: "fill";
      id: string;
      cellId: string;
      label: string;
      choices: string[];
      accepted: string[];
    };

export type CheckPhase = "intro" | "item";

const DEFAULT_RNG = () => Math.random();

export function checkCount(rng: () => number = DEFAULT_RNG): number {
  return CHECK_MIN + Math.floor(rng() * (CHECK_MAX - CHECK_MIN + 1));
}

/** Skip is on the opening screen and on every item. It never changes a box. */
export function checkCanSkip(phase: CheckPhase): boolean {
  return phase === "intro" || phase === "item";
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = swap;
  }
  return copy;
}

function otherCells(cell: StrongCell, pool: StrongCell[]): StrongCell[] {
  return pool.filter((item) => item.id !== cell.id);
}

function parseItem(cell: StrongCell, pool: StrongCell[], rng: () => number, n: number): CheckItem {
  const distractors = shuffle(
    otherCells(cell, pool).filter((item) => grammaticalLabel(item) !== grammaticalLabel(cell)),
    rng,
  ).slice(0, 3);
  const choices = shuffle(
    [{ cellId: cell.id, label: grammaticalLabel(cell) }, ...distractors.map((item) => ({ cellId: item.id, label: grammaticalLabel(item) }))],
    rng,
  );
  return {
    kind: "parse",
    id: `parse-${n}-${cell.id}`,
    cellId: cell.id,
    prompt: nfc(cell.exampleWord ?? ""),
    ref: cell.exampleRef ?? "",
    choices,
    answerCellId: cell.id,
  };
}

function fillItem(cell: StrongCell, pool: StrongCell[], rng: () => number, n: number): CheckItem {
  const accepted = acceptedForms(cell);
  const banned = new Set(accepted);
  const distractors = shuffle(
    otherCells(cell, pool).flatMap((item) => shownForms(item).main.form),
    rng,
  ).filter((form) => !banned.has(form));
  const unique: string[] = [];
  for (const form of distractors) {
    if (!unique.includes(form)) unique.push(form);
    if (unique.length === 3) break;
  }
  return {
    kind: "fill",
    id: `fill-${n}-${cell.id}`,
    cellId: cell.id,
    label: grammaticalLabel(cell),
    choices: shuffle([shownForms(cell).main.form, ...unique], rng),
    accepted,
  };
}

function makeItem(cell: StrongCell, pool: StrongCell[], rng: () => number, n: number): CheckItem {
  const parse = isParseCandidate(cell) && rng() < 0.5;
  if (parse) return parseItem(cell, pool, rng, n);
  return fillItem(cell, pool, rng, n);
}

export function drawCheck(input: {
  levelId: LevelId;
  boxes: Record<string, number>;
  rng?: () => number;
  count?: number;
}): CheckItem[] {
  const rng = input.rng ?? DEFAULT_RNG;
  const count = input.count ?? checkCount(rng);
  const bounded = Math.min(CHECK_MAX, Math.max(CHECK_MIN, count));
  const current = cellsInLevel(input.levelId);
  const earlier = earlierLevelIds(input.levelId).flatMap((id) => cellsInLevel(id));
  const mix = checkMix();
  const used = new Set<string>();
  const items: CheckItem[] = [];
  const pool = [...current, ...earlier];
  if (pool.length === 0) return items;

  for (let n = 0; n < bounded; n += 1) {
    const wantEarlier = earlier.length > 0 && rng() < mix.earlierLevels;
    const source = (wantEarlier ? earlier : current).filter((cell) => !used.has(cell.id));
    const fallback = pool.filter((cell) => !used.has(cell.id));
    const choices = source.length > 0 ? source : fallback;
    if (choices.length === 0) break;
    const cell = pickWeighted(choices, (item) => boxWeight(input.boxes[item.id]), rng);
    used.add(cell.id);
    items.push(makeItem(cell, pool, rng, n));
  }
  return items;
}

export function gradeParse(item: Extract<CheckItem, { kind: "parse" }>, cellId: string): boolean {
  return cellId === item.answerCellId;
}

export function gradeFill(item: Extract<CheckItem, { kind: "fill" }>, typed: string): boolean {
  const form = nfc(typed.trim());
  return item.accepted.some((accepted) => accepted === form);
}

export type GradedLine = {
  kind: "parse" | "fill";
  cellId: string;
  correct: boolean;
  theirs: string;
  right: string;
};

export function gradedLine(item: CheckItem, answer: string): GradedLine {
  if (item.kind === "parse") {
    return {
      kind: "parse",
      cellId: item.cellId,
      correct: gradeParse(item, answer),
      theirs: leadForm(answer),
      right: leadForm(item.answerCellId),
    };
  }
  return {
    kind: "fill",
    cellId: item.cellId,
    correct: gradeFill(item, answer),
    theirs: nfc(answer.trim()),
    right: leadForm(item.cellId),
  };
}

function leadForm(cellId: string): string {
  const cell = cellById(cellId);
  return cell ? shownForms(cell).main.form : "";
}
