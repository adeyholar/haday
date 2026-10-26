export type SrsCard = { box: number; due: number };
export type SrsState = Record<string, SrsCard>;

const DAY = 86_400_000;

/** A miss returns to box 1 and is due again in this sitting. A hit waits longer. */
export function schedule(prev: SrsCard | undefined, hit: boolean, now: number): SrsCard {
  if (!hit) return { box: 1, due: now + 20_000 };
  const box = Math.min(5, (prev?.box ?? 1) + 1);
  const days = [0, 0, 1, 3, 7, 16][box] ?? 1;
  return { box, due: now + days * DAY };
}

export function dueIds(ids: string[], state: SrsState, now: number): string[] {
  return ids
    .filter((id) => (state[id]?.due ?? 0) <= now)
    .sort((a, b) => (state[a]?.due ?? 0) - (state[b]?.due ?? 0));
}

export function exportProgress(state: SrsState): string {
  return JSON.stringify(state);
}

export function importProgress(raw: string): SrsState {
  const parsed = JSON.parse(raw) as SrsState;
  if (!parsed || typeof parsed !== "object") throw new Error("progress");
  return parsed;
}
