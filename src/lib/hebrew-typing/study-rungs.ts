import { CONSONANTS } from "@/lib/alphabet";
import { IL_ROWS } from "@/lib/hebrew-typing/layout";
import { GAME_WORDS, STUDY_WORDS, type TypeWord } from "@/lib/hebrew-typing/bank";
import { units } from "@/lib/hebrew-typing/engine";

export const HOME_ROW = IL_ROWS[1]!;
export const ALEF_BET_KEYS = CONSONANTS.filter((c) => c.id !== "sin").map((c) => (c.id === "shin" ? "ש" : c.letter));

export type StudyRungId = "home" | "map" | "mix" | "words" | "tanakh";

export type StudyRung = {
  id: StudyRungId;
  title: string;
  hint: string;
};

export const STUDY_TYPE_RUNGS: StudyRung[] = [
  { id: "home", title: "Home row", hint: "Eyes on the screen. Rest fingers on ש ד ג כ · י ח ל ך ף." },
  { id: "map", title: "Where each letter lives", hint: "א through ת. Find the key on the board in front of you." },
  { id: "mix", title: "Mixes", hint: "Letters in any order. Still watch the screen." },
  { id: "words", title: "Short words", hint: "A few letters at a time." },
  { id: "tanakh", title: "From the Tanakh", hint: "Short snippets first, then longer ones." },
];

export const STUDY_RUNG_MAX = STUDY_TYPE_RUNGS.length - 1;

export function clampStudyRung(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(STUDY_RUNG_MAX, Math.round(n)));
}

function mixFrom(seed: number, letters: string[], n: number): string[] {
  const bag = [...letters];
  let x = Math.abs(seed) % 2147483647 || 1;
  for (let i = bag.length - 1; i > 0; i--) {
    x = (x * 48271) % 2147483647;
    const j = x % (i + 1);
    const a = bag[i]!;
    bag[i] = bag[j]!;
    bag[j] = a;
  }
  const out = bag.slice(0, n);
  while (out.length < n) out.push(bag[out.length % bag.length]!);
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
  if (id === "home") return [...HOME_ROW];
  if (id === "map") return [...ALEF_BET_KEYS];
  if (id === "mix") return mixFrom(seed, ALEF_BET_KEYS, 10);
  if (id === "words") return [...STUDY_WORDS];
  const bank = tanakhDeep ? tanakhComplex() : tanakhBasic();
  return (bank.length ? bank : GAME_WORDS.slice(0, 8)).map((w) => w.hebrew);
}

export function studyRungWords(rung: number, tanakhDeep = false): TypeWord[] | null {
  const id = STUDY_TYPE_RUNGS[clampStudyRung(rung)]?.id;
  if (id !== "tanakh") return null;
  const bank = tanakhDeep ? tanakhComplex() : tanakhBasic();
  return bank.length ? bank : GAME_WORDS.slice(0, 8);
}
