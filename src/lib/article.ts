import { drawRound, quizId, ROUND_LEN } from "@/lib/quiz-draw";
import { ARTICLE_QUIZ_EXTRA } from "@/lib/article-quiz-extra";

/** Original teaching notes on the Hebrew article and conjunction vav. Public-domain Masoretic examples. Not a textbook reprint. */

export type ArticleVerse = { ref: string; he: string; en: string; hit: string; hitEn?: string; why?: string };

export type ArticleSample = {
  word: string;
  gloss: string;
  tag: string;
  note: string;
  ref?: string;
};

export type ArticleQuiz = {
  q: string;
  he?: string;
  ref?: string;
  choices: string[];
  answer: string;
  why: string;
  review?: boolean;
};

export type ArticleUnit = {
  id: number;
  title: string;
  short: string;
  rule: string;
  samples: ArticleSample[];
  verses: ArticleVerse[];
  quiz: ArticleQuiz[];
};

export const ARTICLE_QUIZ_LEN = ROUND_LEN;
export const ARTICLE_REVIEW = 3;
export const ARTICLE_UNIT_MAX = 6;

export const ARTICLE_UNITS: ArticleUnit[] = [
  {
    id: 1,
    title: "Definite and indefinite",
    short: "The, a, or a name",
    rule:
      "Hebrew has no word for “a.” מֶלֶךְ is “king” or “a king.” Treat a bare noun as indefinite unless something else makes it definite. Three things do that: the article הַ, a proper name (מִצְרַיִם, יְהוָה), and a possessive suffix (your, his, our). This path trains the article. A prefixed ה is the article well over ninety-nine times in a hundred — train the eye to catch it, then name how it is spelled.",
    samples: [
      { word: "מֶלֶךְ", gloss: "king / a king", tag: "indefinite", note: "No article. Hebrew has no “a,” so the gloss can take one in English.", ref: "Ps 24:8" },
      { word: "הַמֶּלֶךְ", gloss: "the king", tag: "article", note: "הַ plus dagesh in mem. That is the everyday article.", ref: "Isa 6:1" },
      { word: "מִצְרַיִם", gloss: "Egypt", tag: "proper name", note: "Names are definite without הַ. Do not look for an article here.", ref: "Exod 20:2" },
      { word: "יְהוָה", gloss: "YHWH", tag: "proper name", note: "The divine name is definite by being a name.", ref: "Deut 6:4" },
      { word: "הָאָרֶץ", gloss: "the land / the earth", tag: "article", note: "Article is present. The vowel under he is qamets here — that spelling is a later unit.", ref: "Gen 1:1" },
    ],
    verses: [
      { ref: "Ps 24:8", he: "מִי זֶה מֶלֶךְ הַכָּבוֹד יְהוָה עִזּוּז וְגִבּוֹר", en: "Who is this king of glory? YHWH, strong and mighty.", hit: "מֶלֶךְ", hitEn: "king" },
      { ref: "Ps 24:8", he: "מִי זֶה מֶלֶךְ הַכָּבוֹד יְהוָה עִזּוּז וְגִבּוֹר", en: "Who is this king of glory? YHWH, strong and mighty.", hit: "הַכָּבוֹד", hitEn: "glory" },
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "הָאָרֶץ", hitEn: "earth" },
      { ref: "Deut 6:4", he: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", en: "Hear, Israel: YHWH our God, YHWH is one.", hit: "יִשְׂרָאֵל", hitEn: "Israel" },
    ],
    quiz: [
      { q: "Hebrew has an indefinite article like English “a / an.”", choices: ["False — there is no indefinite article", "True — it is אֶ", "True — it is הַ"], answer: "False — there is no indefinite article", why: "מֶלֶךְ is “king” or “a king.” Bare usually means indefinite." },
      { q: "מֶלֶךְ without an article is…", he: "מֶלֶךְ", ref: "Ps 24:8", choices: ["Indefinite — king / a king", "Always “the king”", "A proper name"], answer: "Indefinite — king / a king", why: "No הַ. English may add “a.”" },
      { q: "A Hebrew noun is definite when it has…", choices: ["The article, a proper name, or a possessive suffix", "Only the article הַ", "A dual ending"], answer: "The article, a proper name, or a possessive suffix", why: "Three doors into definite. This chapter drills the first." },
      { q: "הַמֶּלֶךְ is…", he: "הַמֶּלֶךְ", choices: ["The king — article plus the noun", "A king — indefinite", "Kings — plural"], answer: "The king — article plus the noun", why: "See the prefixed ה and the dagesh in mem." },
      { q: "מִצְרַיִם is definite because…", he: "מִצְרַיִם", ref: "Exod 20:2", choices: ["It is a proper name", "It has the article הַ", "Every dual is definite"], answer: "It is a proper name", why: "Names do not need הַ to be “the” place." },
      { q: "In Ps 24:8, הַכָּבוֹד is…", he: "הַכָּבוֹד", ref: "Ps 24:8", choices: ["Definite — “the glory”", "Indefinite", "A verb"], answer: "Definite — “the glory”", why: "Article הַ plus dagesh in kaf." },
      { q: "In Ps 24:8, מֶלֶךְ is…", he: "מֶלֶךְ", ref: "Ps 24:8", choices: ["Indefinite — “king / a king”", "“The king” with a hidden article", "A proper name"], answer: "Indefinite — “king / a king”", why: "Same verse, two nouns: one bare, one with הַ." },
      { q: "יְהוָה takes no article because…", he: "יְהוָה", ref: "Deut 6:4", choices: ["It is a proper name", "Gutturals reject הַ", "It is already plural"], answer: "It is a proper name", why: "Names are definite by themselves." },
      { q: "When you see a prefixed ה on a noun, first say…", choices: ["Article — then check how the vowel and dagesh are spelled", "Always the conjunction", "Always a question word"], answer: "Article — then check how the vowel and dagesh are spelled", why: "The consonant of the article does not change. The vowel might." },
      { q: "הָאָרֶץ in Gen 1:1 is…", he: "הָאָרֶץ", ref: "Gen 1:1", choices: ["Definite — “the earth / the land”", "Indefinite “a land”", "A name with no article"], answer: "Definite — “the earth / the land”", why: "The ה is the article. Qamets under it is a later spelling unit." },
      { q: "Which is indefinite?", choices: ["מֶלֶךְ", "הַמֶּלֶךְ", "מִצְרַיִם"], answer: "מֶלֶךְ", why: "Bare common noun. The other two are definite." },
      { q: "Which is definite without הַ?", choices: ["יִשְׂרָאֵל", "מֶלֶךְ", "סוּס"], answer: "יִשְׂרָאֵל", why: "Proper name. Israel does not need the article to be “the” people." },
      { q: "A suffix like “your” on a noun makes it…", choices: ["Definite", "Indefinite", "Dual"], answer: "Definite", why: "“Your horse” is as definite as “the horse.” Suffixes come in a later chapter; just know the fact." },
      { q: "The lexical form of הַמֶּלֶךְ is…", he: "הַמֶּלֶךְ", choices: ["מֶלֶךְ — strip the article", "הַמֶּלֶךְ — leave the article", "מְלָכִים"], answer: "מֶלֶךְ — strip the article", why: "Look nouns up without the article." },
      { q: "English “the” is the usual gloss of…", he: "הַ", choices: ["The prefixed article הַ", "The conjunction וְ", "The dual ending"], answer: "The prefixed article הַ", why: "Chapter 5 vocabulary: הַ “the.”" },
      { q: "If a noun has neither article nor name nor suffix, read it as…", choices: ["Indefinite, unless the context clearly names a known thing", "Always “the”", "Always a verb"], answer: "Indefinite, unless the context clearly names a known thing", why: "Default: no הַ, no “the.” Context can still point to a known item." },
    ],
  },
  {
    id: 2,
    title: "The everyday article",
    short: "הַ plus dagesh",
    rule:
      "The ordinary article is הַ plus dagesh forte in the first consonant of the noun: הַמֶּלֶךְ, הַיָּם, הַמָּקוֹם. That dagesh is the doubled first letter. Begadkephat letters that already wore dagesh lene now wear dagesh forte — the mark looks the same, the job is new. הַבַּיִת, הַדֶּרֶךְ, הַתּוֹרָה. If the first letter can take dagesh and it has one after הַ, you are looking at the regular article.",
    samples: [
      { word: "הַמֶּלֶךְ", gloss: "the king", tag: "הַ + dagesh", note: "Pathach under he. Dagesh forte in mem.", ref: "Isa 6:1" },
      { word: "הַיָּם", gloss: "the sea", tag: "הַ + dagesh", note: "Yod takes the dagesh. Citation lemma is still יָם.", ref: "Exod 14:21" },
      { word: "הַמִּזְבֵּחַ", gloss: "the altar", tag: "הַ + dagesh", note: "Dagesh in mem. The noun’s own dagesh in bet is separate.", ref: "Lev 1:7" },
      { word: "הַבַּיִת", gloss: "the house", tag: "begadkephat", note: "Bet already had dagesh lene as בַּיִת. With the article that dagesh is forte." },
      { word: "הַתּוֹרָה", gloss: "the instruction", tag: "begadkephat", note: "Tav takes the article’s dagesh.", ref: "Josh 1:8" },
      { word: "הַשַּׁעַר", gloss: "the gate", tag: "הַ + dagesh", note: "Shin takes dagesh after הַ.", ref: "Ruth 4:1" },
    ],
    verses: [
      { ref: "Ps 24:8", he: "מִי זֶה מֶלֶךְ הַכָּבוֹד יְהוָה עִזּוּז וְגִבּוֹר", en: "Who is this king of glory? YHWH, strong and mighty.", hit: "הַכָּבוֹד", hitEn: "glory" },
      { ref: "Exod 14:21", he: "וַיֵּט מֹשֶׁה אֶת יָדוֹ עַל הַיָּם", en: "Moses stretched out his hand over the sea.", hit: "הַיָּם", hitEn: "sea" },
      { ref: "Lev 1:7", he: "וְנָתְנוּ בְּנֵי אַהֲרֹן הַכֹּהֵן אֵשׁ עַל הַמִּזְבֵּחַ", en: "The sons of Aaron the priest shall put fire on the altar.", hit: "הַמִּזְבֵּחַ", hitEn: "altar" },
      { ref: "Ruth 4:1", he: "וּבֹעַז עָלָה הַשַּׁעַר וַיֵּשֶׁב שָׁם", en: "Boaz went up to the gate and sat down there.", hit: "הַשַּׁעַר", hitEn: "gate" },
      { ref: "Josh 1:8", he: "לֹא יָמוּשׁ סֵפֶר הַתּוֹרָה הַזֶּה מִפִּיךָ", en: "This book of the instruction shall not depart from your mouth.", hit: "הַתּוֹרָה", hitEn: "instruction" },
    ],
    quiz: [
      { q: "The ordinary article is…", choices: ["הַ plus dagesh forte in the first letter of the noun", "הָ plus no dagesh always", "וְ plus shewa"], answer: "הַ plus dagesh forte in the first letter of the noun", why: "Pathach under he, doubling on the next consonant." },
      { q: "In הַמֶּלֶךְ the dagesh in mem is…", he: "הַמֶּלֶךְ", choices: ["Dagesh forte from the article", "Dagesh lene only", "A shin-dot"], answer: "Dagesh forte from the article", why: "The article’s doubling sits in the first letter." },
      { q: "הַיָּם is…", he: "הַיָּם", ref: "Exod 14:21", choices: ["Article + יָם (the sea)", "A new lemma hayam", "Indefinite “a sea”"], answer: "Article + יָם (the sea)", why: "Strip הַ and the dagesh. Lexicon: יָם." },
      { q: "When the article is added to בַּיִת, the dagesh in bet…", he: "הַבַּיִת", choices: ["Is now dagesh forte (it was lene on the bare noun)", "Disappears", "Moves to the he"], answer: "Is now dagesh forte (it was lene on the bare noun)", why: "Same mark, new job. Begadkephat with the article." },
      { q: "הַתּוֹרָה shows the article on a begadkephat letter because…", he: "הַתּוֹרָה", ref: "Josh 1:8", choices: ["Tav has dagesh after הַ", "He has qamets", "There is no dagesh"], answer: "Tav has dagesh after הַ", why: "Regular article. Pathach + dagesh." },
      { q: "הַכָּבוֹד in Ps 24:8 is…", he: "הַכָּבוֹד", ref: "Ps 24:8", choices: ["The glory — הַ + dagesh in kaf", "A glory — no article", "Kings"], answer: "The glory — הַ + dagesh in kaf", why: "Kaf is begadkephat. The dagesh here is forte from the article." },
      { q: "The vowel of the ordinary article is…", choices: ["Pathach (הַ)", "Qamets (הָ)", "Seghol (הֶ)"], answer: "Pathach (הַ)", why: "Qamets and seghol are the guttural spellings, next unit." },
      { q: "הַמִּזְבֵּחַ is…", he: "הַמִּזְבֵּחַ", ref: "Lev 1:7", choices: ["The altar — article on מִזְבֵּחַ", "An altar", "Altars"], answer: "The altar — article on מִזְבֵּחַ", why: "Dagesh in mem. Look it up as מִזְבֵּחַ." },
      { q: "הַשַּׁעַר is…", he: "הַשַּׁעַר", ref: "Ruth 4:1", choices: ["The gate — הַ + dagesh in shin", "Heaven", "A verb"], answer: "The gate — הַ + dagesh in shin", why: "Regular article on שַׁעַר." },
      { q: "הַזָּהָב means…", he: "הַזָּהָב", ref: "Gen 41:42", choices: ["The gold", "Gold (indefinite)", "Silver"], answer: "The gold", why: "Article plus זָהָב. Dagesh in zayin." },
      { q: "If the first letter can take dagesh and you see הַ + that dagesh, you have…", choices: ["The regular article", "Compensatory lengthening", "The conjunction"], answer: "The regular article", why: "That is the default picture. Gutturals break it next." },
      { q: "The lexical form of הַיָּם is…", he: "הַיָּם", choices: ["יָם", "הַיָּם", "יַמִּים"], answer: "יָם", why: "Citation lemma, no article. Class vocab is יָם, not בַּיָּם or הַיָּם." },
      { q: "הַדֶּרֶךְ (the road) keeps a dagesh in dalet because…", he: "הַדֶּרֶךְ", choices: ["Dalet is begadkephat and takes the article’s forte", "Dalet is a guttural", "The article is הֶ"], answer: "Dalet is begadkephat and takes the article’s forte", why: "Regular article. Pathach stays." },
      { q: "Which form is the regular article?", choices: ["הַיָּם", "הָעִיר", "הֶעָנָן"], answer: "הַיָּם", why: "Pathach + dagesh. The others are guttural spellings." },
      { q: "In הַמֶּלֶךְ you should still look up…", he: "הַמֶּלֶךְ", choices: ["מֶלֶךְ", "הַמֶּלֶךְ", "מְלָכִים"], answer: "מֶלֶךְ", why: "Strip the prefix. Lexical form is the indefinite singular." },
      { q: "Does the regular article change the consonants of the noun?", choices: ["No — it prefixes הַ and doubles the first letter", "Yes — the first letter is replaced", "Yes — a vav is added"], answer: "No — it prefixes הַ and doubles the first letter", why: "The noun is still there. Read past the prefix." },
    ],
  },
  {
    id: 3,
    title: "Gutturals refuse the dagesh",
    short: "הָ, הַ, הֶ",
    rule:
      "All gutturals — א ה ח ע — and also ר cannot take dagesh, lene or forte. The article still wants to double the first letter. When that doubling is refused, the article is spelled in three ways. With א, ע, or ר the pathach lengthens to qamets: הָאִישׁ, הָעִיר, הָרֹאשׁ. That is compensatory lengthening. With ה or ח the pathach usually stays: הַהֵיכָל, הַחֶרֶב. That is virtual doubling — the dagesh is missing, the vowel does not lengthen. Before unaccented הָ, חָ, or עָ (and sometimes accented חָ) the article is הֶ with no dagesh: הֶחָכָם, הֶעָנָן, הֶהָרִים. Name the first letter, then name the vowel under he.",
    samples: [
      { word: "הָאִישׁ", gloss: "the man", tag: "compensatory · א", note: "Alef refuses dagesh. Pathach → qamets. הָ." },
      { word: "הָעִיר", gloss: "the city", tag: "compensatory · ע", note: "Ayin refuses dagesh. הָ." },
      { word: "הָרֹאשׁ", gloss: "the head", tag: "compensatory · ר", note: "Resh refuses dagesh like a guttural. הָ." },
      { word: "הַהֵיכָל", gloss: "the temple", tag: "virtual · ה", note: "He refuses dagesh but pathach stays. הַ.", ref: "Isa 6:1" },
      { word: "הַחֶרֶב", gloss: "the sword", tag: "virtual · ח", note: "Het refuses dagesh; pathach stays. הַחֶרֶב, not הָחֶרֶב.", ref: "Gen 3:24" },
      { word: "הֶעָנָן", gloss: "the cloud", tag: "seghol · עָ", note: "Unaccented עָ after the article. הֶ, no dagesh.", ref: "Exod 13:22" },
      { word: "הֶחָכָם", gloss: "the wise one", tag: "seghol · חָ", note: "Article הֶ before חָ.", ref: "Eccl 2:14" },
    ],
    verses: [
      { ref: "Gen 2:7", he: "וַיִּיצֶר יְהוָה אֱלֹהִים אֶת הָאָדָם עָפָר מִן הָאֲדָמָה", en: "YHWH God formed the man from the dust of the ground.", hit: "הָאָדָם", hitEn: "man" },
      { ref: "Gen 22:6", he: "וַיִּקַּח בְּיָדוֹ אֶת הָאֵשׁ וְאֶת הַמַּאֲכֶלֶת", en: "He took in his hand the fire and the knife.", hit: "הָאֵשׁ", hitEn: "fire" },
      { ref: "Isa 6:1", he: "וָאֶרְאֶה אֶת אֲדֹנָי יֹשֵׁב עַל כִּסֵּא רָם וְנִשָּׂא וְשׁוּלָיו מְלֵאִים אֶת הַהֵיכָל", en: "I saw the Lord sitting on a throne, high and lifted up; and his train filled the temple.", hit: "הַהֵיכָל", hitEn: "temple" },
      { ref: "Gen 3:24", he: "וַיַּשְׁכֵּן מִקֶּדֶם לְגַן עֵדֶן אֶת הַכְּרֻבִים וְאֵת לַהַט הַחֶרֶב הַמִּתְהַפֶּכֶת", en: "He placed cherubim at the east of the garden of Eden, and the flame of the sword that turned.", hit: "הַחֶרֶב", hitEn: "sword" },
      { ref: "Exod 13:22", he: "לֹא יָמִישׁ עַמּוּד הֶעָנָן יוֹמָם וְעַמּוּד הָאֵשׁ לָיְלָה לִפְנֵי הָעָם", en: "The pillar of cloud by day and the pillar of fire by night did not depart from before the people.", hit: "הֶעָנָן", hitEn: "cloud" },
      { ref: "Eccl 2:14", he: "הֶחָכָם עֵינָיו בְּרֹאשׁוֹ וְהַכְּסִיל בַּחֹשֶׁךְ הוֹלֵךְ", en: "The wise man’s eyes are in his head, and the fool walks in darkness.", hit: "הֶחָכָם", hitEn: "wise" },
    ],
    quiz: [
      { q: "Gutturals and resh cannot take…", choices: ["Dagesh — lene or forte", "Any vowel", "The article at all"], answer: "Dagesh — lene or forte", why: "א ה ח ע and ר refuse the article’s doubling." },
      { q: "Compensatory lengthening on the article means…", choices: ["Pathach of הַ becomes qamets: הָ", "The noun loses a letter", "Seghol is added under the noun"], answer: "Pathach of הַ becomes qamets: הָ", why: "The vowel grows because the dagesh was refused." },
      { q: "Compensatory lengthening happens when the noun begins with…", choices: ["א, ע, or ר", "ה or ח", "ב, מ, or פ"], answer: "א, ע, or ר", why: "Those three refuse dagesh and the article vowel lengthens." },
      { q: "הָאִישׁ is…", he: "הָאִישׁ", choices: ["Article with compensatory qamets (alef)", "Regular הַ + dagesh", "Seghol article"], answer: "Article with compensatory qamets (alef)", why: "Alef cannot take dagesh. הָ." },
      { q: "הָאֵשׁ is…", he: "הָאֵשׁ", ref: "Gen 22:6", choices: ["The fire — compensatory הָ on אֵשׁ", "Indefinite fire", "The woman"], answer: "The fire — compensatory הָ on אֵשׁ", why: "Alef. Pathach has become qamets." },
      { q: "Virtual doubling means…", choices: ["Dagesh is refused but the pathach stays: הַ", "The article is missing", "The noun is dual"], answer: "Dagesh is refused but the pathach stays: הַ", why: "He and het usually do this." },
      { q: "הַהֵיכָל is virtual doubling because…", he: "הַהֵיכָל", ref: "Isa 6:1", choices: ["The noun begins with ה; pathach stays, no dagesh", "Alef caused qamets", "It is the conjunction"], answer: "The noun begins with ה; pathach stays, no dagesh", why: "הַ not הָ. Temple." },
      { q: "הַחֶרֶב is…", he: "הַחֶרֶב", ref: "Gen 3:24", choices: ["Virtual doubling — הַ before het", "Compensatory הָ", "No article"], answer: "Virtual doubling — הַ before het", why: "Pathach, not qamets. Het refuses dagesh." },
      { q: "The irregular seghol article הֶ appears before…", choices: ["Unaccented הָ, חָ, or עָ", "Any guttural", "Labials ב מ פ"], answer: "Unaccented הָ, חָ, or עָ", why: "הֶחָכָם, הֶעָנָן, הֶהָרִים. Het with qamets may be accented and still take הֶ." },
      { q: "הֶעָנָן is…", he: "הֶעָנָן", ref: "Exod 13:22", choices: ["The cloud — seghol article before עָ", "Regular הַ + dagesh", "Compensatory הָ"], answer: "The cloud — seghol article before עָ", why: "Look at the vowel under he: seghol." },
      { q: "הֶחָכָם is…", he: "הֶחָכָם", ref: "Eccl 2:14", choices: ["The wise one — הֶ before חָ", "Virtual doubling הַ", "Indefinite"], answer: "The wise one — הֶ before חָ", why: "Seghol, no dagesh." },
      { q: "הָאָדָם in Gen 2:7 is…", he: "הָאָדָם", ref: "Gen 2:7", choices: ["The man — compensatory on alef", "Virtual doubling", "No article"], answer: "The man — compensatory on alef", why: "הָ + אָדָם." },
      { q: "How do you tell compensatory from virtual doubling?", choices: ["Compensatory has הָ (qamets); virtual keeps הַ (pathach)", "Virtual always has dagesh", "They are spelled the same"], answer: "Compensatory has הָ (qamets); virtual keeps הַ (pathach)", why: "Name the vowel under he." },
      { q: "הָעִיר begins with ayin, so the article is…", he: "הָעִיר", choices: ["הָ — compensatory", "הַ — virtual", "הֶ — seghol"], answer: "הָ — compensatory", why: "Ayin is in the א ע ר set." },
      { q: "Resh with the article behaves like…", he: "הָרֹאשׁ", choices: ["Alef and ayin — compensatory הָ", "He and het — virtual הַ", "A begadkephat with dagesh"], answer: "Alef and ayin — compensatory הָ", why: "Resh refuses dagesh. הָרֹאשׁ." },
      { q: "Which is virtual doubling?", choices: ["הַחֶרֶב", "הָאִישׁ", "הֶעָנָן"], answer: "הַחֶרֶב", why: "Pathach, het, no dagesh. Not qamets, not seghol." },
    ],
  },
  {
    id: 4,
    title: "Dagesh drops, vowels move",
    short: "יְ, מְ, and a few nouns",
    rule:
      "A few first letters give up the article’s dagesh even though they could take it. When יְ or מְ start the noun, you often see הַיְלָדִים, הַמְרַגְּלִים — pathach stays, dagesh is gone. That loss is the sqnmlwy family: s-type letters plus q, n, m, l, w, y, when they would have dagesh forte and a vocal shewa. A small set of nouns also change their own first vowel when the article is added: אֶרֶץ → הָאָרֶץ, עַם → הָעָם, גַּן → הַגָּן, הַר → הָהָר. Learn the pair. Still look them up in the indefinite singular.",
    samples: [
      { word: "הַיְלָדִים", gloss: "the boys", tag: "dagesh dropped · יְ", note: "Yod + vocal shewa. Article הַ, no dagesh in yod.", ref: "1 Kgs 12:8" },
      { word: "הַמְרַגְּלִים", gloss: "the spies", tag: "dagesh dropped · מְ", note: "Mem + vocal shewa. Pathach stays.", ref: "Josh 6:22" },
      { word: "הָאָרֶץ", gloss: "the land", tag: "noun vowel moves", note: "אֶרֶץ → הָאָרֶץ. Compensatory הָ and the first vowel of the noun becomes qamets.", ref: "Gen 1:1" },
      { word: "הָעָם", gloss: "the people", tag: "noun vowel moves", note: "עַם → הָעָם. Ayin: compensatory, and pathach of the noun lengthens.", ref: "Exod 13:22" },
      { word: "הַגָּן", gloss: "the garden", tag: "noun vowel moves", note: "גַּן → הַגָּן. Gimel can take dagesh, so the article is regular הַ; the noun’s own pathach becomes qamets.", ref: "Gen 2:10" },
      { word: "הָהָר", gloss: "the mountain", tag: "noun vowel moves", note: "הַר → הָהָר. Learn the pair. Plural often הֶהָרִים (seghol article before unaccented הָ).", ref: "Exod 19:16" },
    ],
    verses: [
      { ref: "1 Kgs 12:8", he: "וַיַּעֲזֹב אֶת עֲצַת הַזְּקֵנִים וַיִּוָּעַץ אֶת הַיְלָדִים אֲשֶׁר גָּדְלוּ אִתּוֹ", en: "He abandoned the counsel of the elders and took counsel with the young men who had grown up with him.", hit: "הַיְלָדִים", hitEn: "young men" },
      { ref: "Josh 6:22", he: "וְלִשְׁנַיִם הָאֲנָשִׁים הַמְרַגְּלִים אֶת הָאָרֶץ אָמַר יְהוֹשֻׁעַ", en: "Joshua said to the two men who had spied out the land…", hit: "הַמְרַגְּלִים", hitEn: "spied" },
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "הָאָרֶץ", hitEn: "earth" },
      { ref: "Gen 2:10", he: "וְנָהָר יֹצֵא מֵעֵדֶן לְהַשְׁקוֹת אֶת הַגָּן", en: "A river went out of Eden to water the garden.", hit: "הַגָּן", hitEn: "garden" },
      { ref: "Exod 19:16", he: "וַיְהִי קֹלֹת וּבְרָקִים וְעָנָן כָּבֵד עַל הָהָר", en: "There were thunders and lightnings and a thick cloud on the mountain.", hit: "הָהָר", hitEn: "mountain" },
      { ref: "Deut 12:2", he: "אַבֵּד תְּאַבְּדוּן אֶת כָּל הַמְּקֹמוֹת אֲשֶׁר עָבְדוּ שָׁם הַגּוֹיִם עַל הֶהָרִים הָרָמִים", en: "You shall destroy all the places where the nations served their gods, on the high mountains.", hit: "הֶהָרִים", hitEn: "mountains" },
    ],
    quiz: [
      { q: "הַיְלָדִים has no dagesh in yod because…", he: "הַיְלָדִים", ref: "1 Kgs 12:8", choices: ["Yod with vocal shewa often drops the article’s dagesh", "Yod is a guttural", "The article is missing"], answer: "Yod with vocal shewa often drops the article’s dagesh", why: "הַיְ not הַיּ. Pathach stays." },
      { q: "הַמְרַגְּלִים is…", he: "הַמְרַגְּלִים", ref: "Josh 6:22", choices: ["The spies — הַ, dagesh dropped under מְ", "Compensatory הָ", "Indefinite"], answer: "The spies — הַ, dagesh dropped under מְ", why: "Mem + vocal shewa. Same family as הַיְלָדִים." },
      { q: "The sqnmlwy loss of dagesh happens when…", choices: ["A letter in that set would have dagesh forte plus vocal shewa", "Any noun begins with mem", "The noun is feminine"], answer: "A letter in that set would have dagesh forte plus vocal shewa", why: "s-type letters plus q n m l w y. Not every mem." },
      { q: "אֶרֶץ with the article is…", he: "הָאָרֶץ", ref: "Gen 1:1", choices: ["הָאָרֶץ — first vowel of the noun also moves to qamets", "הַאֶרֶץ with dagesh", "הֶאֶרֶץ"], answer: "הָאָרֶץ — first vowel of the noun also moves to qamets", why: "Learn the pair. Alef: compensatory, and אֶ → אָ." },
      { q: "עַם with the article is…", he: "הָעָם", choices: ["הָעָם", "הַעַם", "הֶעַם"], answer: "הָעָם", why: "Ayin compensatory, and the noun’s pathach lengthens." },
      { q: "גַּן with the article is…", he: "הַגָּן", ref: "Gen 2:10", choices: ["הַגָּן — regular הַ + dagesh, noun vowel → qamets", "הָגַן", "הֶגַן"], answer: "הַגָּן — regular הַ + dagesh, noun vowel → qamets", why: "Gimel can take dagesh. The change is in the noun, not the article vowel." },
      { q: "הַר with the article (singular) is…", he: "הָהָר", ref: "Exod 19:16", choices: ["הָהָר", "הַהַר", "הֶהַר"], answer: "הָהָר", why: "Learn the pair. Mountain, definite." },
      { q: "הֶהָרִים (the mountains) uses seghol because…", he: "הֶהָרִים", ref: "Deut 12:2", choices: ["The article sits before unaccented הָ", "Mountains are dual", "Gimel refused dagesh"], answer: "The article sits before unaccented הָ", why: "Same seghol rule as הֶעָנָן. Singular was הָהָר." },
      { q: "Lexical form of הָאָרֶץ is…", he: "הָאָרֶץ", choices: ["אֶרֶץ", "אָרֶץ", "הָאָרֶץ"], answer: "אֶרֶץ", why: "Indefinite singular in the lexicon, even though the vowels moved." },
      { q: "Lexical form of הַיְלָדִים is…", he: "הַיְלָדִים", choices: ["יֶלֶד", "יְלָדִים", "הַיֶּלֶד"], answer: "יֶלֶד", why: "Strip article and plural. Class vocab: יֶלֶד." },
      { q: "In Gen 1:1 הָאָרֶץ you should see…", he: "הָאָרֶץ", ref: "Gen 1:1", choices: ["Article (compensatory) plus a noun that changed its first vowel", "No article — a name", "Virtual doubling on gimel"], answer: "Article (compensatory) plus a noun that changed its first vowel", why: "Two facts, one word." },
      { q: "Does every yod drop the article’s dagesh?", choices: ["No — mainly yod with vocal shewa (יְ)", "Yes, always", "Only in the dual"], answer: "No — mainly yod with vocal shewa (יְ)", why: "הַיָּם keeps dagesh. הַיְלָדִים drops it." },
      { q: "הַיָּם vs הַיְלָדִים. What is different?", choices: ["הַיָּם has dagesh in yod; הַיְלָדִים has vocal shewa and no dagesh", "Only the gloss", "One is a verb"], answer: "הַיָּם has dagesh in yod; הַיְלָדִים has vocal shewa and no dagesh", why: "Same prefix letter, two spellings. Name the vowel on yod." },
      { q: "These vowel-changing nouns are few. When you meet הָעָם you…", he: "הָעָם", choices: ["Recognize the pair עַם / הָעָם and look up עַם", "Hunt a new root עָם", "Call it indefinite"], answer: "Recognize the pair עַם / הָעָם and look up עַם", why: "Do not invent a new lemma." },
      { q: "Which keeps regular הַ + dagesh and still changes the noun vowel?", choices: ["הַגָּן", "הָאָרֶץ", "הָעָם"], answer: "הַגָּן", why: "Gimel takes dagesh. Alef and ayin also force compensatory הָ." },
      { q: "Pathach under the article, no dagesh, yod with shewa: you are looking at…", he: "הַיְלָדִים", choices: ["The dropped-dagesh spelling, not a missing article", "Compensatory lengthening", "The conjunction וְ"], answer: "The dropped-dagesh spelling, not a missing article", why: "Still הַ. Still “the.”" },
    ],
  },
  {
    id: 5,
    title: "Conjunction וְ",
    short: "And, but, also — always prefixed",
    rule:
      "וְ is the most common word in the Tanakh. It is always prefixed, never free-standing. Default spelling: shewa, וְאִישׁ. Before the labials ב מ פ (the “bump” letters) it is shureq: וּמֶלֶךְ, וּבַיִת, וּפַרְעֹה. An initial begadkephat then loses dagesh lene (וּבַיִת, not וּבּ). Before a vocal shewa it is also shureq: וּנְעָרִים. Exception: יְ + וְ contracts to וִי (וִיהוּדָה). Before a hateph, write the matching short vowel: וַאֲנָשִׁים, וֶאֱמֶת, וָחֳלִי. Special: אֱלֹהִים with the conjunction is וֵאלֹהִים. Before many monosyllables and initially-accented words you will see qamets: וָלֶחֶם, וָבֹהוּ, וָצֹאן. An initial ו is the conjunction well over ninety-nine times in a hundred, whatever the vowel.",
    samples: [
      { word: "וְאִישׁ", gloss: "and a man", tag: "default וְ", note: "Shewa. This is the lexical spelling." },
      { word: "וּמֶלֶךְ", gloss: "and a king", tag: "bump · מ", note: "Labial mem. Shureq וּ.", ref: "2 Kgs 3:9" },
      { word: "וּבֵיתוֹ", gloss: "and his house", tag: "bump · ב", note: "Bet is a labial. Dagesh lene drops: וּב, not וּבּ.", ref: "Exod 1:1" },
      { word: "וִיהוּדָה", gloss: "and Judah", tag: "יְ contracts", note: "יְ + וְ → וִי.", ref: "1 Sam 18:16" },
      { word: "וֶאֱמֶת", gloss: "and truth", tag: "hateph match", note: "Hateph seghol on alef → seghol on vav.", ref: "Exod 34:6" },
      { word: "וֵאלֹהִים", gloss: "and God", tag: "special", note: "Not וֶאֱלֹהִים. Tsere, and the hateph on alef is gone.", ref: "Gen 50:24" },
      { word: "וָלֶחֶם", gloss: "and bread", tag: "qamets · accent", note: "Monosyllabic / initially accented often take וָ.", ref: "Gen 45:23" },
    ],
    verses: [
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "וְאֵת", hitEn: "and" },
      { ref: "Gen 24:35", he: "וַיִּתֶּן לוֹ צֹאן וּבָקָר וְכֶסֶף וְזָהָב", en: "He has given him flocks and herds, silver and gold.", hit: "וּבָקָר", hitEn: "herds" },
      { ref: "2 Kgs 3:9", he: "וַיֵּלֶךְ מֶלֶךְ יִשְׂרָאֵל וּמֶלֶךְ יְהוּדָה וּמֶלֶךְ אֱדוֹם", en: "The king of Israel went, and the king of Judah, and the king of Edom.", hit: "וּמֶלֶךְ", hitEn: "king" },
      { ref: "Exod 1:1", he: "וְאֵלֶּה שְׁמוֹת בְּנֵי יִשְׂרָאֵל הַבָּאִים מִצְרָיְמָה אֵת יַעֲקֹב אִישׁ וּבֵיתוֹ בָּאוּ", en: "These are the names of the sons of Israel who came to Egypt: each man and his house came.", hit: "וּבֵיתוֹ", hitEn: "house" },
      { ref: "1 Sam 18:16", he: "וְכָל יִשְׂרָאֵל וִיהוּדָה אֹהֵב אֶת דָּוִד", en: "All Israel and Judah loved David.", hit: "וִיהוּדָה", hitEn: "Judah" },
      { ref: "Exod 34:6", he: "יְהוָה יְהוָה אֵל רַחוּם וְחַנּוּן אֶרֶךְ אַפַּיִם וְרַב חֶסֶד וֶאֱמֶת", en: "YHWH, YHWH, a God merciful and gracious, slow to anger, and abundant in steadfast love and truth.", hit: "וֶאֱמֶת", hitEn: "truth" },
      { ref: "Gen 50:24", he: "אָנֹכִי מֵת וֵאלֹהִים פָּקֹד יִפְקֹד אֶתְכֶם", en: "I am dying, but God will surely visit you.", hit: "וֵאלֹהִים", hitEn: "God" },
      { ref: "Gen 1:2", he: "וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ", en: "The earth was formless and void.", hit: "וָבֹהוּ", hitEn: "void" },
    ],
    quiz: [
      { q: "The conjunction וְ is…", choices: ["Always prefixed to the next word", "A free-standing word like English “and”", "Only used on verbs"], answer: "Always prefixed to the next word", why: "You will not find a lone וְ." },
      { q: "The default spelling is…", choices: ["וְ (shewa)", "וּ (shureq)", "וָ (qamets)"], answer: "וְ (shewa)", why: "About half the time. וְאִישׁ, וְאֵת." },
      { q: "The “bump” letters that take וּ are…", choices: ["ב, מ, פ", "א, ע, ר", "ה, ח"], answer: "ב, מ, פ", why: "Labials. Bump = bet, mem, pe." },
      { q: "וּמֶלֶךְ uses shureq because…", he: "וּמֶלֶךְ", ref: "2 Kgs 3:9", choices: ["Mem is a bump letter", "Mem is a guttural", "It is a dual"], answer: "Mem is a bump letter", why: "מֶלֶךְ + וְ → וּמֶלֶךְ." },
      { q: "In וּבֵיתוֹ the bet has no dagesh lene because…", he: "וּבֵיתוֹ", ref: "Exod 1:1", choices: ["A prefix sits before it, so begadkephat loses lene", "Bet never takes dagesh", "It is dagesh forte instead"], answer: "A prefix sits before it, so begadkephat loses lene", why: "בַּיִת vs וּבַיִת. The bump shureq is the prefix." },
      { q: "Before a vocal shewa the conjunction is usually…", choices: ["וּ (shureq)", "וְ (shewa — two shewas in a row)", "וֶ"], answer: "וּ (shureq)", why: "Hebrew will not stack two vocal shewas. וּנְעָרִים." },
      { q: "יְ + וְ becomes…", he: "וִיהוּדָה", ref: "1 Sam 18:16", choices: ["וִי (hireq-yod), as in וִיהוּדָה", "וּיְ", "וְיְ"], answer: "וִי (hireq-yod), as in וִיהוּדָה", why: "The two shewas contract. Judah." },
      { q: "Before a hateph vowel, vav takes…", choices: ["The matching short vowel (וַ וֶ וָ)", "Always shewa", "Always shureq"], answer: "The matching short vowel (וַ וֶ וָ)", why: "חֲ → וַחֲ, אֱ → וֶאֱ, חֳ → וָחֳ." },
      { q: "וֶאֱמֶת is…", he: "וֶאֱמֶת", ref: "Exod 34:6", choices: ["And truth — vav matches hateph seghol", "Bump shureq", "The article"], answer: "And truth — vav matches hateph seghol", why: "אֱמֶת + וְ → וֶאֱמֶת." },
      { q: "אֱלֹהִים with the conjunction is…", he: "וֵאלֹהִים", ref: "Gen 50:24", choices: ["וֵאלֹהִים — tsere, hateph dropped", "וֶאֱלֹהִים — ordinary hateph match", "וְאֱלֹהִים"], answer: "וֵאלֹהִים — tsere, hateph dropped", why: "Learn this exception. Joseph’s last speech." },
      { q: "וָבֹהוּ in Gen 1:2 uses qamets because…", he: "וָבֹהוּ", ref: "Gen 1:2", choices: ["Monosyllabic / initially accented words often take וָ", "Bet is a guttural", "It is the article"], answer: "Monosyllabic / initially accented words often take וָ", why: "תֹהוּ וָבֹהוּ. Same family as וָלֶחֶם, וָצֹאן." },
      { q: "In Gen 24:35, וּבָקָר vs וְכֶסֶף. Why the different vowels?", he: "וּבָקָר", ref: "Gen 24:35", choices: ["Bet is bump (וּ); kaf is not (וְ)", "One is the article", "Both should be shewa"], answer: "Bet is bump (וּ); kaf is not (וְ)", why: "Same verse teaches the split: וּבָקָר וְכֶסֶף וְזָהָב." },
      { q: "When you see an initial ו, you should expect…", choices: ["The conjunction, whatever the vowel under it", "A root that begins with vav", "The article"], answer: "The conjunction, whatever the vowel under it", why: "Roots with initial vav are vanishingly rare. Name it “and / but / also.”" },
      { q: "The lexical form of the conjunction is…", he: "וְ", choices: ["וְ", "וּ", "וָ"], answer: "וְ", why: "Class vocab lists וְ. The other vowels are spelling rules." },
      { q: "Does vav swallow the article the way some prepositions do?", choices: ["No — וְהָאָרֶץ keeps both prefixes", "Yes — the he always drops", "Only in the dual"], answer: "No — וְהָאָרֶץ keeps both prefixes", why: "Gen 1:2 וְהָאָרֶץ. Vav then article then noun." },
      { q: "וִיהוּדָה is not וּיְהוּדָה because…", he: "וִיהוּדָה", choices: ["יְ + וְ contracts to וִי", "Judah begins with a bump letter", "It is compensatory lengthening"], answer: "יְ + וְ contracts to וִי", why: "Two vocal shewas are not left in a row." },
    ],
  },
  {
    id: 6,
    title: "Read it in the Tanakh",
    short: "Stack, special uses, look up",
    rule:
      "On a living line, name every prefix, then the noun. Article and vav can stack: וְהָאָרֶץ is “and the earth.” The article can taste like “this/that” (הַיּוֹם this day / today), like a vocative (הַמֶּלֶךְ O king), or like a superlative in a tight pair (the good = the best). Hebrew still has no “a”; אֶחָד may mean “one” or “a certain.” When inseparable prepositions arrive in the next chapter, the he of the article often drops and its vowel (and dagesh) sit on the preposition — לָאוֹר is לְ + הַ + אוֹר. Vav never does that. Strip prefixes, restore the singular, look it up.",
    samples: [
      { word: "וְהָאָרֶץ", gloss: "and the earth", tag: "vav + article", note: "Both prefixes stay. Gen 1:2 opens on this stack.", ref: "Gen 1:2" },
      { word: "הַיּוֹם", gloss: "this day / today", tag: "demonstrative flavor", note: "Article used like “this.” Deut 6:6.", ref: "Deut 6:6" },
      { word: "הַמֶּלֶךְ", gloss: "O king", tag: "vocative", note: "Direct address can wear the article. 1 Sam 24:9 אֲדֹנִי הַמֶּלֶךְ.", ref: "1 Sam 24:9" },
      { word: "לָאוֹר", gloss: "to the light", tag: "preposition + article (preview)", note: "He of הַ has dropped; qamets on lamed is the article’s compensatory vowel. Next chapter owns the rule. Meet it in Gen 1:5.", ref: "Gen 1:5" },
      { word: "יוֹם אֶחָד", gloss: "one day / a first day", tag: "no “a” — sometimes “one”", note: "אֶחָד is “one,” and can feel like English “a certain.”", ref: "Gen 1:5" },
    ],
    verses: [
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "הַשָּׁמַיִם", hitEn: "heavens" },
      { ref: "Gen 1:2", he: "וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל פְּנֵי תְהוֹם", en: "And the earth was formless and void, and darkness was over the face of the deep.", hit: "וְהָאָרֶץ", hitEn: "earth" },
      { ref: "Deut 6:6", he: "וְהָיוּ הַדְּבָרִים הָאֵלֶּה אֲשֶׁר אָנֹכִי מְצַוְּךָ הַיּוֹם עַל לְבָבֶךָ", en: "These words that I command you this day shall be on your heart.", hit: "הַיּוֹם", hitEn: "day" },
      { ref: "1 Sam 24:9", he: "וַיִּקְרָא אַחֲרֵי שָׁאוּל לֵאמֹר אֲדֹנִי הַמֶּלֶךְ", en: "He called after Saul, “My lord the king!”", hit: "הַמֶּלֶךְ", hitEn: "king" },
      { ref: "Gen 1:5", he: "וַיִּקְרָא אֱלֹהִים לָאוֹר יוֹם וְלַחֹשֶׁךְ קָרָא לָיְלָה וַיְהִי עֶרֶב וַיְהִי בֹקֶר יוֹם אֶחָד", en: "God called the light Day, and the darkness he called Night. There was evening and there was morning, one day.", hit: "לָאוֹר", hitEn: "light" },
      { ref: "Jonah 1:9", he: "וְאֶת יְהוָה אֱלֹהֵי הַשָּׁמַיִם אֲנִי יָרֵא אֲשֶׁר עָשָׂה אֶת הַיָּם וְאֶת הַיַּבָּשָׁה", en: "I fear YHWH, the God of heaven, who made the sea and the dry land.", hit: "הַיָּם", hitEn: "sea" },
    ],
    quiz: [
      { q: "וְהָאָרֶץ is…", he: "וְהָאָרֶץ", ref: "Gen 1:2", choices: ["Conjunction + article + “earth”", "Article only", "Conjunction only"], answer: "Conjunction + article + “earth”", why: "וְ then הָ then אָרֶץ. Stack them in order." },
      { q: "In Deut 6:6, הַיּוֹם is best read…", he: "הַיּוֹם", ref: "Deut 6:6", choices: ["This day / today — article with demonstrative flavor", "A day (indefinite)", "Two days (dual)"], answer: "This day / today — article with demonstrative flavor", why: "“Which I command you this day.”" },
      { q: "אֲדֹנִי הַמֶּלֶךְ uses the article as…", he: "הַמֶּלֶךְ", ref: "1 Sam 24:9", choices: ["Vocative — “O king” / “the king” in direct address", "Indefinite", "A proper name without הַ"], answer: "Vocative — “O king” / “the king” in direct address", why: "David is speaking to Saul." },
      { q: "לָאוֹר in Gen 1:5 is…", he: "לָאוֹר", ref: "Gen 1:5", choices: ["לְ + הַ + אוֹר — the he of the article has dropped", "The conjunction + light", "Indefinite “to a light”"], answer: "לְ + הַ + אוֹר — the he of the article has dropped", why: "Qamets on lamed is the article’s compensatory vowel. Prepositions own this fully in the next chapter." },
      { q: "Does vav drop the he of the article?", choices: ["No — וְהָאָרֶץ keeps the he", "Yes, always", "Only before alef"], answer: "No — וְהָאָרֶץ keeps the he", why: "Prepositions may swallow הַ. Vav does not." },
      { q: "הַשָּׁמַיִם in Gen 1:1 is…", he: "הַשָּׁמַיִם", ref: "Gen 1:1", choices: ["Regular article הַ + dagesh on the special dual “heaven”", "Compensatory הָ", "No article"], answer: "Regular article הַ + dagesh on the special dual “heaven”", why: "Shin takes dagesh. The dual shape is from the nouns chapter." },
      { q: "הָאָרֶץ next to it in the same verse is…", he: "הָאָרֶץ", ref: "Gen 1:1", choices: ["Compensatory article + vowel-changing noun", "Regular הַ + dagesh", "Indefinite"], answer: "Compensatory article + vowel-changing noun", why: "First line of the Torah: two article spellings, side by side." },
      { q: "יוֹם אֶחָד is…", he: "יוֹם אֶחָד", ref: "Gen 1:5", choices: ["One day — Hebrew still has no indefinite article", "The day (article on יוֹם)", "A dual of day"], answer: "One day — Hebrew still has no indefinite article", why: "אֶחָד is “one.” Sometimes it feels like English “a.”" },
      { q: "In Jonah 1:9 הַיָּם is…", he: "הַיָּם", ref: "Jonah 1:9", choices: ["The sea — regular article on the class lemma יָם", "In the sea (preposition)", "Seas (plural)"], answer: "The sea — regular article on the class lemma יָם", why: "Strip הַ. Vocab stays יָם." },
      { q: "הַדְּבָרִים in Deut 6:6 is…", he: "הַדְּבָרִים", ref: "Deut 6:6", choices: ["The words — article + masculine plural", "A dual of word", "Indefinite"], answer: "The words — article + masculine plural", why: "הַ + dagesh in dalet + ִים. Nouns chapter plus this chapter." },
      { q: "Best first move on a prefixed noun…", choices: ["Name the prefix(es), then restore the singular to look up", "Guess from English word order", "Ignore the vowels under ה and ו"], answer: "Name the prefix(es), then restore the singular to look up", why: "Article, vav, or both. Then the noun you already know." },
      { q: "וָבֹהוּ beside וְהָאָרֶץ in Gen 1:2 shows…", he: "וָבֹהוּ", ref: "Gen 1:2", choices: ["Two vav spellings in one verse: default/stack vs qamets on a short word", "Two articles", "A dual"], answer: "Two vav spellings in one verse: default/stack vs qamets on a short word", why: "וְהָאָרֶץ … תֹהוּ וָבֹהוּ." },
      { q: "Class vocab for “the” and “and” is…", choices: ["הַ and וְ — citation forms, not every spelling", "הָ and וּ only", "הֶ and וֵ only"], answer: "הַ and וְ — citation forms, not every spelling", why: "Game Recognize uses those lemmas. This path trains the spellings you meet in the text." },
      { q: "Week 3 of the course reads…", choices: ["Chapter 4 (nouns) and chapter 5 (article and vav) together", "Only chapter 5", "Chapters 6 and 7"], answer: "Chapter 4 (nouns) and chapter 5 (article and vav) together", why: "Study set is both. Games stay chapter by chapter." },
      { q: "הַיַּבָּשָׁה in Jonah 1:9 is…", he: "הַיַּבָּשָׁה", ref: "Jonah 1:9", choices: ["The dry land — regular article, dagesh in yod", "Compensatory on ayin", "No article"], answer: "The dry land — regular article, dagesh in yod", why: "הַ + יַבָּשָׁה. Same sea-and-dry-land pair as Genesis 1." },
      { q: "After you name הַ or וְ, the next job is…", choices: ["Read the noun’s ending (gender and number) and look up the singular", "Stop — prefixes are the whole word", "Always add “a” in English"], answer: "Read the noun’s ending (gender and number) and look up the singular", why: "Chapter 4 and chapter 5 on one verse. That is week 3." },
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

export function articleUnit(id: number): ArticleUnit | undefined {
  return ARTICLE_UNITS.find((u) => u.id === id);
}

export function articleQuizPool(unit: ArticleUnit): ArticleQuiz[] {
  return [...unit.quiz, ...(ARTICLE_QUIZ_EXTRA[unit.id] ?? [])];
}

export function buildArticleQuiz(unitId: number): ArticleQuiz[] {
  const unit = articleUnit(unitId);
  if (!unit) return [];
  const reviewCount = unitId > 1 ? ARTICLE_REVIEW : 0;
  const freshTake = Math.min(ARTICLE_QUIZ_LEN - reviewCount, unit.quiz.length);
  const pool = articleQuizPool(unit);
  const fresh = drawRound(pool, freshTake, `article:${unitId}`, quizId);
  const prior = ARTICLE_UNITS.filter((u) => u.id < unitId).flatMap((u) => u.quiz);
  const review = reviewCount ? drawRound(prior, reviewCount, `article-rev:${unitId}`, quizId).map((q) => ({ ...q, review: true })) : [];
  return shuffle([...fresh, ...review]).map((q) => ({
    ...q,
    choices: shuffle(q.choices),
  }));
}

export function starsFromArticleScore(pct: number): number {
  if (pct >= 90) return 3;
  if (pct >= 70) return 2;
  return 1;
}

export function articleMatchPairs(unit: ArticleUnit): Array<{ id: string; he: string; label: string }> {
  return unit.samples.map((s, i) => ({
    id: `${unit.id}-${i}`,
    he: s.word,
    label: `${s.tag} · ${s.gloss}`,
  }));
}
