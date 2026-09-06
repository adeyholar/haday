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
};

const CLIPS = raw as Record<string, VocabClip>;

export function vocabClip(id: string): VocabClip | undefined {
  return CLIPS[id];
}

export function vocabClipLabel(clip: VocabClip): string {
  if (clip.bookEn && clip.ch && clip.v) return `${clip.bookEn} ${clip.ch}:${clip.v}`;
  return "lemma";
}
