import { vocabLessons, type IibsVocabLevel, type IibsVocabWord } from "@/lib/iibs-vocab";
import type { Pos, VocabItem } from "@/lib/vocab";

/** Scripture Path study. Each level's words stay in lesson order and split across thirty weeks. The same pointed word with the same meaning is kept once. Different vowels stay. */
export const IIBS_WEEK_LEVELS = ["A", "B", "C", "D", "E"] as const;
export const IIBS_WEEKS = 30;

export function isIibsWeekLevel(value: string | null | undefined): value is IibsVocabLevel {
  return value === "A" || value === "B" || value === "C" || value === "D" || value === "E";
}

export function iibsWeekCount(level: IibsVocabLevel): number {
  return levelWords(level).length ? IIBS_WEEKS : 0;
}

export function iibsWeekItems(level: IibsVocabLevel, week: number): VocabItem[] {
  const all = levelWords(level);
  if (week < 1 || week > IIBS_WEEKS || !all.length) return [];
  const base = Math.floor(all.length / IIBS_WEEKS);
  const extra = all.length % IIBS_WEEKS;
  let start = 0;
  for (let n = 1; n < week; n += 1) start += base + (n <= extra ? 1 : 0);
  const size = base + (week <= extra ? 1 : 0);
  return all.slice(start, start + size);
}

export function iibsWeekLabel(level: string, week: number): string {
  return `Level ${level} · Week ${week}`;
}

const WORDS = new Map<IibsVocabLevel, VocabItem[]>();
let studyIds: Set<string> | null = null;

function levelWords(level: IibsVocabLevel): VocabItem[] {
  const cached = WORDS.get(level);
  if (cached) return cached;
  const seen = new Set<string>();
  const out: VocabItem[] = [];
  const lessons = vocabLessons(level) ?? [];
  lessons.forEach((lesson, lessonIndex) => {
    lesson.forEach((word, index) => {
      const item = toItem(level, lessonIndex + 1, index + 1, word, seen);
      if (item) out.push(item);
    });
  });
  WORDS.set(level, out);
  return out;
}

/** Ids the week builder actually deals. A save may keep these and no other `iibs-` key. */
export function iibsStudyIdSet(): Set<string> {
  if (studyIds) return studyIds;
  const ids = new Set<string>();
  for (const level of IIBS_WEEK_LEVELS) {
    for (const item of levelWords(level)) ids.add(item.id);
  }
  studyIds = ids;
  return ids;
}

function posOf(kind: string): Pos {
  const k = kind.toLowerCase();
  if (k.includes("verb")) return "verb";
  if (k.includes("adj")) return "adj";
  if (k.includes("prep")) return "prep";
  if (k.includes("pronoun")) return "pron";
  if (k.includes("proper")) return "name";
  if (k.includes("particle") || k.includes("adverb") || k.includes("conjunction")) return "particle";
  return "noun";
}

function cleanGloss(gloss: string): string {
  return gloss
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;])/g, "$1")
    .trim();
}

function toItem(
  level: IibsVocabLevel,
  lesson: number,
  place: number,
  word: IibsVocabWord,
  seen: Set<string>,
): VocabItem | null {
  const gloss = cleanGloss(word.gloss);
  if (!word.hebrew || !gloss) return null;
  const key = `${word.hebrew}\n${gloss}`;
  if (seen.has(key)) return null;
  seen.add(key);
  const plural = word.plural.replace(/\s+/g, " ").trim();
  return {
    id: `iibs-${level.toLowerCase()}-${String(lesson).padStart(2, "0")}-${String(place).padStart(2, "0")}`,
    hebrew: word.hebrew,
    translit: "",
    gloss,
    alts: [],
    pos: posOf(word.kind),
    chapter: 0,
    freq: 0,
    stems: plural ? `Plural ${plural}` : undefined,
  };
}
