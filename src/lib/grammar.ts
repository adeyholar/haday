import { drawRound, ROUND_LEN } from "@/lib/quiz-draw";
import { hardenQuizChoices } from "@/lib/close-quiz";
import type { LearnKind, LearnSample, LearnVerse } from "@/lib/tanakh-learn-note";

export type GrammarTrackId = "prep" | "adj" | "pron" | "exist" | "construct" | "numbers";

export type GrammarQuiz = {
  q: string;
  he?: string;
  ref?: string;
  choices: string[];
  answer: string;
  why: string;
  review?: boolean;
};

export type GrammarUnit = {
  id: number;
  title: string;
  short: string;
  rule: string;
  samples: LearnSample[];
  verses: LearnVerse[];
  quiz: GrammarQuiz[];
};

export type GrammarTrack = {
  id: GrammarTrackId;
  chapter: number;
  title: string;
  short: string;
  blurb: string;
  kind: LearnKind;
  matchPrompt: string;
  units: GrammarUnit[];
  extra?: Record<number, GrammarQuiz[]>;
};

export const GRAMMAR_QUIZ_LEN = ROUND_LEN;
export const GRAMMAR_REVIEW = 3;

export const GRAMMAR_TRACK_IDS: GrammarTrackId[] = [
  "prep",
  "adj",
  "pron",
  "exist",
  "construct",
  "numbers",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function grammarQuizId(q: GrammarQuiz): string {
  return `${q.q}|${q.answer}`;
}

export function isGrammarTrackId(v: unknown): v is GrammarTrackId {
  return typeof v === "string" && (GRAMMAR_TRACK_IDS as string[]).includes(v);
}

export function grammarTrackUnit(track: GrammarTrack, unitId: number): GrammarUnit | undefined {
  return track.units.find((u) => u.id === unitId);
}

export function grammarUnitMax(track: GrammarTrack): number {
  return track.units.length;
}

export function grammarQuizPool(track: GrammarTrack, unit: GrammarUnit): GrammarQuiz[] {
  return [...unit.quiz, ...(track.extra?.[unit.id] ?? [])];
}

export function buildGrammarQuiz(track: GrammarTrack, unitId: number): GrammarQuiz[] {
  const unit = track.units.find((u) => u.id === unitId);
  if (!unit) return [];
  const reviewCount = unitId > 1 ? GRAMMAR_REVIEW : 0;
  const pool = grammarQuizPool(track, unit);
  const freshTake = Math.min(GRAMMAR_QUIZ_LEN - reviewCount, pool.length);
  const fresh = drawRound(pool, freshTake, `grammar:${track.id}:${unitId}`, (q) => `${q.q}|${q.answer}`);
  const prior = track.units.filter((u) => u.id < unitId).flatMap((u) => u.quiz);
  const review = reviewCount
    ? drawRound(prior, reviewCount, `grammar-rev:${track.id}:${unitId}`, (q) => `${q.q}|${q.answer}`).map((q) => ({
        ...q,
        review: true,
      }))
    : [];
  return shuffle([...fresh, ...review]).map((q) => {
    const hard = hardenQuizChoices(q);
    return { ...hard, choices: shuffle(hard.choices) };
  });
}

export function starsFromGrammarScore(pct: number): number {
  if (pct >= 90) return 3;
  if (pct >= 70) return 2;
  return 1;
}

export function grammarMatchPairs(unit: GrammarUnit): Array<{ id: string; he: string; label: string }> {
  return unit.samples.map((s, i) => ({
    id: `${unit.id}-${i}`,
    he: s.word,
    label: `${s.tag ?? ""} · ${s.gloss ?? ""}`.replace(/^ · /, ""),
  }));
}
