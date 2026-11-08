/** Parsing Lab. A short Tanakh passage, nouns and verbs only. No new dataset. */

import type { BookId } from "@/lib/tanakh-canon";
import { bookMeta, isBookId } from "@/lib/tanakh-canon";
import { versesInChapter } from "@/lib/passage";
import { splitStrongTag } from "@/lib/morph-parse";

export const PARSE_VERSE_CAP = 5;
const MISS_KEY = "haday-parse-lab-misses-v1";

const HEBREW_STEM: Record<string, string> = {
  q: "Qal",
  N: "Niphal",
  p: "Piel",
  P: "Pual",
  h: "Hiphil",
  H: "Hophal",
  t: "Hithpael",
  o: "Polel",
  O: "Polal",
  r: "Hithpolel",
  Q: "Qal passive",
  v: "Hishtaphel",
};

const ARAMAIC_STEM: Record<string, string> = {
  q: "Peal",
  Q: "Peil",
  p: "Pael",
  P: "Ithpaal",
  a: "Aphel",
  h: "Haphel",
  H: "Hophal",
  N: "Niphal",
  s: "Saphel",
};

const FORM: Record<string, string> = {
  p: "perfect",
  q: "weqatal",
  i: "imperfect",
  w: "wayyiqtol",
  h: "cohortative",
  j: "jussive",
  v: "imperative",
  r: "participle",
  s: "passive participle",
  a: "infinitive absolute",
  c: "infinitive construct",
};

const CLASS_STEMS = ["Qal", "Niphal", "Piel", "Pual", "Hiphil", "Hophal", "Hithpael"];
const ARAMAIC_STEMS = ["Peal", "Pael", "Haphel", "Hophal", "Niphal"];
const FORMS = [
  "perfect",
  "imperfect",
  "wayyiqtol",
  "weqatal",
  "imperative",
  "participle",
  "passive participle",
  "infinitive construct",
  "infinitive absolute",
  "cohortative",
  "jussive",
];
const GENDERS = ["masculine", "feminine", "common", "masculine or feminine"];
const NUMBERS = ["singular", "plural", "dual"];
const STATES = ["absolute", "construct", "determined"];

const FORM_FAMILY = new Set(["imperfect", "jussive", "cohortative"]);

export type ParseLineId = "lemma" | "stem" | "form" | "png" | "gn" | "gender" | "number" | "state" | "article" | "suffix";

export type ParseLine = {
  id: ParseLineId;
  label: string;
  answer: string;
  also: string[];
};

export type ParseTask = {
  key: string;
  ref: string;
  verse: number;
  index: number;
  surface: string;
  role: "noun" | "verb";
  aramaic: boolean;
  /** Strong's id for the dictionary form, such as H1254. */
  lemmaId: string;
  lines: ParseLine[];
};

export type ParseToken = {
  key: string;
  verse: number;
  index: number;
  surface: string;
  role: "noun" | "verb" | "name" | "other";
  task: ParseTask | null;
};

export type ParseVerse = {
  verse: number;
  ref: string;
  he: string;
  en: string;
  tokens: ParseToken[];
};

export type ParsePassage = {
  book: BookId;
  chapter: number;
  label: string;
  from: number;
  to: number;
  verses: ParseVerse[];
  tasks: ParseTask[];
  names: number;
  aramaic: boolean;
};

export type VerseRow = {
  verse: number;
  he: string;
  en: string;
  words: string[];
  /** Strong tag per word, such as H1254|HVqp3ms. Missing tags are skipped words. */
  tags: string[];
};

type Png = { person?: string; gender?: string; number?: string; state?: string };

function readPng(rest: string, at: number): Png {
  let i = at;
  const out: Png = {};
  const personCh = rest[i] ?? "";
  if (personCh === "1" || personCh === "2" || personCh === "3") {
    out.person = personCh === "1" ? "1st" : personCh === "2" ? "2nd" : "3rd";
    i += 1;
  }
  const g = rest[i] ?? "";
  if (g === "b") {
    out.gender = "masculine or feminine";
    i += 1;
  } else if (g === "m" || g === "f" || g === "c") {
    out.gender = g === "m" ? "masculine" : g === "f" ? "feminine" : "common";
    i += 1;
  }
  const n = rest[i] ?? "";
  if (n === "s" || n === "p" || n === "d") {
    out.number = n === "s" ? "singular" : n === "p" ? "plural" : "dual";
    i += 1;
  }
  const st = rest[i] ?? "";
  if (st === "a") out.state = "absolute";
  else if (st === "c") out.state = "construct";
  else if (st === "d") out.state = "determined";
  return out;
}

