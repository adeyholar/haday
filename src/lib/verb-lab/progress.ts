import { isNoFormSquare } from "@/lib/verb-lab/stems";

export type VerbLabProgress = {
  welcomed: boolean;
  boxes: Record<string, number>;
  /** Missed exam squares. The number is how many forms were missed. No-form squares are never stored. */
  due: Record<string, number>;
  cleared: string[];
  continueId: string | null;
};

export const EMPTY_VERB_LAB: VerbLabProgress = {
  welcomed: false,
  boxes: {},
  due: {},
  cleared: [],
  continueId: null,
};

function clampBox(value: unknown): number | null {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(5, n);
}

function keepSquare(id: string): boolean {
  return id.length > 0 && id.length < 80 && !isNoFormSquare(id) && id.includes(".");
}

export function hydrateVerbLab(raw: unknown): VerbLabProgress {
  if (!raw || typeof raw !== "object") return { ...EMPTY_VERB_LAB, boxes: {}, due: {}, cleared: [] };
  const r = raw as Partial<VerbLabProgress>;
  const boxes: Record<string, number> = {};
  if (r.boxes && typeof r.boxes === "object") {
    for (const [id, value] of Object.entries(r.boxes)) {
      const box = clampBox(value);
      if (box && keepSquare(id)) boxes[id] = box;
    }
  }
  const due: Record<string, number> = {};
  if (r.due && typeof r.due === "object") {
    for (const [id, value] of Object.entries(r.due)) {
      const n = Math.round(Number(value));
      if (Number.isFinite(n) && n > 0 && keepSquare(id)) due[id] = Math.min(99, n);
    }
  }
  const cleared = Array.isArray(r.cleared)
    ? [...new Set(r.cleared.filter((id): id is string => typeof id === "string" && keepSquare(id)))]
    : [];
  const continueId = typeof r.continueId === "string" && keepSquare(r.continueId) ? r.continueId : null;
  return { welcomed: Boolean(r.welcomed), boxes, due, cleared, continueId };
}

export function dueTotal(progress: VerbLabProgress): number {
  return Object.values(progress.due).reduce((sum, n) => sum + n, 0);
}

export function firstDueId(progress: VerbLabProgress): string | null {
  const ids = Object.keys(progress.due).sort((a, b) => (progress.due[b] ?? 0) - (progress.due[a] ?? 0) || a.localeCompare(b));
  return ids[0] ?? null;
}
