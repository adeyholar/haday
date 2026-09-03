import { clusterAtTime } from "@/lib/hebrew-phones";
import raw from "@/lib/genesis-1-5.json";
import audioRaw from "@/lib/tanakh-audio.json";
import { shuffle } from "@/lib/vocab";
import {
  chapterAudioSrc,
  type BookId,
  type TanakhDump,
} from "@/lib/tanakh-canon";

type GenesisDump = {
  heSource: string;
  enSource: string;
  chapters: Record<string, Array<{ v: number; he: string; en: string; words: string[] }>>;
};

const data = raw as GenesisDump;

export type ChapterAudio = { src: string; duration: number; verses: number[]; words?: number[][] };
const AUDIO = audioRaw as Record<string, ChapterAudio>;

export const AUDIO_CREDIT =
  "Hebrew reading: Abraham Shmuelof (Talking Bibles International, via Mechon Mamre). English: World English Bible (public domain). Hebrew text: Westminster Leningrad Codex (public domain).";

export const READ_RATES = [
  { value: 0.7, label: "Slow" },
  { value: 1, label: "Recorded" },
  { value: 1.25, label: "Faster" },
] as const;

export type MediaClock = { media: number; wall: number; rate: number };

/** Highlight sits this far ahead of the playhead so the mark is on the word as it is spoken. */
export const HIGHLIGHT_LEAD = 0.14;

/** Media-time for highlighting. Independent of Slow / Recorded / Faster wall clock. */
export function mediaClockTime(
  currentTime: number,
  paused: boolean,
  clock: MediaClock,
  now: number,
  duration = 0,
): number {
  if (paused || clock.rate <= 0) return currentTime;
  const interpolated = clock.media + ((now - clock.wall) / 1000) * clock.rate;
  // Never sit behind the element or the wall clock — iOS currentTime often lags.
  const t = Math.max(currentTime, interpolated);
  const cap = duration > 0 ? duration : Number.POSITIVE_INFINITY;
  return Math.min(cap, Math.max(0, t));
}

export function formatPlayTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export type ReadingVerse = {
  book: BookId | "Gen";
  bookEn: string;
  chapter: number;
  verse: number;
  he: string;
  en: string;
  words: string[];
  ref: string;
};

export type ReadingCh = 1 | 2 | 3 | 4 | 5;
export type ReadingKey = ReadingCh | "all";

const KEY = "haday-tanakh-read-v1";
const LEGACY_KEY = "haday-gen-read-v1";

export const READING_CHAPTERS: ReadingCh[] = [1, 2, 3, 4, 5];

export function parseReadingKey(raw: string | undefined): ReadingKey {
  if (raw === "all") return "all";
  const n = Number(raw);
  if (n >= 1 && n <= 5) return n as ReadingCh;
  return 1;
}

function rowToVerse(
  book: BookId,
  bookEn: string,
  ch: number,
  row: { v: number; he: string; en: string; words: string[] },
): ReadingVerse {
  return {
    book,
    bookEn,
    chapter: ch,
    verse: row.v,
    he: row.he,
    en: row.en,
    words: row.words,
    ref: `${book} ${ch}:${row.v}`,
  };
}

export function readingVerses(key: ReadingKey): ReadingVerse[] {
  const chs = key === "all" ? READING_CHAPTERS : [key];
  const out: ReadingVerse[] = [];
  for (const ch of chs) {
    const rows = data.chapters[String(ch)] ?? [];
    for (const row of rows) out.push(rowToVerse("Gen", "Genesis", ch, row));
  }
  return out;
}

export function versesFromDump(dump: TanakhDump, chapter: number | "all"): ReadingVerse[] {
  const keys =
    chapter === "all"
      ? Object.keys(dump.chapters)
          .map(Number)
          .filter((n) => Number.isFinite(n))
          .sort((a, b) => a - b)
      : [chapter];
  const out: ReadingVerse[] = [];
  for (const ch of keys) {
    for (const row of dump.chapters[String(ch)] ?? []) {
      out.push(rowToVerse(dump.id, dump.en, ch, row));
    }
  }
  return out;
}

