/** Where the ketiv and the qere differ, the read form is `q` and the written form is `k`.
 * `q` is empty when this ketiv is the rest of a split group whose qere was already drawn. */

export type KetivNote = { q: string; k: string };

export type KetivWord = {
  kq_role?: string | null;
  surface?: string;
  qere?: { surface?: string }[] | null;
};

/** Keyed by `Book.chapter.verse`, then token index. */
export type KetivNotes = Record<string, Record<string, KetivNote>>;

let pending: Promise<KetivNotes> | null = null;

export function fetchKetivQere(): Promise<KetivNotes> {
  if (pending) return pending;
  pending = fetch("/tanakh/ketiv-qere.json")
    .then((res) => (res.ok ? (res.json() as Promise<KetivNotes>) : {}))
    .catch(() => ({}));
  return pending;
}

export function ketivAt(notes: KetivNotes, book: string, chapter: number, verse: number, index: number): KetivNote | undefined {
  return notes[`${book}.${chapter}.${verse}`]?.[String(index)];
}

function readSurfaces(word: KetivWord | undefined): string {
  if (!word || word.kq_role !== "ketiv") return "";
  return (word.qere ?? [])
    .map((item) => item.surface || "")
    .filter(Boolean)
    .join(" ");
}

/**
 * The read form of this ketiv. Its own qere wins.
 * An empty qere borrows the next ketiv, which is where this pin hangs a split reading, then the previous.
 */
export function ketivReadSurface(words: KetivWord[], index: number): string {
  const word = words[index];
  if (!word || word.kq_role !== "ketiv") return "";
  const own = readSurfaces(word);
  if (own) return own;
  const next = readSurfaces(words[index + 1]);
  if (next) return next;
  return readSurfaces(words[index - 1]);
}

/** The previous ketiv already drew this qere. Its own qere was empty and it borrowed ours. */
function qereDrawnOnPrevious(words: KetivWord[], index: number): boolean {
  if (index <= 0) return false;
  const own = readSurfaces(words[index]);
  if (!own) return false;
  const prev = words[index - 1];
  if (!prev || prev.kq_role !== "ketiv" || readSurfaces(prev)) return false;
  return ketivReadSurface(words, index - 1) === own;
}

/** A note only when a read form exists and it is not the written word.
 * A split group draws the qere once, on the ketiv that borrowed it, and still notes every ketiv. */
export function ketivDisplay(words: KetivWord[], index: number): KetivNote | null {
  const word = words[index];
  if (!word || word.kq_role !== "ketiv") return null;
  const q = ketivReadSurface(words, index);
  if (!q) return null;
  const k = word.surface || "";
  if (q === k) return null;
  if (qereDrawnOnPrevious(words, index)) return { q: "", k };
  return { q, k };
}
