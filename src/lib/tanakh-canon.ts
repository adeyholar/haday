import catalogRaw from "@/lib/tanakh-catalog.json";

export type BookId =
  | "Gen"
  | "Exod"
  | "Lev"
  | "Num"
  | "Deut"
  | "Josh"
  | "Judg"
  | "1Sam"
  | "2Sam"
  | "1Kgs"
  | "2Kgs"
  | "Isa"
  | "Jer"
  | "Ezek"
  | "Hos"
  | "Joel"
  | "Amos"
  | "Obad"
  | "Jonah"
  | "Mic"
  | "Nah"
  | "Hab"
  | "Zeph"
  | "Hag"
  | "Zech"
  | "Mal"
  | "Ps"
  | "Prov"
  | "Job"
  | "Song"
  | "Ruth"
  | "Lam"
  | "Eccl"
  | "Esth"
  | "Dan"
  | "Ezra"
  | "Neh"
  | "1Chr"
  | "2Chr";

export type SectionId = "torah" | "neviim" | "ketuvim";

export type BookMeta = {
  id: BookId;
  en: string;
  he: string;
  section: SectionId;
  chapters: number;
  verses: number;
};

export const SECTIONS: { id: SectionId; en: string; he: string }[] = [
  { id: "torah", en: "Torah", he: "תּוֹרָה" },
  { id: "neviim", en: "Nevi'im", he: "נְבִיאִים" },
  { id: "ketuvim", en: "Ketuvim", he: "כְּתוּבִים" },
];

export const TANAKH_BOOKS: BookMeta[] = catalogRaw as BookMeta[];

const BOOK_SET = new Set(TANAKH_BOOKS.map((b) => b.id));

export function isBookId(id: string): id is BookId {
  return BOOK_SET.has(id as BookId);
}

export function bookMeta(id: string): BookMeta | undefined {
  return TANAKH_BOOKS.find((b) => b.id === id);
}

export function booksIn(section: SectionId): BookMeta[] {
  return TANAKH_BOOKS.filter((b) => b.section === section);
}

export type TanakhDump = {
  id: BookId;
  en: string;
  he: string;
  section: SectionId;
  heSource: string;
  enSource: string;
  chapters: Record<string, Array<{ v: number; he: string; en: string; words: string[] }>>;
};

const dumpCache = new Map<string, TanakhDump>();

export async function fetchTanakhBook(id: BookId): Promise<TanakhDump> {
  const hit = dumpCache.get(id);
  if (hit) return hit;
  const res = await fetch(`/tanakh/books/${id}.json`);
  if (!res.ok) throw new Error(`Could not load ${id}`);
  const data = (await res.json()) as TanakhDump;
  dumpCache.set(id, data);
  return data;
}

/** Mechon Mamre / Talking Bibles chapter codes (Abraham Shmuelof). */
const MECHON: Record<BookId, string> = {
  Gen: "01",
  Exod: "02",
  Lev: "03",
  Num: "04",
  Deut: "05",
  Josh: "06",
  Judg: "07",
  "1Sam": "08a",
  "2Sam": "08b",
  "1Kgs": "09a",
  "2Kgs": "09b",
  Isa: "10",
  Jer: "11",
  Ezek: "12",
  Hos: "13",
  Joel: "14",
  Amos: "15",
  Obad: "16",
  Jonah: "17",
  Mic: "18",
  Nah: "19",
  Hab: "20",
  Zeph: "21",
  Hag: "22",
  Zech: "23",
  Mal: "24",
  "1Chr": "25a",
  "2Chr": "25b",
  Ps: "26",
  Job: "27",
  Prov: "28",
  Ruth: "29",
  Song: "30",
  Eccl: "31",
  Lam: "32",
  Esth: "33",
  Dan: "34",
  Ezra: "35a",
  Neh: "35b",
};

/** Psalms 100–150: t26a0 … t26f0 */
export function psalmMechonCode(n: number): string {
  if (n < 100) return String(n).padStart(2, "0");
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const letter = String.fromCharCode("a".charCodeAt(0) + tens - 10);
  return `${letter}${ones}`;
}

export function mechonAudioFile(book: BookId, chapter: number): string {
  const prefix = MECHON[book];
  if (book === "Ps") return `t26${psalmMechonCode(chapter)}.mp3`;
  return `t${prefix}${String(chapter).padStart(2, "0")}.mp3`;
}

export function mechonAudioUrl(book: BookId, chapter: number): string {
  return `https://mechon-mamre.org/mp3/${mechonAudioFile(book, chapter)}`;
}

export function localTanakhSrc(book: BookId, chapter: number): string | undefined {
  if (book === "Gen" && chapter >= 1 && chapter <= 5) {
    return `/audio/tanakh/01-Gen_${String(chapter).padStart(2, "0")}.mp3`;
  }
  return undefined;
}

export function chapterAudioSrc(book: BookId, chapter: number): string {
  return localTanakhSrc(book, chapter) ?? mechonAudioUrl(book, chapter);
}

export function nextChapter(book: BookId, chapter: number): { book: BookId; chapter: number } | null {
  const meta = bookMeta(book);
  if (!meta) return null;
  if (chapter < meta.chapters) return { book, chapter: chapter + 1 };
  const i = TANAKH_BOOKS.findIndex((b) => b.id === book);
  const nxt = TANAKH_BOOKS[i + 1];
  if (!nxt) return null;
  return { book: nxt.id, chapter: 1 };
}

export function prevChapter(book: BookId, chapter: number): { book: BookId; chapter: number } | null {
  if (chapter > 1) return { book, chapter: chapter - 1 };
  const i = TANAKH_BOOKS.findIndex((b) => b.id === book);
  const prev = TANAKH_BOOKS[i - 1];
  if (!prev) return null;
  return { book: prev.id, chapter: prev.chapters };
}

const LAST_KEY = "haday-tanakh-last";

export type LastRead = { book: BookId; chapter: number };

export function loadLastRead(): LastRead | null {
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_KEY) || "null") as LastRead | null;
    if (raw && isBookId(raw.book) && raw.chapter >= 1) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveLastRead(book: BookId, chapter: number) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ book, chapter }));
  } catch {
    /* ignore */
  }
}

export function isLegacyGenesisParam(raw: string): boolean {
  if (raw === "all") return true;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

export function parseChapter(raw: string, max: number): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > max) return null;
  return n;
}

export const TANAKH_CHAPTERS = TANAKH_BOOKS.reduce((n, b) => n + b.chapters, 0);
export const TANAKH_VERSES = TANAKH_BOOKS.reduce((n, b) => n + b.verses, 0);
