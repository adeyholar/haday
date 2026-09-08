import { normalizeHebrew } from "@/lib/hebrew";
import { ROUND_LEN } from "@/lib/quiz-draw";

/**
 * Hebrew Grammar Rules to Live By — Adeola Adegbolagun, BBH 3rd ed. notes.
 *
 * To add a rule later:
 *   1. Push a GrammarRule onto GRAMMAR_RULES (unique id, group, title, aliases).
 *   2. Push one or more GrammarCase rows onto GRAMMAR_CASES with that ruleId.
 * Hunt the verse / Name the rule read both lists. No UI change needed.
 */

export type GrammarRule = {
  id: string;
  group: string;
  title: string;
  statement: string;
  aliases: string[];
};

export type GrammarCase = {
  id: string;
  ruleId: string;
  lemma: string;
  lemmaName: string;
  lemmaAlts: string[];
  book: string;
  chapter: number;
  verse: number;
  he: string;
  en: string;
  hit: string;
  why: string;
};

export const GRAMMAR_GROUPS = [
  { id: "syllable", title: "Syllabification — apply these in the text" },
  { id: "vowels", title: "Vowel syllable preferences" },
  { id: "qamets", title: "Qamets and Qamets Hatuf" },
  { id: "shewa", title: "Shewa and syllabification" },
  { id: "dagesh", title: "Dagesh and syllabification" },
  { id: "guttural", title: "Guttural characteristics" },
  { id: "article", title: "The definite article" },
  { id: "vav", title: "The conjunction וְ" },
] as const;