export function sliceVerses(verses: ReadingVerse[], fromV?: number, toV?: number): ReadingVerse[] {
  if (fromV == null && toV == null) return verses;
  const lo = fromV ?? 1;
  const hi = toV ?? Number.POSITIVE_INFINITY;
  return verses.filter((v) => v.verse >= lo && v.verse <= hi);
}

/** Media-time window covering verses fromV–toV inclusive in one chapter MP3. */
export function audioWindow(
  meta: ChapterAudio | undefined,
  fromV: number,
  toV: number,
  duration = 0,
): { start: number; end: number } {
  const start = verseStartFrom(meta, fromV);
  const after = meta?.verses?.[toV];
  const end = after != null ? after : duration || meta?.duration || start;
  return { start, end: Math.max(start + 0.2, end) };
}

export const READING_CREDIT = {
  he: data.heSource as string,
  en: data.enSource as string,
};

export function chapterAudio(chapter: number): ChapterAudio | undefined {
  return AUDIO[String(chapter)];
}

export function audioFor(book: BookId, chapter: number): ChapterAudio {
  if (book === "Gen") {
    const aligned = AUDIO[String(chapter)];
    if (aligned) return aligned;
  }
  return { src: chapterAudioSrc(book, chapter), duration: 0, verses: [] };
}

function letterCount(word: string): number {
  let n = 0;
  for (const c of word) {
    if (c >= "\u05d0" && c <= "\u05ea") n += 1;
  }
  return n || 1;
}

export function estimateTiming(verses: ReadingVerse[], duration: number): { verses: number[]; words: number[][] } {
  const heading = Math.min(10, Math.max(3, duration * 0.035));
  const weights = verses.map((v) => v.words.reduce((n, w) => n + letterCount(w), 0) || 1);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const body = Math.max(0.2, duration - heading);
  const starts: number[] = [];
  const words: number[][] = [];
  let t = heading;
  for (let i = 0; i < verses.length; i++) {
    starts.push(Math.round(t * 1000) / 1000);
    const span = body * ((weights[i] ?? 1) / total);
    const vw = verses[i]?.words ?? [];
    const ww = vw.map((w) => letterCount(w));
    const wtot = ww.reduce((a, b) => a + b, 0) || 1;
    let wt = t;
    const wstarts: number[] = [];
    for (let j = 0; j < vw.length; j++) {
      wstarts.push(Math.round(wt * 1000) / 1000);
      wt += span * ((ww[j] ?? 1) / wtot);
    }
    words.push(wstarts);
    t += span;
  }
  return { verses: starts, words };
}

export function withEstimatedTiming(meta: ChapterAudio, verses: ReadingVerse[], duration: number): ChapterAudio {
  if (meta.verses.length && meta.words?.length) return { ...meta, duration: duration || meta.duration };
  const est = estimateTiming(verses, duration || meta.duration || 1);
  return { src: meta.src, duration: duration || meta.duration, verses: est.verses, words: est.words };
}

function indexAt(starts: number[], time: number): number {
  if (!starts.length) return 0;
  let v = 0;
  for (let i = 0; i < starts.length; i++) {
    const prev = i > 0 ? starts[i - 1] : undefined;
    const gap = prev != null ? (starts[i] ?? 0) - prev : 1;
    const lead = Math.min(HIGHLIGHT_LEAD, Math.max(0.04, gap * 0.4));
    if (time + lead >= (starts[i] ?? 0)) v = i;
    else break;
  }
  return v;
}

export function verseStartFrom(meta: ChapterAudio | undefined, verse: number): number {
  const starts = meta?.verses;
  if (!starts?.length) return 0;
  return starts[Math.max(0, Math.min(starts.length, verse) - 1)] ?? 0;
}

export function verseStartTime(chapter: number, verse: number): number {
  return verseStartFrom(chapterAudio(chapter), verse);
}

export function verseAtStarts(starts: number[], time: number): number {
  return indexAt(starts, time) + 1;
}

/** Verse number (1-based) for a playback time in that chapter’s MP3. */
export function verseAtTime(chapter: number, time: number): number {
  return verseAtStarts(chapterAudio(chapter)?.verses ?? [], time);
}

