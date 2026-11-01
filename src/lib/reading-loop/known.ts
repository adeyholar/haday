import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { hydrateCard, isMastered, type CardState } from "@/lib/srs";
import type { VocabItem } from "@/lib/vocab";

export type SurfaceWord = { id: string; surface: string };

export type KnownReport = {
  /** Unique class lemmas that actually appear in this passage. */
  found: number;
  /** Of those, how many the student has mastered. */
  known: number;
  pct: number;
  /** Class lemmas in the passage that are not mastered, first-seen order. */
  unknown: VocabItem[];
  /** Word ids whose class lemma is still to learn. Unmatched words are not dimmed. */
  unknownWordIds: string[];
};

const SHORT_SFX = ["יכם", "יכן", "ינו", "יהם", "יהן", "ות", "ים", "יך", "יו", "יה", "נו", "הם", "הן", "ך", "ו", "ה", "י", "ם", "ן", "ת"].map((s) =>
  foldFinals(s),
);
const VERB_PFX = ["והת", "וית", "הת", "וי", "ות", "וא", "ונ", "וה", "ו", "י", "ת", "א", "נ", ""];
const VERB_SFX = ["תם", "תי", "נו", "נה", "ות", "ים", "יו", "יה", "הו", "ני", "ה", "ו", "י", "ת", ""].map((s) => foldFinals(s));

const indexes = new WeakMap<VocabItem[], Map<string, VocabItem>>();

function indexOf(pool: VocabItem[]): Map<string, VocabItem> {
  const cached = indexes.get(pool);
  if (cached) return cached;
  const map = new Map<string, VocabItem>();
  for (const item of pool) {
    for (const he of [item.hebrew, ...(item.hebrewAlts ?? [])]) {
      const key = foldFinals(lettersOnly(he));
      if (key.length < 2) continue;
      const prev = map.get(key);
      if (!prev || item.freq > prev.freq) map.set(key, item);
    }
  }
  indexes.set(pool, map);
  return map;
}

function bodiesOf(surface: string): string[] {
  const s = foldFinals(lettersOnly(surface));
  if (s.length < 2) return [];
  const out = [s];
  if (s.length > 2 && "והבלכ".includes(s[0] ?? "")) out.push(s.slice(1));
  if (s.length > 3 && s[0] === "ו" && "הבלכ".includes(s[1] ?? "")) out.push(s.slice(2));
  return out;
}

function candidatesOf(surface: string): string[] {
  const found = new Set<string>();
  for (const body of bodiesOf(surface)) {
    found.add(body);
    for (const suf of SHORT_SFX) {
      if (body.length - suf.length >= 2 && body.endsWith(suf)) found.add(body.slice(0, body.length - suf.length));
    }
    for (const pfx of VERB_PFX) {
      if (pfx && !body.startsWith(pfx)) continue;
      const rest = body.slice(pfx.length);
      for (const sfx of VERB_SFX) {
        if (sfx && !rest.endsWith(sfx)) continue;
        const core = sfx ? rest.slice(0, rest.length - sfx.length) : rest;
        if (core.length >= 2) {
          found.add(core);
          if (core.includes("ו")) found.add(core.replaceAll("ו", ""));
        }
      }
    }
  }
  return [...found];
}

function closedOk(surface: string, item: VocabItem, key: string): boolean {
  if (item.pos !== "particle" && item.pos !== "pron") return true;
  const s = foldFinals(lettersOnly(surface));
  return s === key || (s.startsWith("ו") && s.slice(1) === key);
}

/** Longest class lemma this surface can be. */
export function matchInPool(surface: string, pool: VocabItem[]): VocabItem | undefined {
  const index = indexOf(pool);
  let best: VocabItem | undefined;
  let bestLen = 0;
  for (const key of candidatesOf(surface)) {
    const item = index.get(key);
    if (!item || !closedOk(surface, item, key)) continue;
    if (!best || key.length > bestLen || (key.length === bestLen && item.freq > best.freq)) {
      best = item;
      bestLen = key.length;
    }
  }
  return best;
}

export function masteredIds(pool: VocabItem[], cards: Record<string, CardState | undefined>, now = Date.now()): Set<string> {
  const ids = new Set<string>();
  for (const item of pool) {
    if (isMastered(hydrateCard(cards[item.id], now))) ids.add(item.id);
  }
  return ids;
}

/** Chapter-level known share. Denominator is class lemmas in the text, not every biblical word. */
export function chapterKnown(
  words: SurfaceWord[],
  pool: VocabItem[],
  cards: Record<string, CardState | undefined>,
  now = Date.now(),
): KnownReport {
  const held = masteredIds(pool, cards, now);
  const seen = new Map<string, VocabItem>();
  const unknownWordIds: string[] = [];
  for (const word of words) {
    const item = matchInPool(word.surface, pool);
    if (!item) continue;
    if (!seen.has(item.id)) seen.set(item.id, item);
    if (!held.has(item.id)) unknownWordIds.push(word.id);
  }
  const unknown: VocabItem[] = [];
  let known = 0;
  for (const item of seen.values()) {
    if (held.has(item.id)) known += 1;
    else unknown.push(item);
  }
  const found = seen.size;
  return {
    found,
    known,
    pct: found ? Math.round((known / found) * 100) : 0,
    unknown,
    unknownWordIds,
  };
}
