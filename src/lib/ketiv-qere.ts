/** A ketiv whose Strong’s number is not the qere’s. `q` is the read form. `k` is the written form. */

export type KetivNote = { q: string; k: string };

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