function phrase(bits: Array<string | undefined>): string {
  return bits.filter(Boolean).join(" ");
}

type ChunkFacts = {
  pos: string;
  nounKind?: "common" | "proper" | "gentilic";
  stem?: string;
  form?: string;
  png: Png;
  article: boolean;
  suffix?: string;
};

function readChunk(chunk: string, aramaic: boolean): ChunkFacts {
  const pos = chunk[0] ?? "";
  const rest = chunk.slice(1);
  const facts: ChunkFacts = { pos, png: {}, article: false };
  if (pos === "V") {
    const stems = aramaic ? ARAMAIC_STEM : HEBREW_STEM;
    facts.stem = stems[rest[0] ?? ""] ?? "";
    facts.form = FORM[rest[1] ?? ""] ?? "";
    facts.png = readPng(rest, 2);
    return facts;
  }
  if (pos === "N") {
    const kind = rest[0] ?? "";
    facts.nounKind = kind === "p" ? "proper" : kind === "g" ? "gentilic" : "common";
    facts.png = readPng(rest, 1);
    return facts;
  }
  if (pos === "T" && rest[0] === "d") facts.article = true;
  if (pos === "R" && rest[0] === "d") facts.article = true;
  if (pos === "S" && rest[0] === "p") {
    const png = readPng(rest, 1);
    facts.suffix = phrase([png.person, png.gender, png.number]);
  }
  return facts;
}

function blocksOf(morph: string): { aramaic: boolean; chunks: string[] }[] {
  return morph
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((block) => {
      const aramaic = block.startsWith("A");
      const body = block.startsWith("H") || block.startsWith("A") ? block.slice(1) : block;
      return { aramaic, chunks: body.split("/").filter(Boolean) };
    });
}

function line(id: ParseLineId, label: string, answer: string, also: string[] = []): ParseLine {
  return { id, label, answer, also: also.filter((item) => item && item !== answer) };
}

function formAlso(answer: string): string[] {
  if (!FORM_FAMILY.has(answer)) return [];
  return [...FORM_FAMILY].filter((item) => item !== answer);
}

function withAnswer(pool: string[], answer: string, also: string[]): string[] {
  const out: string[] = [];
  for (const item of [answer, ...also, ...pool]) {
    if (item && !out.includes(item)) out.push(item);
  }
  return out;
}

/** Choices for a line. The answer is always included. Lemma choices are built in the session. */
export function choicesFor(task: ParseTask, row: ParseLine): string[] {
  if (row.id === "lemma") return [row.answer];
  if (row.id === "stem") {
    const pool = task.aramaic ? ARAMAIC_STEMS : CLASS_STEMS;
    return withAnswer(pool, row.answer, row.also);
  }
  if (row.id === "form") return withAnswer(FORMS, row.answer, row.also);
  if (row.id === "gender") return withAnswer(GENDERS, row.answer, row.also);
  if (row.id === "number") return withAnswer(NUMBERS, row.answer, row.also);
  if (row.id === "state") {
    const pool = task.aramaic || row.answer === "determined" ? STATES : ["absolute", "construct"];
    return withAnswer(pool, row.answer, row.also);
  }
  if (row.id === "article") return withAnswer(["definite article", "no article"], row.answer, row.also);
  if (row.id === "png" || row.id === "gn" || row.id === "suffix") {
    const pool = [
      "3rd masculine singular",
      "3rd feminine singular",
      "3rd masculine plural",
      "3rd feminine plural",
      "2nd masculine singular",
      "2nd feminine singular",
      "2nd masculine plural",
      "1st common singular",
      "1st common plural",
      "masculine singular",
      "feminine singular",
      "masculine plural",
      "feminine plural",
    ];
    return withAnswer(pool, row.answer, row.also);
  }
  return withAnswer([], row.answer, row.also);
}

