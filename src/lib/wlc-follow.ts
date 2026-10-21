/** Where the recording is, inside a Leningrad chapter. Word is null when the
 * spoken tokens and the frame do not match, so the mark stays on the verse. */

const LEAD = 0.08;

export type FollowSpot = { verse: number; word: number | null };

export function frameWords<T extends { kq_role?: string | null }>(words: T[]): T[] {
  return words.filter((word) => word.kq_role !== "qere");
}

function indexAt(starts: number[], time: number): number {
  if (!starts.length) return 0;
  let at = 0;
  for (let i = 0; i < starts.length; i++) {
    const prev = i > 0 ? starts[i - 1] : undefined;
    const gap = prev != null ? (starts[i] ?? 0) - prev : 1;
    const lead = Math.min(LEAD, Math.max(0.02, gap * 0.12));
    if (time + lead >= (starts[i] ?? 0)) at = i;
    else break;
  }
  return at;
}

export function followSpot(
  verses: { words: { kq_role?: string | null }[] }[],
  verseStarts: number[],
  wordStarts: number[][] | undefined,
  time: number,
): FollowSpot | null {
  if (!verseStarts.length || !verses.length || verseStarts.length !== verses.length) return null;
  const verse = Math.min(verses.length - 1, indexAt(verseStarts, time));
  const shown = frameWords(verses[verse]?.words ?? []);
  const starts = wordStarts?.[verse];
  if (!starts || starts.length !== shown.length) return { verse, word: null };
  return { verse, word: Math.min(shown.length - 1, indexAt(starts, time)) };
}
