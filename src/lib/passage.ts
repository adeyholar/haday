import countsRaw from "@/lib/tanakh-verse-counts.json";
import {
  TANAKH_BOOKS,
  bookMeta,
  nextChapter,
  prevChapter,
  type BookId,
} from "@/lib/tanakh-canon";

const COUNTS = countsRaw as Record<string, number[]>;

export type PassageKind = "verses" | "chapters" | "book" | "all";

export type ReadSearch = {
  v1?: number;
  v2?: number;
  c1?: number;
  c2?: number;
  scope?: "book" | "all";
  loop?: boolean;
};

export type Passage = {
  kind: PassageKind;
  book: BookId;
  chapter: number;
  fromCh: number;
  toCh: number;
  fromV: number;
  toV: number;
  loop: boolean;
};

export type PlayLoc = { book: BookId; chapter: number };

const AUTO_KEY = "haday-tanakh-autoplay";

function asInt(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isInteger(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    if (Number.isInteger(n)) return n;
  }
  return undefined;
}

export function parseReadSearch(s: Record<string, unknown>): ReadSearch {
  const out: ReadSearch = {};
  const v1 = asInt(s.v1);
  const v2 = asInt(s.v2);
  const c1 = asInt(s.c1);
  const c2 = asInt(s.c2);
  if (v1 != null && v1 > 0) out.v1 = v1;
  if (v2 != null && v2 > 0) out.v2 = v2;
  if (c1 != null && c1 > 0) out.c1 = c1;
  if (c2 != null && c2 > 0) out.c2 = c2;
  if (s.scope === "book" || s.scope === "all") out.scope = s.scope;
  if (s.loop === true || s.loop === 1 || s.loop === "1" || s.loop === "true") out.loop = true;
  return out;
}

export function versesInChapter(book: string, chapter: number): number {
  const row = COUNTS[book];
  if (!row) return 1;
  return row[Math.max(0, chapter - 1)] ?? 1;
}

export function lastChapter(book: string): number {
  return COUNTS[book]?.length ?? bookMeta(book)?.chapters ?? 1;
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.floor(n)));
}

export function clampVerse(book: string, chapter: number, verse: number): number {
  return clamp(verse, 1, versesInChapter(book, chapter));
}

export function clampChapter(book: string, chapter: number): number {
  return clamp(chapter, 1, lastChapter(book));
}

export function passageSearch(p: Passage): ReadSearch {
  const out: ReadSearch = {};
  if (p.loop) out.loop = true;
  if (p.kind === "verses") {
    out.v1 = p.fromV;
    out.v2 = p.toV;
    return out;
  }
  if (p.kind === "chapters") {
    out.c1 = p.fromCh;
    out.c2 = p.toCh;
    return out;
  }
  if (p.kind === "book") {
    out.scope = "book";
    return out;
  }
  out.scope = "all";
  return out;
}

export function resolvePassage(book: BookId, chapter: number, search: ReadSearch): Passage {
  const chMax = lastChapter(book);
  const ch = clamp(chapter, 1, chMax);
  const loop = Boolean(search.loop);

  if (search.v1 != null || search.v2 != null) {
    let a = clampVerse(book, ch, search.v1 ?? 1);
    let b = clampVerse(book, ch, search.v2 ?? versesInChapter(book, ch));
    if (a > b) [a, b] = [b, a];
    return {
      kind: "verses",
      book,
      chapter: ch,
      fromCh: ch,
      toCh: ch,
      fromV: a,
      toV: b,
      loop,
    };
  }

  if (search.scope === "all") {
    return {
      kind: "all",
      book,
      chapter: ch,
      fromCh: 1,
      toCh: chMax,
      fromV: 1,
      toV: versesInChapter(book, ch),
      loop,
    };
  }

  if (search.scope === "book") {
    return {
      kind: "book",
      book,
      chapter: ch,
      fromCh: 1,
      toCh: chMax,
      fromV: 1,
      toV: versesInChapter(book, ch),
      loop,
    };
  }

  if (search.c1 != null || search.c2 != null) {
    let a = clampChapter(book, search.c1 ?? ch);
    let b = clampChapter(book, search.c2 ?? a);
    if (a > b) [a, b] = [b, a];
    const playing = clamp(ch, a, b);
    return {
      kind: "chapters",
      book,
      chapter: playing,
      fromCh: a,
      toCh: b,
      fromV: 1,
      toV: versesInChapter(book, playing),
      loop,
    };
  }

  return {
    kind: "chapters",
    book,
    chapter: ch,
    fromCh: ch,
    toCh: ch,
    fromV: 1,
    toV: versesInChapter(book, ch),
    loop,
  };
}

