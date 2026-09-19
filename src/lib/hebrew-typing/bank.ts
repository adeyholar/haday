import { CONSONANTS } from "@/lib/alphabet";
import { VOCAB, itemsForChapter, itemsForWeek, type VocabItem } from "@/lib/vocab";
import { stripNiqqud } from "@/lib/hebrew";

export type TypeWord = { id: string; hebrew: string; gloss: string };

export function asTypeWord(v: VocabItem): TypeWord {
  return { id: v.id, hebrew: v.hebrew, gloss: v.gloss };
}

/** Genesis 1:1 plus early class lemmas — all pointed. */
export const GAME_WORDS: TypeWord[] = [
  { id: "bereshit", hebrew: "בְּרֵאשִׁית", gloss: "in the beginning" },
  { id: "bara", hebrew: "בָּרָא", gloss: "he created" },
  { id: "elohim-g", hebrew: "אֱלֹהִים", gloss: "God" },
  { id: "et", hebrew: "אֵת", gloss: "object marker" },
  { id: "hashamayim", hebrew: "הַשָּׁמַיִם", gloss: "the heavens" },
  { id: "veet", hebrew: "וְאֵת", gloss: "and (object)" },
  { id: "haarets", hebrew: "הָאָרֶץ", gloss: "the earth" },
  { id: "or", hebrew: "אוֹר", gloss: "light" },
  { id: "yom", hebrew: "יוֹם", gloss: "day" },
  { id: "laylah", hebrew: "לַיְלָה", gloss: "night" },
  { id: "mayim", hebrew: "מַיִם", gloss: "water" },
  { id: "erets", hebrew: "אֶרֶץ", gloss: "land, earth" },
  { id: "shamayim", hebrew: "שָׁמַיִם", gloss: "heavens" },
  { id: "ab", hebrew: "אָב", gloss: "father" },
  { id: "em", hebrew: "אֵם", gloss: "mother" },
  { id: "ben", hebrew: "בֵּן", gloss: "son" },
  { id: "bat", hebrew: "בַּת", gloss: "daughter" },
  { id: "ish", hebrew: "אִישׁ", gloss: "man" },
  { id: "ishah", hebrew: "אִשָּׁה", gloss: "woman" },
  { id: "bayit", hebrew: "בַּיִת", gloss: "house" },
  { id: "dabar", hebrew: "דָּבָר", gloss: "word" },
  { id: "melek", hebrew: "מֶלֶךְ", gloss: "king" },
  { id: "torah", hebrew: "תּוֹרָה", gloss: "law, instruction" },
  { id: "sus", hebrew: "סוּס", gloss: "horse" },
  { id: "qol", hebrew: "קוֹל", gloss: "voice" },
  { id: "har", hebrew: "הַר", gloss: "mountain" },
  { id: "ir", hebrew: "עִיר", gloss: "city" },
  { id: "leb", hebrew: "לֵב", gloss: "heart" },
  { id: "nephesh", hebrew: "נֶפֶשׁ", gloss: "life, person" },
  { id: "kohen", hebrew: "כֹּהֵן", gloss: "priest" },
  { id: "nabi", hebrew: "נָבִיא", gloss: "prophet" },
  { id: "goy", hebrew: "גּוֹי", gloss: "nation" },
  { id: "sefer", hebrew: "סֵפֶר", gloss: "scroll" },
  { id: "ebed", hebrew: "עֶבֶד", gloss: "servant" },
  { id: "ayin", hebrew: "עַיִן", gloss: "eye" },
  { id: "adam", hebrew: "אָדָם", gloss: "man, Adam" },
  { id: "elohim", hebrew: "אֱלֹהִים", gloss: "God" },
  { id: "moshe", hebrew: "מֹשֶׁה", gloss: "Moses" },
  { id: "israel", hebrew: "יִשְׂרָאֵל", gloss: "Israel" },
  { id: "avraham", hebrew: "אַבְרָהָם", gloss: "Abraham" },
  { id: "david", hebrew: "דָּוִד", gloss: "David" },
  { id: "yhwh-pointed", hebrew: "יְהוָה", gloss: "the LORD" },
];

const BERESHIT_LETTERS = ["ב", "ר", "א", "שׁ", "י", "ת"] as const;

export function studyLetterBatch(index: number, size = 4): string[] {
  const letters = CONSONANTS.map((c) => c.letter);
  const start = (index * size) % letters.length;
  const batch = letters.slice(start, start + size);
  if (batch.length < size) batch.push(...letters.slice(0, size - batch.length));
  return batch.slice(0, size);
}

export function firstWordLetters(): string[] {
  return [...BERESHIT_LETTERS];
}

/** 3–5 letter consonant strings from the first verse. */
export const STUDY_WORDS = ["ברא", "ראש", "שית", "את", "ארץ", "שמים", "אלהים"];

export function pointedVocabSample(limit = 12): TypeWord[] {
  const extra = VOCAB.filter((v) => v.hebrew !== stripNiqqud(v.hebrew) && v.hebrew.length <= 12).slice(0, 8);
  const seen = new Set(GAME_WORDS.map((w) => w.hebrew));
  const more: TypeWord[] = extra
    .filter((v) => !seen.has(v.hebrew))
    .map((v) => ({ id: v.id, hebrew: v.hebrew, gloss: v.gloss }));
  return [...GAME_WORDS, ...more].slice(0, Math.max(8, limit));
}

export function gameRound(
  n = 10,
  seed = Date.now(),
  weak: Record<string, number> = {},
  strong: Record<string, number> = {},
): TypeWord[] {
  return weightedPick(pointedVocabSample(40), n, seed, weak, strong);
}

export function weightedPick(
  pool: TypeWord[],
  n: number,
  seed: number,
  weak: Record<string, number> = {},
  strong: Record<string, number> = {},
): TypeWord[] {
  if (!pool.length) return [];
  const bag: TypeWord[] = [];
  for (const w of pool) {
    const copies = 1 + Math.min(4, weak[w.id] ?? 0) * 2 - (strong[w.id] ? 1 : 0);
    for (let i = 0; i < Math.max(1, copies); i++) bag.push(w);
  }
  let x = Math.abs(seed) % 2147483647 || 1;
  const out: TypeWord[] = [];
  const used = new Set<string>();
  for (let guard = 0; out.length < Math.min(n, pool.length) && guard < bag.length * 4; guard++) {
    x = (x * 48271) % 2147483647;
    const w = bag[x % bag.length]!;
    if (used.has(w.id)) continue;
    used.add(w.id);
    out.push(w);
  }
  for (const w of pool) {
    if (out.length >= n) break;
    if (!used.has(w.id)) {
      used.add(w.id);
      out.push(w);
    }
  }
  return out.slice(0, n);
}

export function poolForSelection(weeks: number[], chapters: number[]): TypeWord[] {
  const seen = new Set<string>();
  const out: TypeWord[] = [];
  function add(items: VocabItem[]) {
    for (const v of items) {
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      out.push(asTypeWord(v));
    }
  }
  for (const w of weeks) add(itemsForWeek(w));
  for (const ch of chapters) add(itemsForChapter(ch));
  return out;
}
