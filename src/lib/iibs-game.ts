import { vocabLessons, type IibsVocabLevel } from "@/lib/iibs-vocab";

export const IIBS_LESSON_PASS = 90;
export const IIBS_LESSON_COUNT = 30;
export const IIBS_GAME_LEVELS = ["A", "B", "C", "D", "E"] as const;

export type IibsLessonRec = { best: number; cleared: boolean; attempts: number };
export type IibsGameProgress = { lessons: Record<string, IibsLessonRec> };

export function emptyIibsGame(): IibsGameProgress {
  return { lessons: {} };
}

export function iibsLessonKey(level: string, lesson: number) {
  return `${level}:${lesson}`;
}

export function hydrateIibsGame(raw: unknown): IibsGameProgress {
  const lessons: Record<string, IibsLessonRec> = {};
  if (!raw || typeof raw !== "object") return { lessons };
  const bag = (raw as { lessons?: unknown }).lessons;
  if (!bag || typeof bag !== "object") return { lessons };
  for (const [key, val] of Object.entries(bag)) {
    if (!/^[A-E]:([1-9]|[12]\d|30)$/.test(key)) continue;
    if (!val || typeof val !== "object") continue;
    const rec = val as Partial<IibsLessonRec>;
    const best = Math.max(0, Math.min(100, Math.round(Number(rec.best) || 0)));
    const cleared = Boolean(rec.cleared) || best >= IIBS_LESSON_PASS;
    lessons[key] = {
      best,
      cleared,
      attempts: Math.max(0, Math.round(Number(rec.attempts) || 0), cleared ? 1 : 0),
    };
  }
  return { lessons };
}

export function lessonWordCount(level: string, lesson: number) {
  const lists = vocabLessons(level);
  if (!lists || lesson < 1 || lesson > lists.length) return 0;
  return lists[lesson - 1]?.length ?? 0;
}

function playedClear(progress: IibsGameProgress, level: string, lesson: number) {
  return Boolean(progress.lessons[iibsLessonKey(level, lesson)]?.cleared);
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
  return progress.lessons[iibsLessonKey(level, lesson)] ?? { best: 0, cleared: false, attempts: 0 };
}

export function applyIibsLesson<T extends { iibs: IibsGameProgress }>(
  game: T,
  level: string,
  lesson: number,
  pct: number,
): T {
  const key = iibsLessonKey(level, lesson);
  const prev = game.iibs.lessons[key] ?? { best: 0, cleared: false, attempts: 0 };
  const score = Math.max(0, Math.min(100, Math.round(pct)));
  const cleared = prev.cleared || score >= IIBS_LESSON_PASS;
  return {
    ...game,
    iibs: {
      lessons: {
        ...game.iibs.lessons,
        [key]: { best: Math.max(prev.best, score), cleared, attempts: prev.attempts + 1 },
      },
    },
  };
}
