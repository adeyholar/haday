import { EMPTY_PROGRESS, type ParadigmProgress } from "@/lib/paradigms/types";
import { sanitizeProgress } from "@/lib/paradigms/progress-shape";

const KEY = "haday.paradigms.v1";

export function readLocalProgress(): ParadigmProgress {
  if (typeof window === "undefined") return { ...EMPTY_PROGRESS, boxes: {}, skips: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_PROGRESS, boxes: {}, skips: [] };
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return { ...EMPTY_PROGRESS, boxes: {}, skips: [] };
  }
}

export function writeLocalProgress(progress: ParadigmProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sanitizeProgress(progress)));
  } catch {
    /* private mode */
  }
}
