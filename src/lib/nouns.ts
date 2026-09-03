/** Original teaching notes on Hebrew nouns. Public-domain Masoretic examples. Not a textbook reprint. */

export type NounVerse = { ref: string; he: string; en: string; hit: string; hitEn?: string };

export type NounSample = {
  word: string;
  gloss: string;
  tag: string;
  note: string;
  ref?: string;
};

export type NounQuiz = {
  q: string;
  he?: string;
  ref?: string;
  choices: string[];
  answer: string;
  why: string;
  review?: boolean;
};

export type NounUnit = {
  id: number;
  title: string;
  short: string;
  rule: string;
  samples: NounSample[];
  verses: NounVerse[];
  quiz: NounQuiz[];
};

export const NOUN_QUIZ_LEN = 12;
export const NOUN_REVIEW = 3;
export const NOUN_UNIT_MAX = 6;

export const NOUN_UNITS: NounUnit[] = [
  {
    id: 1,
    title: "Gender and number",
    short: "What a noun wears",
    rule:
      "A Hebrew noun names a person, place, thing, or idea. Each one also wears gender — masculine or feminine — and number — one, many, or a pair. Gender here is the ending-set the word follows, not always natural sex: תּוֹרָה is feminine because it takes feminine endings. Dual number marks a pair, used often for things that come in twos (eyes, hands). A dual ending must hold the ay diphthong — the same tight cluster as in בַּיִת — then ם. Yod-mem without that diphthong is many, not a pair. You read both facts off the ending.",
    samples: [
      { word: "מֶלֶךְ", gloss: "king", tag: "masculine singular", note: "No extra ending. Masculine singular is usually the bare stem.", ref: "Ps 24:8" },
      { word: "מְלָכִים", gloss: "kings", tag: "masculine plural", note: "The ending ִים marks many on a masculine noun.", ref: "Ps 2:2" },
      { word: "עֵינַיִם", gloss: "eyes (a pair)", tag: "dual", note: "The ending is the ay diphthong plus ם, same cluster as in בַּיִת. That diphthong is required. Without it you only have many.", ref: "Prov 6:17" },
      { word: "תּוֹרָה", gloss: "instruction", tag: "feminine singular", note: "The ending ָה is the usual feminine singular mark.", ref: "Ps 19:8" },
      { word: "תּוֹרוֹת", gloss: "instructions", tag: "feminine plural", note: "The ending וֹת marks many on a feminine noun.", ref: "Exod 18:20" },
    ],
    verses: [
      { ref: "Ps 24:8", he: "מִי זֶה מֶלֶךְ הַכָּבוֹד יְהוָה עִזּוּז וְגִבּוֹר", en: "Who is this king of glory? YHWH, strong and mighty.", hit: "מֶלֶךְ" },
      { ref: "Ps 19:8", he: "תּוֹרַת יְהוָה תְּמִימָה מְשִׁיבַת נָפֶשׁ", en: "The instruction of YHWH is complete, restoring the life.", hit: "תּוֹרַת", hitEn: "instruction" },
      { ref: "Prov 6:17", he: "עֵינַיִם רָמוֹת לְשׁוֹן שָׁקֶר וְיָדַיִם שֹׁפְכוֹת דָּם־נָקִי", en: "Haughty eyes, a lying tongue, and hands that shed innocent blood.", hit: "עֵינַיִם", hitEn: "eyes" },
      { ref: "Ps 2:2", he: "יִתְיַצְּבוּ מַלְכֵי־אֶרֶץ וְרוֹזְנִים נוֹסְדוּ־יָחַד", en: "The kings of the earth take their stand, and rulers counsel together.", hit: "מַלְכֵי", hitEn: "kings" },
    ],
    quiz: [
      { q: "Gender on a Hebrew noun tells you…", choices: ["Which ending-set the word usually follows", "Whether the thing is male or female in nature", "How many there are"], answer: "Which ending-set the word usually follows", why: "Grammatical gender is a clothing size. תּוֹרָה is feminine because of its endings, not because law is female." },
      { q: "Hebrew number can be…", choices: ["Singular, plural, or dual", "Only singular or plural", "Only dual for people"], answer: "Singular, plural, or dual", why: "One, many, or a pair. Dual is its own ending." },
      { q: "Dual number means…", choices: ["A pair — two of them", "Any plural", "A feminine singular"], answer: "A pair — two of them", why: "Eyes, hands, ears — things that come in twos — often wear the dual." },
      { q: "A form is dual only if the ending holds…", he: "עֵינַיִם", ref: "Prov 6:17", choices: ["The ay diphthong (as in בַּיִת) plus ם", "Any yod-mem", "A hireq before the yod"], answer: "The ay diphthong (as in בַּיִת) plus ם", why: "No diphthong, no dual. ִים without the ay-cluster is just many." },
      { q: "תּוֹרָה is feminine because…", he: "תּוֹרָה", ref: "Ps 19:8", choices: ["It takes feminine endings", "Instruction is a woman", "Every abstract noun is feminine"], answer: "It takes feminine endings", why: "Natural sex and grammatical gender often agree, but the ending is what you trust." },
      { q: "מֶלֶךְ is…", he: "מֶלֶךְ", ref: "Ps 24:8", choices: ["Masculine singular", "Masculine plural", "Feminine singular"], answer: "Masculine singular", why: "Bare stem, no plural or dual ending." },
      { q: "מְלָכִים is…", he: "מְלָכִים", choices: ["Masculine plural", "Masculine dual", "Feminine plural"], answer: "Masculine plural", why: "ִים is the usual masculine many-ending." },
      { q: "עֵינַיִם is…", he: "עֵינַיִם", ref: "Prov 6:17", choices: ["Dual — a pair of eyes", "Masculine plural — many eyes", "Feminine singular"], answer: "Dual — a pair of eyes", why: "The ay diphthong plus ם is the required dual mark, the same cluster as in בַּיִת." },
      { q: "תּוֹרוֹת is…", he: "תּוֹרוֹת", choices: ["Feminine plural", "Masculine plural", "Dual"], answer: "Feminine plural", why: "וֹת is the usual feminine many-ending." },
      { q: "Does every feminine noun name a female being?", choices: ["No — gender is the ending pattern", "Yes, always", "Only in the dual"], answer: "No — gender is the ending pattern", why: "You still learn it, because adjectives and verbs will agree with that pattern." },
      { q: "Where do you read gender and number?", choices: ["Off the ending", "Only from the lexicon", "From the first letter"], answer: "Off the ending", why: "That is the skill of this chapter: see the ending, name the form." },
      { q: "The usual job of a noun is the same as in English. It names…", choices: ["A person, place, thing, or idea", "Only verbs of being", "A tense"], answer: "A person, place, thing, or idea", why: "The extra Hebrew work is gender and number on the ending." },
      { q: "In Ps 24:8, מֶלֶךְ is…", he: "מֶלֶךְ", ref: "Ps 24:8", choices: ["One king — masculine singular", "Two kings — dual", "Many kings — masculine plural"], answer: "One king — masculine singular", why: "No ִים and no ַיִם. Bare masculine stem." },
      { q: "Plural means…", choices: ["More than one", "Exactly two", "The lexical form"], answer: "More than one", why: "Dual is reserved for a pair. Plural is the open many." },
      { q: "Why learn gender if it does not change the gloss?", choices: ["It predicts which plural ending the word will take", "It is only for poetry", "It marks the root"], answer: "It predicts which plural ending the word will take", why: "Masculine and feminine nouns add different many-endings. Agreement later depends on it too." },
    ],
  },
  {
    id: 2,
    title: "Masculine endings",
    short: "Bare, ִים, ay-dual",
    rule:
      "A masculine singular noun is usually bare — no extra ending: דָּבָר, מֶלֶךְ, יוֹם. Many masculine nouns add ִים (hireq-yod-mem): דְּבָרִים, מְלָכִים. A pair adds the ay diphthong plus ם — the same tight cluster as in בַּיִת, then mem: עֵינַיִם, סוּסַיִם. Accent sits on the pathach of that cluster. The diphthong is required. Yod-mem with hireq (ִים) is many, not a pair. Do not cut the cluster.",
    samples: [
      { word: "דָּבָר", gloss: "word", tag: "masculine singular", note: "Bare stem. This is also the lexical form you look up.", ref: "1 Kgs 8:56" },
      { word: "דְּבָרִים", gloss: "words", tag: "masculine plural", note: "ִים on a masculine noun. The first vowel has reduced — that is the next unit.", ref: "Gen 15:1" },
      { word: "יוֹם", gloss: "day", tag: "masculine singular", note: "Bare masculine. One closed syllable.", ref: "Gen 1:5" },
      { word: "יָמִים", gloss: "days", tag: "masculine plural", note: "ִים, and the stem vowels move. Still masculine many.", ref: "Gen 1:14" },
      { word: "סוּסַיִם", gloss: "two horses", tag: "masculine dual", note: "Ay diphthong plus ם. Required. Split as סוּ | סַיִם — do not cut the cluster. Compare סוּסִים (many horses), which has hireq, not the diphthong.", ref: "2 Kgs 2:11" },
    ],
    verses: [
      { ref: "Gen 15:1", he: "אַחַר הַדְּבָרִים הָאֵלֶּה הָיָה דְבַר־יְהוָה אֶל־אַבְרָם", en: "After these things, the word of YHWH came to Abram.", hit: "הַדְּבָרִים", hitEn: "these things" },
      { ref: "Gen 1:5", he: "וַיִּקְרָא אֱלֹהִים לָאוֹר יוֹם וְלַחֹשֶׁךְ קָרָא לָיְלָה", en: "God called the light Day, and the darkness he called Night.", hit: "יוֹם" },
      { ref: "Gen 1:14", he: "וְהָיוּ לְאֹתֹת וּלְמוֹעֲדִים וּלְיָמִים וְשָׁנִים", en: "Let them be for signs, for appointed times, for days and years.", hit: "וּלְיָמִים", hitEn: "days" },
      { ref: "Exod 15:1", he: "אָשִׁירָה לַיהוָה כִּי־גָאֹה גָּאָה סוּס וְרֹכְבוֹ רָמָה בַיָּם", en: "I will sing to YHWH, for he is highly exalted — horse and rider he hurled into the sea.", hit: "סוּס" },
      { ref: "Prov 6:17", he: "עֵינַיִם רָמוֹת לְשׁוֹן שָׁקֶר וְיָדַיִם שֹׁפְכוֹת דָּם־נָקִי", en: "Haughty eyes, a lying tongue, and hands that shed innocent blood.", hit: "עֵינַיִם", hitEn: "eyes" },
    ],
    quiz: [
      { q: "The usual masculine singular ending is…", choices: ["None — the stem stands bare", "ִים", "וֹת"], answer: "None — the stem stands bare", why: "Masculine singular is endingless. You see the stem itself." },
      { q: "The usual masculine plural ending is…", choices: ["ִים", "ַיִם", "וֹת"], answer: "ִים", why: "Hireq-yod-mem. Many, not a pair." },
      { q: "The usual masculine dual ending is…", choices: ["The ay diphthong plus ם", "ִים", "וֹת"], answer: "The ay diphthong plus ם", why: "Same cluster as in בַּיִת, then mem. Accent on that pathach." },
      { q: "דְּבָרִים is…", he: "דְּבָרִים", ref: "Gen 15:1", choices: ["Masculine plural", "Masculine dual", "Feminine plural"], answer: "Masculine plural", why: "ִים. Many words, not a pair of words. No ay diphthong." },
      { q: "How do you tell many from a pair on a masculine noun?", choices: ["Dual requires the ay diphthong; ִים has hireq and is many", "Count the letters after the stem", "Dual always has a dagesh"], answer: "Dual requires the ay diphthong; ִים has hireq and is many", why: "No diphthong, no dual. Train the ear and the eye on the ay-cluster from בַּיִת." },
      { q: "יוֹם is…", he: "יוֹם", ref: "Gen 1:5", choices: ["Masculine singular", "Masculine plural", "Dual"], answer: "Masculine singular", why: "Bare stem. One day." },
      { q: "יָמִים is…", he: "יָמִים", ref: "Gen 1:14", choices: ["Masculine plural", "Dual — two days", "Feminine plural"], answer: "Masculine plural", why: "ִים. The stem changed (יוֹם → יָמִים) but the ending is still masculine many." },
      { q: "סוּסִים means…", he: "סוּסִים", choices: ["Horses (many)", "Two horses", "A mare"], answer: "Horses (many)", why: "Hireq, not the ay diphthong. A pair would be סוּסַיִם." },
      { q: "In Gen 15:1, הַדְּבָרִים is…", he: "הַדְּבָרִים", ref: "Gen 15:1", choices: ["Masculine plural", "Masculine singular", "Feminine plural"], answer: "Masculine plural", why: "Article plus דְּבָרִים. The ִים is the tell." },
      { q: "What is the lexical form of דְּבָרִים?", he: "דְּבָרִים", choices: ["דָּבָר — the singular", "דְּבָרִים — leave the plural", "דבר without vowels"], answer: "דָּבָר — the singular", why: "You look nouns up in the singular. Strip the many-ending first." },
      { q: "A pair of horses would wear…", choices: ["The ay diphthong plus ם", "ִים", "וֹת"], answer: "The ay diphthong plus ם", why: "סוּסַיִם. Many horses wear ִים, with no diphthong." },
      { q: "Is יוֹם feminine because day is not a person?", he: "יוֹם", ref: "Gen 1:5", choices: ["No — it is masculine; it takes ִים in the plural", "Yes — abstracts are feminine", "It is dual"], answer: "No — it is masculine; it takes ִים in the plural", why: "Natural sense does not pick the gender. The ending-set does. יָמִים is the proof." },
      { q: "Masculine dual and masculine plural both have a yod-mem. Dual is dual only when…", choices: ["The ending holds the ay diphthong", "The word names a body part", "The mem has dagesh"], answer: "The ending holds the ay diphthong", why: "That cluster is required. Hireq-yod-mem is many." },
      { q: "How does סוּסַיִם split?", he: "סוּסַיִם", choices: ["סוּ | סַיִם", "סוּסַ | יִם", "סוּ | סַ | יִם"], answer: "סוּ | סַיִם", why: "Keep the ay diphthong in one closed slice. Do not cut it." },
      { q: "In Exod 15:1, סוּס is…", he: "סוּס", ref: "Exod 15:1", choices: ["Masculine singular", "Masculine plural", "Feminine singular"], answer: "Masculine singular", why: "Bare stem. One horse, then its rider." },
      { q: "In Prov 6:17, עֵינַיִם is dual because…", he: "עֵינַיִם", ref: "Prov 6:17", choices: ["The ending is the ay diphthong plus ם", "Every yod-mem is dual", "Eyes are always dual even as עַיִן"], answer: "The ending is the ay diphthong plus ם", why: "Same cluster as בַּיִת. That is the requirement." },
    ],
  },
  {
    id: 3,
    title: "Feminine endings",
    short: "ָה, ת, וֹת",
    rule:
      "Feminine singular nouns usually wear a mark. The most common is ָה (qamets-he), as in תּוֹרָה and מַלְכָּה. Other singular marks use ת: בַּת, תִּפְאֶרֶת, בְּרִית, מַלְכוּת. Many feminine nouns add וֹת (holem-waw-tav): תּוֹרוֹת, מְלָכוֹת. A pair still uses the same dual as the masculine: the ay diphthong plus ם, required, often on body parts — יָדַיִם, רַגְלַיִם. In תּוֹרָתַיִם the ת belongs to the stem; the diphthong plus ם is still the dual. No diphthong, no dual.",
    samples: [
      { word: "תּוֹרָה", gloss: "instruction", tag: "feminine singular · ָה", note: "Qamets-he. The everyday feminine singular mark.", ref: "Ps 19:8" },
      { word: "בַּת", gloss: "daughter", tag: "feminine singular · ַת", note: "A ת ending, not ָה. Still feminine singular.", ref: "Gen 30:21" },
      { word: "בְּרִית", gloss: "covenant", tag: "feminine singular · ִית", note: "ִית is another feminine singular mark.", ref: "Gen 9:9" },
      { word: "מַלְכוּת", gloss: "kingdom", tag: "feminine singular · וּת", note: "וּת names a state or realm. Feminine singular.", ref: "Ps 145:13" },
      { word: "יָדַיִם", gloss: "hands (a pair)", tag: "feminine dual", note: "יָד is feminine. Dual still requires the ay diphthong plus ם. Split יָ | דַיִם — do not cut the cluster.", ref: "Prov 6:17" },
    ],
    verses: [
      { ref: "Ps 19:8", he: "תּוֹרַת יְהוָה תְּמִימָה מְשִׁיבַת נָפֶשׁ", en: "The instruction of YHWH is complete, restoring the life.", hit: "תּוֹרַת", hitEn: "instruction" },
      { ref: "Gen 9:9", he: "וַאֲנִי הִנְנִי מֵקִים אֶת־בְּרִיתִי אִתְּכֶם", en: "And I — look — I am establishing my covenant with you.", hit: "בְּרִיתִי", hitEn: "covenant" },
      { ref: "Ps 145:13", he: "מַלְכוּתְךָ מַלְכוּת כָּל־עֹלָמִים וּמֶמְשֶׁלְתְּךָ בְּכָל־דּוֹר וָדוֹר", en: "Your kingdom is a kingdom of all ages, and your rule in every generation.", hit: "מַלְכוּתְךָ", hitEn: "kingdom" },
      { ref: "Prov 6:17", he: "עֵינַיִם רָמוֹת לְשׁוֹן שָׁקֶר וְיָדַיִם שֹׁפְכוֹת דָּם־נָקִי", en: "Haughty eyes, a lying tongue, and hands that shed innocent blood.", hit: "וְיָדַיִם", hitEn: "hands" },
    ],
    quiz: [
      { q: "The most common feminine singular ending is…", choices: ["ָה (qamets-he)", "ִים", "ַיִם"], answer: "ָה (qamets-he)", why: "תּוֹרָה, מַלְכָּה. Learn this first; the ת-family comes next." },
      { q: "The usual feminine plural ending is…", choices: ["וֹת", "ִים", "ָה"], answer: "וֹת", why: "Holem-waw-tav. Many on a feminine noun." },
      { q: "בַּת is feminine because of…", he: "בַּת", ref: "Gen 30:21", choices: ["The ת ending", "The pathach alone", "Natural sex only — no ending"], answer: "The ת ending", why: "Several feminine singular marks use ת: ַת, ֶת, ִית, וּת." },
      { q: "בְּרִית wears which singular mark?", he: "בְּרִית", ref: "Gen 9:9", choices: ["ִית", "ָה", "ִים"], answer: "ִית", why: "Covenant is feminine singular with ִית." },
      { q: "מַלְכוּת is…", he: "מַלְכוּת", ref: "Ps 145:13", choices: ["Feminine singular", "Feminine plural", "Masculine plural"], answer: "Feminine singular", why: "וּת is a singular mark (a realm), not the plural וֹת." },
      { q: "Do not confuse וּת with וֹת. וּת is…", choices: ["A feminine singular mark (kingdom, witness)", "The feminine plural", "The dual"], answer: "A feminine singular mark (kingdom, witness)", why: "Shureq-tav vs holem-waw-tav. Different number." },
      { q: "יָדַיִם is…", he: "יָדַיִם", ref: "Prov 6:17", choices: ["Feminine dual — a pair of hands", "Masculine plural", "Feminine plural"], answer: "Feminine dual — a pair of hands", why: "Body parts that come in twos take the ay diphthong plus ם. יָד itself is feminine." },
      { q: "תּוֹרוֹת is…", he: "תּוֹרוֹת", choices: ["Feminine plural", "Feminine singular", "Masculine plural"], answer: "Feminine plural", why: "וֹת on the תּוֹרָה stem." },
      { q: "A feminine dual uses…", choices: ["The same ay diphthong plus ם as the masculine pair", "וֹת twice", "ָה on both copies"], answer: "The same ay diphthong plus ם as the masculine pair", why: "Dual is one ending for both genders. The diphthong is required either way." },
      { q: "In Ps 145:13, מַלְכוּתְךָ starts from…", he: "מַלְכוּתְךָ", ref: "Ps 145:13", choices: ["Feminine singular מַלְכוּת plus a suffix", "Feminine plural מַלְכוֹת", "Masculine מֶלֶךְ"], answer: "Feminine singular מַלְכוּת plus a suffix", why: "וּת is still singular. The ךָ is ‘your’, not a plural mark." },
      { q: "Which is feminine plural?", choices: ["תּוֹרוֹת", "תּוֹרָה", "דְּבָרִים"], answer: "תּוֹרוֹת", why: "וֹת. תּוֹרָה is singular. דְּבָרִים is masculine many." },
      { q: "בַּת (daughter) in the plural is בָּנוֹת. The וֹת tells you…", he: "בָּנוֹת", choices: ["Feminine plural — even if the stem changed", "Masculine plural", "Dual"], answer: "Feminine plural — even if the stem changed", why: "Trust the ending you see. The stem irregularity is a later unit." },
      { q: "In Gen 9:9, בְּרִיתִי is…", he: "בְּרִיתִי", ref: "Gen 9:9", choices: ["Feminine singular plus ‘my’", "Feminine plural", "Masculine singular"], answer: "Feminine singular plus ‘my’", why: "ִית is the noun’s own mark. י at the end is the suffix." },
      { q: "Paired body parts (hands, feet, eyes, ears) usually wear…", choices: ["Dual — ay diphthong plus ם", "Feminine plural וֹת", "Masculine plural ִים"], answer: "Dual — ay diphthong plus ם", why: "Two of them. That diphthong is the required dual mark." },
      { q: "How does יָדַיִם split?", he: "יָדַיִם", ref: "Prov 6:17", choices: ["יָ | דַיִם", "יָדַ | יִם", "יָ | דַ | יִם"], answer: "יָ | דַיִם", why: "Keep the ay diphthong in the second slice. Do not cut it." },
      { q: "In תּוֹרָתַיִם, what makes it dual?", he: "תּוֹרָתַיִם", choices: ["The ay diphthong plus ם — the ת is part of the stem", "The ת alone", "The ָה of תּוֹרָה"], answer: "The ay diphthong plus ם — the ת is part of the stem", why: "Same requirement as יָדַיִם. No diphthong, no dual." },
    ],
  },
  {
    id: 4,
    title: "Exceptions you will meet",
    short: "Odd endings",
    rule:
      "A few feminine singulars have no ending at all: אֶרֶץ, עִיר, אֶבֶן. Look them up once. A few nouns take the other gender’s plural: אָב → אָבוֹת, שָׁנָה → שָׁנִים. Trust the ending you see. Three common words are dual in form but not ‘two of’: שָׁמַיִם, מִצְרַיִם, מַיִם — they still wear the ay diphthong plus ם; that is why they look dual. And וֹת is sometimes written with holem only, no waw — עֵדֹת. Same ending, shorter spelling.",
    samples: [
      { word: "אֶרֶץ", gloss: "land", tag: "feminine, no ending", note: "Endingless, yet feminine. Plural אֲרָצוֹת still wears וֹת.", ref: "Gen 1:1" },
      { word: "אָבוֹת", gloss: "fathers", tag: "masculine noun, feminine plural ending", note: "אָב is masculine. The many-form takes וֹת. Still ‘fathers’.", ref: "Exod 3:15" },
      { word: "שָׁמַיִם", gloss: "heaven", tag: "dual in form", note: "Always looks dual because it holds the ay diphthong plus ם. Usually translated as a mass, not ‘two heavens’.", ref: "Gen 1:1" },
      { word: "מַיִם", gloss: "water", tag: "dual in form", note: "Same ay diphthong plus ם as שָׁמַיִם. Dual shape, mass meaning.", ref: "Gen 1:2" },
      { word: "מִצְרַיִם", gloss: "Egypt", tag: "dual in form", note: "A place name in dual clothing. Not ‘two Egypts’.", ref: "Exod 20:2" },
    ],
    verses: [
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "הָאָרֶץ", hitEn: "the earth" },
      { ref: "Gen 1:2", he: "וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל־פְּנֵי תְהוֹם וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם", en: "The earth was waste and void, and darkness over the face of the deep, and the spirit of God hovering over the face of the water.", hit: "הַמָּיִם", hitEn: "water" },
      { ref: "Exod 20:2", he: "אָנֹכִי יְהוָה אֱלֹהֶיךָ אֲשֶׁר הוֹצֵאתִיךָ מֵאֶרֶץ מִצְרַיִם מִבֵּית עֲבָדִים", en: "I am YHWH your God, who brought you out of the land of Egypt, out of the house of slaves.", hit: "מִצְרַיִם" },
      { ref: "Exod 3:15", he: "יְהוָה אֱלֹהֵי אֲבֹתֵיכֶם אֱלֹהֵי אַבְרָהָם אֱלֹהֵי יִצְחָק וֵאלֹהֵי יַעֲקֹב", en: "YHWH, the God of your fathers, the God of Abraham, the God of Isaac, and the God of Jacob.", hit: "אֲבֹתֵיכֶם", hitEn: "fathers" },
    ],
    quiz: [
      { q: "אֶרֶץ has no feminine ending. It is still…", he: "אֶרֶץ", ref: "Gen 1:1", choices: ["Feminine — the lexicon says so, and the plural takes וֹת", "Masculine, because it is endingless", "Dual"], answer: "Feminine — the lexicon says so, and the plural takes וֹת", why: "A few feminine singulars are bare. Gender is not only the ָה you can see." },
      { q: "עִיר (city) is…", he: "עִיר", choices: ["Feminine singular with no ending", "Masculine singular", "Dual"], answer: "Feminine singular with no ending", why: "Like אֶרֶץ and אֶבֶן. Endingless, feminine." },
      { q: "אָבוֹת means fathers because…", he: "אָבוֹת", ref: "Exod 3:15", choices: ["אָב is ‘father’ and וֹת is a plural ending", "The word became feminine", "Dual of אָב"], answer: "אָב is ‘father’ and וֹת is a plural ending", why: "Wrong-gender plural is still a plural. Read the pieces you know." },
      { q: "שָׁנָה (year) often pluralizes as שָׁנִים. That ִים is…", he: "שָׁנִים", choices: ["A masculine many-ending on a feminine noun", "Proof the word is masculine", "Dual"], answer: "A masculine many-ending on a feminine noun", why: "A few nouns borrow the other set. The gloss is still ‘years’." },
      { q: "שָׁמַיִם is dual in form. Translate it as…", he: "שָׁמַיִם", ref: "Gen 1:1", choices: ["Heaven / the heavens — not ‘two heavens’", "Two skies exactly", "A feminine singular"], answer: "Heaven / the heavens — not ‘two heavens’", why: "Special dual. It still has the required ay diphthong; the sense is a mass or a realm." },
      { q: "מַיִם is…", he: "מַיִם", ref: "Gen 1:2", choices: ["Dual in form, ‘water’ in sense", "Masculine plural ‘waters’ only when there are two", "Feminine singular"], answer: "Dual in form, ‘water’ in sense", why: "Same club as שָׁמַיִם and מִצְרַיִם." },
      { q: "מִצְרַיִם is…", he: "מִצְרַיִם", ref: "Exod 20:2", choices: ["Egypt — dual in form, one land", "Two Egypts", "A feminine plural"], answer: "Egypt — dual in form, one land", why: "Place name in dual clothing." },
      { q: "The three special duals to memorize are…", choices: ["שָׁמַיִם, מַיִם, מִצְרַיִם", "יָדַיִם, רַגְלַיִם, עֵינַיִם", "סוּסַיִם, תּוֹרָתַיִם, יוֹמַיִם"], answer: "שָׁמַיִם, מַיִם, מִצְרַיִם", why: "True duals (hands, eyes) really mean two. These three usually do not." },
      { q: "עֵדֹת with holem (no waw) is…", he: "עֵדֹת", choices: ["The same feminine plural as עֵדוֹת", "A new singular ending", "A dual"], answer: "The same feminine plural as עֵדוֹת", why: "Defective spelling: the vowel is there, the vowel letter is not. Pronounced the same." },
      { q: "In Gen 1:1, הָאָרֶץ is…", he: "הָאָרֶץ", ref: "Gen 1:1", choices: ["Feminine singular plus the article", "Masculine plural", "Dual"], answer: "Feminine singular plus the article", why: "Bare feminine. The article הָ does not change gender or number." },
      { q: "If a masculine noun takes וֹת, do you change the gloss to a feminine idea?", choices: ["No — אָבוֹת is still fathers", "Yes — it becomes a feminine noun", "Only in construct"], answer: "No — אָבוֹת is still fathers", why: "Ending-set can cross. Meaning follows the stem you memorized." },
      { q: "How do you know אֶרֶץ is feminine the first time you meet it?", he: "אֶרֶץ", choices: ["The lexicon, then the plural אֲרָצוֹת", "It must be masculine because it is bare", "All lands are feminine in every language"], answer: "The lexicon, then the plural אֲרָצוֹת", why: "Endingless feminine is an exception. You store it, then the וֹת plural confirms it." },
      { q: "In Exod 3:15, אֲבֹתֵיכֶם shows which plural spelling?", he: "אֲבֹתֵיכֶם", ref: "Exod 3:15", choices: ["Defective וֹת (holem, no waw) plus a suffix", "Masculine ִים", "Dual ַיִם"], answer: "Defective וֹת (holem, no waw) plus a suffix", why: "אֲבֹת is אָבוֹת in short spelling, then ‘your’." },
      { q: "Why do שָׁמַיִם, מַיִם, and מִצְרַיִם look dual?", choices: ["They hold the ay diphthong plus ם", "They name pairs of lands", "They take ִים with hireq"], answer: "They hold the ay diphthong plus ם", why: "That diphthong is the dual’s required shape. The gloss is usually not ‘two of’." },
      { q: "True dual (hands) vs special dual (water): the difference is…", choices: ["True dual means two; special dual is just the shape", "Special dual always means two", "True dual never appears on body parts"], answer: "True dual means two; special dual is just the shape", why: "יָדַיִם = two hands. מַיִם = water. Both still have the ay diphthong." },
    ],
  },
  {
    id: 5,
    title: "How the vowels move",
    short: "Plural patterns",
    rule:
      "Most nouns change their vowels when a plural ending is added, because the accent shifts. Some do not: שִׁיר → שִׁירִים (the long vowel cannot shrink). Two-syllable words stressed on the end often reduce the first vowel to shewa: דָּבָר → דְּבָרִים. Segholates (stress on the first syllable) all share one plural shape — shewa then qamets: מֶלֶךְ → מְלָכִים. Geminates bring the lost twin back as dagesh: עַם → עַמִּים. Nouns in ֶה drop that ֶה: שָׂדֶה → שָׂדוֹת. A few stems change letters: אִישׁ → אֲנָשִׁים. Learn those as pairs.",
    samples: [
      { word: "שִׁירִים", gloss: "songs", tag: "no vowel change", note: "שִׁיר already has an unchangeable long vowel. The plural just adds ִים.", ref: "Ps 137:3" },
      { word: "דְּבָרִים", gloss: "words", tag: "propretonic reduction", note: "דָּבָר: the first qamets sits two seats back from the new accent, so it drops to shewa.", ref: "Gen 15:1" },
      { word: "מְלָכִים", gloss: "kings", tag: "segholate pattern", note: "מֶלֶךְ is stressed on the first syllable. Every segholate plural looks like this: shewa, qamets, ending.", ref: "Ps 2:2" },
      { word: "עַמִּים", gloss: "peoples", tag: "geminate — dagesh returns", note: "The old twin of עַם was ממ. Plural writes one מ with dagesh forte.", ref: "Ps 2:1" },
      { word: "אֲנָשִׁים", gloss: "men", tag: "irregular stem", note: "אִישׁ does not add ִים to the same letters. Store the pair.", ref: "Gen 6:4" },
    ],
    verses: [
      { ref: "Ps 137:3", he: "כִּי שָׁם שְׁאֵלוּנוּ שׁוֹבֵינוּ דִּבְרֵי־שִׁיר וְתוֹלָלֵינוּ שִׂמְחָה", en: "There our captors asked us for words of song, and our tormentors for joy.", hit: "שִׁיר" },
      { ref: "Ps 2:1", he: "לָמָּה רָגְשׁוּ גוֹיִם וּלְאֻמִּים יֶהְגּוּ־רִיק", en: "Why do the nations rage, and the peoples plot emptiness?", hit: "גוֹיִם", hitEn: "nations" },
      { ref: "Gen 2:24", he: "עַל־כֵּן יַעֲזָב־אִישׁ אֶת־אָבִיו וְאֶת־אִמּוֹ וְדָבַק בְּאִשְׁתּוֹ", en: "Therefore a man leaves his father and his mother and clings to his wife.", hit: "אִישׁ" },
      { ref: "Gen 4:17", he: "וַיְהִי בֹּנֶה עִיר וַיִּקְרָא שֵׁם הָעִיר כְּשֵׁם בְּנוֹ חֲנוֹךְ", en: "He was building a city, and he called the name of the city after the name of his son, Enoch.", hit: "עִיר" },
    ],
    quiz: [
      { q: "Why do vowels often change in the plural?", choices: ["The accent and the syllable map move when the ending is added", "Scribes disliked the singular vowels", "Every plural must take qamets"], answer: "The accent and the syllable map move when the ending is added", why: "New ending, new stress. Open syllables two seats back like to reduce." },
      { q: "שִׁיר → שִׁירִים shows…", he: "שִׁירִים", choices: ["No change — the long vowel cannot shrink", "Propretonic reduction", "A geminate dagesh"], answer: "No change — the long vowel cannot shrink", why: "Unchangeable long vowels (often vowel letters) stay put." },
      { q: "דָּבָר → דְּבָרִים is…", he: "דְּבָרִים", ref: "Gen 15:1", choices: ["Propretonic reduction — first qamets becomes shewa", "A segholate pattern", "Irregular stem change"], answer: "Propretonic reduction — first qamets becomes shewa", why: "Two-syllable, stress on the end. The first vowel is now two seats back and open, so it reduces." },
      { q: "A segholate is a two-syllable noun stressed on…", choices: ["The first syllable", "The last syllable", "Both equally"], answer: "The first syllable", why: "מֶלֶךְ, אֶרֶץ, סֵפֶר. The name comes from the frequent seghol vowels, but the stress is the test." },
      { q: "Every segholate plural, whatever the singular vowels, lands on…", choices: ["Shewa (or hateph) then qamets, then the ending", "Two qamets", "No vowel change"], answer: "Shewa (or hateph) then qamets, then the ending", why: "מֶלֶךְ → מְלָכִים, נֶפֶשׁ → נְפָשׁוֹת, סֵפֶר → סְפָרִים. One pattern." },
      { q: "עַם → עַמִּים writes the lost twin as…", he: "עַמִּים", choices: ["Dagesh forte in the מ", "An extra מ letter beside it", "A holem waw"], answer: "Dagesh forte in the מ", why: "Geminates once had two identical consonants. The dagesh is the twin." },
      { q: "שָׂדֶה → שָׂדוֹת: what dropped?", he: "שָׂדוֹת", choices: ["The ֶה of the singular", "The first consonant", "The plural ending"], answer: "The ֶה of the singular", why: "Masculine nouns in ֶה shed that ֶה, then take a plural ending (often וֹת)." },
      { q: "אִישׁ → אֲנָשִׁים is…", he: "אֲנָשִׁים", choices: ["An irregular stem change — memorize the pair", "Ordinary ִים on אִישׁ", "Dual"], answer: "An irregular stem change — memorize the pair", why: "Letters are added. Same family: אִשָּׁה → נָשִׁים, בַּיִת → בָּתִּים." },
      { q: "Gutturals in the first seat of a reduced plural prefer…", choices: ["A hateph, not a plain shewa", "Hireq", "No vowel"], answer: "A hateph, not a plain shewa", why: "עָנָן → עֲנָנִים. Gutturals do not take vocal shewa." },
      { q: "מֶלֶךְ → מְלָכִים. מֶלֶךְ is a…", he: "מְלָכִים", ref: "Ps 2:2", choices: ["Segholate", "Geminate", "Noun in ֶה"], answer: "Segholate", why: "Stress on the first syllable in the singular. Plural: shewa, qamets, ִים." },
      { q: "What is the lexical form of מְלָכִים?", he: "מְלָכִים", choices: ["מֶלֶךְ", "מְלָכִים", "מלך without vowels only"], answer: "מֶלֶךְ", why: "Always look up the singular. Undo the ending and the vowel pattern." },
      { q: "עִיר → עָרִים shows…", he: "עָרִים", choices: ["Irregular stem plus masculine many-ending on a feminine noun", "Ordinary feminine וֹת", "Dual of city"], answer: "Irregular stem plus masculine many-ending on a feminine noun", why: "City is feminine. Plural עָרִים borrows ִים and changes the stem. Store the pair." },
      { q: "בַּיִת → בָּתִּים keeps a dagesh in ת because…", he: "בָּתִּים", choices: ["The plural is irregular and the ת is doubled in that form", "ת always takes dagesh in the plural", "It is dual"], answer: "The plural is irregular and the ת is doubled in that form", why: "Houses: one of the pairs you memorize, not a pattern you invent." },
      { q: "If the first syllable of the singular has a vowel letter (וּ, יִ, וֹ), propretonic reduction…", choices: ["Does not happen — the long vowel stays", "Always turns it to shewa", "Turns it to dual"], answer: "Does not happen — the long vowel stays", why: "כּוֹכָב → כּוֹכָבִים. Unchangeable long vowels do not reduce." },
    ],
  },
  {
    id: 6,
    title: "Read it on the page",
    short: "Tanakh forms",
    rule:
      "On a real line you name what you see: ending first, then stem. Ask whether the ending holds the ay diphthong before you call it dual — yod-mem with hireq is many, not a pair. Strip an article or a suffix after you have the noun’s own ending. The form you look up is still the singular. Defective וֹת and full וֹת are the same ending. If the stem looks new, check the irregular pairs you already stored (אִישׁ, אִשָּׁה, בַּיִת, בַּת, עִיר, יוֹם).",
    samples: [
      { word: "הַשָּׁמַיִם", gloss: "the heavens", tag: "article + special dual", note: "Article הַ, then שָּׁמַיִם. Dual shape, ‘heaven’ in sense.", ref: "Gen 1:1" },
      { word: "בָּנוֹת", gloss: "daughters", tag: "feminine plural, irregular stem", note: "From בַּת. Ending וֹת is the tell.", ref: "Gen 5:4" },
      { word: "בָּנִים", gloss: "sons", tag: "masculine plural, irregular stem", note: "From בֵּן. Ending ִים is the tell.", ref: "Gen 5:4" },
      { word: "הֶעָרִים", gloss: "the cities", tag: "article + irregular feminine", note: "עִיר is feminine. Plural עָרִים still reads as many cities.", ref: "Gen 13:12" },
      { word: "אֲבֹתֵיכֶם", gloss: "your fathers", tag: "defective וֹת + suffix", note: "אָב → אָבוֹת, short spelling, then ‘your’.", ref: "Exod 3:15" },
    ],
    verses: [
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "הַשָּׁמַיִם", hitEn: "the heavens" },
      { ref: "Gen 5:4", he: "וַיִּהְיוּ יְמֵי־אָדָם אַחֲרֵי הוֹלִידוֹ אֶת־שֵׁת שְׁמֹנֶה מֵאֹת שָׁנָה וַיּוֹלֶד בָּנִים וּבָנוֹת", en: "The days of Adam after he fathered Seth were eight hundred years, and he fathered sons and daughters.", hit: "בָּנִים", hitEn: "sons" },
      { ref: "Gen 13:12", he: "אַבְרָם יָשַׁב בְּאֶרֶץ־כְּנָעַן וְלוֹט יָשַׁב בְּעָרֵי הַכִּכָּר", en: "Abram settled in the land of Canaan, and Lot settled in the cities of the plain.", hit: "בְּעָרֵי", hitEn: "cities" },
      { ref: "Deut 6:1", he: "וְזֹאת הַמִּצְוָה הַחֻקִּים וְהַמִּשְׁפָּטִים אֲשֶׁר צִוָּה יְהוָה אֱלֹהֵיכֶם", en: "This is the command, the statutes, and the judgments that YHWH your God commanded.", hit: "הַחֻקִּים", hitEn: "statutes" },
    ],
    quiz: [
      { q: "In Gen 1:1, הַשָּׁמַיִם is…", he: "הַשָּׁמַיִם", ref: "Gen 1:1", choices: ["Article + special dual ‘heaven’", "Masculine plural ‘names’", "Feminine plural"], answer: "Article + special dual ‘heaven’", why: "הַ plus שָׁמַיִם. Dual shape, mass sense." },
      { q: "In Gen 5:4, בָּנִים is…", he: "בָּנִים", ref: "Gen 5:4", choices: ["Sons — irregular plural of בֵּן", "Builders", "Dual of son"], answer: "Sons — irregular plural of בֵּן", why: "ִים on a changed stem. Pair: בֵּן / בָּנִים." },
      { q: "In Gen 5:4, בָּנוֹת is…", he: "בָּנוֹת", ref: "Gen 5:4", choices: ["Daughters — irregular plural of בַּת", "Buildings", "Masculine plural"], answer: "Daughters — irregular plural of בַּת", why: "וֹת is the tell. Pair: בַּת / בָּנוֹת." },
      { q: "The lexical form of בָּנוֹת is…", he: "בָּנוֹת", choices: ["בַּת", "בָּנוֹת", "בֵּן"], answer: "בַּת", why: "Singular is what the lexicon lists." },
      { q: "הַחֻקִּים in Deut 6:1 is…", he: "הַחֻקִּים", ref: "Deut 6:1", choices: ["Article + geminate plural of חֹק", "Dual of statute", "Feminine plural"], answer: "Article + geminate plural of חֹק", why: "Dagesh in ק is the lost twin. ִים is masculine many. Article הַ." },
      { q: "בְּעָרֵי in Gen 13:12 starts from…", he: "בְּעָרֵי", ref: "Gen 13:12", choices: ["עָרִים (cities) in construct, plus בְּ", "A dual of city", "עִיר singular"], answer: "עָרִים (cities) in construct, plus בְּ", why: "You still see the plural stem עָר. The ֵי is construct many, not a new gender." },
      { q: "You see וֹת. You should first say…", choices: ["Feminine plural — then check for exceptions like אָבוֹת", "Always ‘laws’", "Masculine dual"], answer: "Feminine plural — then check for exceptions like אָבוֹת", why: "Ending first. Then ask whether the stem is one of the crossing nouns." },
      { q: "You see ִים. You should first say…", choices: ["Masculine plural — then check for the ay diphthong (dual) and crossings like שָׁנִים", "Always dual", "Always feminine"], answer: "Masculine plural — then check for the ay diphthong (dual) and crossings like שָׁנִים", why: "Hireq is many. The ay-cluster is the dual requirement; then the few borrowed plurals." },
      { q: "אֲנָשִׁים on a page is…", he: "אֲנָשִׁים", choices: ["Men — look up אִישׁ", "A regular ִים on אִישׁ spelled out", "Dual of man"], answer: "Men — look up אִישׁ", why: "Irregular pair. Do not hunt a root אנשׁ in the noun list first." },
      { q: "נָשִׁים is…", he: "נָשִׁים", choices: ["Women — look up אִשָּׁה", "Men", "A dual of woman"], answer: "Women — look up אִשָּׁה", why: "The other half of that pair. Ending ִים on a changed stem." },
      { q: "A suffix on מַלְכוּתְךָ does not turn it into a plural. Number lives in…", he: "מַלְכוּתְךָ", ref: "Ps 145:13", choices: ["The noun’s own ending (וּת is singular)", "The suffix ךָ", "The article"], answer: "The noun’s own ending (וּת is singular)", why: "Strip the suffix after you have named the noun’s ending." },
      { q: "Defective עֵדֹת and full עֵדוֹת…", choices: ["Are the same feminine plural", "Are different numbers", "Are dual vs plural"], answer: "Are the same feminine plural", why: "Short spelling of וֹת. Pronunciation matches." },
      { q: "In Gen 1:1 you meet both הַשָּׁמַיִם and הָאָרֶץ. That pair is…", he: "הַשָּׁמַיִם", ref: "Gen 1:1", choices: ["Special dual + endingless feminine", "Two masculine plurals", "Two true duals meaning ‘two’"], answer: "Special dual + endingless feminine", why: "Heaven (special dual) and land (bare feminine). Both exceptions from unit 4, now on the first line of the Torah." },
      { q: "Best first move on a new noun form…", choices: ["Name the ending, then find the singular to look up", "Guess from English word order", "Ignore vowels"], answer: "Name the ending, then find the singular to look up", why: "That is the whole chapter, used on a living verse." },
      { q: "יָמִים in Gen 1:14 is…", he: "יָמִים", ref: "Gen 1:14", choices: ["Days — plural of יוֹם, not dual", "Two days exactly", "Feminine plural"], answer: "Days — plural of יוֹם, not dual", why: "Hireq, no ay diphthong. Dual of day would be יוֹמַיִם." },
      { q: "Call a form dual only when you can point to…", he: "עֵינַיִם", ref: "Prov 6:17", choices: ["The ay diphthong plus ם", "Any yod and mem at the end", "A body-part meaning"], answer: "The ay diphthong plus ם", why: "That cluster is required. Meaning helps, but the diphthong is the mark." },
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function nounUnit(id: number): NounUnit | undefined {
  return NOUN_UNITS.find((u) => u.id === id);
}

export function buildNounQuiz(unitId: number): NounQuiz[] {
  const unit = nounUnit(unitId);
  if (!unit) return [];
  const reviewCount = unitId > 1 ? NOUN_REVIEW : 0;
  const freshTake = Math.min(NOUN_QUIZ_LEN - reviewCount, unit.quiz.length);
  const fresh = shuffle(unit.quiz).slice(0, freshTake);
  const prior = NOUN_UNITS.filter((u) => u.id < unitId).flatMap((u) => u.quiz);
  const review = reviewCount ? shuffle(prior).slice(0, reviewCount).map((q) => ({ ...q, review: true })) : [];
  return shuffle([...fresh, ...review]).map((q) => ({
    ...q,
    choices: shuffle(q.choices),
  }));
}

export function starsFromNounScore(pct: number): number {
  if (pct >= 90) return 3;
  if (pct >= 70) return 2;
  return 1;
}

export function nounMatchPairs(unit: NounUnit): Array<{ id: string; he: string; label: string }> {
  return unit.samples.map((s, i) => ({
    id: `${unit.id}-${i}`,
    he: s.word,
    label: `${s.tag} · ${s.gloss}`,
  }));
}