export function gradeLine(row: ParseLine, picked: string): boolean {
  const want = picked.trim();
  return want === row.answer || row.also.includes(want);
}

function taskFrom(surface: string, tag: string, verse: number, index: number, book: BookId, chapter: number): ParseToken {
  const ref = `${book} ${chapter}:${verse}`;
  const key = `${book}.${chapter}.${verse}.${index}`;
  const { id, morph } = splitStrongTag(tag);
  const blocks = blocksOf(morph);
  const aramaic = blocks.some((block) => block.aramaic);
  const facts = blocks.flatMap((block) => block.chunks.map((chunk) => readChunk(chunk, block.aramaic)));
  const head = [...facts].reverse().find((item) => item.pos === "V" || item.pos === "N");
  const article = facts.some((item) => item.article);
  const suffix = facts.find((item) => item.suffix)?.suffix ?? "";
  if (!head || (head.pos === "N" && head.nounKind === "proper")) {
    return { key, verse, index, surface, role: head?.nounKind === "proper" ? "name" : "other", task: null };
  }
  const lines: ParseLine[] = [];
  if (head.pos === "V") {
    if (id) lines.push(line("lemma", "Dictionary form", id));
    if (head.stem) lines.push(line("stem", "Stem", head.stem));
    if (head.form) lines.push(line("form", "Form", head.form, formAlso(head.form)));
    const finite = head.form !== "participle" && head.form !== "passive participle" && !head.form?.startsWith("infinitive");
    if (finite) {
      const png = phrase([head.png.person, head.png.gender, head.png.number]);
      const also =
        head.png.gender === "masculine or feminine"
          ? [phrase([head.png.person, "masculine", head.png.number]), phrase([head.png.person, "feminine", head.png.number])]
          : [];
      if (png) lines.push(line("png", "Person", png, also));
    } else if (head.form === "participle" || head.form === "passive participle") {
      const gn = phrase([head.png.gender, head.png.number]);
      const also =
        head.png.gender === "masculine or feminine"
          ? [phrase(["masculine", head.png.number]), phrase(["feminine", head.png.number])]
          : [];
      if (gn) lines.push(line("gn", "Gender and number", gn, also));
    }
    if (suffix) lines.push(line("suffix", "Pronominal suffix", suffix));
    const task: ParseTask = { key, ref, verse, index, surface, role: "verb", aramaic, lemmaId: id, lines };
    return { key, verse, index, surface, role: "verb", task };
  }
  if (head.png.gender) {
    const also = head.png.gender === "masculine or feminine" ? ["masculine", "feminine"] : [];
    lines.push(line("gender", "Gender", head.png.gender, also));
  }
  if (head.png.number) lines.push(line("number", "Number", head.png.number));
  if (head.png.state) lines.push(line("state", "State", head.png.state));
  if (article) lines.push(line("article", "Article", "definite article"));
  if (suffix) lines.push(line("suffix", "Pronominal suffix", suffix));
  const task: ParseTask = { key, ref, verse, index, surface, role: "noun", aramaic, lemmaId: id, lines };
  return { key, verse, index, surface, role: "noun", task };
}

export function clampParseSpan(book: BookId, chapter: number, from: number, count: number): { from: number; to: number; count: number } {
  const max = versesInChapter(book, chapter);
  const start = Math.min(Math.max(1, Math.floor(from) || 1), max);
  const n = Math.min(PARSE_VERSE_CAP, Math.max(1, Math.floor(count) || 1));
  const to = Math.min(max, start + n - 1);
  return { from: start, to, count: to - start + 1 };
}

