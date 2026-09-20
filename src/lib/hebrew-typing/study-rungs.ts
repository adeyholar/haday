import { IL_ROWS } from "@/lib/hebrew-typing/layout";
import { GAME_WORDS, STUDY_WORDS, type TypeWord } from "@/lib/hebrew-typing/bank";
import { units } from "@/lib/hebrew-typing/engine";

export const HOME_LEFT = ["ש", "ד", "ג", "כ", "ע"];
export const HOME_RIGHT = ["י", "ח", "ל", "ך", "ף"];
export const HOME_ROW = IL_ROWS[1]!;
export const UPPER_ROW = ["ק", "ר", "א", "ט", "ו"];
export const LOWER_ROW = ["ז", "ס", "ב", "ה", "נ", "מ"];
export const OUTER_ROW = ["ן", "ם", "פ", "צ", "ת", "ץ"];

export type StudyRungId =
  | "home-left"
  | "home-right"
  | "home-mix"
  | "upper"
  | "lower"
  | "outer"
  | "mix"
  | "blind"
  | "words"
  | "tanakh";

export type StudyRung = {
  id: StudyRungId;
  title: string;
  hint: string;
  /** Hide glyphs on the board so eyes stay on the word. */
  blind?: boolean;
};

/** Touch-typing path: few new keys, many repeats, then hide the board. */
export const STUDY_TYPE_RUNGS: StudyRung[] = [
  { id: "home-left", title: "Home left", hint: "Rest left fingers on ש ד ג כ ע. Eyes on the word, not the keys." },
  { id: "home-right", title: "Home right", hint: "Right hand on י ח ל ך ף. Return to home after every letter." },
  { id: "home-mix", title: "Home mix", hint: "Both hands. Same ten keys, many times, until it is muscle." },
  { id: "upper", title: "Reach up", hint: "ק ר א ט ו — still start from home row." },
  { id: "lower", title: "Reach down", hint: "ז ס ב ה נ מ — dip, then home again." },
  { id: "outer", title: "Edges & finals", hint: "ן ם פ צ ת ץ. Finals live on their own keys." },
  { id: "mix", title: "Whole board", hint: "Any letter. Keep watching the word." },
  { id: "blind", title: "Eyes up", hint: "Letters come off the keys. Trust the finger.", blind: true },
  { id: "words", title: "Short words", hint: "A few letters at a time." },
  { id: "tanakh", title: "From the Tanakh", hint: "Short snippets first, then longer ones.", blind: true },
];

export const STUDY_RUNG_MAX = STUDY_TYPE_RUNGS.length - 1;

export function clampStudyRung(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(STUDY_RUNG_MAX, Math.round(n)));
}

/** Old 5-step ladder → new 10-step curriculum (once). */
export function migrateOldStudyRung(old: number): number {
  const map = [0, 3, 6, 8, 9];
  if (old >= 0 && old < map.length) return map[old]!;
  return clampStudyRung(old);
}

function rng(seed: number) {
  let x = Math.abs(seed) % 2147483647 || 1;
  return () => {
    x = (x * 48271) % 2147483647;
    return x / 2147483647;
  };
}

function pick(rand: () => number, keys: string[]): string {
  return keys[Math.floor(rand() * keys.length)]!;
}

/** Isolated letters, then pairs, then 3-letter strings — classic tutor pattern. */
export function drillLines(known: string[], fresh: string[], seed: number): string[] {
  const rand = rng(seed);
  const pool = [...new Set([...known, ...fresh])];
  const out: string[] = [];
  const focus = fresh.length ? fresh : known;
  for (let t = 0; t < 3; t++) {
    for (const k of focus) out.push(k);
  }
  for (let i = 0; i < 6; i++) {
    const a = pick(rand, focus);
    const b = pick(rand, pool);
    out.push(a + b);
  }
  for (let i = 0; i < 8; i++) {
    out.push(pick(rand, pool) + pick(rand, pool) + pick(rand, pool));
  }
  return out;
}

export function tanakhBasic(): TypeWord[] {
  return GAME_WORDS.filter((w) => units(w.hebrew).length <= 5).slice(0, 8);
}

export function tanakhComplex(): TypeWord[] {
  return GAME_WORDS.filter((w) => units(w.hebrew).length > 5).slice(0, 8);
}

export function studyRungTargets(rung: number, seed = 1, tanakhDeep = false): string[] {
  const id = STUDY_TYPE_RUNGS[clampStudyRung(rung)]?.id;
  if (id === "home-left") return drillLines([], HOME_LEFT, seed);
  if (id === "home-right") return drillLines(HOME_LEFT, HOME_RIGHT, seed);
  if (id === "home-mix") return drillLines(HOME_ROW, [], seed + 1);
  if (id === "upper") return drillLines(HOME_ROW, UPPER_ROW, seed);
  if (id === "lower") return drillLines([...HOME_ROW, ...UPPER_ROW], LOWER_ROW, seed);
  if (id === "outer") return drillLines([...HOME_ROW, ...UPPER_ROW, ...LOWER_ROW], OUTER_ROW, seed);
  if (id === "mix" || id === "blind") {
    const all = [...HOME_ROW, ...UPPER_ROW, ...LOWER_ROW, ...OUTER_ROW];
    return drillLines(all, [], seed + (id === "blind" ? 9 : 3));
  }
  if (id === "words") return [...STUDY_WORDS, ...STUDY_WORDS];
  const bank = tanakhDeep ? tanakhComplex() : tanakhBasic();
  return (bank.length ? bank : GAME_WORDS.slice(0, 8)).map((w) => w.hebrew);
}

export function studyRungWords(rung: number, tanakhDeep = false): TypeWord[] | null {
  const id = STUDY_TYPE_RUNGS[clampStudyRung(rung)]?.id;
  if (id !== "tanakh") return null;
  const bank = tanakhDeep ? tanakhComplex() : tanakhBasic();
  return bank.length ? bank : GAME_WORDS.slice(0, 8);
}

export function studyRungBlind(rung: number): boolean {
  return Boolean(STUDY_TYPE_RUNGS[clampStudyRung(rung)]?.blind);
}

/** Keys the student has already met on this rung — glow still allowed; labels hide when blind. */
export function studyRungKeys(rung: number): string[] {
  const id = STUDY_TYPE_RUNGS[clampStudyRung(rung)]?.id;
  if (id === "home-left") return HOME_LEFT;
  if (id === "home-right") return [...HOME_LEFT, ...HOME_RIGHT];
  if (id === "home-mix") return HOME_ROW;
  if (id === "upper") return [...HOME_ROW, ...UPPER_ROW];
  if (id === "lower") return [...HOME_ROW, ...UPPER_ROW, ...LOWER_ROW];
  return [...HOME_ROW, ...UPPER_ROW, ...LOWER_ROW, ...OUTER_ROW];
}
