import { VOCAB, type VocabItem } from "@/lib/vocab";

/**
 * Independent personal pronouns. Not demonstratives, not הֵן “behold”.
 * Gloss names the person so “you” and “I” are not one answer.
 */
export type IndependentPronoun = {
  id: string;
  hebrew: string;
  hebrewAlts?: string[];
  gloss: string;
  alts: string[];
  translit: string;
  person: string;
  freq: number;
};

export const INDEPENDENT_PRONOUNS: IndependentPronoun[] = [
  { id: "ani", hebrew: "אֲנִי", gloss: "I", alts: ["I myself"], translit: "ʾănî", person: "1cs", freq: 874 },
  { id: "anoki", hebrew: "אָנֹכִי", gloss: "I — a longer form", alts: ["longer I"], translit: "ʾānōkî", person: "1cs", freq: 359 },
  { id: "attah", hebrew: "אַתָּה", gloss: "you (masculine singular)", alts: ["you ms", "thou"], translit: "ʾattâ", person: "2ms", freq: 749 },
  { id: "at", hebrew: "אַתְּ", gloss: "you (feminine singular)", alts: ["you fs"], translit: "ʾatt", person: "2fs", freq: 74 },
  { id: "hu", hebrew: "הוּא", gloss: "he", alts: ["he it"], translit: "hûʾ", person: "3ms", freq: 1398 },
  { id: "hi", hebrew: "הִיא", hebrewAlts: ["הִוא"], gloss: "she", alts: ["she it"], translit: "hîʾ", person: "3fs", freq: 491 },
  { id: "anahnu", hebrew: "אֲנַחְנוּ", gloss: "we", alts: ["we ourselves"], translit: "ʾănaḥnû", person: "1cp", freq: 121 },
  { id: "attem", hebrew: "אַתֶּם", gloss: "you (masculine plural)", alts: ["you mp"], translit: "ʾattem", person: "2mp", freq: 283 },
  { id: "atten", hebrew: "אַתֵּן", hebrewAlts: ["אַתֵּנָה"], gloss: "you (feminine plural)", alts: ["you fp"], translit: "ʾattēn", person: "2fp", freq: 4 },
  { id: "hem", hebrew: "הֵם", hebrewAlts: ["הֵמָּה"], gloss: "they (masculine)", alts: ["they mp"], translit: "hēm", person: "3mp", freq: 565 },
  { id: "hennah", hebrew: "הֵנָּה", hebrewAlts: ["הֵן"], gloss: "they (feminine)", alts: ["they fp"], translit: "hēnnâ", person: "3fp", freq: 26 },
];

/** This sitting only. The class list is not rewritten, and הֵן “behold” stays a particle. */
export function independentPronounItems(): VocabItem[] {
  return INDEPENDENT_PRONOUNS.map((row) => {
    const base = VOCAB.find((item) => item.id === row.id);
    return {
      id: row.id,
      hebrew: row.hebrew,
      translit: base?.translit ?? row.translit,
      gloss: row.gloss,
      alts: row.alts,
      hebrewAlts: row.hebrewAlts ?? base?.hebrewAlts,
      pos: "pron",
      chapter: 8,
      freq: row.freq,
    };
  });
}
