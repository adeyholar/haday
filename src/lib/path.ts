export const STUDY_PATHS = ["bbh", "iibs"] as const;
export type StudyPath = (typeof STUDY_PATHS)[number];

/** How a new student heard about HaDay. College and an online Bible school suggest a path. */
export const HEARD_SOURCES = ["college", "iibs", "other"] as const;
export type HeardSource = (typeof HEARD_SOURCES)[number];

export function isHeardSource(value: string | null | undefined): value is HeardSource {
  return value === "college" || value === "iibs" || value === "other";
}

/** College suggests Grammar Path. An online Bible school suggests Scripture Path. Internet or a friend must choose. The student confirms before the account is created. */
export function pathForHeard(source: HeardSource | "", chosen: StudyPath | ""): StudyPath | null {
  if (source === "college") return "bbh";
  if (source === "iibs") return "iibs";
  if (source === "other" && (chosen === "bbh" || chosen === "iibs")) return chosen;
  return null;
}

export const PASS_MARK = 90;

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

/** A signed-in student opens their study. The owner stays on the two doors. */
export function homeForAccount(gate: { path: StudyPath | null; admin: boolean }): "/bbh" | "/iibs" | null {
  if (gate.admin || !gate.path) return null;
  return gate.path === "iibs" ? "/iibs" : "/bbh";
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
export const OPEN_DOOR = "haday-open-door";

export function stashPathIntent(path: StudyPath) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PATH_INTENT, path);
}

export function readPathIntent(): StudyPath | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PATH_INTENT);
  return isStudyPath(raw) ? raw : null;
}

export function rememberDoor(path: StudyPath) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(OPEN_DOOR, path);
}

export function currentDoor(): StudyPath | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(OPEN_DOOR);
  return isStudyPath(raw) ? raw : null;
}

export function clearDoor() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(OPEN_DOOR);
}

function isShared(pathname: string, owner = false): boolean {
  if (pathname === "/") return true;
  const list = owner ? ["/admin", ...SHARED] : SHARED;
  return list.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function onIibsPath(pathname: string): boolean {
  return pathname === "/iibs" || pathname.startsWith("/iibs/");
}

/** The owner may hold one open door. The other study sends them back to the two squares. */
export function ownerDoorBlock(pathname: string, door: StudyPath | null): "/" | null {
  if (isShared(pathname, true)) return null;
  if (onIibsPath(pathname)) return door === "iibs" ? null : "/";
  return door === "bbh" ? null : "/";
}

export function blockedDestination(
  pathname: string,
  gate: { path: StudyPath | null; admin: boolean },
): "/" | null {
  if (gate.admin) return null;
  const shared = isShared(pathname);
  if (gate.path === null) return shared ? null : "/";
  if (gate.path === "iibs") {
    if (shared || onIibsPath(pathname)) return null;
    return "/";
  }
  if (onIibsPath(pathname)) return "/";
  return null;
}