export function wordAtStarts(starts: number[], time: number): number {
  return indexAt(starts, time);
}

/** 0-based word index inside a verse for a playback time. */
export function wordAtTime(chapter: number, verse: number, time: number): number {
  return wordAtStarts(chapterAudio(chapter)?.words?.[Math.max(0, verse - 1)] ?? [], time);
}

export function wordEndFrom(meta: ChapterAudio | undefined, verse: number, word: number): number {
  const starts = meta?.words?.[Math.max(0, verse - 1)] ?? [];
  const next = starts[word + 1];
  if (next != null) return next;
  const verses = meta?.verses ?? [];
  const vEnd = verses[verse];
  if (vEnd != null) return vEnd;
  return meta?.duration ?? starts[word] ?? 0;
}

export function wordEndTime(chapter: number, verse: number, word: number): number {
  return wordEndFrom(chapterAudio(chapter), verse, word);
}

export function clusterAtMeta(
  meta: ChapterAudio | undefined,
  verse: number,
  word: number,
  time: number,
  surface: string,
): number {
  const starts = meta?.words?.[Math.max(0, verse - 1)] ?? [];
  const t0 = starts[word] ?? 0;
  const t1 = wordEndFrom(meta, verse, word);
  const lead = Math.min(HIGHLIGHT_LEAD, Math.max(0.04, (t1 - t0) * 0.2));
  return clusterAtTime(surface, t0, t1, time + lead);
}

export function clusterAtPlay(chapter: number, verse: number, word: number, time: number, surface: string): number {
  return clusterAtMeta(chapterAudio(chapter), verse, word, time, surface);
}

export type GradeItem = {
  id: string;
  verse: ReadingVerse;
  choices: string[];
  answer: string;
};

export function gradeFromVerses(verses: ReadingVerse[], n = 10): GradeItem[] {
  const poolSrc = verses.filter((v) => v.en.length > 8);
  const pool = shuffle(poolSrc).slice(0, Math.min(n, poolSrc.length));
  return pool.map((verse, i) => {
    const others = shuffle(poolSrc.filter((v) => v.ref !== verse.ref).map((v) => v.en)).slice(0, 3);
    const choices = shuffle([verse.en, ...others]);
    return { id: `${verse.ref}:${i}`, verse, choices, answer: verse.en };
  });
}

export function readingGradeQuiz(key: ReadingKey, n = 10): GradeItem[] {
  return gradeFromVerses(readingVerses(key), n);
}

export type ChapterReadRec = { best: number; cleared: boolean; attempts: number };

export function progressId(book: string, chapter: number | "all"): string {
  return `${book}.${chapter}`;
}

export function bookClearedCount(
  progress: Record<string, ChapterReadRec>,
  book: string,
  chapters: number,
): number {
  let n = 0;
  for (let i = 1; i <= chapters; i++) {
    if (progress[progressId(book, i)]?.cleared) n += 1;
  }
  return n;
}

export function loadReadingProgress(): Record<string, ChapterReadRec> {
  try {
    const neu = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, ChapterReadRec>;
    if (neu && typeof neu === "object" && Object.keys(neu).length) return neu;
    const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || "{}") as Record<string, ChapterReadRec>;
    if (!old || typeof old !== "object") return {};
    const mapped: Record<string, ChapterReadRec> = {};
    for (const [k, v] of Object.entries(old)) {
      mapped[k === "all" ? "Gen.all" : `Gen.${k}`] = v;
      mapped[k] = v;
    }
    return mapped;
  } catch {
    return {};
  }
}

export function saveReadingResult(key: ReadingKey | string, score: number): ChapterReadRec {
  const all = loadReadingProgress();
  const id = String(key);
  const prev = all[id] ?? { best: 0, cleared: false, attempts: 0 };
  const passed = score >= 90;
  const next: ChapterReadRec = {
    best: Math.max(prev.best, score),
    cleared: passed,
    attempts: prev.attempts + 1,
  };
  all[id] = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  return next;
}
