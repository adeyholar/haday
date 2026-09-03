import { VOCAB, alphabetVocab, type VocabItem } from "@/lib/vocab";

export const GAME_CHAPTER_MAX = 19;
export const SYLLABLE_UNIT_MAX = 8;
export const NOUN_UNIT_MAX = 6;
/** First-try percent required to clear a Game stage and open the next one. */
export const GAME_STAGE_PASS = 90;

export const GAME_STAGES = [
  { id: "recognize", name: "Recognize", short: "Recognize", prompt: "Hebrew → English" },
  { id: "gloss", name: "Gloss", short: "Gloss", prompt: "Type the English gloss" },
  { id: "spell-lenient", name: "Spell (lenient)", short: "Spell · lenient", prompt: "Type each consonant and its vowel" },
  { id: "spell-strict", name: "Spell (strict)", short: "Spell · strict", prompt: "Type each consonant and its vowel — no verse" },
] as const;

export type GameStageId = (typeof GAME_STAGES)[number]["id"];

export type StageRecord = {
  stars: number;
  best: number;
  cleared: boolean;
  attempts: number;
};

export type ChapterRecord = {
  cleared: boolean;
  stars: number;
  stages: Record<GameStageId, StageRecord>;
};

export type UltimateRun = {
  ids: string[];
  answers: string[];
  i: number;
};

export type GameSnapshot = {
  unlockedChapter: number;
  currentChapter: number;
  currentStage: GameStageId;
  chapters: Record<string, ChapterRecord>;
  lastPlayDay: number;
  badges: string[];
  winStreak: number;
  bestWinStreak: number;
  justEarned: string[];
  ultimateBest: number;
  ultimateAttempts: number;
  ultimatePerfect: boolean;
  ultimateRun: UltimateRun | null;
  keepStreak: number;
  lastKeepDay: number;
  alefBet: AlefBetProgress;
  syllables: SyllableProgress;
  nouns: SyllableProgress;
};

export type AlefBetProgress = {
  unlockedLevel: number;
  currentLevel: number;
  levels: Record<string, StageRecord>;
};

export type SyllableProgress = {
  unlockedUnit: number;
  currentUnit: number;
  units: Record<string, StageRecord>;
};

export const CHAPTER_META: Record<number, { title: string; blurb: string }> = {
  1: { title: "Alphabet", blurb: "Consonants of the alef-bet" },
  2: { title: "Names", blurb: "Frequent proper names" },
  3: { title: "Nouns", blurb: "Father, son, house, God" },
  4: { title: "More nouns", blurb: "Nation, king, city, Torah" },
  5: { title: "Article & nouns", blurb: "The, and, fire, heaven, gold" },
  6: { title: "Prepositions", blurb: "In, to, from, with, before" },
  7: { title: "Adjectives", blurb: "Good, holy, great, very" },
  8: { title: "Pronouns", blurb: "I, you, this, who, why" },
  9: { title: "More nouns", blurb: "People, bread, glory, behold" },
  10: { title: "Construct nouns", blurb: "Hand, covenant, field, death" },
  11: { title: "Numbers", blurb: "One to ten, cubit, first" },
  12: { title: "Qal verbs", blurb: "Say, be, go, eat, not" },
  13: { title: "More Qal", blurb: "Bless, know, write, keep" },
  14: { title: "Come & go", blurb: "Enter, rise, return, put" },
  15: { title: "Live & serve", blurb: "Live, cut, answer, life" },
  16: { title: "Redeem", blurb: "Redeem, atone, forsake, there" },
  17: { title: "Love & judge", blurb: "Love, perish, tent, sun" },
  18: { title: "Choose & seek", blurb: "Choose, ask, peace, please" },
  19: { title: "Trust & work", blurb: "Trust, weep, seed, iniquity" },
};

const EMPTY_STAGE: StageRecord = { stars: 0, best: 0, cleared: false, attempts: 0 };

function emptyStages(): Record<GameStageId, StageRecord> {
  return {
    recognize: { ...EMPTY_STAGE },
    gloss: { ...EMPTY_STAGE },
    "spell-lenient": { ...EMPTY_STAGE },
    "spell-strict": { ...EMPTY_STAGE },
  };
}

export function emptyChapter(): ChapterRecord {
  return { cleared: false, stars: 0, stages: emptyStages() };
}

export function defaultGame(): GameSnapshot {
  return {
    unlockedChapter: 1,
    currentChapter: 1,
    currentStage: "recognize",
    chapters: {},
    lastPlayDay: 0,
    badges: [],
    winStreak: 0,
    bestWinStreak: 0,
    justEarned: [],
    ultimateBest: 0,
    ultimateAttempts: 0,
    ultimatePerfect: false,
    ultimateRun: null,
    keepStreak: 0,
    lastKeepDay: 0,
    alefBet: emptyAlefBet(),
    syllables: emptySyllables(),
    nouns: emptyNouns(),
  };
}

