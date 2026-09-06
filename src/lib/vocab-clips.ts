import raw from "@/lib/vocab-clips.json";

export type VocabClip = {
  src: string;
  book?: string;
  bookEn?: string;
  ch?: number;
  v?: number;
  start: number;
  end: number;
  he: string;
  /** Isolated dictionary word. Sentence-cuts from Tanakh reading are not this. */
  kind?: "lemma" | "reading";
  source?: "eliran" | "lingualibre" | "reading";
  credit?: string;
};

const CLIPS = raw as Record<string, VocabClip>;

export function vocabClip(id: string): VocabClip | undefined {
  return CLIPS[id];
}

export function vocabClipLabel(clip: VocabClip): string {
  if (clip.source === "eliran") return "Open Hebrew Bible · isolated word";
  if (clip.source === "lingualibre") return "Lingua Libre · isolated word";
  if (clip.bookEn && clip.ch && clip.v) return `${clip.bookEn} ${clip.ch}:${clip.v}`;
  return "isolated word";
}