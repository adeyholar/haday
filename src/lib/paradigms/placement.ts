import { placementFileData } from "@/lib/paradigms/data";
import { nfc } from "@/lib/paradigms/nfc";
import { isLevelId, type LevelId, type PlacementItem } from "@/lib/paradigms/types";

export type PlacementStep = {
  index: number;
  misses: number;
  firstMissLevel: LevelId | null;
  done: boolean;
  level: LevelId | null;
};

export function placementItems(): PlacementItem[] {
  return placementFileData.items;
}

export function startPlacement(): PlacementStep {
  return { index: 0, misses: 0, firstMissLevel: null, done: false, level: null };
}

export function placementItem(step: PlacementStep): PlacementItem | null {
  if (step.done) return null;
  return placementItems()[step.index] ?? null;
}

/** A miss includes "I don't know". The level is the first miss. Two misses end the quiz. */
export function answerPlacement(step: PlacementStep, miss: boolean): PlacementStep {
  if (step.done) return step;
  const item = placementItems()[step.index];
  if (!item || !isLevelId(item.level)) return { ...step, done: true, level: step.firstMissLevel ?? "L1" };
  const misses = step.misses + (miss ? 1 : 0);
  const firstMissLevel = step.firstMissLevel ?? (miss ? item.level : null);
  const last = step.index >= placementItems().length - 1;
  const done = misses >= 2 || last;
  return {
    index: done ? step.index : step.index + 1,
    misses,
    firstMissLevel,
    done,
    level: done ? (firstMissLevel ?? "L7") : null,
  };
}

/** Leaving the quiz before it finishes places the student at L1. */
export function skipPlacement(): { level: LevelId; source: "skip" } {
  return { level: "L1", source: "skip" };
}

export function placementWord(item: PlacementItem): string {
  return nfc(item.word);
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j] as T;
    copy[j] = swap as T;
  }
  return copy;
}

/** Correct answer and distractors, in a fresh order. The correct line is not fixed first. */
export function placementChoices(item: PlacementItem, rng: () => number = Math.random): string[] {
  return shuffle([item.correct, ...item.distractors], rng);
}
