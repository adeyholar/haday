import type { VocabItem } from "@/lib/vocab";
import { term2Vocab } from "@/lib/vocab-s2";

/** Same bar as the Semester 1 game. One miss in ten is still a pass. */
export const TERM2_PASS = 90;

export const TERM2_CHAPTER_MIN = 20;
export const TERM2_CHAPTER_MAX = 35;

export type Term2StageId = "recognize" | "gloss" | "spell-lenient" | "spell-strict";

export type Term2StageRecord = {
  stars: number;
  best: number;
  cleared: boolean;
  attempts: number;
};

export type Term2ChapterRecord = {
  cleared: boolean;
  stars: number;
  stages: Record<Term2StageId, Term2StageRecord>;
};

/** Vocabulary path and closed-book exams. Not the Semester 1 chapter map. */
export type Term2Game = {
  unlockedChapter: number;
  chapters: Record<string, Term2ChapterRecord>;
  exams: Record<string, Term2StageRecord>;
};

const PATH: Term2StageId[] = ["recognize", "gloss", "spell-lenient"];
const ALL: Term2StageId[] = ["recognize", "gloss", "spell-lenient", "spell-strict"];

const EMPTY_STAGE: Term2StageRecord = { stars: 0, best: 0, cleared: false, attempts: 0 };

function emptyStages(): Record<Term2StageId, Term2StageRecord> {
  return {
    recognize: { ...EMPTY_STAGE },
    gloss: { ...EMPTY_STAGE },
    "spell-lenient": { ...EMPTY_STAGE },
    "spell-strict": { ...EMPTY_STAGE },
  };
}

function emptyChapter(): Term2ChapterRecord {
  return { cleared: false, stars: 0, stages: emptyStages() };
}

export function emptyTerm2Game(): Term2Game {
  return { unlockedChapter: TERM2_CHAPTER_MIN, chapters: {}, exams: {} };
}

export function isTerm2StageId(v: unknown): v is Term2StageId {
  return ALL.includes(v as Term2StageId);
}

export function term2ChapterPool(chapter: number): VocabItem[] {
  if (chapter < TERM2_CHAPTER_MIN || chapter > TERM2_CHAPTER_MAX) return [];
  return term2Vocab().filter((item) => item.chapter === chapter);
}

function clampChapter(n: number): number {
  if (!Number.isInteger(n) || n < TERM2_CHAPTER_MIN || n > TERM2_CHAPTER_MAX) return 0;
  return n;
}

function mergeStage(raw: unknown): Term2StageRecord {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STAGE };
  const r = raw as Partial<Term2StageRecord>;
  return {
    stars: Math.max(0, Math.min(3, Math.round(Number(r.stars) || 0))),
    best: Math.max(0, Math.min(100, Math.round(Number(r.best) || 0))),
    cleared: Boolean(r.cleared),
    attempts: Math.max(0, Math.round(Number(r.attempts) || 0)),
  };
}

function retally(ch: Term2ChapterRecord) {
  ch.stars = ALL.reduce((n, id) => n + ch.stages[id].stars, 0);
  ch.cleared = PATH.every((id) => ch.stages[id].cleared);
}

function mergeChapter(raw: unknown): Term2ChapterRecord {
  const base = emptyChapter();
  if (!raw || typeof raw !== "object") return base;
  const stages = (raw as { stages?: unknown }).stages;
  const bag = stages && typeof stages === "object" ? (stages as Record<string, unknown>) : {};
  for (const id of ALL) base.stages[id] = mergeStage(bag[id]);
  retally(base);
  return base;
}

function unlockedFrom(chapters: Record<string, Term2ChapterRecord>, stored: number): number {
  let open = TERM2_CHAPTER_MIN;
  for (let c = TERM2_CHAPTER_MIN; c < TERM2_CHAPTER_MAX; c++) {
    if (!chapters[String(c)]?.cleared) break;
    open = c + 1;
  }
  const saved = stored >= TERM2_CHAPTER_MIN && stored <= TERM2_CHAPTER_MAX ? Math.round(stored) : TERM2_CHAPTER_MIN;
  return Math.min(TERM2_CHAPTER_MAX, Math.max(saved, open));
}

export function hydrateTerm2Game(raw: unknown): Term2Game {
  const base = emptyTerm2Game();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<Term2Game>;
  const chapters: Record<string, Term2ChapterRecord> = {};
  if (r.chapters && typeof r.chapters === "object") {
    for (const [key, val] of Object.entries(r.chapters)) {
      const n = Number(key);
      if (!Number.isInteger(n) || n < TERM2_CHAPTER_MIN || n > TERM2_CHAPTER_MAX) continue;
      chapters[key] = mergeChapter(val);
    }
  }
  const exams: Record<string, Term2StageRecord> = {};
  if (r.exams && typeof r.exams === "object") {
    for (const [key, val] of Object.entries(r.exams)) {
      const n = Number(key);
      if (!Number.isInteger(n) || n < TERM2_CHAPTER_MIN || n > TERM2_CHAPTER_MAX) continue;
      exams[key] = mergeStage(val);
    }
  }
  return {
    unlockedChapter: unlockedFrom(chapters, Number(r.unlockedChapter) || TERM2_CHAPTER_MIN),
    chapters,
    exams,
  };
}

