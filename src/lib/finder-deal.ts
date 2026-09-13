import { kindLabel, parseTanakhQuery, runTanakhQuery, type QueryForm } from "@/lib/tanakh-query";
import {
  searchTanakhIndex,
  searchWordPassages,
  type TanakhQueryResult,
  type WordPassageResult,
} from "@/lib/tanakh-query-server";
import { versesForRefs } from "@/lib/tanakh-canon";
import { WORD_PAGE } from "@/lib/finder-search";
import { listWordRefs, runWordQuery, wordQueryLabel, type WordIndexFile } from "@/lib/tanakh-word";

type IndexFile = { v?: number; tokens?: number; forms: QueryForm[] };

/** Server first; if Azure has no file on disk, use the public copy the browser already can fetch. */
export async function dealFinderDeck(q: string, n: number): Promise<TanakhQueryResult> {
  try {
    return await searchTanakhIndex({ data: { q, limit: n } });
  } catch {
    const parsed = parseTanakhQuery(q);
    parsed.limit = Math.min(200, Math.max(1, n));
    if (parsed.hebrew) {
      const res = await fetch("/tanakh/word-index.json");
      if (!res.ok) {
        throw new Error("The Tanakh word index is not on this host yet. Try again after the next deploy.");
      }
      const index = (await res.json()) as WordIndexFile;
      const { items, total } = runWordQuery(index, parsed);
      return { parsed, label: wordQueryLabel(parsed.hebrew), total, tokens: index.tokens ?? 0, items };
    }
    const res = await fetch("/tanakh/query-index.json");
    if (!res.ok) {
      throw new Error("The Tanakh card index is not on this host yet. Try again after the next deploy.");
    }
    const index = (await res.json()) as IndexFile;
    const { items, total } = runTanakhQuery(index.forms ?? [], parsed);
    return {
      parsed,
      label: kindLabel(parsed.kind, parsed.need),
      total,
      tokens: index.tokens ?? 0,
      items,
    };
  }
}

export async function dealWordPassages(
  q: string,
  scope: string,
  offset: number,
  limit = WORD_PAGE,
): Promise<WordPassageResult> {
  try {
    return await searchWordPassages({ data: { q, scope, offset, limit } });
  } catch {
    const parsed = parseTanakhQuery(q);
    parsed.scope = (scope || "all") as typeof parsed.scope;
    parsed.limit = 200;
    if (!parsed.hebrew) {
      return { parsed, label: "Type a Hebrew word", total: 0, offset: 0, items: [] };
    }
    const res = await fetch("/tanakh/word-index.json");
    if (!res.ok) {
      throw new Error("The Tanakh word index is not on this host yet. Try again after the next deploy.");
    }
    const index = (await res.json()) as WordIndexFile;
    const refs = listWordRefs(index, parsed);
    const start = Math.min(Math.max(0, offset), Math.max(0, refs.length));
    const slice = refs.slice(start, start + limit);
    const items = await versesForRefs(slice);
    return {
      parsed,
      label: wordQueryLabel(parsed.raw.trim() || parsed.hebrew),
      total: refs.length,
      offset: start,
      items,
    };
  }
}
