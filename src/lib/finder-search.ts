export type FinderSearch = { q: string; n: number };
export type WordSearch = { q: string; scope: "all" | "torah" | "neviim" | "ketuvim"; page: number };

export const FINDER_COUNTS = [10, 20, 50] as const;
export const WORD_PAGE = 25;
export const WORD_SCOPES = [
  { id: "all" as const, label: "All Tanakh" },
  { id: "torah" as const, label: "Torah" },
  { id: "neviim" as const, label: "Nevi'im" },
  { id: "ketuvim" as const, label: "Ketuvim" },
];

export function hasHebrewWord(s: string): boolean {
  return ((s.match(/[\u05D0-\u05EA]/g) ?? []).join("").length) >= 2;
}

export function parseFinderSearch(s: Record<string, unknown>): FinderSearch {
  const raw = Number(s.n);
  const n = Number.isFinite(raw) ? Math.min(50, Math.max(1, Math.floor(raw))) : 10;
  const q = typeof s.q === "string" ? s.q.trim() : "";
  return { q, n };
}

export function parseWordSearch(s: Record<string, unknown>): WordSearch {
  const q = typeof s.q === "string" ? s.q.trim() : "";
  const scopeRaw = typeof s.scope === "string" ? s.scope.toLowerCase() : "all";
  const scope =
    scopeRaw === "torah" || scopeRaw === "neviim" || scopeRaw === "ketuvim" ? scopeRaw : "all";
  const pageRaw = Number(s.page);
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
  return { q, scope, page };
}

export function bookJsonPaths(cwd: string, id: string): string[] {
  const root = cwd.replace(/\/$/, "");
  return [`${root}/public/tanakh/books/${id}.json`, `${root}/.output/public/tanakh/books/${id}.json`];
}

export function finderAsk(labelAsk: string, n: number): string {
  if (hasHebrewWord(labelAsk)) return labelAsk.trim();
  if (/\d+/.test(labelAsk)) return labelAsk.replace(/\d+/, String(n));
  return `give me ${n} ${labelAsk.trim()}`;
}

export function queryIndexPaths(cwd = "."): string[] {
  const root = cwd.replace(/\/$/, "");
  return [`${root}/public/tanakh/query-index.json`, `${root}/.output/public/tanakh/query-index.json`];
}

export function wordIndexPaths(cwd = "."): string[] {
  const root = cwd.replace(/\/$/, "");
  return [`${root}/public/tanakh/word-index.json`, `${root}/.output/public/tanakh/word-index.json`];
}
