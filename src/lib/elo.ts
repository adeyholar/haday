import type { VocabItem } from "@/lib/vocab";
import { weaknessScore, type CardState } from "@/lib/srs";

const KEY = "haday-elo-v1";
const K = 22;
const START = 1000;

type EloBank = { student: number; items: Record<string, number> };

function load(): EloBank {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { student: START, items: {} };
    const parsed = JSON.parse(raw) as Partial<EloBank>;
    return {
      student: Number(parsed.student) || START,
      items: parsed.items && typeof parsed.items === "object" ? parsed.items : {},
    };
  } catch {
    return { student: START, items: {} };
  }
}

function save(bank: EloBank) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bank));
  } catch {
    /* quota */
  }
}

function expected(student: number, item: number): number {
  return 1 / (1 + 10 ** ((item - student) / 400));
}

export function itemElo(item: VocabItem): number {
  const bank = load();
  if (Number.isFinite(bank.items[item.id])) return bank.items[item.id];
  return START + Math.max(0, (item.chapter - 1) * 22);
}

export function updateElo(item: VocabItem, correct: boolean) {
  const bank = load();
  const s = bank.student;
  const i = Number.isFinite(bank.items[item.id]) ? bank.items[item.id] : START + Math.max(0, (item.chapter - 1) * 22);
  const exp = expected(s, i);
  const score = correct ? 1 : 0;
  bank.student = s + K * (score - exp);
  bank.items[item.id] = i + K * (exp - score);
  save(bank);
}

/** Prefer items the student is about 50% likely to get, mixed with weak cards. */
export function pickEloDeck(
  pool: VocabItem[],
  cards: Record<string, CardState>,
  limit: number,
): VocabItem[] {
  if (pool.length <= limit) {
    const a = [...pool];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const student = load().student;
  const scored = pool.map((item) => {
    const exp = expected(student, itemElo(item));
    const near = Math.abs(exp - 0.5);
    const weak = weaknessScore(cards[item.id]);
    return { item, cost: near - 0.18 * weak };
  });
  scored.sort((a, b) => a.cost - b.cost);
  const bag = scored.slice(0, Math.min(pool.length, limit * 2)).map((x) => x.item);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag.slice(0, limit);
}
