export const STUDY_PATHS = ["bbh", "iibs"] as const;
export type StudyPath = (typeof STUDY_PATHS)[number];

export const PASS_MARK = 80;

export const IIBS_LEVELS = [
  { id: "A", title: "Level A", after: null },
  { id: "B", title: "Level B", after: "A" },
  { id: "C", title: "Level C", after: "B" },
  { id: "D", title: "Level D", after: "C" },
  { id: "E", title: "Level E", after: "D" },
  { id: "lab", title: "Hebrew Reading Lab", after: "E" },
] as const;

export type IibsLevelId = (typeof IIBS_LEVELS)[number]["id"];

const RANK: Record<IibsLevelId, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, lab: 5 };

export function isStudyPath(value: string | null | undefined): value is StudyPath {
  return value === "bbh" || value === "iibs";
}

export function isIibsLevel(value: string | null | undefined): value is IibsLevelId {
  return IIBS_LEVELS.some((level) => level.id === value);
}

/** `cleared` is the highest level whose exam is passed. Null means only Level A is open. */
export function levelOpen(id: IibsLevelId, cleared: IibsLevelId | null, admin: boolean): boolean {
  if (admin || id === "A") return true;
  const need = IIBS_LEVELS.find((level) => level.id === id)?.after;
  if (!need || !cleared) return false;
  return RANK[cleared] >= RANK[need];
}

export function levelAfter(id: IibsLevelId): string | null {
  return IIBS_LEVELS.find((level) => level.id === id)?.after ?? null;
}

const SHARED = ["/login", "/legal", "/credits", "/reset-password", "/ask", "/ideas"];

export const PATH_INTENT = "haday-path-intent";

export function stashPathIntent(path: StudyPath) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PATH_INTENT, path);
}

export function readPathIntent(): StudyPath | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PATH_INTENT);
  return isStudyPath(raw) ? raw : null;
}

export function blockedDestination(
  pathname: string,
  gate: { path: StudyPath | null; admin: boolean },
): "/" | null {
  if (gate.admin) return null;
  const shared = pathname === "/" || SHARED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (gate.path === null) return shared ? null : "/";
  if (gate.path === "iibs") {
    if (shared || pathname === "/iibs" || pathname.startsWith("/iibs/")) return null;
    return "/";
  }
  if (pathname === "/iibs" || pathname.startsWith("/iibs/")) return "/";
  return null;
}
