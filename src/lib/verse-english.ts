import { useEffect, useState } from "react";
import { NO_ENGLISH, asEnglishSlot, type EnglishSlot } from "@/lib/english-line";
import { fetchTanakhBook, isBookId, TANAKH_BOOKS, type BookId } from "@/lib/tanakh-canon";

const NONE: EnglishSlot = { state: "none", message: NO_ENGLISH };

const NAME_ALIASES: Record<string, BookId> = {
  "1 sam": "1Sam",
  "2 sam": "2Sam",
  "1 kgs": "1Kgs",
  "2 kgs": "2Kgs",
  "1 chr": "1Chr",
  "2 chr": "2Chr",
  psalm: "Ps",
  psalms: "Ps",
  "song of songs": "Song",
  "song of solomon": "Song",
};

export function bookIdFromName(name: string): BookId | null {
  const trimmed = name.trim();
  if (isBookId(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  const known = NAME_ALIASES[lower];
  if (known) return known;
  const hit = TANAKH_BOOKS.find(
    (book) => book.en.toLowerCase() === lower || book.id.toLowerCase() === lower || book.short?.toLowerCase() === lower,
  );
  return hit?.id ?? null;
}

/** "Num 17:13", "Num.17.13", and "Numbers 17:13" become the book-file key. */
export function osisFromRef(ref: string | undefined): string | null {
  if (!ref) return null;
  const text = ref.trim();
  const dotted = /^([1-2]?[A-Za-z]+)\.(\d+)\.(\d+)$/.exec(text);
  if (dotted) {
    const book = bookIdFromName(dotted[1] ?? "");
    if (!book) return null;
    return `${book}.${dotted[2]}.${dotted[3]}`;
  }
  const spaced = /^(.+?)\s+(\d+):(\d+)$/.exec(text);
  if (!spaced) return null;
  const book = bookIdFromName(spaced[1] ?? "");
  if (!book) return null;
  return `${book}.${spaced[2]}.${spaced[3]}`;
}

export async function slotsForOsis(osis: string): Promise<{ ylt: EnglishSlot; web: EnglishSlot }> {
  const [book, chapter, verse] = osis.split(".");
  if (!book || !isBookId(book) || !chapter || !verse) return { ylt: NONE, web: NONE };
  try {
    const dump = await fetchTanakhBook(book);
    const row = dump.chapters[chapter]?.find((item) => item.v === Number(verse));
    if (!row) return { ylt: NONE, web: NONE };
    return { ylt: asEnglishSlot(row.ylt), web: asEnglishSlot(row.en) };
  } catch {
    return { ylt: NONE, web: NONE };
  }
}

export function useVerseSlots(ref: string | undefined): { ylt: EnglishSlot; web: EnglishSlot } {
  const osis = osisFromRef(ref) ?? "";
  const [slots, setSlots] = useState<{ ylt: EnglishSlot; web: EnglishSlot }>({ ylt: NONE, web: NONE });
  useEffect(() => {
    if (!osis) {
      setSlots({ ylt: NONE, web: NONE });
      return;
    }
    let cancel = false;
    void slotsForOsis(osis).then((next) => {
      if (!cancel) setSlots(next);
    });
    return () => {
      cancel = true;
    };
  }, [osis]);
  return slots;
}