export function emptyAlefBet(): AlefBetProgress {
  return { unlockedLevel: 1, currentLevel: 1, levels: {} };
}

export function emptySyllables(): SyllableProgress {
  return { unlockedUnit: 1, currentUnit: 1, units: {} };
}

export function emptyNouns(): SyllableProgress {
  return { unlockedUnit: 1, currentUnit: 1, units: {} };
}

function emptyAlefLevel(): StageRecord {
  return { ...EMPTY_STAGE };
}

export function hydrateGame(raw: unknown): GameSnapshot {
  const base = defaultGame();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<GameSnapshot>;
  const chapters: Record<string, ChapterRecord> = {};
  if (r.chapters && typeof r.chapters === "object") {
    for (const [key, val] of Object.entries(r.chapters)) {
      chapters[key] = mergeChapter(val);
    }
  }
  const unlocked = clampChapter(Number(r.unlockedChapter) || 1);
  const currentChapter = clampChapter(Number(r.currentChapter) || 1);
  const currentStage = isStageId(r.currentStage) ? r.currentStage : "recognize";
  return {
    unlockedChapter: unlocked,
    currentChapter,
    currentStage,
    chapters,
    lastPlayDay: Number(r.lastPlayDay) || 0,
    badges: Array.isArray(r.badges) ? r.badges.filter((x) => typeof x === "string") : [],
    winStreak: Math.max(0, Number(r.winStreak) || 0),
    bestWinStreak: Math.max(0, Number(r.bestWinStreak) || 0),
    justEarned: Array.isArray(r.justEarned) ? r.justEarned.filter((x) => typeof x === "string") : [],
    ultimateBest: Math.max(0, Math.min(100, Number(r.ultimateBest) || 0)),
    ultimateAttempts: Math.max(0, Number(r.ultimateAttempts) || 0),
    ultimatePerfect: Boolean(r.ultimatePerfect) || Number(r.ultimateBest) >= 100,
    ultimateRun: hydrateUltimateRun(r.ultimateRun),
    keepStreak: Math.max(0, Number(r.keepStreak) || 0),
    lastKeepDay: Number(r.lastKeepDay) || 0,
    alefBet: hydrateAlefBet(r.alefBet),
    syllables: hydrateSyllables(r.syllables),
    nouns: hydrateNouns(r.nouns),
  };
}

function hydrateAlefBet(raw: unknown): AlefBetProgress {
  const base = emptyAlefBet();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AlefBetProgress>;
  const unlocked = Math.min(3, Math.max(1, Number(r.unlockedLevel) || 1));
  const current = Math.min(3, Math.max(1, Number(r.currentLevel) || 1));
  const levels: Record<string, StageRecord> = {};
  if (r.levels && typeof r.levels === "object") {
    for (const [key, val] of Object.entries(r.levels)) {
      if (!val || typeof val !== "object") continue;
      const rec = val as Partial<StageRecord>;
      levels[key] = {
        stars: Number(rec.stars) || 0,
        best: Number(rec.best) || 0,
        cleared: Boolean(rec.cleared),
        attempts: Math.max(Number(rec.attempts) || 0, rec.cleared ? 1 : 0),
      };
    }
  }
  return { unlockedLevel: unlocked, currentLevel: current, levels };
}

function hydrateSyllables(raw: unknown): SyllableProgress {
  const base = emptySyllables();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<SyllableProgress>;
  const unlocked = Math.min(SYLLABLE_UNIT_MAX, Math.max(1, Number(r.unlockedUnit) || 1));
  const current = Math.min(SYLLABLE_UNIT_MAX, Math.max(1, Number(r.currentUnit) || 1));
  const units: Record<string, StageRecord> = {};
  if (r.units && typeof r.units === "object") {
    for (const [key, val] of Object.entries(r.units)) {
      if (!val || typeof val !== "object") continue;
      const rec = val as Partial<StageRecord>;
      units[key] = {
        stars: Number(rec.stars) || 0,
        best: Number(rec.best) || 0,
        cleared: Boolean(rec.cleared),
        attempts: Math.max(Number(rec.attempts) || 0, rec.cleared ? 1 : 0),
      };
    }
  }
  return { unlockedUnit: unlocked, currentUnit: current, units };
}