export function isSingleChapter(p: Passage): boolean {
  return p.fromCh === p.toCh && p.kind !== "book" && p.kind !== "all";
}

export function isFullChapter(p: Passage): boolean {
  if (p.kind === "verses") return p.fromV === 1 && p.toV === versesInChapter(p.book, p.chapter);
  return true;
}

export function verseWindow(p: Passage): { from: number; to: number } {
  if (p.kind === "verses") return { from: p.fromV, to: p.toV };
  return { from: 1, to: versesInChapter(p.book, p.chapter) };
}

export function passageLabel(p: Passage): string {
  const name = bookMeta(p.book)?.en ?? p.book;
  if (p.kind === "all") return "Tanakh";
  if (p.kind === "book") return name;
  if (p.kind === "chapters") {
    if (p.fromCh === p.toCh) return `${name} ${p.fromCh}`;
    return `${name} ${p.fromCh}–${p.toCh}`;
  }
  if (p.fromV === p.toV) return `${name} ${p.chapter}:${p.fromV}`;
  return `${name} ${p.chapter}:${p.fromV}–${p.toV}`;
}

export function playingLabel(p: Passage): string {
  const name = bookMeta(p.book)?.en ?? p.book;
  if (p.kind === "verses") return passageLabel(p);
  if (p.kind === "all") return `${name} ${p.chapter}`;
  if (p.kind === "book") return `${name} ${p.chapter}`;
  if (p.fromCh === p.toCh) return `${name} ${p.chapter}`;
  return `${name} ${p.chapter} · ${p.fromCh}–${p.toCh}`;
}

export function nextPlayLoc(p: Passage): PlayLoc | null {
  if (p.kind === "verses") return p.loop ? { book: p.book, chapter: p.chapter } : null;
  if (p.kind === "all") {
    const nxt = nextChapter(p.book, p.chapter);
    if (nxt) return nxt;
    return p.loop ? { book: "Gen", chapter: 1 } : null;
  }
  if (p.chapter < p.toCh) return { book: p.book, chapter: p.chapter + 1 };
  if (p.loop) return { book: p.book, chapter: p.fromCh };
  return null;
}

export function prevPlayLoc(p: Passage): PlayLoc | null {
  if (p.kind === "verses") return p.loop ? { book: p.book, chapter: p.chapter } : null;
  if (p.kind === "all") {
    const prev = prevChapter(p.book, p.chapter);
    if (prev) return prev;
    if (!p.loop) return null;
    const last = TANAKH_BOOKS[TANAKH_BOOKS.length - 1];
    return last ? { book: last.id, chapter: last.chapters } : null;
  }
  if (p.chapter > p.fromCh) return { book: p.book, chapter: p.chapter - 1 };
  if (p.loop) return { book: p.book, chapter: p.toCh };
  return null;
}

export function sameLoc(a: PlayLoc, b: PlayLoc): boolean {
  return a.book === b.book && a.chapter === b.chapter;
}

export function armAutoplay() {
  try {
    sessionStorage.setItem(AUTO_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function takeAutoplay(): boolean {
  try {
    const on = sessionStorage.getItem(AUTO_KEY) === "1";
    sessionStorage.removeItem(AUTO_KEY);
    return on;
  } catch {
    return false;
  }
}
