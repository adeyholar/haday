/** Draw n items from a large pool, skipping what this sitting just saw. */

export const ROUND_LEN = 12;
const RECENT_KEEP = 24;

export function shuffleList<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffle<T>(arr: T[]): T[] {
  return shuffleList(arr);
}

/**
 * Sattolo cycle: every item moves. For n ≥ 2 this is a derangement
 * (no item stays in its original slot).
 */
export function derange<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Permute `right` so no id sits on the same row as `left`. */
export function derangeAgainst<L extends { id: string }, R extends { id: string }>(left: L[], right: R[]): R[] {
  if (right.length < 2) return [...right];
  const byId = new Map(right.map((x) => [x.id, x]));
  return derange(left.map((x) => x.id)).map((id) => {
    const hit = byId.get(id);
    if (!hit) throw new Error(`derangeAgainst: missing ${id}`);
    return hit;
  });
}

/** Shuffle a choice pad so the answer is never parked in the first cell. */
export function shuffleOffFirst<T>(items: T[], isAnswer: (item: T) => boolean): T[] {
  const a = shuffleList(items);
  if (a.length < 2) return a;
  const i = a.findIndex(isAnswer);
  if (i === 0) {
    const j = 1 + Math.floor(Math.random() * (a.length - 1));
    [a[0], a[j]] = [a[j], a[0]];
  }
  return a;
}

function readRecent(key: string): string[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeRecent(key: string, ids: string[]) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(ids.slice(0, RECENT_KEEP)));
  } catch {
    /* quota / private mode */
  }
}

export function drawRound<T>(pool: T[], n: number, key: string, idOf: (item: T) => string): T[] {
  if (pool.length <= n) return shuffle(pool).map((item) => item);
  const recent = readRecent(key);
  const fresh = pool.filter((item) => !recent.includes(idOf(item)));
  const picked: T[] = [];
  picked.push(...shuffle(fresh).slice(0, n));
  if (picked.length < n) {
    const have = new Set(picked.map(idOf));
    picked.push(...shuffle(pool.filter((item) => !have.has(idOf(item)))).slice(0, n - picked.length));
  }
  const next = [...picked.map(idOf), ...recent.filter((id) => !picked.some((item) => idOf(item) === id))];
  writeRecent(key, next);
  return picked;
}

export function quizId(q: { q: string; he?: string }): string {
  return `${q.q}|${q.he ?? ""}`;
}

/** Put `item` back among the cards after `fromIndex` so it is served again. */
export function spliceLater<T>(list: T[], fromIndex: number, item: T): T[] {
  const rest = list.slice(fromIndex + 1);
  const at = rest.length ? Math.floor(Math.random() * (rest.length + 1)) : 0;
  return [...list.slice(0, fromIndex + 1), ...rest.slice(0, at), item, ...rest.slice(at)];
}
