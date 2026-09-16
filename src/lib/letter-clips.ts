/** Recorded Hebrew names in public/audio/letters/{id}.mp3 — shin and sin are separate. */
const LETTER_CLIPS = new Set([
  "alef",
  "bet",
  "gimel",
  "dalet",
  "he",
  "vav",
  "zayin",
  "het",
  "tet",
  "yod",
  "kaf",
  "lamed",
  "mem",
  "nun",
  "samekh",
  "ayin",
  "pe",
  "tsade",
  "qof",
  "resh",
  "shin",
  "sin",
  "tav",
]);

/** English last-resort only. shin/sin must not become shi-n / si-n. */
export const LETTER_SAY_EN: Record<string, string> = {
  shin: "sheen",
  sin: "seen",
  tav: "tahv",
  he: "heh",
  het: "khet",
};

export function letterNameSrc(id: string): string | undefined {
  return LETTER_CLIPS.has(id) ? `/audio/letters/${id}.mp3` : undefined;
}
