import { readFile } from "node:fs/promises";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { queryIndexPaths } from "@/lib/finder-search";
import { matchFormForWord } from "@/lib/word-card";
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

async function readIndexJson(): Promise<string> {
  const tried: string[] = [];
  for (const path of queryIndexPaths(process.cwd())) {
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
  const raw = await readIndexJson();
  cache = JSON.parse(raw) as IndexFile;
  return cache;
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
    if (data.kind) parsed.kind = data.kind;
    if (data.limit) parsed.limit = Math.min(200, Math.max(1, data.limit));
    if (data.scope) parsed.scope = data.scope as ParsedTanakhQuery["scope"];
    const index = await loadIndex();
    const { items, total } = runTanakhQuery(index.forms, parsed);
    return { parsed, label: kindLabel(parsed.kind, parsed.need), total, tokens: index.tokens, items };
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