function clone(game: Term2Game): Term2Game {
  return hydrateTerm2Game(JSON.parse(JSON.stringify(game)) as unknown);
}

function ensure(game: Term2Game, chapter: number): Term2ChapterRecord {
  const key = String(chapter);
  if (!game.chapters[key]) game.chapters[key] = emptyChapter();
  return game.chapters[key];
}

export function term2ChapterRecord(game: Term2Game, chapter: number): Term2ChapterRecord {
  return game.chapters[String(chapter)] ?? emptyChapter();
}

export function isTerm2ChapterUnlocked(game: Term2Game, chapter: number): boolean {
  const n = clampChapter(chapter);
  if (!n) return false;
  return n <= game.unlockedChapter;
}

export function isTerm2StageUnlocked(game: Term2Game, chapter: number, stage: Term2StageId): boolean {
  if (!isTerm2ChapterUnlocked(game, chapter)) return false;
  const rec = term2ChapterRecord(game, chapter);
  const idx = ALL.indexOf(stage);
  for (let i = 0; i < idx; i++) {
    if (!rec.stages[ALL[i]].cleared) return false;
  }
  return true;
}

export function term2ContinueTarget(game: Term2Game): { chapter: number; stage: Term2StageId } {
  const cap = Math.min(Math.max(game.unlockedChapter, TERM2_CHAPTER_MIN), TERM2_CHAPTER_MAX);
  for (let c = TERM2_CHAPTER_MIN; c <= cap; c++) {
    const rec = term2ChapterRecord(game, c);
    for (const id of PATH) {
      if (!rec.stages[id].cleared) return { chapter: c, stage: id };
    }
  }
  return { chapter: cap, stage: "spell-lenient" };
}

function demote(game: Term2Game, chapter: number, stage: Term2StageId) {
  const rec = ensure(game, chapter);
  const idx = ALL.indexOf(stage);
  for (let i = idx + 1; i < ALL.length; i++) rec.stages[ALL[i]].cleared = false;
  retally(rec);
  for (let c = chapter + 1; c <= TERM2_CHAPTER_MAX; c++) {
    const later = game.chapters[String(c)];
    if (!later) continue;
    for (const id of ALL) later.stages[id].cleared = false;
    retally(later);
  }
  game.unlockedChapter = chapter;
}

export function applyTerm2Stage(
  game: Term2Game,
  chapter: number,
  stage: Term2StageId,
  result: { stars: number; score: number; firstTryRate: number },
): Term2Game {
  const next = clone(game);
  if (!clampChapter(chapter) || !isTerm2StageId(stage)) return next;
  const rec = ensure(next, chapter);
  const prev = rec.stages[stage];
  const passed = result.score >= TERM2_PASS;
  rec.stages[stage] = {
    stars: passed ? Math.max(prev.stars, result.stars) : prev.stars,
    best: Math.max(prev.best, result.score),
    cleared: passed,
    attempts: prev.attempts + 1,
  };
  if (!passed) {
    if (stage !== "spell-strict") demote(next, chapter, stage);
  } else {
    retally(rec);
    if (rec.cleared && chapter >= next.unlockedChapter && chapter < TERM2_CHAPTER_MAX) {
      next.unlockedChapter = chapter + 1;
    }
  }
  return next;
}

export function term2ExamRecord(game: Term2Game, chapter: number): Term2StageRecord {
  return game.exams[String(chapter)] ?? { ...EMPTY_STAGE };
}

export function isTerm2ExamUnlocked(game: Term2Game, chapter: number): boolean {
  if (!clampChapter(chapter)) return false;
  if (chapter === TERM2_CHAPTER_MIN) return true;
  return Boolean(game.exams[String(chapter - 1)]?.cleared);
}

export function applyTerm2Exam(
  game: Term2Game,
  chapter: number,
  result: { stars: number; score: number },
): Term2Game {
  const next = clone(game);
  if (!isTerm2ExamUnlocked(next, chapter)) return next;
  const prev = term2ExamRecord(next, chapter);
  const passed = result.score >= TERM2_PASS;
  next.exams[String(chapter)] = {
    stars: passed ? Math.max(prev.stars, result.stars) : prev.stars,
    best: Math.max(prev.best, result.score),
    cleared: prev.cleared || passed,
    attempts: prev.attempts + 1,
  };
  return next;
}

export function starsForTerm2(firstTryRate: number): number {
  if (firstTryRate >= 0.9) return 3;
  if (firstTryRate >= 0.7) return 2;
  return 1;
}
