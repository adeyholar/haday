import { IIBS_VOCAB, type IibsVocabLevel, type IibsVocabWord } from "@/lib/iibs-vocab";
import { foldFinals, lettersOnly } from "@/lib/hebrew";
import type { ListenItem } from "@/lib/listen";
import { bbhVocab, type Pos } from "@/lib/vocab";

export const IIBS_ROAD_LEVELS = ["A", "B", "C", "D", "E"] as const;

export type IibsRoadId = IibsVocabLevel | "all";

const VOICE = new Map<string, string>();
for (const item of bbhVocab()) {
  const key = foldFinals(lettersOnly(item.hebrew));
  if (key && !VOICE.has(key)) VOICE.set(key, item.id);
}

function posOf(kind: string): Pos {
  const k = kind.toLowerCase();
  if (k.includes("verb")) return "verb";
  if (k.includes("adj")) return "adj";
  if (k.includes("prep")) return "prep";
  if (k.includes("pronoun")) return "pron";
  if (k.includes("proper")) return "name";
  return "noun";
}

function roadGloss(gloss: string): string {
  return gloss
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;])/g, "$1")
    .trim();
}

function pluralLine(plural: string): string {
  return plural
    .split(/[/|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function cardsFor(level: IibsVocabLevel, seen: Set<string>): ListenItem[] {
  const out: ListenItem[] = [];
  let n = 0;
  for (const lesson of IIBS_VOCAB[level]) {
    for (const word of lesson) out.push(...one(level, word, seen, () => ++n));
  }
  return out;
}

function one(level: IibsVocabLevel, word: IibsVocabWord, seen: Set<string>, next: () => number): ListenItem[] {
  const key = foldFinals(lettersOnly(word.hebrew));
  if (!key || seen.has(key)) return [];
  seen.add(key);
  const n = next();
  const gloss = roadGloss(word.gloss);
  if (!gloss) return [];
  const also = pluralLine(word.plural);
  const voice = VOICE.get(key);
  return [
    {
      id: `iibs-${level.toLowerCase()}-${n}`,
      hebrew: word.hebrew,
      translit: "",
      gloss,
      alts: [],
      pos: posOf(word.kind),
      chapter: 0,
      freq: 0,
      heVoiceId: voice,
      alsoHebrew: also || undefined,
      plainEnglish: true,
    },
  ];
}

export function isIibsRoadId(value: string | null | undefined): value is IibsRoadId {
  return value === "all" || value === "A" || value === "B" || value === "C" || value === "D" || value === "E";
}

/** One level, in lesson order. A word is kept once. */
export function iibsRoadList(id: IibsRoadId): ListenItem[] {
  if (id === "all") {
    const seen = new Set<string>();
    return IIBS_ROAD_LEVELS.flatMap((level) => cardsFor(level, seen));
  }
  return cardsFor(id, new Set());
}
