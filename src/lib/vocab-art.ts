/** Classroom plates for picturable BBH lemmas. Original art — not web photos. */
export const VOCAB_ART_IDS = [
  "zion-light",
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

/** YHWH / Elohim / El: light on Zion — never a figure. */
const ART_ALIAS: Record<string, string> = {
  yhwh: "zion-light",
  elohim: "zion-light",
  "el-god": "zion-light",
};

const ART = new Set<string>(VOCAB_ART_IDS);

export function vocabArtSrc(id: string): string | undefined {
  const file = ART_ALIAS[id] ?? (ART.has(id) ? id : undefined);
  if (!file) return undefined;
  return `/vocab-art/${file}.jpg`;
}
