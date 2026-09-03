import { isMastered, isWeak, startOfDay, type CardState } from "@/lib/srs";
import { shuffle, bbhVocab, type VocabItem } from "@/lib/vocab";
import { type GameSnapshot } from "@/lib/game";

export type KeepFace = "he-en" | "en-he";
export type KeepWhy = "due" | "weak" | "cool";

export type KeepCard = VocabItem & { face: KeepFace; why: KeepWhy };

const DAY = 86_400_000;

/** Right at least once — a miss on a brand-new card does not count as met. */
export function hasMet(card: CardState | undefined): boolean {
  if (!card) return false;
  return card.hits >= 1 && card.last > 0;
}

/** If they play Game, stay inside unlocked chapters. Study-only: any hit word. */
export function keepChapterCap(game: GameSnapshot | undefined): number | null {
  if (!game) return null;
  const unlocked = Math.max(1, Number(game.unlockedChapter) || 1);
  const started = Object.values(game.chapters ?? {}).some(
    (ch) => ch.cleared || GAME_STAGES_DONE(ch),
  );
  if (unlocked <= 1 && !started) return null;
  return unlocked;
}

function GAME_STAGES_DONE(ch: { stages?: Record<string, { cleared?: boolean }> }): boolean {
  return Object.values(ch.stages ?? {}).some((s) => s.cleared);
}

function keepPool(cards: Record<string, CardState>, game?: GameSnapshot): VocabItem[] {
  const cap = keepChapterCap(game);
  return bbhVocab().filter((item) => {
    if (!hasMet(cards[item.id])) return false;
    if (cap != null && item.chapter > cap) return false;
    return true;
  });
}

export function keepStats(cards: Record<string, CardState>, game?: GameSnapshot, now = Date.now()) {
  const pool = keepPool(cards, game);
  let due = 0;
  let weak = 0;
  let mastered = 0;
  let cooling = 0;
  for (const item of pool) {
    const c = cards[item.id];
    if (!c) continue;
    if (c.due <= now) due += 1;
    if (isWeak(c)) weak += 1;
    if (isMastered(c)) {
      mastered += 1;
      if (c.last > 0 && now - c.last >= 3 * DAY) cooling += 1;
    }
  }
  return { seen: pool.length, due, weak, mastered, cooling, waiting: due + cooling + weak };
}

export function pickKeepRound(
  cards: Record<string, CardState>,
  game?: GameSnapshot,
  limit = 12,
  now = Date.now(),
): KeepCard[] {
  const seen = keepPool(cards, game);
  if (!seen.length) return [];

  const weak: VocabItem[] = [];
  const due: VocabItem[] = [];
  const cool: VocabItem[] = [];
  const rest: VocabItem[] = [];

  for (const item of seen) {
    const c = cards[item.id];
    if (!c) continue;
    if (isWeak(c)) weak.push(item);
    else if (c.due <= now) due.push(item);
    else if (isMastered(c)) cool.push(item);
    else rest.push(item);
  }

  weak.sort((a, b) => (cards[b.id]?.misses ?? 0) - (cards[a.id]?.misses ?? 0));
  due.sort((a, b) => (cards[a.id]?.due ?? 0) - (cards[b.id]?.due ?? 0));
  cool.sort((a, b) => (cards[a.id]?.last ?? 0) - (cards[b.id]?.last ?? 0));

  const n = Math.min(limit, seen.length);
  const takeWeak = Math.min(weak.length, Math.ceil(n * 0.35));
  const takeDue = Math.min(due.length, Math.ceil(n * 0.25));
  const takeCool = Math.min(cool.length, n - takeWeak - takeDue);

  const picked: Array<{ item: VocabItem; why: KeepWhy }> = [];
  const used = new Set<string>();
  function add(list: VocabItem[], why: KeepWhy, count: number) {
    for (const item of list) {
      if (picked.length >= n) return;
      if (used.has(item.id)) continue;
      if (count <= 0) return;
      used.add(item.id);
      picked.push({ item, why });
      count -= 1;
    }
  }
  add(weak, "weak", takeWeak);
  add(due, "due", takeDue);
  add(cool, "cool", takeCool);
  add(shuffle(rest), "due", n - picked.length);
  add(shuffle([...due, ...weak, ...cool]), "cool", n - picked.length);

  return shuffle(picked).map(({ item, why }, i) => ({
    ...item,
    why,
    face: i % 2 === 0 ? "he-en" : "en-he",
  }));
}

export function keepDoneToday(lastKeepDay: number, now = Date.now()): boolean {
  return lastKeepDay === startOfDay(now) && lastKeepDay > 0;
}
