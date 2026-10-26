export type SrsCard = { box: number; due: number };
export type SrsState = Record<string, SrsCard>;

const DAY = 86_400_000;

/** A miss returns to box 1 and is due again in this sitting. A hit waits longer. A lenient hit does not move the box. */
export function schedule(prev: SrsCard | undefined, hit: boolean, now: number, lenient = false): SrsCard {
  if (lenient) return prev ?? { box: 1, due: 0 };
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

export type PracticeLog = Record<string, { misses: number; tags: string[] }>;

/** Study only. A miss is remembered. A hit, including a lenient one the caller treats as success, leaves the log. */
export function notePractice(log: PracticeLog, id: string, ok: boolean, tags: string[] = []): PracticeLog {
  if (ok) return log;
  const prev = log[id] ?? { misses: 0, tags: [] };
  const merged = [...prev.tags];
  for (const tag of tags) if (!merged.includes(tag)) merged.push(tag);
  return { ...log, [id]: { misses: prev.misses + 1, tags: merged } };
}

/** Game draws study misses first, then what spaced repetition says is due. */
export function selectTestIds(ids: string[], state: SrsState, practice: PracticeLog, now: number, limit = 10): string[] {
  const missed = ids
    .filter((id) => (practice[id]?.misses ?? 0) > 0)
    .sort((a, b) => (practice[b]?.misses ?? 0) - (practice[a]?.misses ?? 0) || a.localeCompare(b));
  const due = dueIds(ids, state, now);
  const out: string[] = [];
  for (const id of [...missed, ...due]) {
    if (out.includes(id)) continue;
    out.push(id);
    if (out.length >= limit) break;
  }
  return out;
}

export function masteryCount(ids: string[], state: SrsState): number {
  return ids.filter((id) => (state[id]?.box ?? 0) >= 5).length;
}

export function exportProgress(state: SrsState): string {
  return JSON.stringify(state);
}

export function importProgress(raw: string): SrsState {
  const parsed = JSON.parse(raw) as SrsState;
  if (!parsed || typeof parsed !== "object") throw new Error("progress");
  return parsed;
}
