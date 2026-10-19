/** Accented Tanakh. Scripture Path → Text. The recorded reading does not use these. */

export type WlcStress = {
  letter_index: number;
  syll_from_end: number;
  source: string;
};

export type WlcAccent = {
  name: string;
  kind: string;
  level: number | string;
  letter_index: number;
  role?: string;
  placement?: string;
  compound?: string;
};

export type WlcWord = {
  id: string;
  surface: string;
  trailer: string;
  consonants: string;
  lemma: string;
  morph: string;
  main_accent: string | null;
  stress: WlcStress | null;
  /** Where a joined or split word got its analysis. Present from dataset 1.2.0. */
  morph_note?: string;
  rhythm_path: string | null;
  qere: WlcWord[];
  kq_role: string | null;
  accents: WlcAccent[];
  meteg: { letter_index: number; function: string }[];
  silluq_inferred?: boolean;
  /** Set when the signed review replaced the OSHB marks on `surface`. */
  review?: string;
};

export type WlcVerse = {
  ref: string;
  system: string;
  text: string;
  words: WlcWord[];
};

export type WlcChapter = {
  book: string;
  chapter: number;
  dataset_version: string;
  verses: WlcVerse[];
};

export type WlcCluster = { letter: string; marks: string };

export function wlcClusters(surface: string): WlcCluster[] {
  const out: WlcCluster[] = [];
  for (const ch of surface) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0x05d0 && cp <= 0x05ea) out.push({ letter: ch, marks: "" });
    else if (out.length) out[out.length - 1].marks += ch;
  }
  return out;
}

export const MAQAF = "\u05be";

/** True when the word's maqaf joins it to the next word (no space, no break). */
export function joinsNext(word: Pick<WlcWord, "surface" | "trailer">): boolean {
  return word.trailer.includes(MAQAF) || (!word.trailer && word.surface.endsWith(MAQAF));
}

/**
 * Group a verse's words into maqaf chains. A word whose trailer is a maqaf is
 * bound to the word after it, so the whole chain renders as one unit with no
 * gap and never breaks across lines. Every other word is a chain of one.
 */
export function wlcMaqafChains<T extends Pick<WlcWord, "surface" | "trailer">>(words: T[]): T[][] {
  const out: T[][] = [];
  let open = false;
  for (const word of words) {
    if (open && out.length) out[out.length - 1].push(word);
    else out.push([word]);
    open = joinsNext(word);
  }
  return out;
}

export function verseLabel(ref: string): string {
  const parts = ref.split(".");
  return parts[parts.length - 1] || ref;
}
