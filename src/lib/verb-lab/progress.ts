import { isClassId, type ClassId } from "@/lib/verb-lab/data";
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

/** Pe-Aleph and the strong verb used to share one key. The class keeps them apart. */
export function progressKey(classId: ClassId, squareId: string): string {
  return `${classId}|${squareId}`;
}

export function readProgressKey(key: string): { classId: ClassId; squareId: string } | null {
  const bar = key.indexOf("|");
  if (bar <= 0) return null;
  const classId = key.slice(0, bar);
  const squareId = key.slice(bar + 1);
  if (!isClassId(classId) || !keepSquare(squareId)) return null;
  return { classId, squareId };
}

function clampBox(value: unknown): number | null {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(5, n);
}

function keepSquare(id: string): boolean {
  return id.length > 0 && id.length < 80 && !id.includes("|") && !isNoFormSquare(id) && id.includes(".");
}

/**
 * A save from before class keys is read as the strong verb.
 * A class key already stored is kept, and it wins over the old bare key.
 */
function placeKey(id: string): string | null {
  if (id.includes("|")) {
    const parsed = readProgressKey(id);
    return parsed ? progressKey(parsed.classId, parsed.squareId) : null;
  }
  if (!keepSquare(id)) return null;
  return progressKey("strong", id);
}

function putNumber(target: Record<string, number>, id: string, value: number, scoped: boolean) {
  const key = placeKey(id);
  if (!key) return;
  if (!scoped && target[key] != null) return;
  target[key] = value;
}

export function hydrateVerbLab(raw: unknown): VerbLabProgress {
  if (!raw || typeof raw !== "object") return { ...EMPTY_VERB_LAB, boxes: {}, due: {}, cleared: [] };
  const r = raw as Partial<VerbLabProgress>;
  const boxes: Record<string, number> = {};
  if (r.boxes && typeof r.boxes === "object") {
    const entries = Object.entries(r.boxes);
    for (const [id, value] of entries) {
      if (!id.includes("|")) continue;
      const box = clampBox(value);
      if (box) putNumber(boxes, id, box, true);
    }
    for (const [id, value] of entries) {
      if (id.includes("|")) continue;
      const box = clampBox(value);
      if (box) putNumber(boxes, id, box, false);
    }
  }
  const due: Record<string, number> = {};
  if (r.due && typeof r.due === "object") {
    const entries = Object.entries(r.due);
    for (const [id, value] of entries) {
      const n = Math.round(Number(value));
      if (!Number.isFinite(n) || n <= 0) continue;
      if (!id.includes("|")) continue;
      putNumber(due, id, Math.min(99, n), true);
    }
    for (const [id, value] of entries) {
      const n = Math.round(Number(value));
      if (!Number.isFinite(n) || n <= 0) continue;
      if (id.includes("|")) continue;
      putNumber(due, id, Math.min(99, n), false);
    }
  }
  const cleared = new Set<string>();
  if (Array.isArray(r.cleared)) {
    for (const id of r.cleared) {
      if (typeof id !== "string" || !id.includes("|")) continue;
      const key = placeKey(id);
      if (key) cleared.add(key);
    }
    for (const id of r.cleared) {
      if (typeof id !== "string" || id.includes("|")) continue;
      const key = placeKey(id);
      if (key) cleared.add(key);
    }
  }
  let continueId: string | null = null;
  if (typeof r.continueId === "string") {
    continueId = placeKey(r.continueId);
  }
  return { welcomed: Boolean(r.welcomed), boxes, due, cleared: [...cleared], continueId };
}

export function dueTotal(progress: VerbLabProgress): number {
  return Object.values(progress.due).reduce((sum, n) => sum + n, 0);
}

export function firstDueId(progress: VerbLabProgress): string | null {
  const ids = Object.keys(progress.due).sort((a, b) => (progress.due[b] ?? 0) - (progress.due[a] ?? 0) || a.localeCompare(b));
  return ids[0] ?? null;
}