function hydrateNouns(raw: unknown): SyllableProgress {
  const base = emptyNouns();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<SyllableProgress>;
  const unlocked = Math.min(NOUN_UNIT_MAX, Math.max(1, Number(r.unlockedUnit) || 1));
  const current = Math.min(NOUN_UNIT_MAX, Math.max(1, Number(r.currentUnit) || 1));
  const units: Record<string, StageRecord> = {};
  if (r.units && typeof r.units === "object") {
    for (const [key, val] of Object.entries(r.units)) {
      if (!val || typeof val !== "object") continue;
      const rec = val as Partial<StageRecord>;
      units[key] = {
        stars: Number(rec.stars) || 0,
        best: Number(rec.best) || 0,
        cleared: Boolean(rec.cleared),
        attempts: Math.max(Number(rec.attempts) || 0, rec.cleared ? 1 : 0),
      };
    }
  }
  return { unlockedUnit: unlocked, currentUnit: current, units };
}

function hydrateUltimateRun(raw: unknown): UltimateRun | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<UltimateRun>;
  if (!Array.isArray(r.ids) || !r.ids.length) return null;
  const ids = r.ids.filter((x) => typeof x === "string");
  const answers = Array.isArray(r.answers)
    ? r.answers.map((x) => (typeof x === "string" ? x : ""))
    : ids.map(() => "");
  while (answers.length < ids.length) answers.push("");
  const i = Math.max(0, Math.min(ids.length, Number(r.i) || 0));
  return { ids, answers: answers.slice(0, ids.length), i };
}

function mergeChapter(val: unknown): ChapterRecord {
  const ch = emptyChapter();
  if (!val || typeof val !== "object") return ch;
  const v = val as Partial<ChapterRecord>;
  ch.cleared = Boolean(v.cleared);
  ch.stars = Number(v.stars) || 0;
  if (v.stages && typeof v.stages === "object") {
    for (const s of GAME_STAGES) {
      const rec = v.stages[s.id];
      if (rec && typeof rec === "object") {
        ch.stages[s.id] = {
          stars: Number(rec.stars) || 0,
          best: Number(rec.best) || 0,
          cleared: Boolean(rec.cleared),
          attempts: Math.max(Number(rec.attempts) || 0, rec.cleared ? 1 : 0),
        };
      }
    }
  }
  return ch;
}

export function isStageId(v: unknown): v is GameStageId {
  return GAME_STAGES.some((s) => s.id === v);
}

export function clampChapter(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(GAME_CHAPTER_MAX, Math.max(1, Math.round(n)));
}

export function stageIndex(id: GameStageId): number {
  return GAME_STAGES.findIndex((s) => s.id === id);
}

export function stageMeta(id: GameStageId) {
  return GAME_STAGES[stageIndex(id)] ?? GAME_STAGES[0];
}

export function chapterRecord(game: GameSnapshot, chapter: number): ChapterRecord {
  return game.chapters[String(chapter)] ?? emptyChapter();
}

export function isChapterUnlocked(game: GameSnapshot, chapter: number): boolean {
  const n = clampChapter(chapter);
  if (n <= 1) return true;
  return n <= game.unlockedChapter;
}

export function isStageUnlocked(game: GameSnapshot, chapter: number, stage: GameStageId): boolean {
  if (!isChapterUnlocked(game, chapter)) return false;
  const rec = chapterRecord(game, chapter);
  const idx = stageIndex(stage);
  for (let i = 0; i < idx; i++) {
    if (!rec.stages[GAME_STAGES[i].id].cleared) return false;
  }
  return true;
}

export function continueTarget(game: GameSnapshot): { chapter: number; stage: GameStageId } {
  const cap = Math.min(Math.max(game.unlockedChapter, 1), GAME_CHAPTER_MAX);
  for (let c = 1; c <= cap; c++) {
    const rec = chapterRecord(game, c);
    for (const s of GAME_STAGES) {
      if (!rec.stages[s.id].cleared) return { chapter: c, stage: s.id };
    }
  }
  return { chapter: GAME_CHAPTER_MAX, stage: "spell-strict" };
}

export function continueLabel(game: GameSnapshot): string {
  const t = continueTarget(game);
  const meta = CHAPTER_META[t.chapter];
  return `Continue · Chapter ${t.chapter} · ${stageMeta(t.stage).name}`;
}

export function starsForRate(firstTryRate: number): number {
  if (firstTryRate >= 0.9) return 3;
  if (firstTryRate >= 0.7) return 2;
  return 1;
}

function cloneGame(game: GameSnapshot): GameSnapshot {
  return JSON.parse(JSON.stringify(game)) as GameSnapshot;
}

