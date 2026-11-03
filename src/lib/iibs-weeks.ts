import { E_PRIOR_IDS, E_REPAIR_SLOTS, E_SLOT_FREEZE, E_SPLITS } from "@/lib/iibs-e-freeze";
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

/** Every Scripture Path lemma, levels A–E. Used by the reading loop, not by a week sitting. */
let iibsAll: VocabItem[] | null = null;
export function iibsPathItems(): VocabItem[] {
  if (!iibsAll) iibsAll = IIBS_WEEK_LEVELS.flatMap((level) => levelWords(level));
  return iibsAll;
}

const WORDS = new Map<IibsVocabLevel, VocabItem[]>();
const LEGACY = new Map<string, string>();
let studyIds: Set<string> | null = null;
let repairsLinked = false;
let repairsLinking = false;

/** Stable id. It is a hash of the pointed word and its meaning, not its place in the lesson. */
export function iibsWordId(level: IibsVocabLevel, hebrew: string, gloss: string): string {
  let hash = 2166136261;
  const text = `${hebrew}\n${gloss}`;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `iibs-${level.toLowerCase()}-${(hash >>> 0).toString(36)}`;
}

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
  noteTwinMeanings(out);
  WORDS.set(level, out);
  return out;
}

type RepairSplit = { from: string; slots: readonly string[] };
type RepairBook = {
  freeze: ReadonlyMap<string, string>;
  prior: ReadonlyMap<string, string>;
  slots: readonly string[];
  splits: readonly RepairSplit[];
};

const E_FREEZE_ID = new Map(E_SLOT_FREEZE.map((row) => [row.slot, row.id]));
const E_PRIOR_ID = new Map(E_PRIOR_IDS.map((row) => [row.slot, row.id]));

/** One book per level. Only Level E has a frozen repair. The live guard runs after every level is built. */
const REPAIR_BOOKS: Partial<Record<IibsVocabLevel, RepairBook>> = {
  E: { freeze: E_FREEZE_ID, prior: E_PRIOR_ID, slots: E_REPAIR_SLOTS, splits: E_SPLITS },
};

/** One old id is carried to the first real new word and not to any word after it. */
export function firstRepairTarget(targets: readonly string[]): string | undefined {
  for (const slot of targets) {
    if (slot) return slot;
  }
  return undefined;
}

function liveWordIds(): Set<string> {
  const live = new Set<string>();
  for (const items of WORDS.values()) {
    for (const item of items) live.add(item.id);
  }
  return live;
}

/** A live study id is never stored as an old id. */
function linkOld(live: Set<string>, oldId: string, nextId: string) {
  if (!oldId || !nextId || oldId === nextId || live.has(oldId)) return;
  if (!LEGACY.has(oldId)) LEGACY.set(oldId, nextId);
}

/** Pre-fix hashes chain to the id the place has now. A later edit chains the id it replaced. A split keeps the first live target only. */
function linkLevelRepairs(level: IibsVocabLevel, live: Set<string>) {
  const book = REPAIR_BOOKS[level];
  if (!book) return;
  const slots = new Set<string>([...book.slots, ...book.prior.keys()]);
  for (const slot of slots) {
    const from = book.freeze.get(slot);
    const current = LEGACY.get(slot);
    if (!from || !current || from === current) continue;
    const mid = book.prior.get(slot);
    if (mid && mid !== current && mid !== from && !live.has(mid)) {
      linkOld(live, mid, current);
      linkOld(live, from, mid);
    } else {
      linkOld(live, from, current);
    }
    if (!live.has(slot)) LEGACY.set(slot, from);
  }
  for (const split of book.splits) {
    const slot = firstRepairTarget(split.slots);
    if (!slot) continue;
    let target = LEGACY.get(slot) ?? slot;
    const seen = new Set<string>();
    while (LEGACY.has(target) && !seen.has(target)) {
      seen.add(target);
      const next = LEGACY.get(target);
      if (!next || next === target) break;
      target = next;
    }
    if (!live.has(target)) continue;
    linkOld(live, split.from, target);
  }
}

function ensureRepairLinks() {
  if (repairsLinked || repairsLinking) return;
  repairsLinking = true;
  for (const level of IIBS_WEEK_LEVELS) levelWords(level);
  const live = liveWordIds();
  for (const level of IIBS_WEEK_LEVELS) linkLevelRepairs(level, live);
  repairsLinked = true;
  repairsLinking = false;
}

/** The place-based id dealt on 14 Oct, then any later hash of the same word. A live id is not an old id. */
export function iibsLegacyId(id: string): string | undefined {
  ensureRepairLinks();
  const live = iibsStudyIdSet();
  if (live.has(id)) return undefined;
  let current = id;
  const seen = new Set<string>();
  let hopped = false;
  while (LEGACY.has(current) && !seen.has(current)) {
    seen.add(current);
    const next = LEGACY.get(current);
    if (!next || next === current) break;
    current = next;
    hopped = true;
    if (live.has(current)) break;
  }
  return hopped ? current : undefined;
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
  const id = iibsWordId(level, word.hebrew, gloss);
  const slot = `iibs-${level.toLowerCase()}-${String(lesson).padStart(2, "0")}-${String(place).padStart(2, "0")}`;
  if (slot !== id) LEGACY.set(slot, id);
  const plural = word.plural.replace(/\s+/g, " ").trim();
  return {
    id,
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

/** The same pointed spelling kept twice, with two meanings, accepts either meaning. */
function noteTwinMeanings(items: VocabItem[]) {
  const twins = new Map<string, VocabItem[]>();
  for (const item of items) {
    const group = twins.get(item.hebrew) ?? [];
    group.push(item);
    twins.set(item.hebrew, group);
  }
  for (const group of twins.values()) {
    if (group.length < 2) continue;
    for (const item of group) {
      const others = group.filter((other) => other !== item).map((other) => other.gloss);
      item.alts = others;
      const note = `Also ${others.join("; ")}`;
      item.stems = item.stems ? `${item.stems}. ${note}` : note;
    }
  }
}
