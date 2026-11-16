import { iibsPathItems } from "@/lib/iibs-weeks";
import { glossMatches, quizChoices, type VocabItem } from "@/lib/vocab";

export type PassageAsk = "choice" | "gloss";

/** Four meanings. The wrong ones are look-alikes from the Scripture Path lists, not a random slice. */
export function passageChoices(item: VocabItem, pool: VocabItem[] = iibsPathItems()): string[] {
  return quizChoices(item, pool);
}

export function passageGlossHit(item: VocabItem, raw: string): boolean {
  return glossMatches(item, raw);
}

/**
 * A hit leaves the queue. A miss comes back once, at the end.
 * A second miss on that word does not start another lap.
 */
export function stepPassage(queue: readonly string[], ok: boolean, retried: ReadonlySet<string>): { queue: string[]; retried: Set<string> } {
  const id = queue[0];
  if (!id) return { queue: [...queue], retried: new Set(retried) };
  const rest = queue.slice(1);
  if (ok || retried.has(id)) return { queue: rest, retried: new Set(retried) };
  const next = new Set(retried);
  next.add(id);
  return { queue: [...rest, id], retried: next };
}
