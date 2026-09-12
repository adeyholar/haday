/** Trial plates for concrete Ch. 3–4 nouns. Original classroom art — not web photos. */
export const VOCAB_ART_IDS = [
  "bayit",
  "erets",
  "adamah",
  "yom",
  "laylah",
  "derek",
  "har",
  "mayim",
  "melek",
  "sus",
  "sefer",
  "ir",
  "ayin",
] as const;

export type VocabArtId = (typeof VOCAB_ART_IDS)[number];

const ART = new Set<string>(VOCAB_ART_IDS);

export function vocabArtSrc(id: string): string | undefined {
  if (!ART.has(id)) return undefined;
  return `/vocab-art/${id}.jpg`;
}
