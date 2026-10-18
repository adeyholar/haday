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

/** The path chooser is for a visitor, the owner, or an account that has no path yet. A placed student never sees it, including while their path is still loading. */
export function shouldShowPathChooser(input: {
  signedIn: boolean;
  resolved: boolean;
  admin: boolean;
  path: StudyPath | null;
}): boolean {
  if (!input.signedIn) return true;
  if (!input.resolved) return false;
  if (input.admin || !input.path) return true;
  return false;
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

export type GrammarTerm = 1 | 2;

export function grammarTerm(value: string | number | null | undefined): GrammarTerm {
  return value === 2 || value === "2" ? 2 : 1;
}

/** The semester stored on the account. */
export function termForAccount(gate: { term: GrammarTerm }): GrammarTerm {
  return gate.term === 2 ? 2 : 1;
}

const termListeners = new Set<(term: GrammarTerm) => void>();
let termRevision = 0;
let heldTerm: GrammarTerm = 1;

export function readTerm(): GrammarTerm {
  return heldTerm;
}

export function termRevisionNow(): number {
  return termRevision;
}

/** A door the admin just walked through. A slower account read must not pull them back. */
export function publishTerm(term: GrammarTerm) {
  termRevision += 1;
  heldTerm = term;
  for (const hear of termListeners) hear(term);
}

export function noteServerTerm(term: GrammarTerm, seenRevision: number): GrammarTerm {
  if (termRevision !== seenRevision) return heldTerm;
  heldTerm = term;
  return term;
}

export function subscribeTerm(hear: (term: GrammarTerm) => void): () => void {
  termListeners.add(hear);
  return () => termListeners.delete(hear);
}

const SECOND_ROOM = ["/bbh", "/ask", "/ideas", "/guide", "/legal", "/credits", "/how-to-memorize-biblical-hebrew-vocabulary"];

/** Study tools that read the open week, plus Semester 2’s own game, exams, and listen under /study/term2. Semester 1 Game, Listen, and Keep stay blocked. */
const TERM2_STUDY = ["/drill", "/quiz", "/write", "/match", "/browse", "/weak", "/study/term2"];

/** A semester room is closed while the other is open, and while they are still choosing. */
export function secondTermBlock(pathname: string, term: GrammarTerm, hall = false): "/bbh" | null {
  if (term !== 2 && !hall) return null;
  if (pathname === "/" || pathname === "/bbh") return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/iibs")) return null;
  if (SECOND_ROOM.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;
  if (term === 2 && !hall && TERM2_STUDY.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }
  return "/bbh";
}

export const TERM_HALL = "haday-term-hall";

const hallListeners = new Set<() => void>();

export function termHallOpen(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(TERM_HALL) === "1";
}

/** Mark the hall without telling the open page. Used before a navigation. */
export function markTermHall() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TERM_HALL, "1");
}

export function openTermHall() {
  markTermHall();
  for (const hear of hallListeners) hear();
}

export function closeTermHall() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TERM_HALL);
  for (const hear of hallListeners) hear();
}

export function subscribeHall(hear: () => void): () => void {
  hallListeners.add(hear);
  return () => hallListeners.delete(hear);
}

const SHARED = [
  "/login",
  "/legal",
  "/credits",
  "/how-to-memorize-biblical-hebrew-vocabulary",
  "/reset-password",
  "/ask",
  "/ideas",
];

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
