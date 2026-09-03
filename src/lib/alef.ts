import { VOWELS, WRITE_LETTERS } from "@/lib/alphabet";
import { pickByBkt } from "@/lib/bkt";
import type { FocusMode } from "@/lib/store";
import { isWeak, type CardState } from "@/lib/srs";
import { shuffle } from "@/lib/vocab";

export type AlefKind = "letter" | "vowel";

export type AlefItem = {
  key: string;
  kind: AlefKind;
  id: string;
  glyph: string;
  name: string;
  sound: string;
};

export function alefKey(kind: AlefKind, id: string): string {
  return `alef:${kind}:${id}`;
}

export function alefLetters(): AlefItem[] {
  return WRITE_LETTERS.map((l) => ({
    key: alefKey("letter", l.id),
    kind: "letter" as const,
    id: l.id,
    glyph: l.letter,
    name: l.name,
    sound: l.sound,
  }));
}

export function alefVowels(): AlefItem[] {
  return VOWELS.map((v) => ({
    key: alefKey("vowel", v.id),
    kind: "vowel" as const,
    id: v.id,
    glyph: v.mark,
    name: v.name,
    sound: v.sound,
  }));
}

export function alefAll(): AlefItem[] {
  return [...alefLetters(), ...alefVowels()];
}

export function alefByKeys(keys: string[]): AlefItem[] {
  const map = new Map(alefAll().map((x) => [x.key, x]));
  return keys.map((k) => map.get(k)).filter((x): x is AlefItem => Boolean(x));
}

export function pickAlefRound(
  pool: AlefItem[],
  _cards: Record<string, CardState>,
  _focus: FocusMode,
  limit = 12,
): AlefItem[] {
  return pickByBkt(pool, limit);
}

export function alefWeakKeys(cards: Record<string, CardState>): string[] {
  return alefAll()
    .filter((item) => isWeak(cards[item.key]))
    .sort((a, b) => (cards[b.key]?.misses ?? 0) - (cards[a.key]?.misses ?? 0))
    .map((item) => item.key);
}

export function shuffleAlef(items: AlefItem[]): AlefItem[] {
  return shuffle(items);
}
