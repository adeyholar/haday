/** Public-domain Masoretic examples. Rules are original teaching notes, not a textbook reprint. */

export type SyllableVerse = { ref: string; he: string; en: string; hit: string; hitEn?: string };

export type SyllableSample = {
  word: string;
  split: string;
  note: string;
  ref?: string;
};

export type SyllableQuiz = {
  q: string;
  he?: string;
  ref?: string;
  choices: string[];
  answer: string;
  why: string;
};

export type SyllableUnit = {
  id: number;
  title: string;
  short: string;
  rule: string;
  samples: SyllableSample[];
  verses: SyllableVerse[];
  quiz: SyllableQuiz[];
};

/** Questions drawn per play. Pool is larger so a retry is not the same five. */
export const SYLLABLE_QUIZ_LEN = 12;

export const SYLLABLE_UNITS: SyllableUnit[] = [
  {
    id: 1,
    title: "Open and closed",
    short: "One vowel",
    rule:
      "A Hebrew syllable starts with a consonant and holds one vowel. It is open if it ends in a vowel, closed if it ends in a consonant. Split the word so each slice obeys that.",
    samples: [
      { word: "דָּבָר", split: "דָּ | בָר", note: "דָּ is open (ends in a vowel). בָר is closed (ends in a consonant).", ref: "1 Kgs 8:56" },
      { word: "מֶלֶךְ", split: "מֶ | לֶךְ", note: "Two syllables, each with one vowel. The second is closed.", ref: "Ps 24:8" },
      { word: "אָדָם", split: "אָ | דָם", note: "Open, then closed. Same pattern as דָּבָר.", ref: "Gen 1:26" },
      { word: "שָׁלוֹם", split: "שָׁ | לוֹם", note: "Open shin-qamets, then a closed holem syllable.", ref: "Num 6:26" },
      { word: "טוֹב", split: "טוֹב", note: "One closed syllable — one vowel, ends in a consonant.", ref: "Gen 1:4" },
    ],
    verses: [
      { ref: "Gen 15:1", he: "אַחַר הַדְּבָרִים הָאֵלֶּה הָיָה דְבַר־יְהוָה אֶל־אַבְרָם", en: "After these things, the word of YHWH came to Abram.", hit: "הַדְּבָרִים", hitEn: "these things" },
      { ref: "Ps 24:8", he: "מִי זֶה מֶלֶךְ הַכָּבוֹד יְהוָה עִזּוּז וְגִבּוֹר", en: "Who is this king of glory? YHWH, strong and mighty.", hit: "מֶלֶךְ" },
      { ref: "Gen 1:26", he: "וַיֹּאמֶר אֱלֹהִים נַעֲשֶׂה אָדָם בְּצַלְמֵנוּ כִּדְמוּתֵנוּ", en: "God said, “Let us make humankind in our image.”", hit: "אָדָם" },
      { ref: "Num 6:26", he: "יִשָּׂא יְהוָה פָּנָיו אֵלֶיךָ וְיָשֵׂם לְךָ שָׁלוֹם", en: "YHWH lift his face toward you and set peace for you.", hit: "שָׁלוֹם" },
    ],
    quiz: [
      { q: "Does a Hebrew syllable normally begin with a vowel?", choices: ["No — it begins with a consonant", "Yes — vowels can start a syllable", "Only in closed syllables"], answer: "No — it begins with a consonant", why: "Each syllable starts with a consonant and carries one vowel." },
      { q: "How many vowels may a syllable hold?", choices: ["One", "Two", "As many as the letters"], answer: "One", why: "One vowel per syllable — that is how you find the cuts." },
      { q: "In דָּ | בָר, what is דָּ?", he: "דָּבָר", ref: "1 Kgs 8:56", choices: ["Open — ends in a vowel", "Closed — ends in a consonant", "Not a syllable"], answer: "Open — ends in a vowel", why: "Open syllables end with a vowel." },
      { q: "In דָּ | בָר, what is בָר?", he: "דָּבָר", ref: "1 Kgs 8:56", choices: ["Closed — ends in a consonant", "Open — ends in a vowel", "A diphthong"], answer: "Closed — ends in a consonant", why: "Closed syllables end with a consonant." },
      { q: "How should מֶלֶךְ split?", he: "מֶלֶךְ", ref: "Ps 24:8", choices: ["מֶ | לֶךְ", "מֶל | ֶךְ", "מֶלֶךְ (one slice)"], answer: "מֶ | לֶךְ", why: "Two vowels, so two syllables. The second ends with a consonant." },
      { q: "How should אָדָם split?", he: "אָדָם", ref: "Gen 1:26", choices: ["אָ | דָם", "אָד | ָם", "אָדָם (one slice)"], answer: "אָ | דָם", why: "Two vowels: open, then closed." },
      { q: "How should שָׁלוֹם split?", he: "שָׁלוֹם", ref: "Num 6:26", choices: ["שָׁ | לוֹם", "שָׁל | וֹם", "שָׁלוֹ | ם"], answer: "שָׁ | לוֹם", why: "Qamets is one vowel, holem is the next. The second slice is closed." },
      { q: "How many syllables in טוֹב?", he: "טוֹב", ref: "Gen 1:4", choices: ["One", "Two", "Three"], answer: "One", why: "One vowel (holem). The word is a single closed syllable." },
      { q: "Is the first slice of מֶלֶךְ open or closed?", he: "מֶלֶךְ", ref: "Ps 24:8", choices: ["Open — מֶ ends in a vowel", "Closed — it ends in ל", "Neither"], answer: "Open — מֶ ends in a vowel", why: "מֶ has the vowel and nothing after it in that slice." },
      { q: "Is בָר in דָּבָר open or closed?", he: "דָּבָר", ref: "1 Kgs 8:56", choices: ["Closed", "Open", "Neither — it is a prefix"], answer: "Closed", why: "It ends with ר, a consonant." },
      { q: "A slice that ends with a consonant is…", choices: ["Closed", "Open", "Furtive"], answer: "Closed", why: "Closed = consonant at the end of the slice." },
      { q: "A slice that ends with a vowel is…", choices: ["Open", "Closed", "Silent"], answer: "Open", why: "Open = the vowel is the last sound in the slice." },
      { q: "How should כָּבוֹד split?", he: "כָּבוֹד", ref: "Ps 24:8", choices: ["כָּ | בוֹד", "כָּב | וֹד", "כָּבוֹד (one)"], answer: "כָּ | בוֹד", why: "Two vowels: qamets, then holem. Second slice is closed." },
      { q: "In Gen 15:1, הַדְּבָרִים has more than two vowels. How do you start the split?", he: "הַדְּבָרִים", ref: "Gen 15:1", choices: ["Count the vowels first, then cut", "Cut after every letter", "Treat the whole word as one slice"], answer: "Count the vowels first, then cut", why: "One vowel per syllable. Find the vowels, then place the bars." },
      { q: "יוֹם in Gen 1:5 is…", he: "יוֹם", ref: "Gen 1:5", choices: ["One closed syllable", "Two syllables י | וֹם", "Open then closed"], answer: "One closed syllable", why: "One vowel (holem). Ends in a consonant." },
    ],
  },
  {
    id: 2,
    title: "Dagesh forte and lene",
    short: "Begadkephat",
    rule:
      "The six letters ב ג ד כ פ ת can take a dagesh. After a vowel it is forte (the letter doubles, and you split through it). After a consonant — or at the start of a word unless the previous word ended in a vowel — it is lene (a hard sound, not a double). Gutturals and ר never take dagesh.",
    samples: [
      { word: "אַתָּה", split: "אַתְ | תָּה", note: "The dagesh in ת follows a vowel (pathach), so it is forte — the ת is doubled in the split.", ref: "Gen 49:8" },
      { word: "הַשָּׁמַיִם", split: "הַשְׁ | שָׁ | מַיִם", note: "Dagesh in ש follows a vowel, so it is forte: the split runs through ש.", ref: "Gen 1:1" },
      { word: "אִשָּׁה", split: "אִשְׁ | שָׁה", note: "Forte in ש after hireq. Double the shin and cut through it.", ref: "Gen 2:23" },
      { word: "כַּבֵּד", split: "כַּבְ | בֵד", note: "Forte in ב after pathach — honor (piel) doubles the middle root letter.", ref: "Exod 20:12" },
      { word: "מִדְבַּר", split: "מִדְ | בַּר", note: "Dagesh in ב follows a consonant (silent shewa), so it is lene — hard b, not a double.", ref: "Num 1:1" },
    ],
    verses: [
      { ref: "Gen 49:8", he: "יְהוּדָה אַתָּה יוֹדוּךָ אַחֶיךָ", en: "Judah, you — your brothers will praise you.", hit: "אַתָּה" },
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "הַשָּׁמַיִם" },
      { ref: "Gen 2:23", he: "לְזֹאת יִקָּרֵא אִשָּׁה כִּי מֵאִישׁ לֻקֳחָה־זֹּאת", en: "This one shall be called woman, for from man this one was taken.", hit: "אִשָּׁה" },
      { ref: "Exod 20:12", he: "כַּבֵּד אֶת־אָבִיךָ וְאֶת־אִמֶּךָ", en: "Honor your father and your mother.", hit: "כַּבֵּד" },
    ],
    quiz: [
      { q: "In אַתָּה, the dagesh in ת is…", he: "אַתָּה", ref: "Gen 49:8", choices: ["Forte — a vowel stands before it", "Lene — a consonant stands before it", "Neither; ת cannot take dagesh"], answer: "Forte — a vowel stands before it", why: "Pathach under א is a vowel, so the dagesh is forte and the ת doubles." },
      { q: "How does אַתָּה split once the ת is forte?", he: "אַתָּה", ref: "Gen 49:8", choices: ["אַתְ | תָּה", "אַ | תָּה", "אַתָּה (one slice)"], answer: "אַתְ | תָּה", why: "Forte doubles the consonant, so the split runs through the ת." },
      { q: "In הַשָּׁמַיִם, the dagesh in ש is…", he: "הַשָּׁמַיִם", ref: "Gen 1:1", choices: ["Forte — it follows a vowel", "Lene — it starts the word", "Not a dagesh"], answer: "Forte — it follows a vowel", why: "Pathach under the article הַ is a vowel, so ש doubles." },
      { q: "How does אִשָּׁה split?", he: "אִשָּׁה", ref: "Gen 2:23", choices: ["אִשְׁ | שָׁה", "אִ | שָּׁה", "אִשָּׁה (one)"], answer: "אִשְׁ | שָׁה", why: "Forte in ש after hireq: cut through the doubled letter." },
      { q: "How does כַּבֵּד split?", he: "כַּבֵּד", ref: "Exod 20:12", choices: ["כַּבְ | בֵד", "כַּ | בֵּד", "כַּבֵּ | ד"], answer: "כַּבְ | בֵד", why: "Piel doubles the middle root letter. Split through that ב." },
      { q: "In מִדְבַּר, the dagesh in ב is…", he: "מִדְבַּר", ref: "Num 1:1", choices: ["Lene — silent shewa stands before it", "Forte — it follows a vowel", "Forte — every begadkephat dagesh is forte"], answer: "Lene — silent shewa stands before it", why: "A consonant with silent shewa precedes it, so the dagesh is lene." },
      { q: "Which letters never take dagesh?", choices: ["Gutturals and ר", "Begadkephat only", "Final forms only"], answer: "Gutturals and ר", why: "א ה ח ע and ר refuse both lene and forte." },
      { q: "Forte in a begadkephat doubles which sound?", choices: ["The hard sound", "The soft sound", "Neither — it only marks a vowel"], answer: "The hard sound", why: "You double the stop (b, g, d, k, p, t), not the spirant." },
      { q: "A dagesh after a vowel is…", choices: ["Forte", "Lene", "Furtive"], answer: "Forte", why: "Vowel before the dot → the letter doubles." },
      { q: "A dagesh after a consonant (or at the start of a word) is…", choices: ["Lene", "Forte", "Quiescent"], answer: "Lene", why: "No vowel immediately before it, so it does not double." },
      { q: "Begadkephat letters are…", choices: ["ב ג ד כ פ ת", "א ה ח ע ר", "Only the finals"], answer: "ב ג ד כ פ ת", why: "Those six can take a dagesh lene or forte." },
      { q: "In Gen 1:1 הַשָּׁמַיִם, you split through ש because…", he: "הַשָּׁמַיִם", ref: "Gen 1:1", choices: ["The dagesh is forte", "Shin always starts a new word", "The article never joins a syllable"], answer: "The dagesh is forte", why: "Forte means the letter is in both slices." },
      { q: "Does ר take dagesh forte?", choices: ["No", "Yes, freely", "Only in verbs"], answer: "No", why: "ר refuses the doubling dot, like the gutturals." },
      { q: "Lene changes…", choices: ["The sound (hard, not doubled)", "The syllable count by adding a slice", "Nothing — ignore it"], answer: "The sound (hard, not doubled)", why: "Lene is a stop, not a double. You do not split through it." },
    ],
  },
  {
    id: 3,
    title: "Silent and vocal shewa",
    short: "Shewa",
    rule:
      "Shewa is silent when a short vowel stands immediately before it — it then closes that syllable. Shewa is vocal in every other case: at the start of a word, as the second of two shewas in a row, under a letter with dagesh forte, or after an unaccented long vowel. A shewa, silent or vocal, marks a syllable boundary. Gutturals do not take vocal shewa (they take a hateph instead); ר may.",
    samples: [
      { word: "פַּרְעֹה", split: "פַּרְ | עֹה", note: "Shewa under ר follows short pathach, so it is silent and closes the first syllable.", ref: "Exod 5:1" },
      { word: "בְּרֵאשִׁית", split: "בְּ | רֵא | שִׁית", note: "Initial shewa is always vocal.", ref: "Gen 1:1" },
      { word: "יִשְׂרָאֵל", split: "יִשְׂ | רָ | אֵל", note: "Shewa under שׂ follows short hireq, so it is silent.", ref: "Deut 6:4" },
      { word: "שְׁמוּאֵל", split: "שְׁ | מוּ | אֵל", note: "Word-initial shewa is vocal; then a closed holem slice; then אֵל.", ref: "1 Sam 3:10" },
      { word: "אַבְרָהָם", split: "אַבְ | רָ | הָם", note: "Shewa under ב follows short pathach — silent, closing the first slice.", ref: "Gen 17:5" },
    ],
    verses: [
      { ref: "Exod 5:1", he: "וְאַחַר בָּאוּ מֹשֶׁה וְאַהֲרֹן וַיֹּאמְרוּ אֶל־פַּרְעֹה", en: "Afterward Moses and Aaron came and said to Pharaoh.", hit: "פַּרְעֹה" },
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "בְּרֵאשִׁית" },
      { ref: "Deut 6:4", he: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", en: "Hear, Israel: YHWH our God, YHWH is one.", hit: "יִשְׂרָאֵל" },
      { ref: "1 Sam 3:10", he: "וַיֹּאמֶר שְׁמוּאֵל דַּבֵּר כִּי שֹׁמֵעַ עַבְדֶּךָ", en: "Samuel said, “Speak, for your servant is listening.”", hit: "שְׁמוּאֵל" },
    ],
    quiz: [
      { q: "Shewa after a short vowel is…", choices: ["Silent — it closes the syllable", "Vocal — it opens the next syllable", "Always hateph"], answer: "Silent — it closes the syllable", why: "Short vowel + shewa = closed syllable, silent shewa." },
      { q: "A shewa at the beginning of a word is…", choices: ["Always vocal", "Always silent", "Forte"], answer: "Always vocal", why: "Nothing short stands before it, so it is vocal." },
      { q: "In פַּרְעֹה, the shewa under ר is…", he: "פַּרְעֹה", ref: "Exod 5:1", choices: ["Silent", "Vocal", "Hateph pathach"], answer: "Silent", why: "It follows short pathach under פּ." },
      { q: "How does פַּרְעֹה split?", he: "פַּרְעֹה", ref: "Exod 5:1", choices: ["פַּרְ | עֹה", "פַּ | רְעֹה", "פַּרְעֹה (one)"], answer: "פַּרְ | עֹה", why: "Silent shewa closes the first slice." },
      { q: "In בְּרֵאשִׁית, the first shewa is…", he: "בְּרֵאשִׁית", ref: "Gen 1:1", choices: ["Vocal — it starts the word", "Silent — every shewa is silent", "Hateph"], answer: "Vocal — it starts the word", why: "Initial shewa is always vocal." },
      { q: "How does יִשְׂרָאֵל split?", he: "יִשְׂרָאֵל", ref: "Deut 6:4", choices: ["יִשְׂ | רָ | אֵל", "יִ | שְׂרָאֵל", "יִשְׂרָ | אֵל"], answer: "יִשְׂ | רָ | אֵל", why: "Silent shewa after hireq closes the first slice; then רָ; then אֵל." },
      { q: "How does שְׁמוּאֵל split?", he: "שְׁמוּאֵל", ref: "1 Sam 3:10", choices: ["שְׁ | מוּ | אֵל", "שְׁמוּאֵל (one)", "שְׁמ | וּאֵל"], answer: "שְׁ | מוּ | אֵל", why: "Vocal shewa opens; holem is the next vowel; then אֵל." },
      { q: "How does אַבְרָהָם split?", he: "אַבְרָהָם", ref: "Gen 17:5", choices: ["אַבְ | רָ | הָם", "אַ | בְרָהָם", "אַבְרָ | הָם"], answer: "אַבְ | רָ | הָם", why: "Silent shewa after pathach; then two qamets slices." },
      { q: "Two shewas side by side inside a word: which is vocal?", choices: ["The second", "The first", "Both silent"], answer: "The second", why: "The first is silent (closes); the second is vocal (opens)." },
      { q: "Shewa under a letter with dagesh forte is…", choices: ["Vocal", "Silent", "Not allowed"], answer: "Vocal", why: "The doubled letter begins a new syllable, so its shewa is vocal." },
      { q: "In שְׁמַע, the shewa under ש is…", he: "שְׁמַע", ref: "Deut 6:4", choices: ["Vocal — start of the word", "Silent — it follows nothing", "Forte"], answer: "Vocal — start of the word", why: "First letter of the word: vocal shewa." },
      { q: "A silent shewa does what to the syllable before it?", choices: ["Closes it", "Opens the next one only", "Deletes a vowel"], answer: "Closes it", why: "Silent shewa is the closing consonant of the previous slice." },
      { q: "Gutturals take vocal shewa?", choices: ["No — they take a hateph instead", "Yes, always", "Only א"], answer: "No — they take a hateph instead", why: "Hatephs are the guttural’s vocal shewa. ר may take vocal shewa." },
      { q: "Does a shewa (silent or vocal) mark a syllable boundary?", choices: ["Yes", "No — only vowels do", "Only vocal shewa"], answer: "Yes", why: "Both kinds of shewa sit at a cut." },
    ],
  },
  {
    id: 4,
    title: "Qamets and qamets hatuf",
    short: "Long a / short o",
    rule:
      "The same sign ָ is qamets (long a) in an open pretonic syllable or a closed accented syllable. It is qamets hatuf (short o) only in a closed, unaccented syllable. A metheg (small vertical stroke) beside the sign marks qamets, not hatuf. Reduced vowels (hatephs) always sit in open syllables and are never silent.",
    samples: [
      { word: "חָכְמָה", split: "חָכְ | מָה", note: "First ָ is hatuf (closed, unaccented). Second ָ is qamets (accented).", ref: "Prov 1:7" },
      { word: "כָּל־", split: "כָּל", note: "The frequent construct “all of” is hatuf — closed and unaccented.", ref: "Exod 19:5" },
      { word: "דָּבָר", split: "דָּ | בָר", note: "Both signs are qamets: first open-pretonic, second closed-accented.", ref: "1 Kgs 8:56" },
      { word: "דָּעַת", split: "דָּ | עַת", note: "First ָ is qamets (open). Not hatuf.", ref: "Prov 1:7" },
      { word: "אָכְלָה", split: "אָכְ | לָה", note: "First ָ with silent shewa in an unaccented closed slice — hatuf (o).", ref: "Gen 1:29" },
    ],
    verses: [
      { ref: "Prov 1:7", he: "יִרְאַת יְהוָה רֵאשִׁית דָּעַת חָכְמָה וּמוּסָר אֱוִילִים בָּזוּ", en: "The fear of YHWH is the beginning of knowledge; fools despise wisdom and instruction.", hit: "חָכְמָה", hitEn: "wisdom" },
      { ref: "Exod 19:5", he: "וִהְיִיתֶם לִי סְגֻלָּה מִכָּל־הָעַמִּים", en: "You shall be my treasured possession out of all the peoples.", hit: "מִכָּל", hitEn: "all" },
      { ref: "Deut 6:5", he: "וְאָהַבְתָּ אֵת יְהוָה אֱלֹהֶיךָ בְּכָל־לְבָבְךָ", en: "You shall love YHWH your God with all your heart.", hit: "בְּכָל", hitEn: "all" },
      { ref: "Gen 1:5", he: "וַיִּקְרָא אֱלֹהִים לָאוֹר יוֹם וְלַחֹשֶׁךְ קָרָא לָיְלָה", en: "God called the light Day, and the darkness he called Night.", hit: "קָרָא" },
    ],
    quiz: [
      { q: "Qamets hatuf (short o) lives in…", choices: ["A closed, unaccented syllable", "An open, pretonic syllable", "Any syllable with ָ"], answer: "A closed, unaccented syllable", why: "That is the only seat of hatuf." },
      { q: "In חָכְמָה, the first ָ is…", he: "חָכְמָה", ref: "Prov 1:7", choices: ["Qamets hatuf (short o)", "Qamets (long a)", "Hateph qamets"], answer: "Qamets hatuf (short o)", why: "Closed and unaccented, with silent shewa after it." },
      { q: "How does חָכְמָה split?", he: "חָכְמָה", ref: "Prov 1:7", choices: ["חָכְ | מָה", "חָ | כְמָה", "חָכְמָה (one)"], answer: "חָכְ | מָה", why: "Hatuf + silent shewa close the first slice; the last is qamets." },
      { q: "The construct כָּל “all of” has…", he: "כָּל", ref: "Exod 19:5", choices: ["Qamets hatuf", "Qamets (long a)", "Pathach"], answer: "Qamets hatuf", why: "Closed, unaccented — the most common hatuf word." },
      { q: "In דָּבָר both ָ signs are…", he: "דָּבָר", ref: "1 Kgs 8:56", choices: ["Qamets (long a)", "Hatuf (short o)", "One of each"], answer: "Qamets (long a)", why: "First is open-pretonic; second is closed-accented. Neither is hatuf." },
      { q: "In דָּעַת the first ָ is…", he: "דָּעַת", ref: "Prov 1:7", choices: ["Qamets (long a) — the slice is open", "Hatuf — every first ָ is hatuf", "Shewa"], answer: "Qamets (long a) — the slice is open", why: "Open syllable: cannot be hatuf." },
      { q: "A metheg beside ָ tells you it is…", choices: ["Qamets (long a)", "Qamets hatuf", "Shewa"], answer: "Qamets (long a)", why: "Metheg is written with qamets, not with hatuf." },
      { q: "Hateph vowels (ֲ ֱ ֳ) are…", choices: ["Always in open syllables, never silent", "Silent like shewa", "Only in closed syllables"], answer: "Always in open syllables, never silent", why: "Reduced vowels open a syllable; they do not close one." },
      { q: "How do you tell hatuf from qamets?", choices: ["Closed + unaccented → hatuf; otherwise qamets", "Hatuf is a different written sign", "Hatuf only appears on gutturals"], answer: "Closed + unaccented → hatuf; otherwise qamets", why: "Same sign, two seats." },
      { q: "In בְּכָל־לְבָבְךָ, the ָ of כָּל is…", he: "בְּכָל", ref: "Deut 6:5", choices: ["Hatuf (short o)", "Qamets (long a)", "Pathach"], answer: "Hatuf (short o)", why: "Construct “all of” — closed, unaccented." },
      { q: "In קָרָא, the first ָ is…", he: "קָרָא", ref: "Gen 1:5", choices: ["Qamets (open syllable)", "Hatuf", "Hateph"], answer: "Qamets (open syllable)", why: "קָ is open. Hatuf cannot sit there." },
      { q: "If ָ is in a closed accented syllable, it is…", choices: ["Qamets (long a)", "Hatuf (short o)", "Always hateph"], answer: "Qamets (long a)", why: "Accent on a closed slice keeps it long a, not hatuf." },
      { q: "Silent shewa after ָ is a clue that the ָ may be…", choices: ["Hatuf — the slice is closed and often unaccented", "Always long qamets", "A furtive pathach"], answer: "Hatuf — the slice is closed and often unaccented", why: "Shewa after ָ closes the slice; check the accent next." },
      { q: "How does אָכְלָה split when the first ָ is hatuf?", he: "אָכְלָה", ref: "Gen 1:29", choices: ["אָכְ | לָה", "אָ | כְלָה", "אָכְל | ָה"], answer: "אָכְ | לָה", why: "Closed unaccented first slice (hatuf + silent shewa), then qamets." },
    ],
  },
  {
    id: 5,
    title: "Furtive pathach",
    short: "Before ח / ע",
    rule:
      "A vowel is spoken after its consonant — except at the end of a word, when ח or ע may carry a pathach that is spoken before the guttural. That pathach is furtive: you pronounce it, but you do not count it as a syllable of its own.",
    samples: [
      { word: "רוּחַ", split: "רוּחַ", note: "One syllable. Say ru-ach — the pathach is heard before ח, but the word is not two slices.", ref: "Gen 1:2" },
      { word: "רָקִיעַ", split: "רָ | קִיעַ", note: "Two syllables. The pathach under ע is furtive, not a third vowel-seat.", ref: "Gen 1:6" },
      { word: "נֹחַ", split: "נֹחַ", note: "One syllable. Furtive pathach before final ח.", ref: "Gen 6:9" },
      { word: "יָדַע", split: "יָ | דַע", note: "Careful: the pathach here is a real vowel under ד, not furtive under ע.", ref: "Gen 4:1" },
      { word: "מוֹשִׁיעַ", split: "מוֹ | שִׁיעַ", note: "Two real vowels. Furtive pathach on the final ע.", ref: "Isa 19:20" },
    ],
    verses: [
      { ref: "Gen 1:2", he: "וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם", en: "And the spirit of God was hovering over the face of the waters.", hit: "וְרוּחַ" },
      { ref: "Gen 1:6", he: "וַיֹּאמֶר אֱלֹהִים יְהִי רָקִיעַ בְּתוֹךְ הַמָּיִם", en: "God said, “Let there be an expanse in the midst of the waters.”", hit: "רָקִיעַ", hitEn: "an expanse" },
      { ref: "Gen 6:9", he: "אֵלֶּה תּוֹלְדֹת נֹחַ נֹחַ אִישׁ צַדִּיק", en: "These are the generations of Noah. Noah was a righteous man.", hit: "נֹחַ", hitEn: "Noah" },
      { ref: "Isa 19:20", he: "וְשָׁלַח לָהֶם מוֹשִׁיעַ וָרָב וְהִצִּילָם", en: "He will send them a savior and a champion, and he will deliver them.", hit: "מוֹשִׁיעַ", hitEn: "a savior" },
    ],
    quiz: [
      { q: "Furtive pathach is pronounced…", choices: ["Before the final ח or ע", "After the guttural", "Not at all"], answer: "Before the final ח or ע", why: "It is the one pathach you say before its letter." },
      { q: "Does furtive pathach add a syllable?", choices: ["No", "Yes — always a new open syllable", "Only if the word is long"], answer: "No", why: "You hear it, but you do not split on it." },
      { q: "How many syllables in רוּחַ?", he: "רוּחַ", ref: "Gen 1:2", choices: ["One", "Two", "Three"], answer: "One", why: "Furtive pathach is not a second vowel-seat." },
      { q: "How many syllables in נֹחַ?", he: "נֹחַ", ref: "Gen 6:9", choices: ["One", "Two", "Three"], answer: "One", why: "Holem is the only real vowel. Pathach under ח is furtive." },
      { q: "Split of רָקִיעַ?", he: "רָקִיעַ", ref: "Gen 1:6", choices: ["רָ | קִיעַ", "רָ | קִי | עַ", "רָקִיעַ (one)"], answer: "רָ | קִיעַ", why: "Two real vowels. The pathach under ע is furtive." },
      { q: "Which finals can take furtive pathach?", choices: ["ח and ע", "א and ר", "Any guttural"], answer: "ח and ע", why: "Those two at word-end may carry the extra pathach." },
      { q: "In יָדַע, the pathach under ד is…", he: "יָדַע", ref: "Gen 4:1", choices: ["A real vowel — the word is יָ | דַע", "Furtive — ignore it in the split", "Silent shewa"], answer: "A real vowel — the word is יָ | דַע", why: "The pathach sits under ד, not under the final ע. Not furtive." },
      { q: "How does מוֹשִׁיעַ split?", he: "מוֹשִׁיעַ", ref: "Isa 19:20", choices: ["מוֹ | שִׁיעַ", "מוֹ | שִׁי | עַ", "מוֹשִׁיעַ (one)"], answer: "מוֹ | שִׁיעַ", why: "Two real vowels (holem, hireq-yod). Furtive pathach on ע." },
      { q: "You write furtive pathach…", choices: ["Under the final guttural, but say it before that letter", "Before the guttural, like a separate letter", "Over the previous vowel"], answer: "Under the final guttural, but say it before that letter", why: "Spelling and mouth do not match — that is why it is “furtive.”" },
      { q: "If a word ends in ע with a pathach and already has a long vowel in that slice, the pathach is…", choices: ["Furtive", "A new syllable", "Qamets hatuf"], answer: "Furtive", why: "Long vowel + final ח/ע pathach = furtive, not a new cut." },
      { q: "In וְרוּחַ (Gen 1:2), after the prefix וְ the remaining רוּחַ is…", he: "וְרוּחַ", ref: "Gen 1:2", choices: ["Still one syllable plus a vocal-shewa prefix", "Three full syllables", "Two because of furtive pathach"], answer: "Still one syllable plus a vocal-shewa prefix", why: "וְ is vocal shewa (its own slice). רוּחַ stays one slice." },
      { q: "Furtive pathach appears at…", choices: ["The end of a word", "The start of every guttural", "Only in verbs"], answer: "The end of a word", why: "It is a word-final extra pathach on ח or ע." },
      { q: "Do you count furtive pathach when you tally vowels for the split?", choices: ["No", "Yes", "Only in nouns"], answer: "No", why: "Heard, not counted." },
      { q: "רָקִיעַ has furtive pathach on which letter?", he: "רָקִיעַ", ref: "Gen 1:6", choices: ["ע", "ר", "ק"], answer: "ע", why: "The extra pathach sits under the final ayin." },
    ],
  },
  {
    id: 6,
    title: "Quiescent alef",
    short: "Silent א",
    rule:
      "When א has no vowel of its own, it is quiescent: present in the spelling, silent in the mouth, and not treated as a consonant when you split the word.",
    samples: [
      { word: "חַטָּאת", split: "חַטְ | טָאת", note: "The last א is quiescent. Forte in ט still doubles, so the split runs through ט.", ref: "Ps 51:5" },
      { word: "בָּרָא", split: "בָּ | רָא", note: "Final א has no vowel — quiescent. Two open syllables.", ref: "Gen 1:1" },
      { word: "וַיַּרְא", split: "וַיְ | יַרְא", note: "Dagesh in י is forte (wayyiqtol doubles it), so the split runs through י. Silent shewa under ר closes the second slice; the last א is quiescent and stays there — not a slice of its own.", ref: "Gen 1:4" },
      { word: "רֹאשׁ", split: "רֹאשׁ", note: "One closed syllable. א is a quiet companion to holem, not a second onset.", ref: "Gen 2:10" },
      { word: "מָצָא", split: "מָ | צָא", note: "Final quiescent א. Two open slices.", ref: "Gen 2:20" },
    ],
    verses: [
      { ref: "Ps 51:5", he: "כִּי־פְשָׁעַי אֲנִי אֵדָע וְחַטָּאתִי נֶגְדִּי תָמִיד", en: "For I know my transgressions, and my sin is ever before me.", hit: "וְחַטָּאתִי" },
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "בָּרָא" },
      { ref: "Gen 1:4", he: "וַיַּרְא אֱלֹהִים אֶת־הָאוֹר כִּי־טוֹב", en: "God saw the light, that it was good.", hit: "וַיַּרְא", hitEn: "saw" },
      { ref: "Gen 2:10", he: "וְנָהָר יֹצֵא מֵעֵדֶן לְהַשְׁקוֹת אֶת־הַגָּן וּמִשָּׁם יִפָּרֵד וְהָיָה לְאַרְבָּעָה רָאשִׁים", en: "A river went out from Eden to water the garden… and became four heads.", hit: "רָאשִׁים" },
    ],
    quiz: [
      { q: "A vowel-less א is…", choices: ["Quiescent — silent, ignored in the split", "Always a new syllable", "Read as a glottal stop that counts"], answer: "Quiescent — silent, ignored in the split", why: "No vowel on א means it does not start or fill a syllable." },
      { q: "Does quiescent א count as the consonant that starts a syllable?", choices: ["No", "Yes", "Only at the end of a word"], answer: "No", why: "The split treats it as quiet, not as a new onset." },
      { q: "Split of חַטָּאת?", he: "חַטָּאת", ref: "Ps 51:5", choices: ["חַטְ | טָאת", "חַ | טָּאת", "חַטָּ | את"], answer: "חַטְ | טָאת", why: "Forte doubles ט; the final א is quiescent." },
      { q: "In חַטָּאת the dagesh in ט is…", he: "חַטָּאת", ref: "Ps 51:5", choices: ["Forte (after a vowel)", "Lene (after a consonant)", "Not a dagesh"], answer: "Forte (after a vowel)", why: "Pathach precedes it, so ט doubles." },
      { q: "How does בָּרָא split?", he: "בָּרָא", ref: "Gen 1:1", choices: ["בָּ | רָא", "בָּר | אָ", "בָּרָא (one)"], answer: "בָּ | רָא", why: "Two qamets vowels. Final א is quiet." },
      { q: "How many counted syllables in רֹאשׁ?", he: "רֹאשׁ", ref: "Gen 2:10", choices: ["One", "Two", "Three"], answer: "One", why: "Holem is the only vowel. א is quiescent." },
      { q: "Which letter can go quiet like this?", choices: ["א without a vowel", "Any guttural", "Only ה"], answer: "א without a vowel", why: "Quiescence is the א that has lost its vowel." },
      { q: "In וַיַּרְא, the last א is…", he: "וַיַּרְא", ref: "Gen 1:4", choices: ["Quiescent", "A new syllable of its own", "Furtive pathach"], answer: "Quiescent", why: "No vowel on that א." },
      { q: "How does וַיַּרְא split?", he: "וַיַּרְא", ref: "Gen 1:4", choices: ["וַיְ | יַרְא", "וַיַּרְ | א", "וַיַּרְא (one)"], answer: "וַיְ | יַרְא", why: "Forte in י (the prefix doubles it) — split through י, like אַתְ | תָּה. Quiet א stays in the second slice." },
      { q: "How does מָצָא split?", he: "מָצָא", choices: ["מָ | צָא", "מָצ | אָ", "מָצָא (one)"], answer: "מָ | צָא", why: "Two open slices; final א is quiet." },
      { q: "If א has a vowel under it, it is…", choices: ["A real consonant/onset for that syllable", "Always quiescent anyway", "Always a vowel letter only"], answer: "A real consonant/onset for that syllable", why: "Alef with a vowel starts (or fills) a slice. Quiet alef has none." },
      { q: "In בְּרֵאשִׁית, the א after tsere is…", he: "בְּרֵאשִׁית", ref: "Gen 1:1", choices: ["Quiescent — no vowel of its own", "The start of a new syllable א | שִׁית", "Furtive"], answer: "Quiescent — no vowel of its own", why: "The vowel is tsere on ר. א is quiet in that slice." },
      { q: "Quiescent א is still written because…", choices: ["It belongs to the spelling, not the split", "It always doubles the previous letter", "It marks an accent"], answer: "It belongs to the spelling, not the split", why: "You see it; you do not cut by it." },
      { q: "Compare בָּרָא and בָּרָאת. The extra ת…", choices: ["Adds a closing consonant to the last slice", "Makes the א vocal", "Adds a furtive pathach"], answer: "Adds a closing consonant to the last slice", why: "א stays quiet; ת can close the last syllable." },
      { q: "In וְחַטָּאתִי, the root still splits through…", he: "וְחַטָּאתִי", ref: "Ps 51:5", choices: ["The forte ט, with quiet א in the next slice", "The א, which starts a new syllable", "Nothing — one slice"], answer: "The forte ט, with quiet א in the next slice", why: "Same forte split as חַטָּאת, plus prefix and suffix." },
    ],
  },
  {
    id: 7,
    title: "Diphthongs",
    short: "ay / aw",
    rule:
      "Two tight clusters act as one sound: the ay-group in בַּיִת (house) and the aw-group in מָוֶת (death). A syllable that holds one of them is closed, because it still ends with a consonant. Some words are a single closed syllable for that reason. The dual ending is that same ay-group plus ם — required. So עֵינַיִם and יָדַיִם keep the cluster: do not cut it.",
    samples: [
      { word: "שָׁמַיִם", split: "שָׁ | מַיִם", note: "The second slice holds the ay cluster and is closed.", ref: "Gen 1:1" },
      { word: "בַּיִת", split: "בַּיִת", note: "One closed syllable — the ay group is not cut.", ref: "Prov 24:3" },
      { word: "מָוֶת", split: "מָוֶת", note: "One closed syllable — the aw group stays together.", ref: "Ps 23:4" },
      { word: "יַיִן", split: "יַיִן", note: "One closed syllable with the ay cluster.", ref: "Gen 9:21" },
      { word: "לַיְלָה", split: "לַיְ | לָה", note: "Ay cluster in the first slice (closed), then לָה.", ref: "Gen 1:5" },
      { word: "יָדַיִם", split: "יָ | דַיִם", note: "Dual: the second slice is the ay diphthong plus ם. Required. Do not cut it.", ref: "Prov 6:17" },
    ],
    verses: [
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "הַשָּׁמַיִם" },
      { ref: "Prov 24:3", he: "בַּחָכְמָה יִבָּנֶה בָּיִת וּבִתְבוּנָה יִתְכּוֹנָן", en: "By wisdom a house is built, and by understanding it is established.", hit: "בָּיִת" },
      { ref: "Ps 23:4", he: "גַּם כִּי־אֵלֵךְ בְּגֵיא צַלְמָוֶת לֹא־אִירָא רָע", en: "Even though I walk through the valley of deep darkness, I will not fear evil.", hit: "צַלְמָוֶת", hitEn: "deep darkness" },
      { ref: "Gen 9:21", he: "וַיֵּשְׁתְּ מִן־הַיַּיִן וַיִּשְׁכָּר", en: "He drank of the wine and became drunk.", hit: "הַיַּיִן", hitEn: "the wine" },
      { ref: "Prov 6:17", he: "עֵינַיִם רָמוֹת לְשׁוֹן שָׁקֶר וְיָדַיִם שֹׁפְכוֹת דָּם־נָקִי", en: "Haughty eyes, a lying tongue, and hands that shed innocent blood.", hit: "יָדַיִם", hitEn: "hands" },
    ],
    quiz: [
      { q: "A syllable with the ay cluster is…", choices: ["Closed — it ends with a consonant", "Open — yod is a vowel letter here", "Not a syllable"], answer: "Closed — it ends with a consonant", why: "The cluster still finishes on a consonant." },
      { q: "Split of שָׁמַיִם?", he: "שָׁמַיִם", ref: "Gen 1:1", choices: ["שָׁ | מַיִם", "שָׁמַ | יִם", "שָׁ | מַ | יִם"], answer: "שָׁ | מַיִם", why: "Do not cut the ay group." },
      { q: "בַּיִת is…", he: "בַּיִת", ref: "Prov 24:3", choices: ["One closed syllable", "Two syllables בַּ | יִת", "Open then closed"], answer: "One closed syllable", why: "The whole ay cluster stays in one slice." },
      { q: "מָוֶת holds which cluster?", he: "מָוֶת", ref: "Ps 23:4", choices: ["aw", "ay", "Neither — two full vowels"], answer: "aw", why: "The ָוֶ group is the aw diphthong." },
      { q: "May you split inside ַיִ?", choices: ["No — keep the cluster", "Yes — yod always starts a new syllable", "Only if the word is plural"], answer: "No — keep the cluster", why: "The diphthong is one unit." },
      { q: "How many syllables in יַיִן?", he: "יַיִן", ref: "Gen 9:21", choices: ["One", "Two", "Three"], answer: "One", why: "Ay cluster, one closed slice." },
      { q: "How does לַיְלָה split?", he: "לַיְלָה", ref: "Gen 1:5", choices: ["לַיְ | לָה", "לַ | יְלָה", "לַיְלָה (one)"], answer: "לַיְ | לָה", why: "Ay cluster closes the first slice; then לָה." },
      { q: "In הַשָּׁמַיִם, after the article and the forte ש, the ay lives in…", he: "הַשָּׁמַיִם", ref: "Gen 1:1", choices: ["מַיִם", "שָׁמַ", "הַשְׁ"], answer: "מַיִם", why: "הַשְׁ | שָׁ | מַיִם — the last slice keeps ay together." },
      { q: "In צַלְמָוֶת, the aw cluster is in…", he: "צַלְמָוֶת", ref: "Ps 23:4", choices: ["מָוֶת", "צַלְ", "A separate וֶ slice"], answer: "מָוֶת", why: "Do not cut ָוֶ. צַלְ is a closed first slice." },
      { q: "The ay group is built from…", choices: ["Pathach (or similar) + yod + hireq", "Two qamets vowels", "Shewa + alef"], answer: "Pathach (or similar) + yod + hireq", why: "That tight bundle is the diphthong." },
      { q: "The aw group is built from…", choices: ["Qamets + vav + segol (or similar)", "Holem-vav alone", "Two shewas"], answer: "Qamets + vav + segol (or similar)", why: "That bundle is the aw diphthong." },
      { q: "If you wrongly split בַּיִת as בַּ | יִת you have…", he: "בַּיִת", ref: "Prov 24:3", choices: ["Cut a diphthong — too many slices", "The only correct split", "Dropped a furtive pathach"], answer: "Cut a diphthong — too many slices", why: "Keep ay in one closed syllable." },
      { q: "A diphthong syllable is closed because…", choices: ["It still ends with a consonant", "Every Hebrew syllable is closed", "Yod and vav are always vowels"], answer: "It still ends with a consonant", why: "The cluster’s last sound is consonantal." },
      { q: "In Gen 1:1 הַשָּׁמַיִם, how many slices after you respect forte and ay?", he: "הַשָּׁמַיִם", ref: "Gen 1:1", choices: ["Three: הַשְׁ | שָׁ | מַיִם", "Two: הַ | שָּׁמַיִם", "Four: הַ | שָׁ | מַ | יִם"], answer: "Three: הַשְׁ | שָׁ | מַיִם", why: "Forte doubles ש; ay stays uncut." },
      { q: "A dual noun is dual only when the ending holds…", he: "יָדַיִם", ref: "Prov 6:17", choices: ["The ay diphthong plus ם", "Any yod-mem", "A hireq before yod"], answer: "The ay diphthong plus ם", why: "Same cluster as בַּיִת. That diphthong is required. ִים without it is many, not a pair." },
      { q: "How does יָדַיִם split?", he: "יָדַיִם", ref: "Prov 6:17", choices: ["יָ | דַיִם", "יָדַ | יִם", "יָ | דַ | יִם"], answer: "יָ | דַיִם", why: "Keep the ay diphthong in one closed slice." },
      { q: "How does סוּסַיִם split?", he: "סוּסַיִם", choices: ["סוּ | סַיִם", "סוּסַ | יִם", "סוּסַיִם (one)"], answer: "סוּ | סַיִם", why: "Dual ending is the ay-group plus ם. Do not cut it." },
    ],
  },
  {
    id: 8,
    title: "Gutturals and vowel seats",
    short: "Advanced",
    rule:
      "Short vowels prefer a closed unaccented seat or an open accented seat. Long vowels prefer a closed accented seat or an open pretonic seat. Vocal shewa and hatephs prefer an open propretonic seat (hatephs with gutturals). Gutturals refuse dagesh forte, refuse vocal shewa (hateph instead), and lean toward a-class vowels. ר refuses dagesh but may take vocal shewa.",
    samples: [
      { word: "עֶבֶד", split: "עֶ | בֶד", note: "Short e in an open first slice, and short e in a closed second.", ref: "Josh 1:1" },
      { word: "אֱלֹהִים", split: "אֱ | לֹ | הִים", note: "Hateph under guttural א in an open propretonic syllable.", ref: "Gen 1:1" },
      { word: "דְּבָרִים", split: "דְּ | בָ | רִים", note: "Vocal shewa in the open propretonic slice.", ref: "Gen 15:1" },
      { word: "יַעֲקֹב", split: "יַ | עֲ | קֹב", note: "Hateph pathach under guttural ע — not a vocal shewa.", ref: "Gen 32:29" },
      { word: "אַהֲרֹן", split: "אַ | הֲ | רֹן", note: "Hateph pathach under ה, a guttural.", ref: "Exod 4:14" },
    ],
    verses: [
      { ref: "Gen 1:1", he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth.", hit: "אֱלֹהִים" },
      { ref: "Josh 1:1", he: "וַיְהִי אַחֲרֵי מוֹת מֹשֶׁה עֶבֶד יְהוָה וַיֹּאמֶר יְהוָה אֶל־יְהוֹשֻׁעַ", en: "After the death of Moses, servant of YHWH, YHWH spoke to Joshua.", hit: "עֶבֶד" },
      { ref: "Gen 32:29", he: "לֹא יַעֲקֹב יֵאָמֵר עוֹד שִׁמְךָ כִּי אִם־יִשְׂרָאֵל", en: "Your name shall no longer be said Jacob, but Israel.", hit: "יַעֲקֹב" },
      { ref: "Exod 4:14", he: "הֲלֹא אַהֲרֹן אָחִיךָ הַלֵּוִי", en: "Is not Aaron your brother, the Levite?", hit: "אַהֲרֹן" },
    ],
    quiz: [
      { q: "Long vowels prefer…", choices: ["Closed-accented or open-pretonic", "Only closed unaccented", "Only hateph seats"], answer: "Closed-accented or open-pretonic", why: "That is their usual home." },
      { q: "Vocal shewa and hatephs prefer…", choices: ["Open, propretonic syllables", "Closed, accented syllables", "The end of the word"], answer: "Open, propretonic syllables", why: "Two seats back from the accent, and open." },
      { q: "Gutturals cannot take…", choices: ["Dagesh forte", "Pathach", "Any a-class vowel"], answer: "Dagesh forte", why: "They (and ר) refuse the dot that doubles." },
      { q: "Instead of vocal shewa, a guttural takes…", choices: ["A hateph (reduced) vowel", "Silent shewa only", "Qamets hatuf"], answer: "A hateph (reduced) vowel", why: "Hatephs are the guttural’s vocal shewa." },
      { q: "ר is unlike the other gutturals in that it…", choices: ["May take vocal shewa", "Takes dagesh forte freely", "Never appears with a-class vowels"], answer: "May take vocal shewa", why: "ר refuses dagesh, but vocal shewa is allowed." },
      { q: "How does אֱלֹהִים split?", he: "אֱלֹהִים", ref: "Gen 1:1", choices: ["אֱ | לֹ | הִים", "אֱלֹ | הִים", "אֱלֹהִים (one)"], answer: "אֱ | לֹ | הִים", why: "Hateph opens; holem; then hiriq-yod." },
      { q: "How does עֶבֶד split?", he: "עֶבֶד", ref: "Josh 1:1", choices: ["עֶ | בֶד", "עֶב | ֶד", "עֶבֶד (one)"], answer: "עֶ | בֶד", why: "Two short e vowels: open, then closed." },
      { q: "How does יַעֲקֹב split?", he: "יַעֲקֹב", ref: "Gen 32:29", choices: ["יַ | עֲ | קֹב", "יַעֲ | קֹב", "יַ | עֲקֹב"], answer: "יַ | עֲ | קֹב", why: "Hateph under ע is its own open slice. Do not treat it as silent shewa." },
      { q: "How does אַהֲרֹן split?", he: "אַהֲרֹן", ref: "Exod 4:14", choices: ["אַ | הֲ | רֹן", "אַהֲ | רֹן", "אַ | הַרֹן"], answer: "אַ | הֲ | רֹן", why: "Hateph under the guttural ה opens a slice." },
      { q: "How does דְּבָרִים split?", he: "דְּבָרִים", ref: "Gen 15:1", choices: ["דְּ | בָ | רִים", "דְּבָ | רִים", "דְּבָרִים (one)"], answer: "דְּ | בָ | רִים", why: "Vocal shewa propretonic; qamets pretonic; then the accented last slice." },
      { q: "Short vowels prefer…", choices: ["Closed unaccented, or open accented", "Only open pretonic", "Hateph seats"], answer: "Closed unaccented, or open accented", why: "That is their usual pair of seats." },
      { q: "In אֱלֹהִים the ֱ under א is…", he: "אֱלֹהִים", ref: "Gen 1:1", choices: ["Hateph segol — a reduced vowel, open slice", "Silent shewa", "Qamets hatuf"], answer: "Hateph segol — a reduced vowel, open slice", why: "Gutturals take hateph, not vocal shewa." },
      { q: "Why not put dagesh forte in עֶבֶד’s ע?", he: "עֶבֶד", ref: "Josh 1:1", choices: ["Gutturals refuse dagesh forte", "Ayin never starts a word", "The word has no vowels"], answer: "Gutturals refuse dagesh forte", why: "ע is a guttural." },
      { q: "Propretonic means…", choices: ["Two seats before the accent", "The accented slice itself", "A furtive pathach"], answer: "Two seats before the accent", why: "Pretonic is one before; propretonic is two before." },
    ],
  },
];

export function syllableUnit(id: number): SyllableUnit | undefined {
  return SYLLABLE_UNITS.find((u) => u.id === id);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleQuiz(unit: SyllableUnit): SyllableQuiz[] {
  const items = unit.quiz.map((q) => ({
    ...q,
    choices: shuffle(q.choices),
  }));
  return shuffle(items).slice(0, Math.min(SYLLABLE_QUIZ_LEN, items.length));
}

export function starsFromSyllableScore(pct: number): number {
  if (pct >= 90) return 3;
  if (pct >= 70) return 2;
  return 1;
}

export function highlightParts(he: string, hit: string): { before: string; hit: string; after: string } {
  const i = he.indexOf(hit);
  if (i < 0) return { before: he, hit: "", after: "" };
  return { before: he.slice(0, i), hit, after: he.slice(i + hit.length) };
}
