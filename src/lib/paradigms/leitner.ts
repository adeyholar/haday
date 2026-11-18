const MIN_BOX = 1;
const MAX_BOX = 5;

export function clampBox(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return MIN_BOX;
  return Math.min(MAX_BOX, Math.max(MIN_BOX, Math.round(value)));
}

/** A right answer climbs one box. A miss returns to box 1. New cells are box 1. */
export function nextBox(current: number | undefined, correct: boolean): number {
  if (!correct) return MIN_BOX;
  return Math.min(MAX_BOX, clampBox(current) + 1);
}

/**
 * Box 1 is the heaviest draw, box 5 the lightest.
 * Weights are 5, 4, 3, 2, 1.
 */
export function boxWeight(box: number | undefined): number {
  return MAX_BOX + 1 - clampBox(box);
}

export function pickWeighted<T>(items: readonly T[], weightOf: (item: T) => number, rng: () => number): T {
  if (items.length === 0) {
    throw new Error("Nothing to draw.");
  }
  const weights = items.map((item) => Math.max(0, weightOf(item)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return items[Math.min(items.length - 1, Math.floor(rng() * items.length))]!;
  let mark = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    mark -= weights[i] ?? 0;
    if (mark < 0) return items[i]!;
  }
  return items[items.length - 1]!;
}
