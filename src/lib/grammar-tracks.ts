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

/** Original topic paths. Masoretic examples and class vocab — not a textbook reprint. */
export const GRAMMAR_TRACKS: GrammarTrack[] = [
  {
    id: "prep",
    chapter: 6,
    title: "Prepositions",
    short: "In, to, from, with",
    blurb: "Stand-alone, maqqef, and glued בְּ כְּ לְ. Then מִן, the object marker אֵת, and compounds like לִפְנֵי.",
    intro:
      "Prepositions name a relationship: in, on, to, from, with. Hebrew has three looks: a free word (עִם, אַחַר, תַּחַת), a free word with a maqqef stroke (עַל־, אֶל־, עַד־), and three that never stand alone (בְּ כְּ לְ). Then מִן “from / than / some,” the object marker אֵת, and compounds like לִפְנֵי.\n\nWork one unit at a time. On a living line, name the preposition first, then its object. Strip those pieces before you look the noun up. Class lemmas keep coming back in the verses. 90% held opens the next unit.",
    kind: "prep",
    matchPrompt: "Match the form to its job",
    units: PREP_UNITS,
  },
  {
    id: "adj",
    chapter: 7,
    title: "Adjectives",
    short: "Good, holy, great, very",
    blurb: "Four endings, then attributive (the good king), predicate (the king is good), and adjectives standing as nouns plus מְאֹד.",
    intro:
      "An adjective wears the same gender and number clothes as a noun: טוֹב, טוֹבָה, טוֹבִים, טוֹבוֹת. It either rides behind the noun as one phrase (the good king) or makes a sentence (the king is good). Later it can stand for a person: the righteous, the wicked. מְאֹד “very” does not inflect.\n\nStay on this topic until the four units are clear. Ask two questions on every adjective: does it match the noun’s article? Does it agree in gender and number? Class words טוֹב, גָּדוֹל, קָדוֹשׁ, רַע, חָכָם live here.",
    kind: "adj",
    matchPrompt: "Match the form to its ending",
    units: ADJ_UNITS,
  },
  {
    id: "pron",
    chapter: 8,
    title: "Pronouns",
    short: "I, you, this, who, why",
    blurb: "Independent pronouns, this/these, question words (including הֲ vs הַ), then אֲשֶׁר / כִּי / שֶׁ as clause glue.",
    intro:
      "Independent pronouns (אֲנִי, אַתָּה, הוּא) stand as their own words. Near demonstratives (זֶה, זֹאת, אֵלֶּה) point to “this / these.” Question words (מִי, מָה, לָמָּה, הֲ) ask who, what, why, or yes/no. Clause glue (אֲשֶׁר, כִּי, שֶׁ) joins sentences.\n\nHebrew verbs already hide their subject, so a written pronoun is doing extra work. The yes/no particle הֲ is not the article הַ — different vowel. This path is only pronouns.",
    kind: "pron",
    matchPrompt: "Match the word to its person",
    units: PRON_UNITS,
  },
  {
    id: "exist",
    chapter: 9,
    title: "Existence & nouns",
    short: "Behold, there is, bread",
    blurb: "הִנֵּה, יֵשׁ / אֵין, then גַּם אוֹ לְבַד סָבִיב, with nouns for people, bread, glory, and war in the same verses.",
    intro:
      "הִנֵּה says “look.” יֵשׁ / אֵין say “there is” / “there is not.” Small traffic words גַּם, אוֹ, לְבַד, סָבִיב sit in almost every narrative. Then high-traffic nouns — עַם, לֶחֶם, כָּבוֹד, מִלְחָמָה, עֵץ — show up in those frames.\n\nDo not mix this with construct chains (the next topic). Name the particle in one glance so the class nouns can stay in memory. Strip article and preps before you look a noun up.",
    kind: "exist",
    matchPrompt: "Match the particle to its gloss",
    units: EXIST_UNITS,
  },
  {
    id: "construct",
    chapter: 10,
    title: "Construct nouns",
    short: "The X of Y",
    blurb: "Bound + free: דְּבַר־יְהוָה. Masculine ֵי, feminine ַת, then nouns for hand, covenant, field, and death in the wild.",
    intro:
      "Construct nouns are “the X of Y.” The first noun is bound (construct); the last is free (absolute). English “of” is usually not a separate Hebrew word. Masculine plural ִים becomes ֵי; feminine ָה often becomes ַת. The chain is definite if the last member is a name, has the article, or has a suffix.\n\nStay here until you can restore each lemma and say “of.” Class nouns יָד, בְּרִית, שָׂדֶה, מִדְבָּר, חֶסֶד, מָוֶת live in these chains.",
    kind: "construct",
    matchPrompt: "Match the bound form to its absolute",
    units: CONSTRUCT_UNITS,
  },
  {
    id: "numbers",
    chapter: 11,
    title: "Numbers",
    short: "One to ten, cubit, first",
    blurb: "One and two (the odd pair), three–ten (the gender flip), teens to a thousand, then ordinals like adjectives — first, second, seventh.",
    intro:
      "Cardinals count how many: one and two are the odd pair; three–ten often flip gender on the number; teens are “digit + ten”; tens, hundreds, thousands stack. Ordinals mark position (first, second, seventh) and sit like adjectives: בַּיּוֹם הַשְּׁבִיעִי.\n\nDo not mix שְׁנַיִם “two” with שֵׁנִי “second,” or שֶׁבַע “seven” with שַׁבָּת “sabbath.” Creation week in Genesis 1 is the drill. This path is only numbers.",
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
