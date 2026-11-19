import { isBookId, type BookId } from "@/lib/tanakh-canon";

export type VerseTarget = {
  book: BookId;
  ch: string;
  v1: number;
  v2: number;
};

const REF = /^(\S+)\s+(\d+):(\d+)(?:\s+#(\d+))?$/;

export function parseVerseRef(ref: string): { book: BookId; chapter: number; verse: number; word: number | null } | null {
  const match = REF.exec(ref.trim());
  if (!match) return null;
  const book = match[1] ?? "";
  const chapter = Number(match[2]);
  const verse = Number(match[3]);
  const word = match[4] ? Number(match[4]) : null;
  if (!isBookId(book) || !Number.isInteger(chapter) || !Number.isInteger(verse)) return null;
  return { book, chapter, verse, word };
}

export function verseTarget(ref: string): VerseTarget | null {
  const parsed = parseVerseRef(ref);
  if (!parsed) return null;
  return { book: parsed.book, ch: String(parsed.chapter), v1: parsed.verse, v2: parsed.verse };
}

/** OSHB `Book.ch.v` plus a 1-based WLC word index for the Grammar Path reader. */
export function osisTarget(osis: string, wordIndex: number): (VerseTarget & { w: number }) | null {
  const parts = osis.split(".");
  const book = parts[0] ?? "";
  const chapter = Number(parts[1]);
  const verse = Number(parts[2]);
  if (!isBookId(book) || !Number.isInteger(chapter) || !Number.isInteger(verse) || wordIndex < 1) return null;
  return { book, ch: String(chapter), v1: verse, v2: verse, w: wordIndex };
}
