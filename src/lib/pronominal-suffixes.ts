import type { VocabItem } from "@/lib/vocab";

/**
 * Qal perfect 3ms of קטל with an object suffix.
 * The gloss names the person, so “you” and “them” are not one answer.
 * This sitting only. The class list is not rewritten.
 */
export type PronominalSuffix = {
  id: string;
  hebrew: string;
  gloss: string;
  alts: string[];
  translit: string;
  person: string;
};

export const PRONOMINAL_SUFFIXES: PronominalSuffix[] = [
  { id: "suf-3ms", hebrew: "קְטָלוֹ", gloss: "he killed him (it)", alts: ["he killed him", "killed him"], translit: "qətālô", person: "3ms" },
  { id: "suf-3fs", hebrew: "קְטָלָהּ", gloss: "he killed her (it)", alts: ["he killed her", "killed her"], translit: "qətālāh", person: "3fs" },
  { id: "suf-2ms", hebrew: "קְטָֽלְךָ", gloss: "he killed you (masculine singular)", alts: ["he killed you ms"], translit: "qətāləkā", person: "2ms" },
  { id: "suf-2fs", hebrew: "קְטָלֵךְ", gloss: "he killed you (feminine singular)", alts: ["he killed you fs"], translit: "qətālēk", person: "2fs" },
  { id: "suf-1cs", hebrew: "קְטָלַ֫נִי", gloss: "he killed me", alts: ["killed me"], translit: "qətāláni", person: "1cs" },
  { id: "suf-3mp", hebrew: "קְטָלָם", gloss: "he killed them (masculine)", alts: ["he killed them mp"], translit: "qətālām", person: "3mp" },
  { id: "suf-3fp", hebrew: "קְטָלָן", gloss: "he killed them (feminine)", alts: ["he killed them fp"], translit: "qətālān", person: "3fp" },
  { id: "suf-2mp", hebrew: "קְטָֽלְכֶם", gloss: "he killed you (masculine plural)", alts: ["he killed you mp"], translit: "qətālkem", person: "2mp" },
  { id: "suf-2fp", hebrew: "קְטָֽלְכֶן", gloss: "he killed you (feminine plural)", alts: ["he killed you fp"], translit: "qətālken", person: "2fp" },
  { id: "suf-1cp", hebrew: "קְטָלָ֫נוּ", gloss: "he killed us", alts: ["killed us"], translit: "qətālánu", person: "1cp" },
];

export function pronominalSuffixItems(): VocabItem[] {
  return PRONOMINAL_SUFFIXES.map((row) => ({
    id: row.id,
    hebrew: row.hebrew,
    translit: row.translit,
    gloss: row.gloss,
    alts: row.alts,
    pos: "verb",
    chapter: 12,
    freq: 1,
  }));
}