function ensureChapter(game: GameSnapshot, chapter: number): ChapterRecord {
  const key = String(chapter);
  if (!game.chapters[key]) game.chapters[key] = emptyChapter();
  return game.chapters[key];
}

function retally(ch: ChapterRecord) {
  ch.stars = GAME_STAGES.reduce((n, s) => n + ch.stages[s.id].stars, 0);
  ch.cleared = GAME_STAGES.every((s) => ch.stages[s.id].cleared);
}

function demoteAfter(game: GameSnapshot, chapter: number, stage: GameStageId) {
  const rec = ensureChapter(game, chapter);
  const idx = stageIndex(stage);
  for (let i = idx + 1; i < GAME_STAGES.length; i++) {
    rec.stages[GAME_STAGES[i].id].cleared = false;
  }
  retally(rec);
  for (let c = chapter + 1; c <= GAME_CHAPTER_MAX; c++) {
    const later = game.chapters[String(c)];
    if (!later) continue;
    later.cleared = false;
    for (const s of GAME_STAGES) later.stages[s.id].cleared = false;
    later.stars = GAME_STAGES.reduce((n, st) => n + later.stages[st.id].stars, 0);
  }
  game.unlockedChapter = chapter;
}

export function applyStageResult(
  game: GameSnapshot,
  chapter: number,
  stage: GameStageId,
  result: { stars: number; score: number; firstTryRate: number },
): GameSnapshot {
  const next = cloneGame(hydrateGame(game));
  const rec = ensureChapter(next, chapter);
  const prev = rec.stages[stage];
  const passed = result.score >= GAME_STAGE_PASS;
  rec.stages[stage] = {
    stars: passed ? Math.max(prev.stars, result.stars) : prev.stars,
    best: Math.max(prev.best, result.score),
    cleared: passed,
    attempts: (prev.attempts || 0) + 1,
  };

  if (!passed) {
    demoteAfter(next, chapter, stage);
    next.winStreak = 0;
  } else {
    retally(rec);
    next.winStreak = (next.winStreak || 0) + 1;
    next.bestWinStreak = Math.max(next.bestWinStreak || 0, next.winStreak);
    if (rec.cleared && chapter >= next.unlockedChapter && chapter < GAME_CHAPTER_MAX) {
      next.unlockedChapter = chapter + 1;
    }
  }

  const cursor = continueTarget(next);
  next.currentChapter = cursor.chapter;
  next.currentStage = cursor.stage;
  next.lastPlayDay = Date.now();
  return next;
}

export function alefBetLevelRecord(game: GameSnapshot, level: number): StageRecord {
  return game.alefBet?.levels?.[String(level)] ?? emptyAlefLevel();
}

export function isAlefBetLevelUnlocked(game: GameSnapshot, level: number): boolean {
  const n = Math.min(3, Math.max(1, Math.round(level) || 1));
  return n <= (game.alefBet?.unlockedLevel || 1);
}

export function applyAlefBetResult(
  game: GameSnapshot,
  level: number,
  result: { stars: number; score: number; firstTryRate: number },
): GameSnapshot {
  const next = cloneGame(hydrateGame(game));
  const n = Math.min(3, Math.max(1, Math.round(level) || 1));
  const ab = next.alefBet ?? emptyAlefBet();
  const prev = ab.levels[String(n)] ?? emptyAlefLevel();
  ab.levels[String(n)] = {
    stars: Math.max(prev.stars, result.stars),
    best: Math.max(prev.best, result.score),
    cleared: true,
    attempts: (prev.attempts || 0) + 1,
  };
  if (n >= ab.unlockedLevel && n < 3) ab.unlockedLevel = n + 1;
  ab.currentLevel = ab.unlockedLevel;
  next.alefBet = ab;
  next.lastPlayDay = Date.now();
  if (result.firstTryRate >= 0.4) {
    next.winStreak = (next.winStreak || 0) + 1;
    next.bestWinStreak = Math.max(next.bestWinStreak || 0, next.winStreak);
  } else {
    next.winStreak = 0;
  }
  return next;
}

export function syllableUnitRecord(game: GameSnapshot, unit: number): StageRecord {
  return game.syllables?.units?.[String(unit)] ?? emptyAlefLevel();
}

export function isSyllableUnitUnlocked(game: GameSnapshot, unit: number): boolean {
  const n = Math.min(SYLLABLE_UNIT_MAX, Math.max(1, Math.round(unit) || 1));
  return n <= (game.syllables?.unlockedUnit || 1);
}

