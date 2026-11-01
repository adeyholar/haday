/** Verses opened today, and the last place. Separate from Drill progress. */

import type { StudyScope } from "@/lib/reading-loop/passage";

export const DAILY_GOAL = 8;
const STORE_KEY = "haday-read-session-v1";

export type ReadPlace = {
  scope: StudyScope;
  book: string;
  chapter: number;
  verse: number;
  href: string;
};

export type ReadSession = {
  day: string;
  today: number;
  goal: number;
  last: ReadPlace | null;
};

type Saved = { day: string; refs: string[]; last: ReadPlace | null };

export type SessionStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function browserStore(): SessionStore | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

function empty(now: number): Saved {
  return { day: dayKey(now), refs: [], last: null };
}

function readSaved(store: SessionStore | null, now: number): Saved {
  if (!store) return empty(now);
  const raw = store.getItem(STORE_KEY);
  if (!raw) return empty(now);
  try {
    const row = JSON.parse(raw) as Partial<Saved>;
    const day = typeof row.day === "string" ? row.day : "";
    if (day !== dayKey(now)) return empty(now);
    const refs = Array.isArray(row.refs) ? row.refs.filter((ref) => typeof ref === "string").slice(0, 400) : [];
    const last = row.last && typeof row.last === "object" ? sanitizePlace(row.last) : null;
    return { day, refs, last };
  } catch {
    return empty(now);
  }
}

function sanitizePlace(row: Partial<ReadPlace>): ReadPlace | null {
  if (row.scope !== "bbh" && row.scope !== "iibs") return null;
  if (typeof row.book !== "string" || !row.book) return null;
  const chapter = Math.round(Number(row.chapter));
  const verse = Math.round(Number(row.verse));
  if (chapter < 1 || verse < 1) return null;
  return {
    scope: row.scope,
    book: row.book.slice(0, 8),
    chapter,
    verse,
    href: typeof row.href === "string" ? row.href.slice(0, 180) : "",
  };
}

function toSession(saved: Saved): ReadSession {
  return { day: saved.day, today: saved.refs.length, goal: DAILY_GOAL, last: saved.last };
}

export function peekSession(now = Date.now(), store: SessionStore | null = browserStore()): ReadSession {
  return toSession(readSaved(store, now));
}

/** Count a verse once per day. Opening the same verse again does not add another. */
export function noteVerse(place: ReadPlace, now = Date.now(), store: SessionStore | null = browserStore()): ReadSession {
  const saved = readSaved(store, now);
  const ref = `${place.scope}:${place.book}:${place.chapter}:${place.verse}`;
  if (!saved.refs.includes(ref)) saved.refs.push(ref);
  saved.last = {
    scope: place.scope,
    book: place.book,
    chapter: place.chapter,
    verse: place.verse,
    href: place.href,
  };
  store?.setItem(STORE_KEY, JSON.stringify(saved));
  return toSession(saved);
}

const DIM_KEY = "haday-dim-unknown";

export function readDimUnknown(store: SessionStore | null = browserStore()): boolean {
  return store?.getItem(DIM_KEY) === "1";
}

export function writeDimUnknown(on: boolean, store: SessionStore | null = browserStore()): void {
  store?.setItem(DIM_KEY, on ? "1" : "0");
}
