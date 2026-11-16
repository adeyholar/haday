import { iibsLegacyId, iibsPathItems, iibsStudyIdSet } from "@/lib/iibs-weeks";
import { glossMatches, quizChoices, type VocabItem } from "@/lib/vocab";

export type PassageAsk = "choice" | "gloss";

export type PassageSitting = {
  scope: "iibs" | "bbh";
  ref: string;
  label: string;
  back: string;
  ask: PassageAsk;
  /** The list this sitting started with. */
  ids: string[];
  /** What is still ahead, including a miss that comes back once. */
  queue: string[];
  retried: string[];
  /** First answer for a word already graded. */
  first: Record<string, boolean>;
  at: number;
};

const SITTING_KEY = /^(iibs|bbh):[A-Za-z0-9.]{1,16}$/;
const SITTING_KEEP = 8;

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

export function passageSittingKey(scope: string, ref: string): string {
  const face = scope === "iibs" ? "iibs" : "bbh";
  return `${face}:${ref}`;
}

function keepId(id: string, scope: "iibs" | "bbh"): string | null {
  if (typeof id !== "string" || !id || id.length > 80) return null;
  if (scope !== "iibs") return id;
  const next = iibsLegacyId(id) ?? id;
  return iibsStudyIdSet().has(next) ? next : null;
}

function keepIds(raw: unknown, scope: "iibs" | "bbh", allowed?: Set<string>): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of raw) {
    const next = keepId(id, scope);
    if (!next || seen.has(next)) continue;
    if (allowed && !allowed.has(next)) continue;
    seen.add(next);
    out.push(next);
    if (out.length >= 80) break;
  }
  return out;
}

/** Drop a broken row. Keep the eight newest open sittings. */
export function hydratePassageSittings(raw: unknown): Record<string, PassageSitting> {
  const out: Record<string, PassageSitting> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!SITTING_KEY.test(key) || !val || typeof val !== "object") continue;
    const row = val as Partial<PassageSitting>;
    if (row.ask !== "choice" && row.ask !== "gloss") continue;
    const scope = key.startsWith("iibs:") ? "iibs" : "bbh";
    const ref = key.slice(scope.length + 1);
    const ids = keepIds(row.ids, scope);
    if (!ids.length) continue;
    const allowed = new Set(ids);
    const queue = keepIds(row.queue, scope, allowed);
    if (!queue.length) continue;
    const first: Record<string, boolean> = {};
    if (row.first && typeof row.first === "object") {
      for (const [id, ok] of Object.entries(row.first)) {
        const next = keepId(id, scope);
        if (!next || !allowed.has(next) || typeof ok !== "boolean") continue;
        first[next] = ok;
      }
    }
    out[key] = {
      scope,
      ref,
      label: typeof row.label === "string" ? row.label.slice(0, 80) : ref,
      back: typeof row.back === "string" ? row.back.slice(0, 180) : "",
      ask: row.ask,
      ids,
      queue,
      retried: keepIds(row.retried, scope, allowed),
      first,
      at: Math.max(0, Math.round(Number(row.at) || 0)),
    };
  }
  const ranked = Object.entries(out).sort((a, b) => b[1].at - a[1].at).slice(0, SITTING_KEEP);
  return Object.fromEntries(ranked);
}

/** The open sitting for this passage, or the newest one when no passage was named. */
export function openPassageSitting(
  sittings: Record<string, PassageSitting> | undefined,
  key?: string,
): PassageSitting | null {
  if (!sittings) return null;
  if (key) return sittings[key]?.queue.length ? sittings[key] : null;
  let best: PassageSitting | null = null;
  for (const sitting of Object.values(sittings)) {
    if (!sitting.queue.length) continue;
    if (!best || sitting.at > best.at) best = sitting;
  }
  return best;
}