export const GRAMMAR_RULES: GrammarRule[] = [
  {
    id: "syllable-consonant-vowel",
    group: "syllable",
    title: "Every syllable begins with a consonant and has one vowel",
    statement:
      "Every syllable must begin with a consonant and have only one vowel (very few exceptions). Apply this while you divide the word — do not memorize a chart.",
    aliases: [
      "every syllable begins with a consonant",
      "one vowel",
      "syllable one vowel",
      "begin with a consonant",
      "only one vowel",
    ],
  },
  {
    id: "syllable-open-closed",
    group: "syllable",
    title: "Open vs closed syllables",
    statement:
      "There are only two types of syllables. Open syllables end with a vowel. Closed syllables end with a consonant.",
    aliases: [
      "open and closed",
      "open vs closed",
      "open syllable",
      "closed syllable",
      "two types of syllables",
      "end with a vowel",
      "end with a consonant",
    ],
  },
  {
    id: "forte-divides",
    group: "syllable",
    title: "Dagesh forte doubles the consonant and is divided",
    statement:
      "A dagesh forte doubles the consonant and must be divided: write the first of the pair with shewa (no dagesh — the two letters already show the double) to close the previous syllable; the second takes the vowel and opens the next. So הַשָּׁמַיִם is הַשְׁ | שָׁ | מַ | יִם.",
    aliases: [
      "dagesh forte doubles",
      "forte doubles",
      "divided in syllabification",
      "must be divided",
      "doubles the consonant",
    ],
  },
  {
    id: "forte-hard-sound",
    group: "syllable",
    title: "Forte in a begadkephat doubles the hard sound",
    statement:
      "A dagesh forte in a begadkephat consonant doubles the hard sound, not the soft sound (pp, not ff; tt, not th-th).",
    aliases: [
      "hard sound",
      "doubles the hard sound",
      "not the soft sound",
      "forte hard",
      "begadkephat hard",
    ],
  },
  {
    id: "shewa-marks-end",
    group: "syllable",
    title: "A shewa always marks the end of a syllable",
    statement:
      "The presence of a shewa in a word — silent or vocal — always marks the end of a syllable. Silent shewa closes that syllable; vocal shewa is itself the vowel of an open syllable.",
    aliases: [
      "shewa marks the end",
      "marks the end of a syllable",
      "shewa always marks",
      "end of a syllable",
      "presence of a shewa",
    ],
  },
  {
    id: "guttural-silent-shewa",
    group: "syllable",
    title: "A guttural can take silent shewa, not vocal shewa",
    statement:
      "The real rule is not “gutturals never take shewa.” א ה ח ע cannot take vocal shewa (they take a hateph, a reduced vowel, instead). Silent shewa is not a vowel, so a guttural may take it. Tanakh proves it: שָׁמַעְתָּ (Gen 3:17) has silent shewa under ע, closing מַעְ. The dagesh in תּ is lene — that silent shewa is not a vowel, so you do not split the ת.",
    aliases: [
      "guttural silent shewa",
      "can take a silent shewa",
      "guttural can take silent",
      "silent shewa guttural",
      "cannot take a vocal shewa but it can take a silent",
      "gutturals never take shewa",
      "ע never take shewa",
      "guttural no shewa",
    ],
  },
  {
    id: "resh-vocal-shewa",
    group: "syllable",
    title: "ר with shewa follows the shewa rules",
    statement:
      "When ר takes shewa, silent vs vocal is the ordinary shewa test — not the guttural hateph rule. After a short vowel the shewa is silent (פַּרְעֹה). At the start of a word, as the second of two, or after an unaccented long vowel, it is vocal (רְאוּבֵן). ר still cannot take dagesh.",
    aliases: [
      "ר can take vocal shewa",
      "ר vocal shewa",
      "unlike the gutturals",
      "ר vocal",
      "ר shewa",
    ],
  },
  {
    id: "metheg-qamets",
    group: "syllable",
    title: "Metheg marks qamets, not qamets hatuf",
    statement:
      "The metheg may be used to distinguish qamets from qamets hatuf. The metheg occurs with qamets (בָּֽתִּים) and not with qamets hatuf.",
    aliases: [
      "metheg",
      "metheg qamets",
      "meteg",
      "gaesh",
      "batim",
      "distinguishes qamets",
      "metheg occurs with qamets",
    ],
  },
  {
    id: "furtive-pathach",
    group: "syllable",
    title: "Furtive pathach is not counted in syllabification",
    statement:
      "Furtive pathach (as in רוּחַ) is not a full vowel and is not counted in syllabification. It must, however, be pronounced before the final guttural.",
    aliases: [
      "furtive pathach",
      "furtive patah",
      "not a full vowel",
      "not counted in syllabification",
      "pronounced before the guttural",
      "ruach",
    ],
  },
  {
    id: "quiescent-alef",
    group: "syllable",
    title: "א without a vowel is quiescent",
    statement:
      "When א occurs without a vowel, it is quiescent (silent) — as in חַטָּאת “sin.” It does not begin a new syllable.",
    aliases: [
      "quiescent א",
      "א without a vowel",
      "quiescent",
      "silent א",
      "chatat",
      "chattat",
      "sin quiescent",
    ],
  },
  {
    id: "diphthong-closed",
    group: "syllable",
    title: "A diphthong syllable is closed",
    statement:
      "Syllables that contain the diphthong (patah + י, as in בַּ֫יִת) are considered closed because they always end with a consonant.",
    aliases: [
      "diphthong",
      "diphthong closed",
      "bayit diphthong",
      "patah י",
      "closed because they always end with a consonant",
    ],
  },
  {
    id: "short-closed-unacc",
    group: "vowels",
    title: "Short vowel in a closed, unaccented syllable",
    statement:
      "Short vowels prefer either a closed, unaccented syllable or an open, accented syllable.",
    aliases: [
      "short vowel closed",
      "closed unaccented",
      "short closed",
      "short vowels prefer closed unaccented",
      "closed unaccented syllable",
    ],
  },
  {
    id: "short-open-acc",
    group: "vowels",
    title: "Short vowel in an open, accented syllable",
    statement: "Short vowels also prefer an open, accented syllable.",
    aliases: ["short vowel open", "open accented short", "open accented syllable", "short open accented"],
  },
  {
    id: "long-closed-acc",
    group: "vowels",
    title: "Long vowel in a closed, accented syllable",
    statement:
      "Long vowels (changeable or unchangeable) prefer a closed, accented syllable or an open, pretonic syllable.",
    aliases: ["long vowel closed", "closed accented long", "closed accented syllable", "long closed accented"],
  },
  {
    id: "long-open-pretonic",
    group: "vowels",
    title: "Long vowel in an open, pretonic syllable",
    statement: "Long vowels prefer an open, pretonic syllable (the syllable before the accent).",
    aliases: ["open pretonic", "long pretonic", "open pretonic syllable", "long vowel pretonic"],
  },
  {
    id: "shewa-propretonic",
    group: "vowels",
    title: "Vocal shewa in an open, propretonic syllable",
    statement:
      "Vocal shewa and reduced (hateph) vowels prefer open, propretonic syllables — two syllables before the accent.",
    aliases: [
      "vocal shewa propretonic",
      "vocal shewa",
      "propretonic shewa",
      "vocal shewa in an open propretonic",
      "open propretonic shewa",
    ],
  },
  {
    id: "reduced-propretonic",
    group: "vowels",
    title: "Reduced (hateph) vowel in an open, propretonic syllable",
    statement:
      "Hateph vowels appear with gutturals in the open, propretonic position. They always occur in open syllables and are never silent.",
    aliases: [
      "hateph",
      "reduced vowel",
      "hateph propretonic",
      "reduced vowels always occur in open syllables",
      "hateph never silent",
      "reduced hateph",
    ],
  },
  {
    id: "qamets-hatuf",
    group: "qamets",
    title: "Qamets Hatuf (short o)",
    statement:
      "Qamets Hatuf (short o) occurs only in a closed, unaccented syllable. The most frequent word is כֹּל / כָּל — all of, each of, every.",
    aliases: [
      "qamets hatuf",
      "qamets hatuph",
      "kamets hatuf",
      "short o",
      "qamets hatof",
      "qamets hatuf short o",
      "closed and unaccented",
    ],
  },
  {
    id: "qamets-long",
    group: "qamets",
    title: "Qamets (changeable long a)",
    statement:
      "Qamets (changeable long ā) prefers an open, pretonic syllable or a closed, accented syllable.",
    aliases: ["qamets", "kamets", "long a", "qamets long", "changeable long a", "changeable long"],
  },
  {
    id: "shewa-silent-short",
    group: "shewa",
    title: "Shewa is silent after a short vowel",
    statement:
      "A shewa is silent if the previous vowel is short. It closes the syllable. Also: the first of two contiguous shewas within a word is silent; a shewa at the end of a word is silent.",
    aliases: [
      "silent shewa",
      "shewa silent",
      "shewa after short",
      "shewa is silent if the previous vowel is short",
      "preceded by a short vowel",
    ],
  },
  {
    id: "shewa-two-first",
    group: "shewa",
    title: "First of two contiguous shewas is silent",
    statement:
      "When two shewas sit side by side inside a word, the first is silent and the second is vocal.",
    aliases: [
      "two shewas",
      "contiguous shewa",
      "first shewa silent",
      "first of two contiguous",
      "two contiguous shewas",
      "second of two contiguous shewas is vocal",
    ],
  },
  {
    id: "shewa-final",
    group: "shewa",
    title: "Shewa at the end of a word is silent",
    statement: "A shewa at the end of a word is silent — the only exception to “not after a short vowel ⇒ vocal.”",
    aliases: ["final shewa", "shewa end of word", "shewa at the end of a word", "end of a word is silent"],
  },
  {
    id: "shewa-initial",
    group: "shewa",
    title: "Initial shewa is always vocal",
    statement: "A shewa at the beginning of a word is always vocal.",
    aliases: ["initial shewa", "vocal shewa initial", "first shewa vocal", "initial shewa is always vocal", "beginning of a word"],
  },
  {
    id: "shewa-after-forte",
    group: "shewa",
    title: "Shewa under a letter with dagesh forte is vocal",
    statement: "A shewa under any consonant with dagesh forte is vocal (the dagesh closes the previous syllable).",
    aliases: [
      "shewa dagesh forte",
      "shewa after forte",
      "shewa doubled",
      "shewa under dagesh forte",
      "shewa under any consonant with dagesh forte",
      "daghesh forte is vocal",
    ],
  },
  {
    id: "shewa-after-long",
    group: "shewa",
    title: "Shewa after an unaccented long vowel is vocal",
    statement: "A shewa immediately after an unaccented long vowel is vocal.",
    aliases: [
      "shewa after long",
      "vocal shewa long vowel",
      "shewa after an unaccented long vowel",
      "unaccented long vowel is vocal",
    ],
  },
  {
    id: "dagesh-forte-vowel",
    group: "dagesh",
    title: "Begadkephat dagesh is forte after a vowel",
    statement: "The dagesh in a begadkephat letter is forte if it is preceded by a vowel.",
    aliases: [
      "dagesh forte",
      "forte after vowel",
      "daghesh forte",
      "dagesh forte if preceded by a vowel",
      "preceded by a vowel",
    ],
  },
  {
    id: "dagesh-lene-cons",
    group: "dagesh",
    title: "Begadkephat dagesh is lene after a consonant",
    statement: "The dagesh in a begadkephat letter is lene if it is preceded by a consonant (often silent shewa).",
    aliases: [
      "dagesh lene",
      "lene after consonant",
      "daghesh lene",
      "dagesh lene if preceded by a consonant",
      "preceded by a consonant",
    ],
  },
  {
    id: "dagesh-lene-initial",
    group: "dagesh",
    title: "Word-initial begadkephat takes dagesh lene",
    statement:
      "A begadkephat at the beginning of a word takes dagesh lene unless the previous word ends in a vowel.",
    aliases: [
      "initial dagesh lene",
      "begadkephat start",
      "beginning of a word takes dagesh lene",
      "word initial lene",
    ],
  },
  {
    id: "guttural-no-forte",
    group: "guttural",
    title: "All gutturals cannot take dagesh, including ר",
    statement:
      "All gutturals cannot take dagesh — lene or forte. That includes ר. Compensation often lengthens the preceding vowel.",
    aliases: [
      "guttural no dagesh",
      "cannot take forte",
      "ר no dagesh",
      "gutturals cannot take dagesh forte",
      "cannot take daghesh forte",
      "cannot take dagesh lene",
      "cannot take lene or forte",
    ],
  },
  {
    id: "guttural-hateph",
    group: "guttural",
    title: "Gutturals excluding ר take a hateph, not vocal shewa",
    statement:
      "Gutturals excluding ר cannot take vocal shewa; they take a hateph (reduced vowel) instead. They may still take silent shewa.",
    aliases: [
      "guttural hateph",
      "no vocal shewa guttural",
      "cannot take vocal shewa",
      "prefer hateph",
      "gutturals prefer hateph",
    ],
  },
  {
    id: "guttural-a-class",
    group: "guttural",
    title: "Gutturals prefer a-class vowels",
    statement: "The gutturals prefer to appear with a-class vowels (pathach, qamets, hateph pathach).",
    aliases: [
      "guttural a-class",
      "a-class vowel",
      "pathach guttural",
      "prefer a-class vowels",
      "a class vowels",
    ],
  },
  {
    id: "article-regular",
    group: "article",
    title: "Ordinary article is הַ plus dagesh forte",
    statement:
      "The everyday article is הַ plus dagesh forte in the first consonant of the noun (הַמֶּלֶךְ, הַיָּם). Begadkephat letters that had dagesh lene now wear dagesh forte — same mark, new job.",
    aliases: [
      "regular article",
      "ordinary article",
      "ha plus dagesh",
      "definite article dagesh",
      "article pathach dagesh",
    ],
  },
  {
    id: "article-compensatory",
    group: "article",
    title: "א, ע, and ר: compensatory הָ",
    statement:
      "Gutturals and ר cannot take dagesh. When the noun begins with א, ע, or ר, the article’s pathach lengthens to qamets: הָאִישׁ, הָעִיר, הָרֹאשׁ.",
    aliases: [
      "compensatory lengthening",
      "article qamets",
      "ha becomes qamets",
      "א ע ר article",
    ],
  },
  {
    id: "article-virtual",
    group: "article",
    title: "ה and ח: virtual doubling הַ",
    statement:
      "When the noun begins with ה or ח, the article usually keeps pathach and still has no dagesh: הַהֵיכָל, הַחֶרֶב. That is virtual doubling.",
    aliases: [
      "virtual doubling",
      "article pathach guttural",
      "he het article",
      "virtual dagesh",
    ],
  },
  {
    id: "article-seghol",
    group: "article",
    title: "Seghol article הֶ before unaccented הָ חָ עָ",
    statement:
      "Before unaccented הָ, חָ, or עָ (and sometimes accented חָ) the article is הֶ with no dagesh: הֶחָכָם, הֶעָנָן, הֶהָרִים.",
    aliases: [
      "seghol article",
      "irregular seghol",
      "ה-seghol",
      "article before unaccented",
    ],
  },
  {
    id: "vav-default",
    group: "vav",
    title: "Conjunction וְ is always prefixed",
    statement:
      "וְ (and, but, also, even, then) is always prefixed. Default spelling is shewa. An initial ו is the conjunction well over ninety-nine times in a hundred.",
    aliases: [
      "conjunction ו",
      "ו always prefixed",
      "default shewa ו",
      "and but also",
    ],
  },
  {
    id: "vav-bump",
    group: "vav",
    title: "Bump letters ב מ פ take shureq וּ",
    statement:
      "Before the labials ב, מ, or פ the conjunction is shureq: וּמֶלֶךְ, וּבַיִת, וּפַרְעֹה. An initial begadkephat then loses dagesh lene.",
    aliases: [
      "bump rule",
      "shureq ו",
      "labial ו",
      "ב מ פ conjunction",
    ],
  },
  {
    id: "vav-hateph",
    group: "vav",
    title: "ו matches a hateph; יְ contracts to וִי; אֱלֹהִים is וֵאלֹהִים",
    statement:
      "Before a hateph, ו takes the matching short vowel (וַאֲ, וֶאֱ, וָחֳ). יְ + וְ contracts to וִי (וִיהוּדָה). אֱלֹהִים with the conjunction is the special form וֵאלֹהִים. Short and initially accented words often take וָ (וָלֶחֶם, וָבֹהוּ).",
    aliases: [
      "hateph ו",
      "yehudah contraction",
      "velohim",
      "qamets ו",
      "and God",
    ],
  },
];

