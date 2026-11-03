import { hydrateDrillRuns, type DrillPlace, type DrillRuns } from "@/lib/etch";

/** This device's copy of the final exam drill. It survives a reload that brings back an older server snapshot. */
export const FINAL_DRILL_STORAGE_KEY = "haday-final-drill-v1";

type Store = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

type FileShape = {
  ownerId?: string;
  due?: DrillPlace;
  weak?: DrillPlace;
};

function faceOf(key: string): "due" | "weak" | null {
  if (key === "final:due") return "due";
  if (key === "final:weak") return "weak";
  return null;
}

function readFile(storage: Store): FileShape {
  try {
    const raw = storage.getItem(FINAL_DRILL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FileShape;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** The saved final exam sittings for this account. A different account on the device is ignored. */
export function readFinalDrillRuns(storage: Store | null, ownerId: string | null): DrillRuns {
  if (!storage) return {};
  const file = readFile(storage);
  if (file.ownerId && ownerId && file.ownerId !== ownerId) return {};
  if (file.ownerId && !ownerId) return {};
  return hydrateDrillRuns({ "final:due": file.due, "final:weak": file.weak });
}

export function writeFinalDrillRun(storage: Store | null, ownerId: string | null, key: string, place: DrillPlace | null) {
  const face = faceOf(key);
  if (!storage || !face) return;
  const current = readFile(storage);
  const sameOwner = !current.ownerId || !ownerId || current.ownerId === ownerId;
  const next: FileShape = sameOwner ? { ...current } : {};
  const clean = place ? hydrateDrillRuns({ [key]: place })[key] : undefined;
  if (place && !clean) return;
  if (clean) next[face] = clean;
  else delete next[face];
  if (ownerId) next.ownerId = ownerId;
  try {
    if (!next.due && !next.weak) storage.removeItem(FINAL_DRILL_STORAGE_KEY);
    else storage.setItem(FINAL_DRILL_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* the sitting is still in memory */
  }
}

export function clearFinalDrillFile(storage: Store | null) {
  try {
    storage?.removeItem(FINAL_DRILL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Keep the further sitting. A copy that is only on this device wins when the server snapshot never received it.
 * A different word list on the server is left alone.
 */
export function mergeFinalDrillRuns(runs: DrillRuns, saved: DrillRuns): DrillRuns {
  let next: DrillRuns | null = null;
  for (const key of ["final:due", "final:weak"] as const) {
    const local = saved[key];
    if (!local?.ids.length) continue;
    const remote = runs[key];
    const takeLocal = !remote?.ids.length || (remote.fingerprint === local.fingerprint && local.index > remote.index);
    if (!takeLocal) continue;
    next ??= { ...runs };
    next[key] = local;
  }
  return next ?? runs;
}

export function browserDrillStorage(): Store | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function applySavedFinalDrill(runs: DrillRuns, ownerId: string | null): DrillRuns {
  return mergeFinalDrillRuns(runs, readFinalDrillRuns(browserDrillStorage(), ownerId));
}
