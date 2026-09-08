import type { GrammarUnit } from "@/lib/grammar";

/** Original teaching on Biblical Hebrew numbers. Masoretic examples. Not a textbook reprint. */
export const NUMBER_UNITS: GrammarUnit[] = [
  {
    id: 1,
    title: "One and two",
    short: "The odd pair",
    rule:
      "Hebrew writes numbers as words. אֶחָד (fs אַחַת) “one” behaves like an adjective: it follows the noun and agrees. שְׁנַיִם / שְׁתַּיִם “two” is dual in form. Two can sit before or after the noun. Memorize these two tightly — they are the irregulars.",
    teach:
      "One follows and agrees like an adjective (יוֹם אֶחָד). Two is dual-shaped (שְׁנַיִם / שְׁתַּיִם). Memorize these two as the irregulars before the gender flip in the next unit.",
    samples: [
      { word: "אֶחָד", gloss: "one (ms)", tag: "cardinal", note: "Class. fs אַחַת.", ref: "Gen 1:5" },
      { word: "אַחַת", gloss: "one (fs)", tag: "cardinal", note: "ת not ד.", ref: "Gen 11:6" },
      { word: "שְׁנַיִם", gloss: "two (m)", tag: "dual shape", note: "Class. fs שְׁתַּיִם.", ref: "Gen 1:16" },
      { word: "אַמָּה", gloss: "cubit", tag: "measure", note: "Class noun for length.", ref: "Gen 6:15" },
    ],
    verses: [
      { ref: "Gen 1:5", he: "וַיְהִי־עֶרֶב וַיְהִי־בֹקֶר יוֹם אֶחָד", en: "There was evening and there was morning, one day.", hit: "אֶחָד", hitEn: "one", vocabId: "ehad" },
      { ref: "Gen 1:16", he: "וַיַּעַשׂ אֱלֹהִים אֶת־שְׁנֵי הַמְּאֹרֹת הַגְּדֹלִים", en: "God made the two great lights.", hit: "שְׁנֵי", hitEn: "two", vocabId: "shenayim" },
      { ref: "Deut 6:4", he: "יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", en: "YHWH our God, YHWH is one.", hit: "אֶחָד", hitEn: "one", vocabId: "ehad" },
      { ref: "Gen 6:15", he: "שְׁלֹשׁ מֵאוֹת אַמָּה אֹרֶךְ הַתֵּבָה", en: "Three hundred cubits the length of the ark.", hit: "אַמָּה", hitEn: "cubits", vocabId: "ammah" },
    ],
    quiz: [
      { q: "אֶחָד means…", he: "אֶחָד", choices: ["One", "Two", "Ten"], answer: "One", why: "Class." },
      { q: "The feminine of one is…", he: "אַחַת", choices: ["אַחַת", "שְׁתַּיִם", "עֶשֶׂר"], answer: "אַחַת", why: "ת, not ד." },
      { q: "Number one behaves like…", choices: ["An adjective — follows and agrees", "A construct-only noun that never agrees", "A verb"], answer: "An adjective — follows and agrees", why: "יוֹם אֶחָד." },
      { q: "יוֹם אֶחָד is…", he: "יוֹם אֶחָד", ref: "Gen 1:5", choices: ["One day — noun then “one”", "First day as ordinal רִאשׁוֹן", "Two days"], answer: "One day — noun then “one”", why: "Evening and morning, one day." },
      { q: "יְהוָה אֶחָד is…", he: "אֶחָד", ref: "Deut 6:4", choices: ["YHWH is one", "YHWH is two", "One YHWH of YHWHs (chain only)"], answer: "YHWH is one", why: "Shema. Class name + number." },
      { q: "שְׁנַיִם is…", he: "שְׁנַיִם", choices: ["Two (masculine, dual shape)", "Twelve", "Twenty"], answer: "Two (masculine, dual shape)", why: "Class." },
      { q: "שְׁתַּיִם is…", he: "שְׁתַּיִם", choices: ["Two (feminine)", "One (fs)", "Six"], answer: "Two (feminine)", why: "Class hebrewAlts." },
      { q: "שְׁנֵי הַמְּאֹרֹת is…", he: "שְׁנֵי", ref: "Gen 1:16", choices: ["The two lights — construct of two + definite noun", "Twelve lights", "One light"], answer: "The two lights — construct of two + definite noun", why: "שְׁנֵי = construct of two." },
      { q: "אַמָּה is…", he: "אַמָּה", choices: ["Cubit (forearm measure)", "Hundred", "Half"], answer: "Cubit (forearm measure)", why: "Class noun." },
      { q: "אֹרֶךְ is…", he: "אֹרֶךְ", choices: ["Length", "Width", "One"], answer: "Length", why: "Class." },
      { q: "Construct of two (m) is…", choices: ["שְׁנֵי", "שְׁנַיִם only", "אַחַד"], answer: "שְׁנֵי", why: "שְׁנֵי הַמְּאֹרֹת." },
      { q: "Look up שְׁנֵי as…", he: "שְׁנֵי", choices: ["שְׁנַיִם", "שֵׁנִי the ordinal only", "שֵׁשׁ"], answer: "שְׁנַיִם", why: "Citation is the absolute." },
    ],
  },
  {
    id: 2,
    title: "Three to ten",
    short: "The gender flip",
    rule:
      "Numbers three–ten are nouns. They often show the opposite gender ending from the counted noun: שְׁלֹשָׁה בָּנִים “three sons” (feminine-looking number, masculine noun). The counted noun is plural. Memorize the masculine absolute: שָׁלֹשׁ, אַרְבַּע, חָמֵשׁ, שֵׁשׁ, שֶׁבַע, שְׁמֹנֶה, תֵּשַׁע, עֶשֶׂר — and meet the rest as family resemblances.",
    teach:
      "Three–ten: the number often looks the opposite gender of the noun, and the noun is plural. Citation is שָׁלֹשׁ, אַרְבַּע, חָמֵשׁ, שֵׁשׁ, שֶׁבַע. Tens (thirty, forty) are plural shapes of the digit.",
    samples: [
      { word: "שָׁלֹשׁ", gloss: "three", tag: "cardinal", note: "Class. Thirty is שְׁלֹשִׁים.", ref: "Gen 6:10" },
      { word: "אַרְבַּע", gloss: "four", tag: "cardinal", note: "Class. Forty אַרְבָּעִים.", ref: "Gen 2:10" },
      { word: "חָמֵשׁ", gloss: "five", tag: "cardinal", note: "Class.", ref: "Gen 5:6" },
      { word: "שֶׁבַע", gloss: "seven", tag: "cardinal", note: "Class. Seventy שִׁבְעִים.", ref: "Gen 2:2" },
      { word: "עֶשֶׂר", gloss: "ten", tag: "cardinal", note: "Also in 11–19.", ref: "Gen 5:14" },
    ],
    verses: [
      { ref: "Gen 6:10", he: "וַיּוֹלֶד נֹחַ שְׁלֹשָׁה בָנִים", en: "Noah fathered three sons.", hit: "שְׁלֹשָׁה", hitEn: "three", vocabId: "shalosh" },
      { ref: "Gen 2:10", he: "וּמִשָּׁם יִפָּרֵד וְהָיָה לְאַרְבָּעָה רָאשִׁים", en: "From there it divided and became four heads.", hit: "אַרְבָּעָה", hitEn: "four", vocabId: "arba" },
      { ref: "Gen 8:10", he: "וַיָּחֶל עוֹד שִׁבְעַת יָמִים אֲחֵרִים", en: "He waited yet another seven days.", hit: "שִׁבְעַת", hitEn: "seven", vocabId: "sheba" },
      { ref: "Gen 7:6", he: "וְנֹחַ בֶּן־שֵׁשׁ מֵאוֹת שָׁנָה", en: "Noah was six hundred years old.", hit: "שֵׁשׁ", hitEn: "six", vocabId: "shesh" },
    ],
    quiz: [
      { q: "שָׁלֹשׁ means…", he: "שָׁלֹשׁ", choices: ["Three", "Thirty only", "Third only"], answer: "Three", why: "Class. Thirty is the plural shape." },
      { q: "Three–ten often take the opposite gender ending to the noun. That means…", choices: ["שְׁלֹשָׁה בָנִים — “feminine-looking” number, masculine sons", "They never agree in any way", "They are adjectives like אֶחָד"], answer: "שְׁלֹשָׁה בָנִים — “feminine-looking” number, masculine sons", why: "The famous flip. Memorize the pattern, not a panic." },
      { q: "The counted noun with 3–10 is usually…", choices: ["Plural", "Always singular", "Always dual"], answer: "Plural", why: "Three sons." },
      { q: "אַרְבַּע means…", he: "אַרְבַּע", choices: ["Four", "Forty only", "Eight"], answer: "Four", why: "Class." },
      { q: "אַרְבָּעָה רָאשִׁים is…", he: "אַרְבָּעָה", ref: "Gen 2:10", choices: ["Four heads", "Fourteen heads", "Four hundred"], answer: "Four heads", why: "River became four heads." },
      { q: "חָמֵשׁ means…", he: "חָמֵשׁ", choices: ["Five", "Fifty only", "Six"], answer: "Five", why: "Class." },
      { q: "שֵׁשׁ means…", he: "שֵׁשׁ", choices: ["Six", "Seven", "Sixty only"], answer: "Six", why: "Class. Sixty שִׁשִּׁים." },
      { q: "שֶׁבַע means…", he: "שֶׁבַע", choices: ["Seven", "Sabbath only", "Two"], answer: "Seven", why: "Class. Related to seventh / sabbath, not the same lemma as שַׁבָּת." },
      { q: "שְׁמֹנֶה means…", he: "שְׁמֹנֶה", choices: ["Eight", "Nine", "Eighteen"], answer: "Eight", why: "Class." },
      { q: "תֵּשַׁע means…", he: "תֵּשַׁע", choices: ["Nine", "Ten", "Three"], answer: "Nine", why: "Class." },
      { q: "Thirty, forty, fifty are…", choices: ["Plural shapes of three, four, five (שְׁלֹשִׁים …)", "Brand-new unrelated lemmas", "Ordinals"], answer: "Plural shapes of three, four, five (שְׁלֹשִׁים …)", why: "Class lists thirty with three." },
      { q: "Look up שְׁלֹשָׁה as…", he: "שְׁלֹשָׁה", choices: ["שָׁלֹשׁ", "שְׁלֹשָׁה as the only form", "שָׁלוֹם"], answer: "שָׁלֹשׁ", why: "Citation is the ms absolute you memorized." },
    ],
  },
  {
    id: 3,
    title: "Eleven to a thousand",
    short: "Ten-and-a-bit, then tens",
    rule:
      "Eleven–nineteen are “one/two/… + ten”: אַחַד עָשָׂר. Twenty is עֶשְׂרִים (plural of ten). Thirty–ninety are the plural shapes you already met. A hundred is מֵאָה, two hundred מָאתַיִם (dual), a thousand אֶלֶף. “Twenty-one” is often “twenty and one.”",
    teach:
      "Teens are digit + ten. Twenty is the plural of ten. Hundred מֵאָה, thousand אֶלֶף. “Ninety and nine” is how Hebrew stacks. Stay in this chapter — this is not construct ֵי.",
    samples: [
      { word: "עֶשְׂרִים", gloss: "twenty", tag: "ten’s plural", note: "From עֶשֶׂר.", ref: "Gen 31:41" },
      { word: "מֵאָה", gloss: "hundred", tag: "cardinal", note: "Class. Dual מָאתַיִם.", ref: "Gen 6:15" },
      { word: "אֶלֶף", gloss: "thousand", tag: "cardinal", note: "Class. Dual אַלְפַּיִם.", ref: "Exod 18:21" },
      { word: "חֲצִי", gloss: "half", tag: "measure", note: "Class.", ref: "Exod 25:10" },
      { word: "רֹחַב", gloss: "width", tag: "measure", note: "Class.", ref: "Exod 25:10" },
    ],
    verses: [
      { ref: "Gen 6:15", he: "שְׁלֹשׁ מֵאוֹת אַמָּה אֹרֶךְ הַתֵּבָה חֲמִשִּׁים אַמָּה רָחְבָּהּ וּשְׁלֹשִׁים אַמָּה קוֹמָתָהּ", en: "Three hundred cubits the length of the ark, fifty cubits its width, and thirty cubits its height.", hit: "מֵאוֹת", hitEn: "hundred", vocabId: "meah" },
      { ref: "Exod 25:10", he: "אַמָּתַיִם וָחֵצִי אָרְכּוֹ וְאַמָּה וָחֵצִי רָחְבּוֹ", en: "Two cubits and a half its length, and a cubit and a half its width.", hit: "חֵצִי", hitEn: "half", vocabId: "hatsi" },
      { ref: "Gen 17:24", he: "וְאַבְרָהָם בֶּן־תִּשְׁעִים וָתֵשַׁע שָׁנָה", en: "Abraham was ninety-nine years old.", hit: "תִּשְׁעִים", hitEn: "ninety", vocabId: "tesha" },
      { ref: "Josh 3:12", he: "וְעַתָּה קְחוּ לָכֶם שְׁנֵי עָשָׂר אִישׁ", en: "And now take for yourselves twelve men.", hit: "שְׁנֵי עָשָׂר", hitEn: "twelve", vocabId: "shenayim" },
    ],
    quiz: [
      { q: "Eleven is built as…", choices: ["One + ten (אַחַד עָשָׂר)", "A dual of five", "Always מֵאָה"], answer: "One + ten (אַחַד עָשָׂר)", why: "Teen = digit plus ten." },
      { q: "שְׁנֵי עָשָׂר אִישׁ is…", he: "שְׁנֵי עָשָׂר", ref: "Josh 3:12", choices: ["Twelve men", "Twenty men", "Two men"], answer: "Twelve men", why: "Two + ten." },
      { q: "Twenty is…", choices: ["עֶשְׂרִים — plural of ten", "שְׁתֵּים", "מֵאָה"], answer: "עֶשְׂרִים — plural of ten", why: "Same root as ten." },
      { q: "מֵאָה means…", he: "מֵאָה", choices: ["Hundred", "Thousand", "Cubit"], answer: "Hundred", why: "Class." },
      { q: "שְׁלֹשׁ מֵאוֹת is…", he: "שְׁלֹשׁ מֵאוֹת", ref: "Gen 6:15", choices: ["Three hundred", "Thirty", "Three thousand"], answer: "Three hundred", why: "Three + hundreds. Ark length." },
      { q: "אֶלֶף means…", he: "אֶלֶף", choices: ["Thousand", "Hundred", "Eleven"], answer: "Thousand", why: "Class." },
      { q: "חֲצִי means…", he: "חֲצִי", choices: ["Half, middle", "Width", "Cubit"], answer: "Half, middle", why: "Class." },
      { q: "רֹחַב means…", he: "רֹחַב", choices: ["Width, breadth", "Length", "Half"], answer: "Width, breadth", why: "Class. Pair with אֹרֶךְ." },
      { q: "Ninety-nine in Gen 17:24 is…", ref: "Gen 17:24", choices: ["Ninety and nine — תִּשְׁעִים וָתֵשַׁע", "Nine hundred", "Nineteen"], answer: "Ninety and nine — תִּשְׁעִים וָתֵשַׁע", why: "Tens and a digit with “and.”" },
      { q: "אַמָּתַיִם is…", he: "אַמָּתַיִם", choices: ["Two cubits — dual of אַמָּה", "Two hundred", "Twelve cubits"], answer: "Two cubits — dual of אַמָּה", why: "Dual measure." },
      { q: "Fifty cubits in Gen 6:15 uses…", ref: "Gen 6:15", choices: ["חֲמִשִּׁים — plural shape of five", "חָמֵשׁ only", "חֲצִי"], answer: "חֲמִשִּׁים — plural shape of five", why: "Tens from the digit." },
      { q: "Look up מֵאוֹת as…", he: "מֵאוֹת", choices: ["מֵאָה", "אֶלֶף", "אַמָּה"], answer: "מֵאָה", why: "Plural of hundred." },
    ],
  },
  {
    id: 4,
    title: "First, second, seventh",
    short: "Ordinals sit like adjectives",
    rule:
      "Ordinals mark position: רִאשׁוֹן first (from רֹאשׁ), שֵׁנִי second, שְׁלִישִׁי third, שְׁבִיעִי seventh. They behave like adjectives: after the noun, agreeing, often with matching article — בַּיּוֹם הַשְּׁבִיעִי “on the seventh day.” After tenth, Hebrew often just uses cardinals for “the 13th year.”",
    teach:
      "Ordinals sit like adjectives: יוֹם שֵׁנִי, בַּיּוֹם הַשְּׁבִיעִי. Do not mix שֵׁנִי (second) with שְׁנַיִם (two), or שְׁבִיעִי with שַׁבָּת. Creation week in Genesis 1 is the drill.",
    samples: [
      { word: "רִאשׁוֹן", gloss: "first, former", tag: "ordinal", note: "Class. From רֹאשׁ.", ref: "Exod 12:2" },
      { word: "שֵׁנִי", gloss: "second", tag: "ordinal", note: "Class.", ref: "Gen 1:8" },
      { word: "שְׁלִישִׁי", gloss: "third", tag: "ordinal", note: "Class.", ref: "Gen 1:13" },
      { word: "שְׁבִיעִי", gloss: "seventh", tag: "ordinal", note: "Class.", ref: "Gen 2:2" },
    ],
    verses: [
      { ref: "Gen 2:2", he: "וַיְכַל אֱלֹהִים בַּיּוֹם הַשְּׁבִיעִי מְלַאכְתּוֹ אֲשֶׁר עָשָׂה", en: "God finished on the seventh day his work which he had done.", hit: "הַשְּׁבִיעִי", hitEn: "seventh", vocabId: "shebii" },
      { ref: "Gen 1:8", he: "וַיְהִי־עֶרֶב וַיְהִי־בֹקֶר יוֹם שֵׁנִי", en: "There was evening and there was morning, a second day.", hit: "שֵׁנִי", hitEn: "second", vocabId: "sheni" },
      { ref: "Gen 1:13", he: "וַיְהִי־עֶרֶב וַיְהִי־בֹקֶר יוֹם שְׁלִישִׁי", en: "There was evening and there was morning, a third day.", hit: "שְׁלִישִׁי", hitEn: "third", vocabId: "shelishi" },
      { ref: "Gen 1:5", he: "וַיְהִי־עֶרֶב וַיְהִי־בֹקֶר יוֹם אֶחָד", en: "There was evening and there was morning, one day.", hit: "יוֹם", hitEn: "day", vocabId: "yom" },
    ],
    quiz: [
      { q: "Ordinals tell…", choices: ["Position in a series (first, second…)", "How many (that is cardinals)", "Only duals"], answer: "Position in a series (first, second…)", why: "Seventh day vs seven days." },
      { q: "רִאשׁוֹן is built from…", he: "רִאשׁוֹן", choices: ["רֹאשׁ head / beginning", "שָׁלֹשׁ", "אַמָּה"], answer: "רֹאשׁ head / beginning", why: "Class. First / former." },
      { q: "שֵׁנִי means…", he: "שֵׁנִי", choices: ["Second", "Two (that is שְׁנַיִם)", "Twelve"], answer: "Second", why: "Ordinal. Class." },
      { q: "שְׁלִישִׁי means…", he: "שְׁלִישִׁי", choices: ["Third", "Three only", "Thirty"], answer: "Third", why: "Class." },
      { q: "שְׁבִיעִי means…", he: "שְׁבִיעִי", choices: ["Seventh", "Seven only", "Sabbath the noun שַׁבָּת"], answer: "Seventh", why: "Related family, own lemma." },
      { q: "בַּיּוֹם הַשְּׁבִיעִי is…", he: "הַשְּׁבִיעִי", ref: "Gen 2:2", choices: ["On the seventh day — prep + article + noun, article + ordinal", "Seven days", "The sabbath lemma only"], answer: "On the seventh day — prep + article + noun, article + ordinal", why: "Attributive ordinal. Both have הַ." },
      { q: "יוֹם שֵׁנִי (no articles) is…", he: "יוֹם שֵׁנִי", ref: "Gen 1:8", choices: ["A second day", "The second day (both הַ)", "Twelve days"], answer: "A second day", why: "Creation formula. Class יוֹם." },
      { q: "Feminine ordinals often end in…", choices: ["ִית (שְׁבִיעִית)", "ִים", "ַיִם"], answer: "ִית (שְׁבִיעִית)", why: "Like other fs adjectives." },
      { q: "After tenth, “the 13th year” often uses…", choices: ["Cardinals, not a new ordinal set", "Always רִאשׁוֹן", "The object marker"], answer: "Cardinals, not a new ordinal set", why: "The book says so; the text shows it." },
      { q: "Do not mix שֵׁנִי (second) with…", choices: ["שְׁנַיִם (two)", "רִאשׁוֹן", "יוֹם"], answer: "שְׁנַיִם (two)", why: "Cardinal vs ordinal." },
      { q: "Creation week is a drill for…", choices: ["יוֹם + ordinals you will keep seeing", "Only prepositions", "Only construct ֵי"], answer: "יוֹם + ordinals you will keep seeing", why: "Maximum exposure, Genesis 1." },
      { q: "Look up הַשְּׁבִיעִי as…", he: "הַשְּׁבִיעִי", choices: ["שְׁבִיעִי — strip the article", "שֶׁבַע only", "שַׁבָּת only"], answer: "שְׁבִיעִי — strip the article", why: "Ordinal citation." },
    ],
  },
];
