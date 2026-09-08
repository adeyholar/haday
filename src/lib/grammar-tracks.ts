import { ADJ_UNITS } from "@/lib/grammar-adj";
import { CONSTRUCT_UNITS } from "@/lib/grammar-construct";
import { EXIST_UNITS } from "@/lib/grammar-exist";
import { NUMBER_UNITS } from "@/lib/grammar-numbers";
import { PREP_UNITS } from "@/lib/grammar-prep";
import { PRON_UNITS } from "@/lib/grammar-pron";
import {
  GRAMMAR_TRACK_IDS,
  isGrammarTrackId,
  type GrammarTrack,
  type GrammarTrackId,
} from "@/lib/grammar";

/** Chapter 6–11 grammar games. Original notes, Masoretic examples, class vocab. */
export const GRAMMAR_TRACKS: GrammarTrack[] = [
  {
    id: "prep",
    chapter: 6,
    title: "Prepositions",
    short: "In, to, from, with",
    blurb:
      "Stand-alone, maqqef, and glued בְּ כְּ לְ. Then מִן (from, than, some), the object marker אֵת, and compounds like לִפְנֵי.",
    kind: "prep",
    matchPrompt: "Match the form to its job",
    units: PREP_UNITS,
  },
  {
    id: "adj",
    chapter: 7,
    title: "Adjectives",
    short: "Good, holy, great, very",
    blurb:
      "Four endings, then attributive (the good king), predicate (the king is good), and adjectives standing as nouns plus מְאֹד.",
    kind: "adj",
    matchPrompt: "Match the form to its ending",
    units: ADJ_UNITS,
  },
  {
    id: "pron",
    chapter: 8,
    title: "Pronouns",
    short: "I, you, this, who, why",
    blurb:
      "Independent pronouns, this/these, question words (including הֲ vs הַ), then אֲשֶׁר / כִּי / שֶׁ as clause glue.",
    kind: "pron",
    matchPrompt: "Match the word to its person",
    units: PRON_UNITS,
  },
  {
    id: "exist",
    chapter: 9,
    title: "Existence & nouns",
    short: "Behold, there is, bread",
    blurb:
      "הִנֵּה, יֵשׁ / אֵין, then גַּם אוֹ לְבַד סָבִיב, with chapter-9 nouns (people, bread, glory, war) in the same verses.",
    kind: "exist",
    matchPrompt: "Match the particle to its gloss",
    units: EXIST_UNITS,
  },
  {
    id: "construct",
    chapter: 10,
    title: "Construct nouns",
    short: "The X of Y",
    blurb:
      "Bound + free: דְּבַר־יְהוָה. Masculine ֵי, feminine ַת, then chapter-10 nouns (hand, covenant, field, death) in the wild.",
    kind: "construct",
    matchPrompt: "Match the bound form to its absolute",
    units: CONSTRUCT_UNITS,
  },
  {
    id: "numbers",
    chapter: 11,
    title: "Numbers",
    short: "One to ten, cubit, first",
    blurb:
      "One and two (the odd pair), three–ten (the gender flip), teens to a thousand, then ordinals like adjectives — first, second, seventh.",
    kind: "numbers",
    matchPrompt: "Match the number to its count",
    units: NUMBER_UNITS,
  },
];

export function grammarTrack(id: string | undefined): GrammarTrack | undefined {
  if (!id || !isGrammarTrackId(id)) return undefined;
  return GRAMMAR_TRACKS.find((t) => t.id === id);
}

export function grammarTrackIds(): GrammarTrackId[] {
  return [...GRAMMAR_TRACK_IDS];
}
