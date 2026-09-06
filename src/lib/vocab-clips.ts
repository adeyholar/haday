import raw from "@/lib/vocab-clips.json";

export type VocabClip = {
  src: string;
  book: string;
  bookEn: string;
  ch: number;
  v: number;
  start: number;
  end: number;
  he: string;
};

const CLIPS = raw as Record<string, VocabClip>;

export function vocabClip(id: string): VocabClip | undefined {
  return CLIPS[id];
}

export function vocabClipLabel(clip: VocabClip): string {
  return `${clip.bookEn} ${clip.ch}:${clip.v}`;
}
