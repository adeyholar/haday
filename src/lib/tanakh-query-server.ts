import { readFile } from "node:fs/promises";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { queryIndexPaths, wordIndexPaths, bookJsonPaths, WORD_PAGE } from "@/lib/finder-search";
import { matchFormForWord } from "@/lib/word-card";
import { listWordRefs, runWordQuery, wordQueryLabel, type WordIndexFile } from "@/lib/tanakh-word";
import { isBookId, type TanakhDump } from "@/lib/tanakh-canon";
import {
  kindLabel,
  parseTanakhQuery,
  runTanakhQuery,
  type ParsedTanakhQuery,
  type QueryForm,
  type QueryKind,
} from "@/lib/tanakh-query";

type IndexFile = { v: number; tokens: number; forms: QueryForm[] };

let cache: IndexFile | null = null;
let wordCache: WordIndexFile | null = null;

async function readFirst(paths: string[]): Promise<string> {
  const tried: string[] = [];
  for (const path of paths) {
    tried.push(path);
    try {
      return await readFile(path, "utf8");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw err;
    }
  }
  throw new Error(`Tanakh index is not on this host (looked in ${tried.join(" · ")}).`);
}

async function loadIndex(): Promise<IndexFile> {
  if (cache) return cache;
  cache = JSON.parse(await readFirst(queryIndexPaths(process.cwd()))) as IndexFile;
  return cache;
}

async function loadWordIndex(): Promise<WordIndexFile> {
  if (wordCache) return wordCache;
  wordCache = JSON.parse(await readFirst(wordIndexPaths(process.cwd()))) as WordIndexFile;
  return wordCache;
}

const bookCache = new Map<string, TanakhDump>();

async function loadBookDump(id: string): Promise<TanakhDump | null> {
  const hit = bookCache.get(id);
  if (hit) return hit;
  try {
    const data = JSON.parse(await readFirst(bookJsonPaths(process.cwd(), id))) as TanakhDump;
    bookCache.set(id, data);
    return data;
  } catch {
    return null;
  }
}

async function versesForPage(refs: string[]): Promise<WordPassage[]> {
  const needed = new Set<string>();
  const parsed = refs.map((ref) => {
    const [book, ch, v] = ref.split(".");
    return { ref, book: book ?? "", ch: ch ?? "1", v: Number(v ?? 1) };
  });
  for (const row of parsed) {
    if (isBookId(row.book)) needed.add(row.book);
  }
  await Promise.all([...needed].map((id) => loadBookDump(id)));
  const out: WordPassage[] = [];
  for (const row of parsed) {
    const dump = bookCache.get(row.book);
    const verse = dump?.chapters[row.ch]?.find((item) => item.v === row.v);
    if (!verse) continue;
    out.push({ ref: row.ref, he: verse.he, en: verse.en });
  }
  return out;
}

export type TanakhQueryResult = {
  parsed: ParsedTanakhQuery;
  label: string;
  total: number;
  tokens: number;
  items: QueryForm[];
};

export const searchTanakhIndex = createServerFn({ method: "POST" })
  .validator((input: { q: string; kind?: QueryKind; limit?: number; scope?: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }): Promise<TanakhQueryResult> => {
    const parsed = parseTanakhQuery(data.q || data.kind || "qamets hatuf");
    if (data.kind && !parsed.hebrew) parsed.kind = data.kind;
    if (data.limit) parsed.limit = Math.min(200, Math.max(1, data.limit));
    if (data.scope) parsed.scope = data.scope as ParsedTanakhQuery["scope"];
    if (parsed.hebrew) {
      const index = await loadWordIndex();
      const { items, total } = runWordQuery(index, parsed);
      return { parsed, label: wordQueryLabel(parsed.hebrew), total, tokens: index.tokens, items };
    }
    const index = await loadIndex();
    const { items, total } = runTanakhQuery(index.forms, parsed);
    return { parsed, label: kindLabel(parsed.kind, parsed.need), total, tokens: index.tokens, items };
  });

export type WordPassage = { ref: string; he: string; en: string };

export type WordPassageResult = {
  parsed: ParsedTanakhQuery;
  label: string;
  total: number;
  offset: number;
  items: WordPassage[];
};

export const searchWordPassages = createServerFn({ method: "POST" })
  .validator((input: { q: string; scope?: string; offset?: number; limit?: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }): Promise<WordPassageResult> => {
    const parsed = parseTanakhQuery(data.q);
    if (data.scope) parsed.scope = data.scope as ParsedTanakhQuery["scope"];
    parsed.limit = 200;
    if (!parsed.hebrew) {
      return { parsed, label: "Type a Hebrew word", total: 0, offset: 0, items: [] };
    }
    const index = await loadWordIndex();
    const refs = listWordRefs(index, parsed);
    const limit = Math.min(50, Math.max(1, data.limit ?? WORD_PAGE));
    const offset = Math.min(Math.max(0, data.offset ?? 0), Math.max(0, refs.length));
    const slice = refs.slice(offset, offset + limit);
    const items = await versesForPage(slice);
    return {
      parsed,
      label: wordQueryLabel(parsed.raw.trim() || parsed.hebrew),
      total: refs.length,
      offset,
      items,
    };
  });

export type WordLookup = {
  w: string;
  t: string[];
  n: number;
};

export const lookupTanakhWord = createServerFn({ method: "POST" })
  .validator((input: { w: string; ref?: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }): Promise<WordLookup | null> => {
    const w = (data.w || "").trim();
    if (!w) return null;
    try {
      const index = await loadIndex();
      const hit = matchFormForWord(index.forms, w, data.ref);
      if (!hit) return { w, t: [], n: 0 };
      return { w: hit.w, t: hit.t, n: hit.n };
    } catch {
      return { w, t: [], n: 0 };
    }
  });