export const GRAMMAR_CASES: GrammarCase[] = [
  {
    id: "mitsrayim-hireq",
    ruleId: "short-closed-unacc",
    lemma: "מִצְרַיִם",
    lemmaName: "mitsrayim",
    lemmaAlts: ["egypt", "mitsrayim", "mitsraim", "miṣrayim", "מצרים"],
    book: "Exod",
    chapter: 20,
    verse: 2,
    he: "אָנֹכִי יְהוָה אֱלֹהֶיךָ אֲשֶׁר הוֹצֵאתִיךָ מֵאֶרֶץ מִצְרַיִם",
    en: "I am YHWH your God, who brought you out from the land of Egypt.",
    hit: "מִצְרַיִם",
    why: "The hireq under מ sits in a closed, unaccented syllable (מִצְ).",
  },
  {
    id: "melek-seghol",
    ruleId: "short-open-acc",
    lemma: "מֶלֶךְ",
    lemmaName: "melek",
    lemmaAlts: ["king", "melek", "melekh", "מלך"],
    book: "Ps",
    chapter: 24,
    verse: 8,
    he: "מִי זֶה מֶלֶךְ הַכָּבוֹד יְהוָה עִזּוּז וְגִבּוֹר",
    en: "Who is this king of glory? YHWH, strong and mighty.",
    hit: "מֶלֶךְ",
    why: "The first seghol of מֶלֶךְ is a short vowel in an open, accented syllable (מֶ | לֶךְ).",
  },
  {
    id: "dabar-closed",
    ruleId: "long-closed-acc",
    lemma: "דָּבָר",
    lemmaName: "dabar",
    lemmaAlts: ["dabar", "davar", "word", "matter", "דבר"],
    book: "Deut",
    chapter: 4,
    verse: 2,
    he: "לֹא תֹסִפוּ עַל־הַדָּבָר אֲשֶׁר אָנֹכִי מְצַוֶּה אֶתְכֶם",
    en: "You shall not add to the word that I command you.",
    hit: "הַדָּבָר",
    why: "In הַדָּבָר the qamets of בָר is a long vowel in a closed, accented syllable.",
  },
  {
    id: "bara-pretonic",
    ruleId: "long-open-pretonic",
    lemma: "בָּרָא",
    lemmaName: "bara",
    lemmaAlts: ["bara", "created", "create", "ברא"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "בָּרָא",
    why: "The first qamets of בָּרָא (בָּ | רָא) is a long vowel in an open, pretonic syllable.",
  },
  {
    id: "david-pretonic",
    ruleId: "long-open-pretonic",
    lemma: "דָּוִד",
    lemmaName: "david",
    lemmaAlts: ["david", "dawid", "dāwīd", "דוד"],
    book: "1Sam",
    chapter: 16,
    verse: 13,
    he: "וַיִּמְשַׁח אֹתוֹ בְּקֶרֶב אֶחָיו וַתִּצְלַח רוּחַ יְהוָה אֶל־דָּוִד",
    en: "He anointed him among his brothers, and the spirit of YHWH rushed upon David.",
    hit: "דָּוִד",
    why: "The qamets in דָּ is a long vowel in an open, pretonic syllable.",
  },
  {
    id: "devarim-shewa",
    ruleId: "shewa-propretonic",
    lemma: "דָּבָר",
    lemmaName: "dabar",
    lemmaAlts: ["dabar", "davar", "word", "words", "devarim", "דבר", "דברים"],
    book: "Deut",
    chapter: 1,
    verse: 1,
    he: "אֵלֶּה הַדְּבָרִים אֲשֶׁר דִּבֶּר מֹשֶׁה אֶל־כָּל־יִשְׂרָאֵל",
    en: "These are the words that Moses spoke to all Israel.",
    hit: "הַדְּבָרִים",
    why: "Vocal shewa under ד in דְּבָרִים is in an open, propretonic syllable.",
  },
  {
    id: "elohim-hateph",
    ruleId: "reduced-propretonic",
    lemma: "אֱלֹהִים",
    lemmaName: "elohim",
    lemmaAlts: ["elohim", "god", "gods", "elohim", "אלהים"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "אֱלֹהִים",
    why: "Hateph seghol under א is a reduced vowel in an open, propretonic syllable. It is never silent.",
  },
  {
    id: "hokmah-hatuf",
    ruleId: "qamets-hatuf",
    lemma: "חָכְמָה",
    lemmaName: "hokmah",
    lemmaAlts: ["hokmah", "hokhmah", "chokmah", "hokhma", "wisdom", "חכמה"],
    book: "Prov",
    chapter: 9,
    verse: 10,
    he: "תְּחִלַּת חָכְמָה יִרְאַת יְהוָה וְדַעַת קְדֹשִׁים בִּינָה",
    en: "The beginning of wisdom is the fear of YHWH, and knowledge of the Holy One is understanding.",
    hit: "חָכְמָה",
    why: "חָכְ is a closed, unaccented syllable, so the first qamets is Hatuf (short o). The qamets in מָה is long ā because that syllable is accented.",
  },
  {
    id: "kol-hatuf",
    ruleId: "qamets-hatuf",
    lemma: "כֹּל",
    lemmaName: "kol",
    lemmaAlts: ["kol", "kōl", "kal", "all", "every", "each", "כל", "כל־"],
    book: "Gen",
    chapter: 1,
    verse: 31,
    he: "וַיַּרְא אֱלֹהִים אֶת־כָּל־אֲשֶׁר עָשָׂה וְהִנֵּה־טוֹב מְאֹד",
    en: "God saw all that he had made, and behold, it was very good.",
    hit: "כָּל",
    why: "כָּל־ is a closed, unaccented syllable, so the vowel is Qamets Hatuf (short o), not long ā. This is the word that most often carries Hatuf.",
  },
  {
    id: "kol-hatuf-exod",
    ruleId: "qamets-hatuf",
    lemma: "כֹּל",
    lemmaName: "kol",
    lemmaAlts: ["kol", "kōl", "all", "every", "each", "כל"],
    book: "Exod",
    chapter: 19,
    verse: 5,
    he: "וִהְיִיתֶם לִי סְגֻלָּה מִכָּל־הָעַמִּים",
    en: "You shall be my treasured possession out of all the peoples.",
    hit: "מִכָּל",
    why: "In מִכָּל־ the qamets under כ is Hatuf (short o) in a closed, unaccented syllable.",
  },
  {
    id: "dabar-qamets",
    ruleId: "qamets-long",
    lemma: "דָּבָר",
    lemmaName: "dabar",
    lemmaAlts: ["dabar", "davar", "word", "matter", "דבר"],
    book: "Deut",
    chapter: 4,
    verse: 2,
    he: "לֹא תֹסִפוּ עַל־הַדָּבָר אֲשֶׁר אָנֹכִי מְצַוֶּה אֶתְכֶם",
    en: "You shall not add to the word that I command you.",
    hit: "הַדָּבָר",
    why: "Absolute דָּבָר has qamets (long ā) in the open pretonic syllable and in the closed accented syllable.",
  },
  {
    id: "malkah-silent",
    ruleId: "shewa-silent-short",
    lemma: "מַלְכָּה",
    lemmaName: "malkah",
    lemmaAlts: ["malkah", "malka", "queen", "מלכה", "מלכת"],
    book: "Esth",
    chapter: 1,
    verse: 9,
    he: "גַּם וַשְׁתִּי הַמַּלְכָּה עָשְׂתָה מִשְׁתֵּה נָשִׁים",
    en: "Vashti the queen also made a feast for the women.",
    hit: "הַמַּלְכָּה",
    why: "Shewa under ל is silent: it is immediately preceded by short pathach and closes the syllable מַלְ. This is the notes’ word “queen.”",
  },
  {
    id: "malkah-silent-kgs",
    ruleId: "shewa-silent-short",
    lemma: "מַלְכָּה",
    lemmaName: "malkah",
    lemmaAlts: ["malkah", "malka", "queen", "מלכה", "מלכת", "sheba"],
    book: "1Kgs",
    chapter: 10,
    verse: 1,
    he: "וּמַלְכַּת־שְׁבָא שֹׁמַעַת אֶת־שֵׁמַע שְׁלֹמֹה",
    en: "The queen of Sheba heard the report of Solomon.",
    hit: "וּמַלְכַּת",
    why: "Shewa under ל is silent after short pathach, closing מַלְ.",
  },
  {
    id: "vayyishmeu-two",
    ruleId: "shewa-two-first",
    lemma: "שָׁמַע",
    lemmaName: "shama",
    lemmaAlts: ["shama", "shamaʿ", "hear", "heard", "שמע"],
    book: "Gen",
    chapter: 3,
    verse: 8,
    he: "וַיִּשְׁמְעוּ אֶת־קוֹל יְהוָה אֱלֹהִים מִתְהַלֵּךְ בַּגָּן",
    en: "They heard the voice of YHWH God walking in the garden.",
    hit: "וַיִּשְׁמְעוּ",
    why: "Two shewas in a row: under ש (silent, after hireq) then under מ (vocal). Syllabified יִשְׁ | מְ | עוּ.",
  },
  {
    id: "yaladt-final",
    ruleId: "shewa-final",
    lemma: "יָלַד",
    lemmaName: "yalad",
    lemmaAlts: ["yalad", "bear", "gave birth", "ילד", "ילדת"],
    book: "Gen",
    chapter: 16,
    verse: 11,
    he: "הִנָּךְ הָרָה וְיֹלַדְתְּ בֵּן וְקָרָאת שְׁמוֹ יִשְׁמָעֵאל",
    en: "Behold, you are pregnant and shall bear a son; you shall call his name Ishmael.",
    hit: "וְיֹלַדְתְּ",
    why: "The shewa at the end of וְיֹלַדְתְּ is silent — the notes’ exception.",
  },
  {
    id: "bereshit-initial",
    ruleId: "shewa-initial",
    lemma: "רֵאשִׁית",
    lemmaName: "reshit",
    lemmaAlts: ["reshit", "bereshit", "beginning", "ראשית", "בראשית"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "בְּרֵאשִׁית",
    why: "The shewa under ב is initial, so it is vocal.",
  },
  {
    id: "samuel-initial",
    ruleId: "shewa-initial",
    lemma: "שְׁמוּאֵל",
    lemmaName: "samuel",
    lemmaAlts: ["samuel", "shemuel", "shmuel", "שמואל"],
    book: "1Sam",
    chapter: 3,
    verse: 10,
    he: "וַיֹּאמֶר שְׁמוּאֵל דַּבֵּר כִּי שֹׁמֵעַ עַבְדֶּךָ",
    en: "Samuel said, “Speak, for your servant is listening.”",
    hit: "שְׁמוּאֵל",
    why: "Initial shewa under ש is always vocal.",
  },
  {
    id: "melakhim-forte-shewa",
    ruleId: "shewa-after-forte",
    lemma: "מֶלֶךְ",
    lemmaName: "melek",
    lemmaAlts: ["melek", "king", "kings", "melakhim", "מלך", "מלכים"],
    book: "2Sam",
    chapter: 11,
    verse: 1,
    he: "וַיְהִי לִתְשׁוּבַת הַשָּׁנָה לְעֵת צֵאת הַמְּלָכִים",
    en: "At the turn of the year, the time when kings go out to battle.",
    hit: "הַמְּלָכִים",
    why: "Shewa under מ in הַמְּלָכִים is vocal because that מ has dagesh forte.",
  },
  {
    id: "shophetim-long",
    ruleId: "shewa-after-long",
    lemma: "שֹׁפֵט",
    lemmaName: "shofet",
    lemmaAlts: ["shofet", "shophet", "judge", "judges", "shophetim", "shoftim", "שפט", "שפטים"],
    book: "Judg",
    chapter: 2,
    verse: 16,
    he: "וַיָּקֶם יְהוָה שֹׁפְטִים וַיּוֹשִׁיעוּם מִיַּד שֹׁסֵיהֶם",
    en: "YHWH raised up judges, and they saved them from the hand of those who plundered them.",
    hit: "שֹׁפְטִים",
    why: "Shewa under pe follows unaccented holem (changeable long o), so it is vocal.",
  },
  {
    id: "appayim-forte",
    ruleId: "dagesh-forte-vowel",
    lemma: "אַף",
    lemmaName: "aph",
    lemmaAlts: ["aph", "af", "nose", "face", "anger", "אף", "אפים"],
    book: "Gen",
    chapter: 3,
    verse: 19,
    he: "בְּזֵעַת אַפֶּיךָ תֹּאכַל לֶחֶם עַד שׁוּבְךָ אֶל־הָאֲדָמָה",
    en: "By the sweat of your face you shall eat bread until you return to the ground.",
    hit: "אַפֶּיךָ",
    why: "Dagesh in pe is forte: it is a begadkephat preceded by a vowel (the notes’ אַפֶּיךָ).",
  },
  {
    id: "attah-forte-2",
    ruleId: "dagesh-forte-vowel",
    lemma: "אַתָּה",
    lemmaName: "attah",
    lemmaAlts: ["attah", "you", "אתה"],
    book: "Gen",
    chapter: 49,
    verse: 8,
    he: "יְהוּדָה אַתָּה יוֹדוּךָ אַחֶיךָ",
    en: "Judah, your brothers will praise you.",
    hit: "אַתָּה",
    why: "Dagesh in ת of אַתָּה is forte because a vowel (pathach) precedes it.",
  },
  {
    id: "midbar-lene",
    ruleId: "dagesh-lene-cons",
    lemma: "מִדְבָּר",
    lemmaName: "midbar",
    lemmaAlts: ["midbar", "wilderness", "desert", "מדבר"],
    book: "Exod",
    chapter: 3,
    verse: 1,
    he: "וּמֹשֶׁה הָיָה רֹעֶה אֶת־צֹאן יִתְרוֹ חֹתְנוֹ אַחַר הַמִּדְבָּר",
    en: "Moses was shepherding the flock of Jethro his father-in-law, behind the wilderness.",
    hit: "הַמִּדְבָּר",
    why: "Dagesh in ב of מִדְבָּר is lene: it is preceded by a consonant with silent shewa, not a vowel.",
  },
  {
    id: "bereshit-lene",
    ruleId: "dagesh-lene-initial",
    lemma: "רֵאשִׁית",
    lemmaName: "reshit",
    lemmaAlts: ["reshit", "bereshit", "beginning", "bara", "ברא", "בראשית"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "בְּרֵאשִׁית",
    why: "ב at the beginning of בְּרֵאשִׁית takes dagesh lene (no previous word ending in a vowel).",
  },
  {
    id: "haarets-guttural",
    ruleId: "guttural-no-forte",
    lemma: "אֶרֶץ",
    lemmaName: "erets",
    lemmaAlts: ["erets", "eretz", "earth", "land", "ארץ"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "הָאָרֶץ",
    why: "א cannot take dagesh forte, so the article is הָ (lengthened) rather than a doubled consonant.",
  },
  {
    id: "elohim-hateph-g",
    ruleId: "guttural-hateph",
    lemma: "אֱלֹהִים",
    lemmaName: "elohim",
    lemmaAlts: ["elohim", "god", "אלהים"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "אֱלֹהִים",
    why: "א is a guttural, so it takes hateph seghol rather than a simple vocal shewa.",
  },
  {
    id: "adamah-hateph",
    ruleId: "guttural-hateph",
    lemma: "אֲדָמָה",
    lemmaName: "adamah",
    lemmaAlts: ["adamah", "ground", "soil", "אדמה"],
    book: "Gen",
    chapter: 2,
    verse: 7,
    he: "וַיִּיצֶר יְהוָה אֱלֹהִים אֶת־הָאָדָם עָפָר מִן־הָאֲדָמָה",
    en: "YHWH God formed the human of dust from the ground.",
    hit: "הָאֲדָמָה",
    why: "Hateph pathach under א: gutturals prefer a reduced vowel, not vocal shewa.",
  },
  {
    id: "yaaqob-a-class",
    ruleId: "guttural-a-class",
    lemma: "יַעֲקֹב",
    lemmaName: "jacob",
    lemmaAlts: ["jacob", "yaaqob", "yaakov", "yaʿăqōb", "יעקב"],
    book: "Gen",
    chapter: 32,
    verse: 29,
    he: "לֹא יַעֲקֹב יֵאָמֵר עוֹד שִׁמְךָ כִּי אִם־יִשְׂרָאֵל",
    en: "Your name shall no longer be said Jacob, but Israel.",
    hit: "יַעֲקֹב",
    why: "ע takes pathach then hateph pathach — a-class vowels with the guttural.",
  },
  {
    id: "am-a-class",
    ruleId: "guttural-a-class",
    lemma: "עַם",
    lemmaName: "am",
    lemmaAlts: ["am", "people", "nation", "עם"],
    book: "Exod",
    chapter: 19,
    verse: 5,
    he: "וִהְיִיתֶם לִי סְגֻלָּה מִכָּל־הָעַמִּים",
    en: "You shall be my treasured possession out of all the peoples.",
    hit: "הָעַמִּים",
    why: "ע prefers the a-class pathach in עַם / עַמִּים.",
  },
  {
    id: "israel-one-vowel",
    ruleId: "syllable-consonant-vowel",
    lemma: "יִשְׂרָאֵל",
    lemmaName: "israel",
    lemmaAlts: ["israel", "yisrael", "yiśrāʾēl", "ישראל"],
    book: "Deut",
    chapter: 6,
    verse: 4,
    he: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד",
    en: "Hear, Israel: YHWH our God, YHWH is one.",
    hit: "יִשְׂרָאֵל",
    why: "יִשְׂ | רָ | אֵל — every syllable begins with a consonant and holds one vowel. That is the whole rule, applied.",
  },
  {
    id: "dabar-open-closed",
    ruleId: "syllable-open-closed",
    lemma: "דָּבָר",
    lemmaName: "dabar",
    lemmaAlts: ["dabar", "davar", "word", "matter", "דבר"],
    book: "Deut",
    chapter: 4,
    verse: 2,
    he: "לֹא תֹסִפוּ עַל־הַדָּבָר אֲשֶׁר אָנֹכִי מְצַוֶּה אֶתְכֶם",
    en: "You shall not add to the word that I command you.",
    hit: "הַדָּבָר",
    why: "דָּ | בָר — first syllable open (ends with a vowel), second closed (ends with ר). Only these two kinds exist.",
  },
  {
    id: "melek-open-closed",
    ruleId: "syllable-open-closed",
    lemma: "מֶלֶךְ",
    lemmaName: "melek",
    lemmaAlts: ["king", "melek", "melekh", "מלך"],
    book: "Ps",
    chapter: 24,
    verse: 8,
    he: "מִי זֶה מֶלֶךְ הַכָּבוֹד יְהוָה עִזּוּז וְגִבּוֹר",
    en: "Who is this king of glory? YHWH, strong and mighty.",
    hit: "מֶלֶךְ",
    why: "מֶ | לֶךְ — open, then closed. The accent sits on the open first syllable of this segholate.",
  },
  {
    id: "shamayim-forte-divides",
    ruleId: "forte-divides",
    lemma: "שָׁמַיִם",
    lemmaName: "shamayim",
    lemmaAlts: ["shamayim", "heavens", "heaven", "sky", "שמים"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "הַשָּׁמַיִם",
    why: "Dagesh forte in ש doubles it and must be split: הַשְׁ | שָׁ | מַ | יִם. First ש takes shewa and closes (no dagesh after the split); the second takes qamets.",
  },
  {
    id: "appayim-hard",
    ruleId: "forte-hard-sound",
    lemma: "אַף",
    lemmaName: "aph",
    lemmaAlts: ["aph", "af", "nose", "face", "anger", "אף", "אפים"],
    book: "Gen",
    chapter: 3,
    verse: 19,
    he: "בְּזֵעַת אַפֶּיךָ תֹּאכַל לֶחֶם עַד שׁוּבְךָ אֶל־הָאֲדָמָה",
    en: "By the sweat of your face you shall eat bread until you return to the ground.",
    hit: "אַפֶּיךָ",
    why: "Pe with dagesh forte is the hard p, doubled: ap-pe-kha, never the soft f.",
  },
  {
    id: "malkah-shewa-end",
    ruleId: "shewa-marks-end",
    lemma: "מַלְכָּה",
    lemmaName: "malkah",
    lemmaAlts: ["malkah", "malka", "queen", "מלכה"],
    book: "Esth",
    chapter: 1,
    verse: 9,
    he: "גַּם וַשְׁתִּי הַמַּלְכָּה עָשְׂתָה מִשְׁתֵּה נָשִׁים",
    en: "Vashti the queen also made a feast for the women.",
    hit: "הַמַּלְכָּה",
    why: "The silent shewa under ל ends the syllable מַלְ. Whether silent or vocal, a shewa always marks a syllable boundary.",
  },
  {
    id: "shamata-guttural-silent",
    ruleId: "guttural-silent-shewa",
    lemma: "שָׁמַע",
    lemmaName: "shama",
    lemmaAlts: ["shama", "shamaʿ", "hear", "heard", "you heard", "שמע", "שמעת"],
    book: "Gen",
    chapter: 3,
    verse: 17,
    he: "וּלְאָדָם אָמַר כִּי שָׁמַעְתָּ לְקוֹל אִשְׁתֶּךָ",
    en: "And to the human he said, “Because you listened to the voice of your wife…”",
    hit: "שָׁמַעְתָּ",
    why: "The precise rule: gutturals refuse vocal shewa, not shewa itself. Silent shewa is not a vowel, so ע takes it here. Short pathach → silent, שָׁ | מַעְ | תָּ. Dagesh in ת is lene.",
  },
  {
    id: "reuben-resh-vocal",
    ruleId: "resh-vocal-shewa",
    lemma: "רְאוּבֵן",
    lemmaName: "reuben",
    lemmaAlts: ["reuben", "reuven", "re'uven", "ראובן"],
    book: "Gen",
    chapter: 29,
    verse: 32,
    he: "וַתַּהַר לֵאָה וַתֵּלֶד בֵּן וַתִּקְרָא שְׁמוֹ רְאוּבֵן",
    en: "Leah conceived and bore a son, and she called his name Reuben.",
    hit: "רְאוּבֵן",
    why: "Shewa on ר follows the shewa rules: it starts the word, so it is vocal. Do not replace it with a hateph.",
  },
  {
    id: "barkhi-resh-vocal",
    ruleId: "resh-vocal-shewa",
    lemma: "בָּרַךְ",
    lemmaName: "barak",
    lemmaAlts: ["barak", "bless", "blessed", "ברך", "barki", "barkhi"],
    book: "Ps",
    chapter: 103,
    verse: 1,
    he: "בָּרְכִי נַפְשִׁי אֶת־יְהוָה וְכָל־קְרָבַי אֶת־שֵׁם קָדְשׁוֹ",
    en: "Bless YHWH, O my soul, and all that is within me, his holy name.",
    hit: "בָּרְכִי",
    why: "Shewa under ר is vocal (בָּ | רְ | כִי) because it follows an unaccented long vowel — the ordinary shewa rule, not a guttural hateph.",
  },
  {
    id: "batim-metheg",
    ruleId: "metheg-qamets",
    lemma: "בַּיִת",
    lemmaName: "bayit",
    lemmaAlts: ["bayit", "batim", "houses", "house", "בתים", "בית"],
    book: "Exod",
    chapter: 1,
    verse: 21,
    he: "וַיְהִי כִּי־יָרְאוּ הַמְיַלְּדֹת אֶת־הָאֱלֹהִים וַיַּעַשׂ לָהֶם בָּֽתִּים",
    en: "And because the midwives feared God, he made houses for them.",
    hit: "בָּֽתִּים",
    why: "Metheg with the first qamets marks it as long ā in an open syllable (בָּֽ | תִּים), not hatuf. Hatuf never takes the metheg.",
  },
  {
    id: "ruach-furtive",
    ruleId: "furtive-pathach",
    lemma: "רוּחַ",
    lemmaName: "ruach",
    lemmaAlts: ["ruach", "ruah", "spirit", "wind", "breath", "רוח"],
    book: "Gen",
    chapter: 1,
    verse: 2,
    he: "וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל־פְּנֵי תְהוֹם וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם",
    en: "The earth was formless and empty, and darkness over the face of the deep, and the spirit of God hovering over the face of the waters.",
    hit: "וְרוּחַ",
    why: "The pathach under ḥet is furtive: not a full vowel, not a syllable of its own. Pronounce it before the guttural (rûaḥ), but count רוּחַ as one closed syllable.",
  },
  {
    id: "noah-furtive",
    ruleId: "furtive-pathach",
    lemma: "נֹחַ",
    lemmaName: "noah",
    lemmaAlts: ["noah", "noach", "נח"],
    book: "Gen",
    chapter: 5,
    verse: 29,
    he: "וַיִּקְרָא אֶת־שְׁמוֹ נֹחַ לֵאמֹר זֶה יְנַחֲמֵנוּ",
    en: "He called his name Noah, saying, “This one shall comfort us.”",
    hit: "נֹחַ",
    why: "Furtive pathach under ḥet is pronounced before the guttural (nōaḥ) but is not counted as its own syllable.",
  },
  {
    id: "chatta't-quiescent",
    ruleId: "quiescent-alef",
    lemma: "חַטָּאת",
    lemmaName: "chatta't",
    lemmaAlts: ["chatta't", "chattat", "hattat", "chatat", "sin", "חטאת"],
    book: "Gen",
    chapter: 4,
    verse: 7,
    he: "הֲלוֹא אִם־תֵּיטִיב שְׂאֵת וְאִם לֹא תֵיטִיב לַפֶּתַח חַטָּאת רֹבֵץ",
    en: "If you do well, lifting. If you do not do well, sin is crouching at the door.",
    hit: "חַטָּאת",
    why: "The א of חַטָּאת has no vowel — it is quiescent. It does not open a new syllable; the word is חַטָּאת, not ḥaṭ-ṭā-ʾat.",
  },
  {
    id: "bayit-diphthong",
    ruleId: "diphthong-closed",
    lemma: "בַּיִת",
    lemmaName: "bayit",
    lemmaAlts: ["bayit", "house", "home", "בית"],
    book: "Ps",
    chapter: 127,
    verse: 1,
    he: "אִם־יְהוָה לֹא־יִבְנֶה בַיִת שָׁוְא עָמְלוּ בוֹנָיו בּוֹ",
    en: "Unless YHWH builds the house, the builders labor in vain.",
    hit: "בַיִת",
    why: "The patah+י diphthong (בַ֫יִ) makes a closed syllable — it ends with a consonant. בַּ֫יִת is not ba-yit as two open vowels.",
  },
  {
    id: "bayit-diphthong-sam",
    ruleId: "diphthong-closed",
    lemma: "בַּיִת",
    lemmaName: "bayit",
    lemmaAlts: ["bayit", "house", "home", "בית"],
    book: "2Sam",
    chapter: 7,
    verse: 13,
    he: "הוּא יִבְנֶה־בַּיִת לִשְׁמִי וְכֹנַנְתִּי אֶת־כִּסֵּא מַמְלַכְתּוֹ עַד־עוֹלָם",
    en: "He shall build a house for my name, and I will establish the throne of his kingdom forever.",
    hit: "בַּיִת",
    why: "בַּ֫יִת is a closed diphthong syllable (patah + י), always ending with a consonant — the notes’ example.",
  },
  {
    id: "erets-open-closed",
    ruleId: "syllable-open-closed",
    lemma: "אֶרֶץ",
    lemmaName: "erets",
    lemmaAlts: ["erets", "eretz", "earth", "land", "ארץ"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "הָאָרֶץ",
    why: "אֶ | רֶץ — open, then closed. Every syllable still starts with a consonant and holds one vowel.",
  },
  {
    id: "or-one-closed",
    ruleId: "syllable-consonant-vowel",
    lemma: "אוֹר",
    lemmaName: "or",
    lemmaAlts: ["or", "light", "אור"],
    book: "Gen",
    chapter: 1,
    verse: 3,
    he: "וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי־אוֹר",
    en: "God said, “Let there be light,” and there was light.",
    hit: "אוֹר",
    why: "One consonant onset, one vowel (holem). The word is a single closed syllable.",
  },
  {
    id: "shabbat-forte",
    ruleId: "forte-divides",
    lemma: "שַׁבָּת",
    lemmaName: "shabbat",
    lemmaAlts: ["shabbat", "sabbath", "shabbath", "שבת"],
    book: "Exod",
    chapter: 20,
    verse: 8,
    he: "זָכוֹר אֶת־יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ",
    en: "Remember the sabbath day, to keep it holy.",
    hit: "הַשַּׁבָּת",
    why: "Dagesh forte in ב: first ב shewa-closes (no dagesh); second takes the vowel — שַׁבְ | בָת.",
  },
  {
    id: "bayit-lene-initial",
    ruleId: "dagesh-lene-initial",
    lemma: "בַּיִת",
    lemmaName: "bayit",
    lemmaAlts: ["bayit", "house", "בית"],
    book: "Prov",
    chapter: 24,
    verse: 3,
    he: "בַּחָכְמָה יִבָּנֶה בָּיִת וּבִתְבוּנָה יִתְכּוֹנָן",
    en: "By wisdom a house is built.",
    hit: "בָּיִת",
    why: "Word-initial ב takes dagesh lene. Hard b, not a double — do not split through it.",
  },
  {
    id: "shema-initial-shewa",
    ruleId: "shewa-initial",
    lemma: "שְׁמַע",
    lemmaName: "shema",
    lemmaAlts: ["shema", "hear", "listen", "שמע"],
    book: "Deut",
    chapter: 6,
    verse: 4,
    he: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד",
    en: "Hear, Israel: YHWH our God, YHWH is one.",
    hit: "שְׁמַע",
    why: "Shewa under ש starts the word, so it is vocal.",
  },
  {
    id: "kol-hatuf-deut",
    ruleId: "qamets-hatuf",
    lemma: "כָּל",
    lemmaName: "kol",
    lemmaAlts: ["kol", "kal", "all", "every", "כל"],
    book: "Deut",
    chapter: 6,
    verse: 5,
    he: "וְאָהַבְתָּ אֵת יְהוָה אֱלֹהֶיךָ בְּכָל־לְבָבְךָ",
    en: "You shall love YHWH your God with all your heart.",
    hit: "בְּכָל",
    why: "Construct כָּל is closed and unaccented — qamets hatuf (kol).",
  },
  {
    id: "qara-qamets-long",
    ruleId: "qamets-long",
    lemma: "קָרָא",
    lemmaName: "qara",
    lemmaAlts: ["qara", "called", "call", "קרא"],
    book: "Gen",
    chapter: 1,
    verse: 5,
    he: "וַיִּקְרָא אֱלֹהִים לָאוֹר יוֹם וְלַחֹשֶׁךְ קָרָא לָיְלָה",
    en: "God called the light Day, and the darkness he called Night.",
    hit: "קָרָא",
    why: "קָ is open. The sign is qamets (long a), not hatuf.",
  },
  {
    id: "ruach-furtive-gen",
    ruleId: "furtive-pathach",
    lemma: "רוּחַ",
    lemmaName: "ruach",
    lemmaAlts: ["ruach", "spirit", "wind", "breath", "רוח"],
    book: "Gen",
    chapter: 1,
    verse: 2,
    he: "וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם",
    en: "And the spirit of God was hovering over the face of the waters.",
    hit: "וְרוּחַ",
    why: "Furtive pathach under ḥet is pronounced before the letter but is not a new syllable.",
  },
  {
    id: "noach-furtive",
    ruleId: "furtive-pathach",
    lemma: "נֹחַ",
    lemmaName: "noach",
    lemmaAlts: ["noah", "noach", "נח"],
    book: "Gen",
    chapter: 6,
    verse: 9,
    he: "אֵלֶּה תּוֹלְדֹת נֹחַ נֹחַ אִישׁ צַדִּיק",
    en: "These are the generations of Noah. Noah was a righteous man.",
    hit: "נֹחַ",
    why: "One syllable. Furtive pathach before final ḥet (nōaḥ).",
  },
  {
    id: "yadayim-dual",
    ruleId: "diphthong-closed",
    lemma: "יָדַיִם",
    lemmaName: "yadayim",
    lemmaAlts: ["yadayim", "hands", "yadaim", "ידים"],
    book: "Prov",
    chapter: 6,
    verse: 17,
    he: "עֵינַיִם רָמוֹת לְשׁוֹן שָׁקֶר וְיָדַיִם שֹׁפְכוֹת דָּם־נָקִי",
    en: "Haughty eyes, a lying tongue, and hands that shed innocent blood.",
    hit: "יָדַיִם",
    why: "Dual: keep the ay diphthong plus ם as one closed slice — יָ | דַיִם.",
  },
  {
    id: "elohim-hateph",
    ruleId: "guttural-hateph",
    lemma: "אֱלֹהִים",
    lemmaName: "elohim",
    lemmaAlts: ["elohim", "god", "elohim", "אלהים"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "אֱלֹהִים",
    why: "א takes hateph segol, not vocal shewa. אֱ | לֹ | הִים.",
  },
  {
    id: "yisrael-silent-shewa",
    ruleId: "shewa-silent-short",
    lemma: "יִשְׂרָאֵל",
    lemmaName: "yisrael",
    lemmaAlts: ["israel", "yisrael", "ישראל"],
    book: "Deut",
    chapter: 6,
    verse: 4,
    he: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד",
    en: "Hear, Israel: YHWH our God, YHWH is one.",
    hit: "יִשְׂרָאֵל",
    why: "Hireq is short, so shewa under sin is silent and closes יִשְׂ.",
  },
  {
    id: "avraham-silent-shewa",
    ruleId: "shewa-silent-short",
    lemma: "אַבְרָהָם",
    lemmaName: "avraham",
    lemmaAlts: ["abraham", "avraham", "abram", "אברהם"],
    book: "Gen",
    chapter: 17,
    verse: 5,
    he: "וְלֹא־יִקָּרֵא עוֹד אֶת־שִׁמְךָ אַבְרָם וְהָיָה שִׁמְךָ אַבְרָהָם",
    en: "Your name shall no longer be called Abram, but your name shall be Abraham.",
    hit: "אַבְרָהָם",
    why: "Pathach is short, so shewa under ב is silent: אַבְ | רָ | הָם.",
  },
  {
    id: "paroh-resh-shewa",
    ruleId: "resh-vocal-shewa",
    lemma: "פַּרְעֹה",
    lemmaName: "paroh",
    lemmaAlts: ["pharaoh", "paroh", "par’oh", "פרעה"],
    book: "Exod",
    chapter: 5,
    verse: 1,
    he: "וְאַחַר בָּאוּ מֹשֶׁה וְאַהֲרֹן וַיֹּאמְרוּ אֶל־פַּרְעֹה",
    en: "Afterward Moses and Aaron came and said to Pharaoh.",
    hit: "פַּרְעֹה",
    why: "Shewa on ר follows the shewa rules: short pathach before it, so it is silent — not a guttural hateph.",
  },
  {
    id: "hayam-regular-article",
    ruleId: "article-regular",
    lemma: "יָם",
    lemmaName: "yam",
    lemmaAlts: ["yam", "sea", "the sea", "ים"],
    book: "Exod",
    chapter: 14,
    verse: 21,
    he: "וַיֵּט מֹשֶׁה אֶת יָדוֹ עַל הַיָּם",
    en: "Moses stretched out his hand over the sea.",
    hit: "הַיָּם",
    why: "Ordinary article: הַ plus dagesh forte in י. Strip it and look up יָם.",
  },
  {
    id: "haadam-compensatory",
    ruleId: "article-compensatory",
    lemma: "אָדָם",
    lemmaName: "adam",
    lemmaAlts: ["adam", "man", "the man", "אדם"],
    book: "Gen",
    chapter: 2,
    verse: 7,
    he: "וַיִּיצֶר יְהוָה אֱלֹהִים אֶת הָאָדָם עָפָר מִן הָאֲדָמָה",
    en: "YHWH God formed the man from the dust of the ground.",
    hit: "הָאָדָם",
    why: "א refuses dagesh, so the article’s pathach lengthens to qamets: הָ.",
  },
  {
    id: "haerev-virtual",
    ruleId: "article-virtual",
    lemma: "חֶרֶב",
    lemmaName: "hereb",
    lemmaAlts: ["hereb", "sword", "the sword", "חרב"],
    book: "Gen",
    chapter: 3,
    verse: 24,
    he: "וַיַּשְׁכֵּן מִקֶּדֶם לְגַן עֵדֶן אֶת הַכְּרֻבִים וְאֵת לַהַט הַחֶרֶב הַמִּתְהַפֶּכֶת",
    en: "He placed cherubim at the east of the garden of Eden, and the flame of the sword that turned.",
    hit: "הַחֶרֶב",
    why: "ח refuses dagesh but the pathach stays: virtual doubling הַחֶרֶב, not הָחֶרֶב.",
  },
  {
    id: "heanan-seghol",
    ruleId: "article-seghol",
    lemma: "עָנָן",
    lemmaName: "anan",
    lemmaAlts: ["anan", "cloud", "the cloud", "ענן"],
    book: "Exod",
    chapter: 13,
    verse: 22,
    he: "לֹא יָמִישׁ עַמּוּד הֶעָנָן יוֹמָם וְעַמּוּד הָאֵשׁ לָיְלָה לִפְנֵי הָעָם",
    en: "The pillar of cloud by day and the pillar of fire by night did not depart from before the people.",
    hit: "הֶעָנָן",
    why: "Unaccented עָ after the article: irregular seghol הֶ, no dagesh.",
  },
  {
    id: "veet-default-vav",
    ruleId: "vav-default",
    lemma: "וְ",
    lemmaName: "we",
    lemmaAlts: ["we", "ve", "and", "ו", "ו", "ו"],
    book: "Gen",
    chapter: 1,
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning God created the heavens and the earth.",
    hit: "וְאֵת",
    why: "Default conjunction: shewa on ו, always prefixed. וְאֵת = and + object marker.",
  },
  {
    id: "ubakar-bump",
    ruleId: "vav-bump",
    lemma: "בָּקָר",
    lemmaName: "baqar",
    lemmaAlts: ["baqar", "cattle", "herd", "בקר"],
    book: "Gen",
    chapter: 24,
    verse: 35,
    he: "וַיִּתֶּן לוֹ צֹאן וּבָקָר וְכֶסֶף וְזָהָב",
    en: "He has given him flocks and herds, silver and gold.",
    hit: "וּבָקָר",
    why: "ב is a bump letter, so the conjunction is shureq וּ. Begadkephat loses dagesh lene.",
  },
  {
    id: "velohim-special",
    ruleId: "vav-hateph",
    lemma: "אֱלֹהִים",
    lemmaName: "elohim",
    lemmaAlts: ["elohim", "god", "and god", "אלהים"],
    book: "Gen",
    chapter: 50,
    verse: 24,
    he: "אָנֹכִי מֵת וֵאלֹהִים פָּקֹד יִפְקֹד אֶתְכֶם",
    en: "I am dying, but God will surely visit you.",
    hit: "וֵאלֹהִים",
    why: "Special: not the ordinary hateph match וֶאֱלֹהִים, but וֵאלֹהִים with tsere.",
  },
];

const BOOK_ALIASES: Record<string, string> = {
  gen: "Gen",
  genesis: "Gen",
  gn: "Gen",
  bereshit: "Gen",
  exod: "Exod",
  exodus: "Exod",
  ex: "Exod",
  shemot: "Exod",
  lev: "Lev",
  leviticus: "Lev",
  num: "Num",
  numbers: "Num",
  deut: "Deut",
  deuteronomy: "Deut",
  dt: "Deut",
  devarim: "Deut",
  josh: "Josh",
  joshua: "Josh",
  judg: "Judg",
  judges: "Judg",
  jdg: "Judg",
  jg: "Judg",
  ruth: "Ruth",
  "1sam": "1Sam",
  "1 sam": "1Sam",
  "1 samuel": "1Sam",
  "i sam": "1Sam",
  "1sa": "1Sam",
  "1samuel": "1Sam",
  "2sam": "2Sam",
  "2 sam": "2Sam",
  "2 samuel": "2Sam",
  "2sa": "2Sam",
  "2samuel": "2Sam",
  "1kgs": "1Kgs",
  "1 kgs": "1Kgs",
  "1 kings": "1Kgs",
  "1ki": "1Kgs",
  "1kings": "1Kgs",
  "1kin": "1Kgs",
  "2kgs": "2Kgs",
  "2 kings": "2Kgs",
  "2kings": "2Kgs",
  esth: "Esth",
  esther: "Esth",
  est: "Esth",
  isa: "Isa",
  isaiah: "Isa",
  jer: "Jer",
  jeremiah: "Jer",
  ezek: "Ezek",
  ps: "Ps",
  psalm: "Ps",
  psalms: "Ps",
  psa: "Ps",
  prov: "Prov",
  proverb: "Prov",
  proverbs: "Prov",
  pr: "Prov",
  prv: "Prov",
  job: "Job",
};

export function canonicalBook(raw: string): string | null {
  const k = raw.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  if (BOOK_ALIASES[k]) return BOOK_ALIASES[k];
  const compact = k.replace(/\s+/g, "");
  if (BOOK_ALIASES[compact]) return BOOK_ALIASES[compact];
  const titled = raw.trim();
  const known = new Set(Object.values(BOOK_ALIASES));
  if (known.has(titled)) return titled;
  return null;
}

export function parseRef(input: string): { book: string; chapter: number; verse: number } | null {
  const t = input.trim();
  const m = t.match(/^((?:[123]\s*)?[A-Za-z]+)\s*(\d+)\s*[:.]\s*(\d+)$/);
  if (m) {
    const book = canonicalBook(m[1].replace(/\s+/g, ""));
    if (!book) return null;
    return { book, chapter: Number(m[2]), verse: Number(m[3]) };
  }
  const spaced = t.match(/^((?:[123]\s*)?[A-Za-z]+)\s+(\d+)\s+(\d+)$/);
  if (!spaced) return null;
  const book = canonicalBook(spaced[1].replace(/\s+/g, ""));
  if (!book) return null;
  return { book, chapter: Number(spaced[2]), verse: Number(spaced[3]) };
}

function foldLatin(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ʾʿāēīōūəḥṣṭš\-’']/g, (ch) => {
      const map: Record<string, string> = {
        ʾ: "",
        ʿ: "",
        ā: "a",
        ē: "e",
        ī: "i",
        ō: "o",
        ū: "u",
        ə: "e",
        ḥ: "h",
        ṣ: "s",
        ṭ: "t",
        š: "sh",
        "-": "",
        "’": "",
        "'": "",
      };
      return map[ch] ?? ch;
    })
    .replace(/[^a-z]/g, "");
}

export function lemmaMatches(c: GrammarCase, input: string): boolean {
  const raw = input.trim();
  if (!raw) return false;
  const he = normalizeHebrew(raw);
  if (he && (he === normalizeHebrew(c.lemma) || c.lemmaAlts.some((a) => normalizeHebrew(a) === he))) {
    return true;
  }
  const want = [c.lemmaName, ...c.lemmaAlts].map(foldLatin).filter(Boolean);
  return want.includes(foldLatin(raw));
}

export function refMatches(c: GrammarCase, input: string): boolean {
  const parsed = parseRef(input);
  if (!parsed) return false;
  return parsed.book === c.book && parsed.chapter === c.chapter && parsed.verse === c.verse;
}

export function refMatchesParts(
  c: GrammarCase,
  bookRaw: string,
  chapterRaw: string,
  verseRaw: string,
): boolean {
  const bookField = bookRaw.trim();
  if (refMatches(c, bookField)) return true;
  const glued = `${bookRaw} ${chapterRaw}:${verseRaw}`;
  if (refMatches(c, glued)) return true;
  const spaced = `${bookRaw} ${chapterRaw} ${verseRaw}`;
  if (refMatches(c, spaced)) return true;
  const book = canonicalBook(bookRaw);
  const ch = Number(chapterRaw.trim());
  const vs = Number(verseRaw.trim());
  if (!book || !Number.isFinite(ch) || !Number.isFinite(vs)) return false;
  return book === c.book && ch === c.chapter && vs === c.verse;
}

/** Lemma and reference must belong to the same case of this rule. */
export function huntHits(
  ruleId: string,
  lemma: string,
  bookRaw: string,
  chapterRaw: string,
  verseRaw: string,
): GrammarCase | null {
  return (
    casesForRule(ruleId).find(
      (c) => lemmaMatches(c, lemma) && refMatchesParts(c, bookRaw, chapterRaw, verseRaw),
    ) ?? null
  );
}

/** Any rule that truly applies to this same highlighted form may count. */
export function nameHits(item: GrammarCase, input: string): GrammarRule | null {
  const own = ruleById(item.ruleId);
  if (own && ruleMatches(own, input)) return own;
  const sameForm = GRAMMAR_CASES.filter(
    (c) =>
      c.id !== item.id &&
      c.book === item.book &&
      c.chapter === item.chapter &&
      c.verse === item.verse &&
      (c.hit === item.hit || normalizeHebrew(c.hit) === normalizeHebrew(item.hit)),
  );
  for (const c of sameForm) {
    const r = ruleById(c.ruleId);
    if (r && ruleMatches(r, input)) return r;
  }
  return null;
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "in",
  "of",
  "or",
  "and",
  "is",
  "to",
  "for",
  "with",
  "that",
  "this",
  "if",
  "not",
  "on",
  "at",
  "by",
  "be",
  "as",
  "any",
]);

function foldRule(s: string): string {
  return s
    .toLowerCase()
    .replace(/daghesh/g, "dagesh")
    .replace(/hatuph|hatof|hataf/g, "hatuf")
    .replace(/qametz|kamets|kametz|qames/g, "qamets")
    .replace(/sheva|shva/g, "shewa")
    .replace(/begadkefat|begadkephat/g, "begadkephat")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ruleMatches(rule: GrammarRule, input: string): boolean {
  const fold = foldRule(input);
  if (fold.length < 4) return false;
  const title = foldRule(rule.title);
  if (fold === title) return true;
  const aliases = rule.aliases.map(foldRule).filter(Boolean);
  if (aliases.some((a) => a === fold)) return true;
  if (
    aliases.some((a) => {
      const distinctive = a.length >= 8 || a.split(" ").length >= 2;
      return distinctive && fold.includes(a);
    })
  ) {
    return true;
  }
  const tokens = fold.split(" ").filter((w) => w.length > 2 && !STOP.has(w));
  if (tokens.length < 3) return false;
  const hay = `${title} ${aliases.join(" ")}`;
  const hits = tokens.filter((w) => hay.includes(w)).length;
  return hits >= 2 && hits / tokens.length >= 0.5;
}

export function ruleById(id: string): GrammarRule | undefined {
  return GRAMMAR_RULES.find((r) => r.id === id);
}

export function casesForRule(ruleId: string): GrammarCase[] {
  return GRAMMAR_CASES.filter((c) => c.ruleId === ruleId);
}

export function formatRef(c: GrammarCase): string {
  return `${c.book} ${c.chapter}:${c.verse}`;
}

export function groupTitle(groupId: string): string {
  return GRAMMAR_GROUPS.find((g) => g.id === groupId)?.title ?? groupId;
}

export const HUNT_ROUND_LEN = ROUND_LEN;

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
