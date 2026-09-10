export type FinderSearch = { q: string; n: number };

export const FINDER_COUNTS = [10, 20, 50] as const;

export function parseFinderSearch(s: Record<string, unknown>): FinderSearch {
  const raw = Number(s.n);
  const n = Number.isFinite(raw) ? Math.min(50, Math.max(1, Math.floor(raw))) : 10;
  const q = typeof s.q === "string" ? s.q.trim() : "";
  return { q, n };
}

export function finderAsk(labelAsk: string, n: number): string {
  if (/\d+/.test(labelAsk)) return labelAsk.replace(/\d+/, String(n));
  return `give me ${n} ${labelAsk.trim()}`;
}
