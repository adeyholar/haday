import { EMPTY_PROGRESS, type ParadigmProgress } from "@/lib/paradigms/types";
import { sanitizeProgress } from "@/lib/paradigms/progress-shape";

const PREFIX = "haday.paradigms.v1.";
const LEGACY_KEY = "haday.paradigms.v1";

function empty(): ParadigmProgress {
  return { ...EMPTY_PROGRESS, boxes: {}, skips: [] };
}

export function progressStorageKey(userId: string): string {
  return `${PREFIX}${userId}`;
}

function dropLegacy(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* private mode */
  }
}

export function readLocalProgress(userId: string): ParadigmProgress {
  dropLegacy();
  if (!userId || typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(progressStorageKey(userId));
    if (!raw) return empty();
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return empty();
  }
}

export function writeLocalProgress(userId: string, progress: ParadigmProgress): void {
  dropLegacy();
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(progressStorageKey(userId), JSON.stringify(sanitizeProgress(progress)));
  } catch {
    /* private mode */
  }
}
