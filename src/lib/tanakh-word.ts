import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { booksIn, isBookId, type BookId } from "@/lib/tanakh-canon";
import type { ParsedTanakhQuery, QueryForm } from "@/lib/tanakh-query";

export type WordIndexFile = {
  v: number;
  tokens: number;
  e: Record<string, { n: number; r: string[] }>;
};

/** Proclitics and wayyiqtol letters we attach in front of a typed word. */
export const WORD_PREFIXES = [
  "",
  "ו",
  "ה",
  "ב",
  "כ",
  "ל",
  "מ",
  "וה",
  "וב",
  "וכ",
  "ול",
  "ומ",
  "בה",
  "כה",
  "לה",
  "מה",
  "ובה",
  "וכה",
  "ולה",
  "ומה",
  "י",
  "ת",
  "א",
  "נ",
  "וי",
  "ות",
  "וא",
  "ונ",
] as const;

/** Regular endings (plural, 3ms/3fs, 1cs). Not a root guess. */
export const WORD_SUFFIXES = ["", "ה", "ו", "י", "ת", "ם", "נו", "תי", "ים", "ות", "יו", "יה", "ך", "תם", "נה"] as const;

export function letterKey(s: string): string {
  return foldFinals(lettersOnly(s));
}

export function expandWordKeys(query: string): string[] {
  const q = letterKey(query);
  if (q.length < 2) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of WORD_PREFIXES) {
    for (const s of WORD_SUFFIXES) {
      const key = foldFinals(`${p}${q}${s}`);
      if (key.length < 2 || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

export function tokenMatchesQuery(token: string, query: string): boolean {
  const q = letterKey(query);
  if (q.length < 2) return false;
  const tok = letterKey(token);
  if (tok === q) return true;
  return expandWordKeys(q).includes(tok);
}

export function markQueryInVerse(he: string, query: string): { word: string; hit: boolean }[] {
  return he
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ word, hit: tokenMatchesQuery(word, query) }));
}

function booksForScope(scope: ParsedTanakhQuery["scope"]): Set<string> | null {
  if (scope === "all") return null;
  if (scope === "torah" || scope === "neviim" || scope === "ketuvim") {
    return new Set(booksIn(scope).map((b) => b.id));
  }
  if (isBookId(scope)) return new Set([scope as BookId]);
  return null;
}

function spreadRefs(refs: string[], limit: number): string[] {
  if (refs.length <= limit) return refs;
  const out: string[] = [];
  const seen = new Set<string>();
  const last = refs.length - 1;
  for (let i = 0; i < limit; i++) {
    const idx = Math.round((i * last) / (limit - 1));
    const r = refs[idx]!;
    if (seen.has(r)) continue;
    seen.add(r);
    out.push(r);
  }
  for (const r of refs) {
    if (out.length >= limit) break;
    if (seen.has(r)) continue;
    seen.add(r);
    out.push(r);
  }
  return out;
}

export function listWordRefs(index: WordIndexFile, parsed: ParsedTanakhQuery): string[] {
  const q = parsed.hebrew || letterKey(parsed.raw);
  if (q.length < 2) return [];
  const books = booksForScope(parsed.scope);
  const refs: string[] = [];
  const seen = new Set<string>();
  for (const key of expandWordKeys(q)) {
    const row = index.e[key];
    if (!row) continue;
    for (const ref of row.r) {
      if (seen.has(ref)) continue;
      if (books && !books.has(ref.split(".")[0] ?? "")) continue;
      seen.add(ref);
      refs.push(ref);
    }
  }
  return refs;
}

export function runWordQuery(
  index: WordIndexFile,
  parsed: ParsedTanakhQuery,
): { items: QueryForm[]; total: number } {
  const refs = listWordRefs(index, parsed);
  if (!refs.length) return { items: [], total: 0 };
  const picked = spreadRefs(refs, parsed.limit);
  const display = parsed.raw.trim() || parsed.hebrew || "";
  const items: QueryForm[] = picked.map((ref) => ({
    w: display,
    n: refs.length,
    t: ["word"],
    r: [ref],
  }));
  return { items, total: refs.length };
}

export function wordQueryLabel(hebrew: string): string {
  return `“${hebrew}” in the Tanakh`;
}
