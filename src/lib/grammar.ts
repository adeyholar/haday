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
  /** Extra how-to after the rule, so each unit can be digested on its own. */
  teach: string;
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
  /** Longer teaching for this topic map. Original notes — not a textbook chapter. */
  intro: string;
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

export function grammarMixPool(
  tracks: GrammarTrack[],
  unitUnlocked: (trackId: GrammarTrackId, unitId: number) => boolean,
): GrammarQuiz[] {
  const seen = new Set<string>();
  const out: GrammarQuiz[] = [];
  for (const track of tracks) {
    for (const unit of track.units) {
      if (!unitUnlocked(track.id, unit.id)) continue;
      for (const q of grammarQuizPool(track, unit)) {
        const id = grammarQuizId(q);
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(q);
      }
    }
  }
  return out;
}

export function buildGrammarMixQuiz(
  tracks: GrammarTrack[],
  unitUnlocked: (trackId: GrammarTrackId, unitId: number) => boolean,
): GrammarQuiz[] {
  const pool = grammarMixPool(tracks, unitUnlocked);
  if (!pool.length) return [];
  const key = `grammar-mix:${tracks.map((t) => t.id).join(",")}`;
  return drawRound(pool, GRAMMAR_QUIZ_LEN, key, grammarQuizId).map((q) => {
    const hard = hardenQuizChoices(q);
    return { ...hard, choices: shuffle(hard.choices) };
  });
}

export function grammarTopicLabel(track: Pick<GrammarTrack, "title">): string {
  return track.title;
}

export function grammarNeighborId(id: GrammarTrackId, dir: -1 | 1): GrammarTrackId | undefined {
  const i = GRAMMAR_TRACK_IDS.indexOf(id);
  if (i < 0) return undefined;
  return GRAMMAR_TRACK_IDS[i + dir];
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
