import { vocabLessons, type IibsVocabLevel } from "@/lib/iibs-vocab";

export const IIBS_LESSON_PASS = 90;
export const IIBS_LESSON_COUNT = 30;
export const IIBS_GAME_LEVELS = ["A", "B", "C", "D", "E"] as const;

export const IIBS_STAGES = [
  { id: "multiple", name: "Multiple", prompt: "Hebrew, then choose the English" },
  { id: "gloss", name: "Gloss", prompt: "Type the English" },
  { id: "hebrew", name: "Hebrew", prompt: "The word stays up. Type each consonant and its vowel." },
  { id: "strict", name: "Strict", prompt: "English only. Type the Hebrew, then Check." },
] as const;

export type IibsStageId = (typeof IIBS_STAGES)[number]["id"];
export type IibsStageRec = { best: number; cleared: boolean; attempts: number };

export type IibsLessonRec = {
  best: number;
  cleared: boolean;
  attempts: number;
  stages: Record<IibsStageId, IibsStageRec>;
};

/** One rank for each level on the ladder, from the first words to the Reading Lab. */
export const IIBS_RANKS = [
  { id: "A", title: "Bearer of Words", short: "Words" },
  { id: "B", title: "Keeper of the Phrase", short: "Phrase" },
  { id: "C", title: "Parser of the Clause", short: "Parser" },
  { id: "D", title: "Steward of the Verb", short: "Verb" },
  { id: "E", title: "Scholar of the Line", short: "Line" },
  { id: "lab", title: "Reader of the Scroll", short: "Scroll" },
] as const;

export type IibsRank = (typeof IIBS_RANKS)[number];

export function rankForLevel(id: string): IibsRank | null {
  return IIBS_RANKS.find((rank) => rank.id === id) ?? null;
}

/** The highest level rank already earned. The Reading Lab rank waits until that level can be cleared. */
export function heldIibsRank(progress: IibsGameProgress): IibsRank | null {
  let held: IibsRank | null = null;
  for (const rank of IIBS_RANKS) {
    if (rank.id === "lab") continue;
    if (levelCleared(progress, rank.id)) held = rank;
  }
  return held;
}

export function rankEarned(progress: IibsGameProgress, id: string) {
  if (id === "lab") return false;
  return levelCleared(progress, id);
}

export type IibsGameProgress = { lessons: Record<string, IibsLessonRec> };

export function emptyIibsGame(): IibsGameProgress {
  return { lessons: {} };
}

export function iibsLessonKey(level: string, lesson: number) {
  return `${level}:${lesson}`;
}

export function emptyStage(): IibsStageRec {
  return { best: 0, cleared: false, attempts: 0 };
}

export function emptyLessonRec(): IibsLessonRec {
  return {
    best: 0,
    cleared: false,
    attempts: 0,
    stages: {
      multiple: emptyStage(),
      gloss: emptyStage(),
      hebrew: emptyStage(),
      strict: emptyStage(),
    },
  };
}

function readStage(raw: unknown): IibsStageRec {
  if (!raw || typeof raw !== "object") return emptyStage();
  const rec = raw as Partial<IibsStageRec>;
  const best = Math.max(0, Math.min(100, Math.round(Number(rec.best) || 0)));
  const cleared = Boolean(rec.cleared) || best >= IIBS_LESSON_PASS;
  return {
    best,
    cleared,
    attempts: Math.max(0, Math.round(Number(rec.attempts) || 0), cleared ? 1 : 0),
  };
}

export function hydrateIibsGame(raw: unknown): IibsGameProgress {
  const lessons: Record<string, IibsLessonRec> = {};
  if (!raw || typeof raw !== "object") return { lessons };
  const bag = (raw as { lessons?: unknown }).lessons;
  if (!bag || typeof bag !== "object") return { lessons };
  for (const [key, val] of Object.entries(bag)) {
    if (!/^[A-E]:([1-9]|[12]\d|30)$/.test(key)) continue;
    if (!val || typeof val !== "object") continue;
    const rec = val as Partial<IibsLessonRec> & { stages?: unknown };
    const base = emptyLessonRec();
    const bagStages = rec.stages && typeof rec.stages === "object" ? (rec.stages as Record<string, unknown>) : null;
    if (bagStages) {
      for (const stage of IIBS_STAGES) base.stages[stage.id] = readStage(bagStages[stage.id]);
    } else if (Boolean(rec.cleared) || Math.round(Number(rec.best) || 0) >= IIBS_LESSON_PASS) {
      const best = Math.max(0, Math.min(100, Math.round(Number(rec.best) || 0)));
      base.stages.multiple = { best, cleared: true, attempts: Math.max(1, Math.round(Number(rec.attempts) || 0)) };
    }
    const cleared = base.stages.strict.cleared;
    const attempts = IIBS_STAGES.reduce((sum, stage) => sum + base.stages[stage.id].attempts, 0);
    lessons[key] = { best: base.stages.strict.best, cleared, attempts, stages: base.stages };
  }
  return { lessons };
}

