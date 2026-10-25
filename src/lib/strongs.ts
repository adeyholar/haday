export type StrongEntry = {
  id: string;
  word: string;
  translit: string;
  pron: string;
  def: string;
  kjv: string;
  derivation: string;
};

type Raw = { w?: string; x?: string; p?: string; d?: string; k?: string; r?: string };

/** Hebrew Strong's is split so a card loads one range, not the whole book. */
export const STRONG_HEBREW_CHUNK = 500;
export const STRONG_HEBREW_MAX = 8674;

const files = new Map<string, Promise<Record<string, Raw>>>();

export function strongHebrewChunk(id: string): string | null {
  const match = /^H(\d+)$/.exec(id.trim().toUpperCase());
  const n = match ? Number(match[1]) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > STRONG_HEBREW_MAX) return null;
  const start = Math.floor((n - 1) / STRONG_HEBREW_CHUNK) * STRONG_HEBREW_CHUNK + 1;
  const end = Math.min(start + STRONG_HEBREW_CHUNK - 1, STRONG_HEBREW_MAX);
  const pad = (value: number) => String(value).padStart(4, "0");
  return `H${pad(start)}-H${pad(end)}`;
}

function loadJson(cacheKey: string, url: string): Promise<Record<string, Raw>> {
  const hit = files.get(cacheKey);
  if (hit) return hit;
  const job = fetch(url).then((res) => {
    if (!res.ok) throw new Error("lexicon");
    return res.json() as Promise<Record<string, Raw>>;
  });
  files.set(cacheKey, job);
  return job;
}

function loadFile(kind: "hebrew" | "greek", id: string): Promise<Record<string, Raw>> {
  if (kind === "greek") return loadJson("greek", "/lexicon/strongs-greek.json");
  const name = strongHebrewChunk(id);
  if (!name) return Promise.resolve({});
  return loadJson(name, `/lexicon/strongs-hebrew/${name}.json`);
}

export async function lookupStrong(id: string): Promise<StrongEntry | null> {
  const key = id.trim().toUpperCase();
  if (!/^[HG]\d+$/.test(key)) return null;
  try {
    const book = await loadFile(key.startsWith("G") ? "greek" : "hebrew", key);
    const row = book[key];
    if (!row) return null;
    return {
      id: key,
      word: row.w ?? "",
      translit: row.x ?? "",
      pron: row.p ?? "",
      def: row.d ?? "",
      kjv: row.k ?? "",
      derivation: row.r ?? "",
    };
  } catch {
    return null;
  }
}

export type StrongBook = Record<string, Record<string, string[]>>;

const tagCache = new Map<string, StrongBook>();

export async function fetchStrongTags(book: string): Promise<StrongBook> {
  const hit = tagCache.get(book);
  if (hit) return hit;
  try {
    const res = await fetch(`/tanakh/strongs/${book}.json`);
    if (!res.ok) return {};
    const data = (await res.json()) as StrongBook;
    tagCache.set(book, data);
    return data;
  } catch {
    return {};
  }
}