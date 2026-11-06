import { lettersOnly } from "@/lib/hebrew";
import { shuffleList } from "@/lib/quiz-draw";
import { hydrateCard, isWeak, weaknessScore, type CardState } from "@/lib/srs";
import { VOCAB } from "@/lib/vocab";

export type CardBook = Record<string, CardState | undefined>;

/** 0 when this card is not weak. Higher means more misses. */
export function weakRank(card: CardState | undefined): number {
  if (!card || !isWeak(card)) return 0;
  const c = hydrateCard(card);
  return Math.max(c.misses, c.lapses) * 1000 + c.reveals * 100 + weaknessScore(c);
}

export function vocabRank(cards: CardBook | undefined, id: string, now = Date.now()): number {
  if (!cards) return 0;
  const raw = cards[id];
  return raw ? weakRank(hydrateCard(raw, now)) : 0;
}

const letterCache = new WeakMap<object, Map<string, number>>();

function lemmaRanks(cards: CardBook, now: number): Map<string, number> {
  const hit = letterCache.get(cards);
  if (hit) return hit;
  const map = new Map<string, number>();
  const touch = (hebrew: string, rank: number) => {
    const key = lettersOnly(hebrew);
    if (key.length < 2 || rank <= (map.get(key) ?? 0)) return;
    map.set(key, rank);
  };
  for (const item of VOCAB) {
    const rank = vocabRank(cards, item.id, now);
    if (!rank) continue;
    touch(item.hebrew, rank);
    for (const alt of item.hebrewAlts ?? []) touch(alt, rank);
  }
  letterCache.set(cards, map);
  return map;
}

/**
 * Rank a Hebrew line by a weak class lemma.
 * The whole spelling counts, and so does the spelling with one or two prefixes taken off
 * (the, and, a preposition). A short lemma hidden inside a longer word does not.
 */
export function hebrewWeakRank(cards: CardBook | undefined, hebrew: string | undefined, now = Date.now()): number {
  if (!cards || !hebrew) return 0;
  const map = lemmaRanks(cards, now);
  const key = lettersOnly(hebrew);
  const tries = [key];
  if (key.length >= 3) tries.push(key.slice(1));
  if (key.length >= 4) tries.push(key.slice(2));
  let best = 0;
  for (const part of tries) {
    if (part.length < 2) continue;
    const rank = map.get(part) ?? 0;
    if (rank > best) best = rank;
  }
  return best;
}

/**
 * Weak items lead a new sitting, most-weak first, and that block is not shuffled.
 * The rest is shuffled so a new round is not a fixed list.
 */
export function leadWithWeak<T>(
  items: T[],
  rankOf: (item: T) => number,
  idOf: (item: T) => string,
  shuffleRest: (list: T[]) => T[] = shuffleList,
): T[] {
  if (!items.length) return [];
  const weak = items
    .filter((item) => rankOf(item) > 0)
    .sort((a, b) => {
      const gap = rankOf(b) - rankOf(a);
      if (gap !== 0) return gap;
      const ia = idOf(a);
      const ib = idOf(b);
      return ia < ib ? -1 : ia > ib ? 1 : 0;
    });
  if (!weak.length) return shuffleRest([...items]);
  const ids = new Set(weak.map(idOf));
  return [...weak, ...shuffleRest(items.filter((item) => !ids.has(idOf(item))))];
}
