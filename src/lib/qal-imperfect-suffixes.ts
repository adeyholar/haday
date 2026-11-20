import type { VocabItem } from "@/lib/vocab";

/**
 * Qal imperfect of קטל, plain and before a pronominal suffix.
 * The preformative never changes. Holem becomes sheva before a suffix
 * unless the form already has an ending. 3fs and 2ms are one spelling.
 * 3fp and 2fp take no pronominal suffix. This sitting only.
 */
export type QalImperfectSuffix = {
  id: string;
  hebrew: string;
  gloss: string;
  alts: string[];
  translit: string;
  person: string;
};

export const QAL_IMPERFECT_SUFFIXES: QalImperfectSuffix[] = [
  { id: "yiq-3ms", hebrew: "יִקְטֹל", gloss: "he will kill with no suffix", alts: ["3ms qal imperfect"], translit: "yiqtol", person: "3ms" },
  { id: "yiq-3ms-before", hebrew: "יִקְטְל", gloss: "he will kill before a suffix", alts: ["3ms before a suffix"], translit: "yiqtel", person: "3ms" },
  { id: "yiq-3fs", hebrew: "תִּקְטֹל", gloss: "3fs and 2ms with no suffix", alts: ["3fs and 2ms qal imperfect"], translit: "tiqtol", person: "3fs/2ms" },
  { id: "yiq-3fs-before", hebrew: "תִּקְטְל", gloss: "3fs and 2ms before a suffix", alts: ["3fs and 2ms before a suffix"], translit: "tiqtel", person: "3fs/2ms" },
  { id: "yiq-2fs", hebrew: "תִּקְטְלִי", gloss: "you fs will kill. unchanged before a suffix", alts: ["2fs qal imperfect"], translit: "tiqteli", person: "2fs" },
  { id: "yiq-1cs", hebrew: "אֶקְטֹל", gloss: "I will kill with no suffix", alts: ["1cs qal imperfect"], translit: "eqtol", person: "1cs" },
  { id: "yiq-1cs-before", hebrew: "אֶקְטְל", gloss: "I will kill before a suffix", alts: ["1cs before a suffix"], translit: "eqtel", person: "1cs" },
  { id: "yiq-3mp", hebrew: "יִקְטְלוּ", gloss: "they mp will kill. unchanged before a suffix", alts: ["3mp qal imperfect"], translit: "yiqtelu", person: "3mp" },
  { id: "yiq-2mp", hebrew: "תִּקְטְלוּ", gloss: "you mp will kill. unchanged before a suffix", alts: ["2mp qal imperfect"], translit: "tiqtelu", person: "2mp" },
  { id: "yiq-1cp", hebrew: "נִקְטֹל", gloss: "we will kill with no suffix", alts: ["1cp qal imperfect"], translit: "niqtol", person: "1cp" },
  { id: "yiq-1cp-before", hebrew: "נִקְטְל", gloss: "we will kill before a suffix", alts: ["1cp before a suffix"], translit: "niqtel", person: "1cp" },
  { id: "yiq-fp", hebrew: "תִּקְטֹ֫לְנָה", gloss: "3fp and 2fp take no pronominal suffix", alts: ["feminine plural takes no suffix"], translit: "tiqtolenah", person: "3fp/2fp" },
];

export function qalImperfectSuffixItems(): VocabItem[] {
  return QAL_IMPERFECT_SUFFIXES.map((row) => ({
    id: row.id,
    hebrew: row.hebrew,
    translit: row.translit,
    gloss: row.gloss,
    alts: row.alts,
    pos: "verb",
    chapter: 19,
    freq: 1,
  }));
}