export function iibsGlossHit(gloss: string, input: string) {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  const given = clean(input);
  if (!given) return false;
  const bare = gloss.replace(/\([^)]*\)/g, " ");
  if (clean(bare) === given) return true;
  return bare.split(/[,;/]| or /i).some((part) => clean(part) === given && given.length > 0);
}

export function lessonWordCount(level: string, lesson: number) {
  const lists = vocabLessons(level);
  if (!lists || lesson < 1 || lesson > lists.length) return 0;
  return lists[lesson - 1]?.length ?? 0;
}

function playedClear(progress: IibsGameProgress, level: string, lesson: number) {
  return Boolean(progress.lessons[iibsLessonKey(level, lesson)]?.stages?.strict?.cleared);
}

/** A lesson is done when it was cleared, or it has no words and everything before it is done. */
export function lessonSatisfied(progress: IibsGameProgress, level: string, lesson: number): boolean {
  if (lesson < 1) return true;
  if (lessonWordCount(level, lesson) === 0) return lessonSatisfied(progress, level, lesson - 1);
  return playedClear(progress, level, lesson);
}

export function levelCleared(progress: IibsGameProgress, level: string) {
  return lessonSatisfied(progress, level, IIBS_LESSON_COUNT);
}

export function levelUnlocked(progress: IibsGameProgress, id: string, admin: boolean) {
  if (admin || id === "A") return true;
  if (id === "lab") return levelCleared(progress, "E");
  const index = IIBS_GAME_LEVELS.indexOf(id as IibsVocabLevel);
  if (index <= 0) return false;
  return levelCleared(progress, IIBS_GAME_LEVELS[index - 1]!);
}

export function lessonUnlocked(progress: IibsGameProgress, level: string, lesson: number, admin: boolean) {
  if (!levelUnlocked(progress, level, admin)) return false;
  if (admin || lesson <= 1) return true;
  return lessonSatisfied(progress, level, lesson - 1);
}

export function iibsLessonRec(progress: IibsGameProgress, level: string, lesson: number): IibsLessonRec {
  return progress.lessons[iibsLessonKey(level, lesson)] ?? emptyLessonRec();
}

export function stageUnlocked(
  progress: IibsGameProgress,
  level: string,
  lesson: number,
  stage: IibsStageId,
  admin: boolean,
) {
  if (!lessonUnlocked(progress, level, lesson, admin)) return false;
  if (admin || stage === "multiple") return true;
  const index = IIBS_STAGES.findIndex((item) => item.id === stage);
  const prev = IIBS_STAGES[index - 1];
  if (!prev) return true;
  return Boolean(iibsLessonRec(progress, level, lesson).stages[prev.id].cleared);
}

export function applyIibsStage<T extends { iibs: IibsGameProgress }>(
  game: T,
  level: string,
  lesson: number,
  stage: IibsStageId,
  pct: number,
): T {
  const key = iibsLessonKey(level, lesson);
  const prev = game.iibs.lessons[key] ?? emptyLessonRec();
  const before = prev.stages[stage] ?? emptyStage();
  const score = Math.max(0, Math.min(100, Math.round(pct)));
  const stages = {
    ...prev.stages,
    [stage]: {
      best: Math.max(before.best, score),
      cleared: before.cleared || score >= IIBS_LESSON_PASS,
      attempts: before.attempts + 1,
    },
  };
  const attempts = IIBS_STAGES.reduce((sum, item) => sum + stages[item.id].attempts, 0);
  return {
    ...game,
    iibs: {
      lessons: {
        ...game.iibs.lessons,
        [key]: { best: stages.strict.best, cleared: stages.strict.cleared, attempts, stages },
      },
    },
  };
}

/** A lesson counts as cleared only after Strict. Used by the ladder tests. */
export function applyIibsLesson<T extends { iibs: IibsGameProgress }>(
  game: T,
  level: string,
  lesson: number,
  pct: number,
): T {
  let next = game;
  for (const stage of IIBS_STAGES) next = applyIibsStage(next, level, lesson, stage.id, pct);
  return next;
}