export function buildPassage(book: BookId, chapter: number, rows: VerseRow[]): ParsePassage {
  const meta = bookMeta(book);
  const verses: ParseVerse[] = rows.map((row) => ({
    verse: row.verse,
    ref: `${book} ${chapter}:${row.verse}`,
    he: row.he,
    en: row.en,
    tokens: row.words.map((surface, index) => taskFrom(surface, row.tags[index] ?? "", row.verse, index, book, chapter)),
  }));
  const tasks = verses.flatMap((verse) => verse.tokens.flatMap((token) => (token.task ? [token.task] : [])));
  const names = verses.reduce((sum, verse) => sum + verse.tokens.filter((token) => token.role === "name").length, 0);
  const from = verses[0]?.verse ?? 1;
  const to = verses[verses.length - 1]?.verse ?? from;
  const span = from === to ? String(from) : `${from}–${to}`;
  const many = tasks.length === 1 ? "1 noun or verb" : `${tasks.length} nouns and verbs`;
  return {
    book,
    chapter,
    label: `${meta?.en ?? book} ${chapter}:${span} · ${many}`,
    from,
    to,
    verses,
    tasks,
    names,
    aramaic: tasks.some((task) => task.aramaic),
  };
}

export function hintText(task: ParseTask, level: number): string {
  const tongue = task.aramaic ? "Aramaic" : "Hebrew";
  const kind = task.role === "verb" ? "verb" : "noun";
  if (level <= 1) {
    const extra = task.lines.some((row) => row.id === "suffix") ? " A pronominal suffix is on it." : "";
    const article = task.lines.some((row) => row.id === "article") ? " The article is on it." : "";
    return `${tongue} ${kind}.${extra}${article}`.replace("  ", " ");
  }
  if (level === 2) {
    const first = task.lines[0];
    return first ? `${first.label}: ${first.answer}` : `${tongue} ${kind}.`;
  }
  const shown = task.lines.slice(0, -1).map((row) => `${row.label}: ${row.answer}`);
  return shown.join(" · ") || `${tongue} ${kind}.`;
}

export type FindGrade = { missed: ParseTask[]; extras: ParseToken[]; names: ParseToken[] };

/** Independent mode. A missed noun or verb is a miss. A particle is not. A name is not. */
export function gradeFind(tokens: ParseToken[], tapped: string[]): FindGrade {
  const picked = new Set(tapped);
  const missed = tokens.flatMap((token) => (token.task && !picked.has(token.key) ? [token.task] : []));
  const extras = tokens.filter((token) => picked.has(token.key) && token.role === "other");
  const names = tokens.filter((token) => picked.has(token.key) && token.role === "name");
  return { missed, extras, names };
}

export type StoredMiss = { feature: string; ref: string; surface: string };

export function featureOf(row: ParseLine): string {
  if (row.id === "lemma") return "dictionary form";
  if (row.id === "suffix") return `suffix · ${row.answer}`;
  return row.answer;
}

export function loadMisses(): StoredMiss[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(MISS_KEY) || "[]") as StoredMiss[];
    return Array.isArray(raw) ? raw.filter((row) => row && typeof row.feature === "string").slice(0, 40) : [];
  } catch {
    return [];
  }
}

export type ParseMode = "guided" | "independent";

export type ParseLabSearch = {
  book?: BookId;
  ch?: number;
  v?: number;
  n?: number;
  at?: number;
  one?: boolean;
  mode?: ParseMode;
};

function asInt(raw: unknown): number | undefined {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function parseParseLabSearch(raw: Record<string, unknown>): ParseLabSearch {
  const book = typeof raw.book === "string" && isBookId(raw.book) ? raw.book : undefined;
  const mode = raw.mode === "independent" ? "independent" : raw.mode === "guided" ? "guided" : undefined;
  const one = raw.one === true || raw.one === "true" || raw.one === "1";
  return {
    book,
    ch: asInt(raw.ch),
    v: asInt(raw.v),
    n: asInt(raw.n),
    at: typeof raw.at === "number" || typeof raw.at === "string" ? asInt(raw.at) ?? (raw.at === 0 || raw.at === "0" ? 0 : undefined) : undefined,
    one: one || undefined,
    mode,
  };
}

export function rememberMisses(rows: StoredMiss[]): StoredMiss[] {
  const prior = loadMisses();
  const seen = new Set(prior.map((row) => `${row.feature}|${row.ref}|${row.surface}`));
  const next = [...rows.filter((row) => {
    const key = `${row.feature}|${row.ref}|${row.surface}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }), ...prior].slice(0, 40);
  try {
    localStorage.setItem(MISS_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}