export function applySyllableResult(
  game: GameSnapshot,
  unit: number,
  result: { stars: number; score: number; firstTryRate: number },
): GameSnapshot {
  const next = cloneGame(hydrateGame(game));
  const n = Math.min(SYLLABLE_UNIT_MAX, Math.max(1, Math.round(unit) || 1));
  const sy = next.syllables ?? emptySyllables();
  const prev = sy.units[String(n)] ?? emptyAlefLevel();
  const passed = result.score >= 70;
  sy.units[String(n)] = {
    stars: Math.max(prev.stars, result.stars),
    best: Math.max(prev.best, result.score),
    cleared: prev.cleared || passed,
    attempts: (prev.attempts || 0) + 1,
  };
  if (passed && n >= sy.unlockedUnit && n < SYLLABLE_UNIT_MAX) sy.unlockedUnit = n + 1;
  sy.currentUnit = sy.unlockedUnit;
  next.syllables = sy;
  next.lastPlayDay = Date.now();
  if (result.firstTryRate >= 0.4) {
    next.winStreak = (next.winStreak || 0) + 1;
    next.bestWinStreak = Math.max(next.bestWinStreak || 0, next.winStreak);
  } else {
    next.winStreak = 0;
  }
  return next;
}

export function nounUnitRecord(game: GameSnapshot, unit: number): StageRecord {
  return game.nouns?.units?.[String(unit)] ?? emptyAlefLevel();
}

export function isNounUnitUnlocked(game: GameSnapshot, unit: number): boolean {
  const n = Math.min(NOUN_UNIT_MAX, Math.max(1, Math.round(unit) || 1));
  return n <= (game.nouns?.unlockedUnit || 1);
}

export function applyNounResult(
  game: GameSnapshot,
  unit: number,
  result: { stars: number; score: number; firstTryRate: number },
): GameSnapshot {
  const next = cloneGame(hydrateGame(game));
  const n = Math.min(NOUN_UNIT_MAX, Math.max(1, Math.round(unit) || 1));
  const nn = next.nouns ?? emptyNouns();
  const prev = nn.units[String(n)] ?? emptyAlefLevel();
  const passed = result.score >= 70;
  nn.units[String(n)] = {
    stars: Math.max(prev.stars, result.stars),
    best: Math.max(prev.best, result.score),
    cleared: prev.cleared || passed,
    attempts: (prev.attempts || 0) + 1,
  };
  if (passed && n >= nn.unlockedUnit && n < NOUN_UNIT_MAX) nn.unlockedUnit = n + 1;
  nn.currentUnit = nn.unlockedUnit;
  next.nouns = nn;
  next.lastPlayDay = Date.now();
  if (result.firstTryRate >= 0.4) {
    next.winStreak = (next.winStreak || 0) + 1;
    next.bestWinStreak = Math.max(next.bestWinStreak || 0, next.winStreak);
  } else {
    next.winStreak = 0;
  }
  return next;
}

export function applyUltimateResult(game: GameSnapshot, pct: number): GameSnapshot {
  const next = cloneGame(hydrateGame(game));
  const score = Math.max(0, Math.min(100, Math.round(pct)));
  next.ultimateBest = Math.max(next.ultimateBest || 0, score);
  next.ultimateAttempts = (next.ultimateAttempts || 0) + 1;
  next.ultimatePerfect = next.ultimatePerfect || score >= 100;
  next.ultimateRun = null;
  return next;
}

export function startUltimateRun(game: GameSnapshot, ids: string[]): GameSnapshot {
  const next = cloneGame(hydrateGame(game));
  next.ultimateRun = { ids, answers: ids.map(() => ""), i: 0 };
  return next;
}

export function patchUltimateRun(game: GameSnapshot, run: UltimateRun): GameSnapshot {
  const next = cloneGame(hydrateGame(game));
  next.ultimateRun = {
    ids: run.ids,
    answers: run.answers.slice(0, run.ids.length),
    i: Math.max(0, Math.min(run.ids.length, run.i)),
  };
  return next;
}

export function chapterPool(chapter: number): VocabItem[] {
  const n = clampChapter(chapter);
  if (n === 1) return alphabetVocab();
  return VOCAB.filter((v) => v.chapter === n);
}

/** Play deck: the BBH citation form only, so class vocab stays what the book printed. */
export function chapterPlayPool(chapter: number, _stage?: GameStageId): VocabItem[] {
  return chapterPool(chapter);
}

export function runOrdinal(n: number): string {
  const words = [
    "",
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
    "eleventh",
    "twelfth",
  ];
  if (n >= 1 && n < words.length) return words[n];
  const ones = n % 10;
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  if (ones === 1) return `${n}st`;
  if (ones === 2) return `${n}nd`;
  if (ones === 3) return `${n}rd`;
  return `${n}th`;
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
