import { searchTanakhIndex, searchWordPassages, type TanakhQueryResult, type WordPassageResult } from "@/lib/tanakh-query-server";
import { WORD_PAGE } from "@/lib/finder-search";

/** The word indexes stay on the server. A phone does not download them. */
export async function dealFinderDeck(q: string, n: number): Promise<TanakhQueryResult> {
  return searchTanakhIndex({ data: { q, limit: n } });
}

export async function dealWordPassages(
  q: string,
  scope: string,
  offset: number,
  limit = WORD_PAGE,
): Promise<WordPassageResult> {
  return searchWordPassages({ data: { q, scope, offset, limit } });
}
