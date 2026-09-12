/** Classroom plates for picturable BBH nouns. Original art — web photos failed license/sense checks. */
export const VOCAB_ART_IDS = [
  // Ch. 3
  "ab",
  "adamah",
  "ah",
  "achot",
  "ish",
  "em",
  "erets",
  "ishah",
  "bayit",
  "ben",
  "bat",
  "yom",
  "laylah",
  "naar",
  "naarah",
  // Ch. 4
  "derek",
  "har",
  "kohen",
  "leb",
  "mayim",
  "melek",
  "sus",
  "sefer",
  "ayin",
  "ir",
  "tsaba",
  "torah",
  // Ch. 5
  "esh",
  "hekal",
  "zahav",
  "hereb",
  "yeled",
  "yam",
  "kesef",
  "mizbeah",
  "anan",
  "ruah",
  "shamayim",
  "shaar",
] as const;

export type VocabArtId = (typeof VOCAB_ART_IDS)[number];

const ART = new Set<string>(VOCAB_ART_IDS);

export function vocabArtSrc(id: string): string | undefined {
  if (!ART.has(id)) return undefined;
  return `/vocab-art/${id}.jpg`;
}
