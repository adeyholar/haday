import { kindLabel, parseTanakhQuery, runTanakhQuery, type QueryForm } from "@/lib/tanakh-query";
import { searchTanakhIndex, type TanakhQueryResult } from "@/lib/tanakh-query-server";

type IndexFile = { v?: number; tokens?: number; forms: QueryForm[] };

/** Server first; if Azure has no file on disk, use the public copy the browser already can fetch. */
export async function dealFinderDeck(q: string, n: number): Promise<TanakhQueryResult> {
  try {
    return await searchTanakhIndex({ data: { q, limit: n } });
  } catch {
    const res = await fetch("/tanakh/query-index.json");
    if (!res.ok) {
      throw new Error("The Tanakh card index is not on this host yet. Try again after the next deploy.");
    }
    const index = (await res.json()) as IndexFile;
    const parsed = parseTanakhQuery(q);
    parsed.limit = Math.min(200, Math.max(1, n));
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
