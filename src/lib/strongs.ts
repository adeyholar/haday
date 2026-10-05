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

const files = new Map<string, Promise<Record<string, Raw>>>();

function loadFile(kind: "hebrew" | "greek"): Promise<Record<string, Raw>> {
  const hit = files.get(kind);
  if (hit) return hit;
  const job = fetch(`/lexicon/strongs-${kind}.json`).then((res) => {
    if (!res.ok) throw new Error("lexicon");
    return res.json() as Promise<Record<string, Raw>>;
  });
  files.set(kind, job);
  return job;
}

export async function lookupStrong(id: string): Promise<StrongEntry | null> {
  const key = id.trim().toUpperCase();
  if (!/^[HG]\d+$/.test(key)) return null;
  try {
    const book = await loadFile(key.startsWith("G") ? "greek" : "hebrew");
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
