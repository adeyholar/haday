import { isHighWeak, isWeak, weaknessScore, type CardState } from "@/lib/srs";
import { alphabetVocab, bbhVocab, type VocabItem } from "@/lib/vocab";

/** Letters plus class lemmas. Not the extra dump past the course. */
export function classVocab(): VocabItem[] {
  return [...alphabetVocab(), ...bbhVocab()];
}

export type WeakRun = {
  ids: string[];
  index: number;
};

/** Every word that is weak, told answers first. */
export function weakPool(cards: Record<string, CardState | undefined>, items: VocabItem[]): VocabItem[] {
  return items
    .filter((item) => isWeak(cards[item.id]))
    .sort((a, b) => {
      const high = Number(isHighWeak(cards[b.id])) - Number(isHighWeak(cards[a.id]));
      if (high !== 0) return high;
      const score = weaknessScore(cards[b.id]) - weaknessScore(cards[a.id]);
      if (score !== 0) return score;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}

export function packWeakRun(ids: string[], index: number): WeakRun | null {
  if (!ids.length || !Number.isInteger(index) || index < 0 || index >= ids.length) return null;
  return { ids: [...ids], index };
}

export function hydrateWeakRun(raw: unknown): WeakRun | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<WeakRun>;
  if (!Array.isArray(r.ids) || r.ids.length === 0) return null;
  if (!r.ids.every((id) => typeof id === "string" && id.length > 0)) return null;
  const index = Number(r.index);
  if (!Number.isInteger(index) || index < 0 || index >= r.ids.length) return null;
  return { ids: r.ids, index };
}

/** Resume the saved sitting. A missing word is skipped; the index stays on the same word. */
export function unpackWeakRun(
  run: WeakRun | null | undefined,
  items: VocabItem[],
): { queue: VocabItem[]; index: number } | null {
  const clean = hydrateWeakRun(run);
  if (!clean) return null;
  const byId = new Map(items.map((item) => [item.id, item]));
  const queue: VocabItem[] = [];
  let index = 0;
  let placed = false;
  for (let i = 0; i < clean.ids.length; i++) {
    const item = byId.get(clean.ids[i] ?? "");
    if (!item) continue;
    if (!placed && i >= clean.index) {
      index = queue.length;
      placed = true;
    }
    queue.push(item);
  }
  if (!queue.length || !placed) return null;
  return { queue, index };
}
