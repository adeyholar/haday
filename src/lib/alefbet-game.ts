import { CONSONANTS, type HebrewLetter } from "@/lib/alphabet";

/** Sin 21, Shin 22, Tav 23 — as specified for this mastery game. */
export const ALEF_BET_LINE: HebrewLetter[] = (() => {
  const byId = Object.fromEntries(CONSONANTS.map((c) => [c.id, c]));
  const core = CONSONANTS.filter((c) => c.id !== "shin" && c.id !== "sin" && c.id !== "tav");
  return [...core, byId.sin, byId.shin, byId.tav];
})();

export const ALEF_BET_COUNT = ALEF_BET_LINE.length;

export type AlefBetLevel = 1 | 2 | 3;

export const ALEF_BET_LEVELS: Array<{
  id: AlefBetLevel;
  title: string;
  short: string;
  blurb: string;
}> = [
  { id: 1, title: "The line", short: "Alef → Tav", blurb: "Recognize each letter in order, from Alef to Tav." },
  { id: 2, title: "The place", short: "1–23", blurb: "Alef is 1. Sin is 21. Shin is 22. Tav is 23." },
  { id: 3, title: "The neighbor", short: "Before / after", blurb: "Which letter stands before, after, or a few steps away." },
];

export type NeighborDelta = -3 | -2 | -1 | 1 | 2 | 3;

export type AlefBetQuestion =
  | { kind: "name-of"; letter: HebrewLetter; index: number }
  | { kind: "glyph-of"; letter: HebrewLetter; index: number }
  | { kind: "number-of"; letter: HebrewLetter; index: number }
  | { kind: "letter-of"; letter: HebrewLetter; index: number }
  | { kind: "neighbor"; letter: HebrewLetter; index: number; delta: NeighborDelta };

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function positionOf(id: string): number {
  return ALEF_BET_LINE.findIndex((l) => l.id === id) + 1;
}

export function letterAt(pos: number): HebrewLetter | undefined {
  return ALEF_BET_LINE[pos - 1];
}

export function ordinalWord(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export function neighborPrompt(q: Extract<AlefBetQuestion, { kind: "neighbor" }>): string {
  const steps = Math.abs(q.delta);
  const dir = q.delta < 0 ? "before" : "after";
  if (steps === 1) return `Which letter comes ${dir} ${q.letter.name}?`;
  return `Which letter is ${steps} ${dir} ${q.letter.name}?`;
}

export function buildAlefBetRound(level: AlefBetLevel): AlefBetQuestion[] {
  if (level === 1) {
    return ALEF_BET_LINE.map((letter, i) =>
      i % 2 === 0
        ? { kind: "name-of" as const, letter, index: i + 1 }
        : { kind: "glyph-of" as const, letter, index: i + 1 },
    );
  }
  if (level === 2) {
    return shuffle(ALEF_BET_LINE).map((letter, i) => {
      const index = positionOf(letter.id);
      return i % 2 === 0
        ? { kind: "number-of" as const, letter, index }
        : { kind: "letter-of" as const, letter, index };
    });
  }
  const deltas: NeighborDelta[] = [-3, -2, -1, 1, 2, 3];
  const bag: AlefBetQuestion[] = [];
  for (const letter of shuffle(ALEF_BET_LINE)) {
    const index = positionOf(letter.id);
    const ok = deltas.filter((d) => {
      const at = index + d;
      return at >= 1 && at <= ALEF_BET_COUNT;
    });
    if (!ok.length) continue;
    const delta = ok[Math.floor(Math.random() * ok.length)];
    bag.push({ kind: "neighbor", letter, index, delta });
  }
  return bag.slice(0, 16);
}

export function expectedLetter(q: AlefBetQuestion): HebrewLetter {
  if (q.kind === "neighbor") return letterAt(q.index + q.delta) ?? q.letter;
  return q.letter;
}

export function expectedNumber(q: AlefBetQuestion): number {
  return q.index;
}

export function starsFromRate(firstTryRate: number): number {
  if (firstTryRate >= 0.9) return 3;
  if (firstTryRate >= 0.7) return 2;
  return 1;
}

export function shuffledLine(): HebrewLetter[] {
  return shuffle(ALEF_BET_LINE);
}

export function shuffledNames(): HebrewLetter[] {
  return shuffle(ALEF_BET_LINE);
}
