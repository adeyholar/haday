import { clampBox } from "@/lib/paradigms/leitner";
import {
  EMPTY_PROGRESS,
  isLevelId,
  type ParadigmProgress,
  type PlacementSource,
  type SkipRecord,
} from "@/lib/paradigms/types";

const SOURCES: readonly PlacementSource[] = ["unset", "quiz", "skip", "chairman"];
const MAX_SKIPS = 200;
const CELL_ID = /^[A-Za-z][A-Za-z-]*\.[A-Za-z0-9.-]+$/;

function isSource(value: string): value is PlacementSource {
  return (SOURCES as readonly string[]).includes(value);
}

export function sanitizeProgress(input: unknown): ParadigmProgress {
  if (!input || typeof input !== "object") return { ...EMPTY_PROGRESS, boxes: {}, skips: [] };
  const row = input as Partial<ParadigmProgress>;
  const level = typeof row.level === "string" && isLevelId(row.level) ? row.level : "L1";
  const source = typeof row.source === "string" && isSource(row.source) ? row.source : "unset";
  const boxes: Record<string, number> = {};
  if (row.boxes && typeof row.boxes === "object") {
    for (const [id, value] of Object.entries(row.boxes)) {
      if (!CELL_ID.test(id) || typeof value !== "number" || !Number.isFinite(value)) continue;
      boxes[id] = clampBox(value);
    }
  }
  const skips: SkipRecord[] = [];
  if (Array.isArray(row.skips)) {
    for (const item of row.skips) {
      if (!item || typeof item !== "object") continue;
      const skip = item as Partial<SkipRecord>;
      if (typeof skip.at !== "string" || typeof skip.lessonKey !== "string") continue;
      skips.push({
        at: skip.at.slice(0, 40),
        lessonKey: skip.lessonKey.slice(0, 120),
        itemId: typeof skip.itemId === "string" ? skip.itemId.slice(0, 80) : null,
      });
    }
  }
  return {
    level,
    placed: row.placed === true || source === "quiz" || source === "skip" || source === "chairman",
    source: row.placed === true || source !== "unset" ? source : "unset",
    boxes,
    skips: skips.slice(-MAX_SKIPS),
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : "",
  };
}

/** A fresh placement replaces a hand-set level. Box practice does not. */
export function mergeStudentSave(existing: ParadigmProgress | null, incoming: ParadigmProgress): ParadigmProgress {
  const next = sanitizeProgress(incoming);
  const placement = next.source === "quiz" || next.source === "skip";
  if (existing?.source === "chairman" && !placement) {
    return sanitizeProgress({
      ...next,
      level: existing.level,
      placed: true,
      source: "chairman",
      updatedAt: next.updatedAt || new Date().toISOString(),
    });
  }
  return sanitizeProgress({ ...next, updatedAt: next.updatedAt || new Date().toISOString() });
}
