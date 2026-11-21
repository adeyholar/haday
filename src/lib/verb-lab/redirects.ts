import { stemByAlias, type StemId } from "@/lib/verb-lab/stems";

export type VerbLabFrom = "learn" | "practice" | "play";
export type VerbLabView = "room" | "welcome" | "square" | "exam";
export type VerbLabTab = "chart" | "practice";
export type VerbLabMode = "quiz" | "drill";

export type VerbLabSearch = {
  from?: VerbLabFrom;
  view?: VerbLabView;
  square?: string;
  tab?: VerbLabTab;
  mode?: VerbLabMode;
  exam?: string;
  stem?: StemId;
  weak?: string;
};

export type LegacyTarget = {
  to: "/verb-lab" | "/iibs/verb-lab";
  search: VerbLabSearch;
};

const FROM: readonly VerbLabFrom[] = ["learn", "practice", "play"];
const VIEWS: readonly VerbLabView[] = ["room", "welcome", "square", "exam"];
const TABS: readonly VerbLabTab[] = ["chart", "practice"];
const MODES: readonly VerbLabMode[] = ["quiz", "drill"];

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function readVerbLabSearch(search: Record<string, unknown>): VerbLabSearch {
  const stem = typeof search.stem === "string" ? stemByAlias(search.stem) ?? undefined : undefined;
  const out: VerbLabSearch = {};
  const from = oneOf(search.from, FROM);
  const view = oneOf(search.view, VIEWS);
  const tab = oneOf(search.tab, TABS);
  const mode = oneOf(search.mode, MODES);
  if (from) out.from = from;
  if (view) out.view = view;
  if (typeof search.square === "string" && search.square.includes(".")) out.square = search.square;
  if (tab) out.tab = tab;
  if (mode) out.mode = mode;
  if (typeof search.exam === "string" && search.exam.length > 0 && search.exam.length < 40) out.exam = search.exam;
  if (stem) out.stem = stem;
  if (typeof search.weak === "string" && search.weak.length > 0 && search.weak.length < 40) out.weak = search.weak;
  return out;
}

function plainHash(hash: string): string {
  return hash.replace(/^#/, "").trim();
}

/** Old paradigm doors, one target each. The grammar lesson track stays where it is. */
const EXACT: Record<string, VerbLabSearch> = {
  "/study/verb-lab/qal-perfect": { view: "square", square: "Qal.qatal", tab: "practice" },
  "/study/verb-lab/qal-clocks": { view: "square", square: "Qal.yiqtol", tab: "practice" },
  "/game/qal-perfect": { view: "exam", exam: "qal-perfect", stem: "Qal" },
  "/game/qal-imperfect": { view: "square", square: "Qal.yiqtol", tab: "practice" },
  "/game/verb-paradigm-quest": { view: "square", square: "Qal.qatal", tab: "practice" },
  "/game/verbal-system": { view: "room" },
  "/iibs/qal-imperfect": { view: "square", square: "Qal.yiqtol", tab: "practice" },
  "/iibs/verb-paradigm-quest": { view: "square", square: "Qal.qatal", tab: "practice" },
  "/iibs/verbal-system": { view: "room" },
  "/iibs/binyanim": { view: "welcome" },
};

export function legacyVerbTarget(pathname: string, hash = ""): LegacyTarget | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const search = EXACT[path];
  if (!search) return null;
  const scripture = path.startsWith("/iibs/");
  const next: VerbLabSearch = { ...search };
  if (path === "/game/verbal-system" || path === "/iibs/verbal-system") {
    const stem = stemByAlias(plainHash(hash));
    if (stem) next.stem = stem;
  }
  return { to: scripture ? "/iibs/verb-lab" : "/verb-lab", search: next };
}

export function legacyVerbPaths(): string[] {
  return Object.keys(EXACT);
}
