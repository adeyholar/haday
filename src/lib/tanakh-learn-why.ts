/** Passage notes for Learn → In the Tanakh. Original teaching; Masoretic text; citation glosses as in public lexica. */

export const LEARN_WHY: Record<string, string> = {
  // Article 1 — definite / indefinite
  "article|Ps 24:8|מֶלֶךְ":
    "The psalm asks who this king of glory is. מֶלֶךְ has no article — “king / a king.” Right beside it הַכָּבוֹד wears הַ. One line shows both: a bare noun, then a marked “the.”",
  "article|Ps 24:8|הַכָּבוֹד":
    "The question is not about glory in general. הַכָּבוֹד is כָּבוֹד “glory, weight” with the article — that known glory of YHWH. Pathach plus dagesh in כ is the rule doing the verse’s work.",
  "article|Gen 1:1|הָאָרֶץ":
    "Creation names the whole known earth, not “a land.” הָאָרֶץ is the lemma אֶרֶץ with the article (qamets before the guttural). The verse needs “the earth” as the other half of “the heavens.”",
  "article|Deut 6:4|יִשְׂרָאֵל":
    "The Shema calls a people by name. יִשְׂרָאֵל is definite as a proper name — no הַ. That is how the command can say Hear, Israel, without an article.",

  // Article 2 — everyday הַ + dagesh
  "article|Exod 14:21|הַיָּם":
    "Moses stretches his hand over הַיָּם. Not a sea: the sea they are crossing. יָם is the citation lemma; the article plus dagesh in י points to that body of water in the story.",
  "article|Lev 1:7|הַמִּזְבֵּחַ":
    "Aaron’s sons put fire on הַמִּזְבֵּחַ. The altar of the offering is a known place in the camp. מִזְבֵּחַ takes הַ and a dagesh in מ — “the altar,” the one this rite uses.",
  "article|Ruth 4:1|הַשַּׁעַר":
    "Boaz goes up הַשַּׁעַר and sits. The city gate is where legal business happens. שַׁעַר with הַ and dagesh in ש is that public gate, not any doorway.",
  "article|Josh 1:8|הַתּוֹרָה":
    "This book of הַתּוֹרָה is not to leave Joshua’s mouth. תּוֹרָה “instruction” plus the article names that known teaching — the book in his hand — ת taking the article’s dagesh.",

  // Article 3 — gutturals
  "article|Gen 2:7|הָאָדָם":
    "YHWH forms הָאָדָם from the dust. Not “a human” in the abstract: the human of this scene. א cannot take dagesh, so the article lengthens to הָ on אָדָם.",
  "article|Gen 22:6|הָאֵשׁ":
    "Abraham carries הָאֵשׁ and the knife up the mountain. The fire for the offering is a definite thing in his hand. אֵשׁ begins with א — guttural — so the article is הָ, no dagesh.",
  "article|Isa 6:1|הַהֵיכָל":
    "Isaiah sees the Lord’s train filling הַהֵיכָל. The noun begins with ה. ה is a guttural, so there is no doubling after הַ — pathach stays, no dagesh in ה.",
  "article|Gen 3:24|הַחֶרֶב":
    "East of the garden stands the flame of הַחֶרֶב that turns. The sword is the known guard on that path. ח is a guttural: article הַ, no dagesh in ח.",
  "article|Exod 13:22|הֶעָנָן":
    "The pillar of הֶעָנָן does not leave the people. ע often takes seghol on the article (הֶ). The cloud is that guiding pillar — “the cloud,” not weather in general.",
  "article|Eccl 2:14|הֶחָכָם":
    "הֶחָכָם has his eyes in his head; the fool walks in darkness. ח here takes the seghol article. The wise man is a type the verse sets against the fool — definite by the article.",

  // Article 4 — vocal shewa / י
  "article|1 Kgs 12:8|הַיְלָדִים":
    "Rehoboam leaves the elders and takes counsel with הַיְלָדִים who grew up with him. The article sits on a shewa: הַיְ. Those young men are a known circle at court.",
  "article|Josh 6:22|הַמְרַגְּלִים":
    "Joshua speaks to the two men הַמְרַגְּלִים — who had spied the land. The article on a shewa (מְ) points back to those two spies, already in the story.",
  "article|Gen 2:10|הַגָּן":
    "A river goes out of Eden to water הַגָּן. Not a garden: the garden God planted. גַּן with הַ and dagesh is that enclosed place.",
  "article|Exod 19:16|הָהָר":
    "Thunder and a thick cloud sit on הָהָר. Sinai is “the mountain” of this meeting. ה cannot take dagesh, so the article is הָ on הַר.",
  "article|Deut 12:2|הֶהָרִים":
    "Israel must destroy the high places of the nations on הֶהָרִים. “The mountains” where they served other gods. ה as a guttural takes the seghol article in the plural.",

  // Article 5 — ו
  "article|Gen 1:1|וְאֵת":
    "The heavens and the earth are a pair. וְאֵת is וְ “and” plus אֵת, joining the second object to the first. The conjunction is how the verse holds both halves of creation together.",
  "article|Gen 24:35|וּבָקָר":
    "YHWH has given Abraham flocks וּבָקָר, silver and gold. Labial ב after ו takes the shureq spelling וּ. The “and” stacks the gifts in one list.",
  "article|2 Kgs 3:9|וּמֶלֶךְ":
    "Three kings go out: Israel, Judah, וּמֶלֶךְ Edom. Each וּ adds another king to the campaign. מ is labial, so the conjunction is וּ, not וְ.",
  "article|Exod 1:1|וּבֵיתוֹ":
    "Each man of Jacob came to Egypt וּבֵיתוֹ — and his house. The ו ties household to the man. Labial ב: וּ.",
  "article|1 Sam 18:16|וִיהוּדָה":
    "All Israel וִיהוּדָה loved David. Before י the conjunction is often וִ. The “and” makes Judah stand with Israel as one love.",
  "article|Exod 34:6|וֶאֱמֶת":
    "YHWH is abundant in ḥesed וֶאֱמֶת. Before א with a hateph the ו takes seghol (וֶ). Love and truth are joined as one character of God.",
  "article|Gen 50:24|וֵאלֹהִים":
    "Joseph is dying, וֵאלֹהִים will surely visit them. Before elohim the ו is וֵ. The “and/but” turns the deathbed into a promise: God, not Joseph, will act.",
  "article|Gen 1:2|וָבֹהוּ":
    "The earth was tohu וָבֹהוּ — waste and void. Before ב with qamets the ו can be וָ. The pair is one picture of unformed earth.",

  // Article 6 — mix
  "article|Gen 1:1|הַשָּׁמַיִם":
    "God creates הַשָּׁמַיִם and the earth. Dual-looking שָׁמַיִם is “the heavens” as the known sky-vault. Article plus dagesh in ש: not some heavens, the heavens of this world.",
  "article|Gen 1:2|וְהָאָרֶץ":
    "וְהָאָרֶץ was waste and void. ו plus the article on אֶרֶץ: “and the earth.” The same earth named in 1:1 is now described. Conjunction and article both sit on one word.",
  "article|Deut 6:6|הַיּוֹם":
    "These words I command you הַיּוֹם shall be on your heart. “This day” is the day of the command. יוֹם with the article is that today, not a day in general.",
  "article|1 Sam 24:9|הַמֶּלֶךְ":
    "David calls after Saul, “My lord הַמֶּלֶךְ.” The article on מֶלֶךְ is how you address the known king in the cave — not a king, the king.",
  "article|Gen 1:5|לָאוֹר":
    "God called לָאוֹר Day. ל plus the article (often fused as לָ before a guttural) marks the light he just made. The naming needs a definite object: that light.",
  "article|Jonah 1:9|הַיָּם":
    "Jonah fears the God who made הַיָּם and the dry land. On the ship, “the sea” is the sea under them. Same lemma יָם, article pointing at the created sea that is about to storm.",

  // Nouns 1 — gender and number
  "noun|Ps 24:8|מֶלֶךְ":
    "Who is this מֶלֶךְ of glory? Bare masculine singular — no ִים, no dual. The psalm is hunting one king. The ending (here, the lack of one) is how you know it is not “kings.”",
  "noun|Ps 19:8|תּוֹרַת":
    "תּוֹרַת YHWH is complete, restoring the life. Construct feminine of תּוֹרָה: “instruction of.” The ending tells you the noun is feminine; the verse then says what that instruction does.",
  "noun|Prov 6:17|עֵינַיִם":
    "The list of hated things begins with עֵינַיִם raised high. Dual: a pair of eyes, the ay-diphthong plus ם. Pride sits on those two eyes — not “many eyes.”",
  "noun|Ps 2:2|מַלְכֵי":
    "מַלְכֵי earth take their stand. Construct plural of מֶלֶךְ: “kings of.” The ֵי ending is many kings, joined to “earth.” Nations’ rulers, not one king.",

  // Nouns 2 — masculine endings
  "noun|Gen 15:1|הַדְּבָרִים":
    "After הַדְּבָרִים these, the word of YHWH comes to Abram. דָּבָר “word, thing” in the masculine plural. “These things” are the events just told — many, marked ִים.",
  "noun|Gen 1:5|יוֹם":
    "God named the light יוֹם. Bare masculine singular: one day, the first. No plural ending. The naming of Day starts with this one form.",
  "noun|Gen 1:14|וּלְיָמִים":
    "Lights are for signs, seasons, וּלְיָמִים and years. יָמִים is the masculine plural of יוֹם. Days in the calendar, not a pair (that would need the dual diphthong).",
  "noun|Exod 15:1|סוּס":
    "Horse and rider YHWH hurled into the sea. סוּס is masculine singular — one typical horse in the song of the drowned army. The ending-less form is the citation lemma.",

  // Nouns 3 — feminine
  "noun|Gen 9:9|בְּרִיתִי":
    "I am establishing בְּרִיתִי with you. בְּרִית is feminine; the ִי is “my.” The covenant God names is that known bond — feminine noun plus possessive, still definite.",
  "noun|Ps 145:13|מַלְכוּתְךָ":
    "מַלְכוּתְךָ is a kingdom of all ages. מַלְכוּת is a feminine abstract (“kingship, kingdom”). Your-ending on a feminine noun: the rule that does not end.",
  "noun|Prov 6:17|וְיָדַיִם":
    "And יָדַיִם that shed innocent blood. Dual of יָד, a pair of hands. The verse condemns those two hands at work — ay-diphthong plus ם, same cluster as in בַּיִת.",

  // Nouns 4 — special dual / irregular
  "noun|Gen 1:1|הָאָרֶץ":
    "The earth in 1:1 is הָאָרֶץ, feminine in agreement later (הָיְתָה in 1:2). Gender is the ending-set the word follows. Here the article plus אֶרֶץ names the created land-world.",
  "noun|Gen 1:2|הַמָּיִם":
    "The spirit hovers over the face of הַמָּיִם. מַיִם is dual in form, usually singular in meaning: “water.” The deep’s water is one mass — look it up as מַיִם, not as a pair of waters.",
  "noun|Exod 20:2|מִצְרַיִם":
    "Brought out of the land of מִצְרַיִם. Dual in form (two Egypts, Upper and Lower, in the name), treated as a place-name. Definite as a name, no הַ needed.",
  "noun|Exod 3:15|אֲבֹתֵיכֶם":
    "God of אֲבֹתֵיכֶם — your fathers. אָב is masculine but takes a feminine-looking plural אָבוֹת. The ending is the exception the lexicon lists; the verse means the ancestors.",

  // Nouns 5 — endingless feminine / gender surprises
  "noun|Ps 137:3|שִׁיר":
    "Captors asked for דִּבְרֵי־שִׁיר, words of song. שִׁיר is often masculine. The construct “words of song” still reads the lemma as song — check gender in the lexicon, not by meaning alone.",
  "noun|Ps 2:1|גוֹיִם":
    "Why do גוֹיִם rage? גּוֹי “nation” with masculine plural ִים. Many nations, not a dual pair. The psalm’s “why” is aimed at that many.",
  "noun|Gen 2:24|אִישׁ":
    "Therefore an אִישׁ leaves father and mother. Masculine singular, endingless: a man, the typical husband in the verse. No ִים, no dual.",
  "noun|Gen 4:17|עִיר":
    "Cain was building an עִיר. עִיר “city” is feminine and often endingless in the singular. Gender shows up when adjectives and verbs agree — here the lemma itself is the city he names.",

  // Nouns 6 — mix
  "noun|Gen 1:1|הַשָּׁמַיִם":
    "הַשָּׁמַיִם looks dual (-ayim) and is the sky God made. Number on the ending can be a frozen pair-form with a singular sense. Look it up as שָׁמַיִם.",
  "noun|Gen 5:4|בָּנִים":
    "Adam fathered בָּנִים וּבָנוֹת. בֵּן takes the masculine plural ִים even though the singular is short. Sons as many — the regular many-ending on an irregular stem.",
  "noun|Gen 13:12|בְּעָרֵי":
    "Lot settled בְּעָרֵי the plain. Construct plural of עִיר (feminine): “in the cities of.” ֵי is the construct many-ending. The verse places Lot among those towns.",
  "noun|Deut 6:1|הַחֻקִּים":
    "This is the command, הַחֻקִּים, and the judgments. חֹק “statute” in masculine plural. The many-ending lists the known statutes Moses is about to speak.",

  // Syllables 1 — open / closed
  "syllable|Gen 15:1|הַדְּבָרִים":
    "After these הַדְּבָרִים the word of YHWH comes. Several vowels, so several syllables: start by counting vowels, then cut. The “things” just told are this marked word.",
  "syllable|Gen 1:26|אָדָם":
    "Let us make אָדָם in our image. אָ | דָם — open, then closed. The human of creation is two vowels, two slices, in the sentence that founds humankind.",
  "syllable|Num 6:26|שָׁלוֹם":
    "YHWH set שָׁלוֹם for you. שָׁ | לוֹם — the blessing’s last gift is two syllables, the second closed. Peace is that marked word at the end of the priestly line.",
  "syllable|Ps 24:8|מֶלֶךְ":
    "Who is this מֶלֶךְ of glory? מֶ | לֶךְ. The king the psalm seeks is two vowels in the question itself.",

  // Syllables 2 — dagesh
  "syllable|Gen 49:8|אַתָּה":
    "Judah, אַתָּה — your brothers will praise you. The dagesh in ת is forte: אַתּ | תָּה. The split runs through the doubled ת. “You” is that marked word of address.",
  "syllable|Gen 1:1|הַשָּׁמַיִם":
    "הַשָּׁמַיִם: article’s dagesh in ש. הַשּׁ | שָׁ | מַ | יִם — first ש takes shewa and closes, the second takes the vowel. The heavens of 1:1 wear that doubling.",
  "syllable|Gen 2:23|אִשָּׁה":
    "This one shall be called אִשָּׁה. Dagesh forte in ש: split through it. The name “woman” in the naming verse is that doubled ש.",
  "syllable|Exod 20:12|כַּבֵּד":
    "כַּבֵּד your father and mother. Dagesh in ב is the piel doubling. Honor is a doubled middle letter — the command’s first word.",
  "syllable|Gen 3:17|שָׁמַעְתָּ":
    "Because you שָׁמַעְתָּ to your wife’s voice. Silent shewa on ע: שָׁ | מַעְ | תָּ. Dagesh in ת after silent shewa is lene, not a split. The listening that brought the ground’s curse is this form.",

  // Syllables 3 — shewa
  "syllable|Exod 5:1|פַּרְעֹה":
    "Moses and Aaron speak to פַּרְעֹה. Silent shewa on ר: פַּרְ | עֹה. Pharaoh in the confrontation is a closed first slice, then the rest of the name.",
  "syllable|Gen 1:1|בְּרֵאשִׁית":
    "בְּרֵאשִׁית — vocal shewa on ב is not a full vowel. The “in beginning” that opens the Torah starts with a reduced slice, then רֵא | שִׁית.",
  "syllable|Deut 6:4|יִשְׂרָאֵל":
    "Hear, יִשְׂרָאֵל. Silent shewa on שׂ: יִשְׂ | רָאֵל. The name you are commanded to hear is cut after that silent close.",
  "syllable|1 Sam 3:10|שְׁמוּאֵל":
    "שְׁמוּאֵל said, Speak, your servant is listening. Vocal shewa on ש: a short first slice in the name of the boy who learns to hear.",

  // Syllables 4 — furtive / reduced
  "syllable|Prov 1:7|חָכְמָה":
    "Fear of YHWH is the beginning of knowledge; fools despise חָכְמָה. Vocal shewa on כ: חָ | כְ | מָה. Wisdom in this motto is three slices, the middle reduced.",
  "syllable|Exod 19:5|מִכָּל":
    "A treasured possession מִכָּל the peoples. מִ | כָּל — closed, then closed. “Out of all” is how Israel is set apart at Sinai.",
  "syllable|Deut 6:5|בְּכָל":
    "Love YHWH בְּכָל your heart. Vocal shewa on ב, then כָּל. “With all” is the measure of the love command.",
  "syllable|Gen 1:5|קָרָא":
    "God קָרָא the light Day. קָ | רָא — open, open. The naming act is two open slices in the first week.",

  // Syllables 5 — qamets / hateph
  "syllable|Gen 1:2|וְרוּחַ":
    "וְרוּחַ of God hovering on the water. Furtive pathach on ח: the vowel is sounded before the guttural at the end. “And the spirit” is that marked breath over the deep.",
  "syllable|Gen 1:6|רָקִיעַ":
    "Let there be a רָקִיעַ in the midst of the waters. Furtive pathach on ע. The expanse of day two ends with that little vowel before the guttural.",
  "syllable|Gen 6:9|נֹחַ":
    "נֹחַ was a righteous man. Furtive pathach on ח in a one-syllable name. Noah in his toledot wears that final sneak-vowel.",
  "syllable|Isa 19:20|מוֹשִׁיעַ":
    "He will send them a מוֹשִׁיעַ. Furtive pathach on ע. “Savior” at the end of the word is still one last vowel before the guttural.",

  // Syllables 6 — long / diphthong
  "syllable|Ps 51:5|וְחַטָּאתִי":
    "My sin is ever before me: וְחַטָּאתִי. Dagesh forte in ט, suffix ִי. The confession’s “my sin” is that marked form — split through the doubled letter, then the ending.",
  "syllable|Gen 1:1|בָּרָא":
    "God בָּרָא the heavens and the earth. בָּ | רָא. The creating verb of the opening line is two open syllables — one vowel each.",
  "syllable|Gen 1:4|וַיַּרְא":
    "God וַיַּרְא the light, that it was good. Wayyiqtol: וַ | יַּרְ | א. The seeing that judges the light is this prefixed, closed-middle form.",
  "syllable|Gen 2:10|רָאשִׁים":
    "The river became four רָאשִׁים. רֹאשׁ “head” in the plural. Four heads of the river — the ending ִים is many, and the first vowel is the stem of “head.”",

  // Syllables 7 — mix / diphthong
  "syllable|Prov 24:3|בָּיִת":
    "By wisdom a בָּיִת is built. The ay-diphthong in בַּיִת is one cluster, not two vowels to split apart. “House” in this proverb is that diphthong closed by ת.",
  "syllable|Ps 23:4|צַלְמָוֶת":
    "The valley of צַלְמָוֶת. Compound “shadow-death.” Walk through that marked place: more than one vowel, so more than one slice, in the psalm of not fearing.",
  "syllable|Gen 9:21|הַיַּיִן":
    "Noah drank of הַיַּיִן and became drunk. Article plus יַיִן. The wine of the vineyard after the flood is this definite form — י with the article’s dagesh.",
  "syllable|Prov 6:17|יָדַיִם":
    "יָדַיִם that shed innocent blood. Dual diphthong plus ם: a pair of hands. The hated thing is those two hands, not a long plural.",

  // Syllables 8 — names / mix
  "syllable|Gen 1:1|אֱלֹהִים":
    "אֱלֹהִים created. Hateph seghol on א is reduced, not a full vowel count in the same way. The subject of 1:1 is this name — look it up as אֱלֹהִים.",
  "syllable|Josh 1:1|עֶבֶד":
    "After the death of Moses עֶבֶד YHWH. Segolate: two vowels, typically two slices עֶ | בֶד. “Servant of YHWH” is Moses’ title as the book of Joshua opens.",
  "syllable|Gen 32:29|יַעֲקֹב":
    "Your name shall no longer be יַעֲקֹב but Israel. Hateph patach on ע. The old name in the renaming scene is that reduced guttural slice.",
  "syllable|Exod 4:14|אַהֲרֹן":
    "Is not אַהֲרֹן your brother? Hateph patach on ה. Aaron is named into the mission — the reduced vowel sits in the middle of the brother’s name.",
};

export function learnWhyKey(kind: string, ref: string, hit: string): string {
  return `${kind}|${ref}|${hit}`;
}
