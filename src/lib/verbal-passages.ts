/** One Tanakh verse for each Verbal System root. Shown only after every form is right. */
export type VerbalPassage = { ref: string; where: string; he: string; en: string; query: string };

export const VERBAL_PASSAGES: Record<string, VerbalPassage> = {
  "shamar": {
    "ref": "Gen.2.15",
    "where": "Genesis 2:15",
    "he": "וַיִּקַּ֛ח יְהוָ֥ה אֱלֹהִ֖ים אֶת הָֽאָדָ֑ם וַיַּנִּחֵ֣הוּ בְגַן עֵ֔דֶן לְעָבְדָ֖הּ וּלְשָׁמְרָֽהּ",
    "en": "Yahweh God took the man, and put him into the garden of Eden to cultivate and keep it.",
    "query": "שמר"
  },
  "katav": {
    "ref": "Deut.6.9",
    "where": "Deuteronomy 6:9",
    "he": "וּכְתַבְתָּ֛ם עַל מְזוּזֹ֥ת בֵּיתֶ֖ךָ וּבִשְׁעָרֶֽיךָ",
    "en": "You shall write them on the door posts of your house and on your gates.",
    "query": "כתב"
  },
  "paqad": {
    "ref": "Gen.21.1",
    "where": "Genesis 21:1",
    "he": "וַֽיהוָ֛ה פָּקַ֥ד אֶת שָׂרָ֖ה כַּאֲשֶׁ֣ר אָמָ֑ר וַיַּ֧עַשׂ יְהוָ֛ה לְשָׂרָ֖ה כַּאֲשֶׁ֥ר דִּבֵּֽר",
    "en": "Yahweh visited Sarah as he had said, and Yahweh did to Sarah as he had spoken.",
    "query": "פקד"
  },
  "zakar": {
    "ref": "Gen.8.1",
    "where": "Genesis 8:1",
    "he": "וַיִּזְכֹּ֤ר אֱלֹהִים֙ אֶת נֹ֔חַ וְאֵ֤ת כָּל הַֽחַיָּה֙ וְאֶת כָּל הַבְּהֵמָ֔ה אֲשֶׁ֥ר אִתּ֖וֹ בַּתֵּבָ֑ה וַיַּעֲבֵ֨ר אֱלֹהִ֥ים ר֨וּחַ֙ עַל הָאָ֔רֶץ וַיָּשֹׁ֖כּוּ הַמָּֽיִם",
    "en": "God remembered Noah, all the animals, and all the livestock that were with him in the ship; and God made a wind to pass over the earth. The waters subsided.",
    "query": "זכר"
  },
  "shafat": {
    "ref": "Exod.18.13",
    "where": "Exodus 18:13",
    "he": "וַיְהִי֙ מִֽמָּחֳרָ֔ת וַיֵּ֥שֶׁב מֹשֶׁ֖ה לִשְׁפֹּ֣ט אֶת הָעָ֑ם וַיַּעֲמֹ֤ד הָעָם֙ עַל מֹשֶׁ֔ה מִן הַבֹּ֖קֶר עַד הָעָֽרֶב",
    "en": "On the next day, Moses sat to judge the people, and the people stood around Moses from the morning to the evening.",
    "query": "שפט"
  },
  "lamad": {
    "ref": "Deut.5.1",
    "where": "Deuteronomy 5:1",
    "he": "וַיִּקְרָ֣א מֹשֶׁה֮ אֶל כָּל יִשְׂרָאֵל֒ וַיֹּ֣אמֶר אֲלֵהֶ֗ם שְׁמַ֤ע יִשְׂרָאֵל֙ אֶת הַחֻקִּ֣ים וְאֶת הַמִּשְׁפָּטִ֔ים אֲשֶׁ֧ר אָנֹכִ֛י דֹּבֵ֥ר בְּאָזְנֵיכֶ֖ם הַיּ֑וֹם וּלְמַדְתֶּ֣ם אֹתָ֔ם וּשְׁמַרְתֶּ֖ם לַעֲשֹׂתָֽם",
    "en": "Moses called to all Israel, and said to them, “Hear, Israel, the statutes and the ordinances which I speak in your ears today, that you may learn them, and observe to do them.”",
    "query": "למד"
  },
  "malak": {
    "ref": "Exod.15.18",
    "where": "Exodus 15:18",
    "he": "יְהוָ֥ה יִמְלֹ֖ךְ לְעֹלָ֥ם וָעֶֽד",
    "en": "Yahweh will reign forever and ever.”",
    "query": "מלך"
  },
  "karat": {
    "ref": "Gen.15.18",
    "where": "Genesis 15:18",
    "he": "בַּיּ֣וֹם הַה֗וּא כָּרַ֧ת יְהוָ֛ה אֶת אַבְרָ֖ם בְּרִ֣ית לֵאמֹ֑ר לְזַרְעֲךָ֗ נָתַ֨תִּי֙ אֶת הָאָ֣רֶץ הַזֹּ֔את מִנְּהַ֣ר מִצְרַ֔יִם עַד הַנָּהָ֥ר הַגָּדֹ֖ל נְהַר פְּרָֽת",
    "en": "In that day Yahweh made a covenant with Abram, saying, “I have given this land to your offspring, from the river of Egypt to the great river, the river Euphrates:",
    "query": "כרת"
  },
  "shakan": {
    "ref": "Exod.25.8",
    "where": "Exodus 25:8",
    "he": "וְעָ֥שׂוּ לִ֖י מִקְדָּ֑שׁ וְשָׁכַנְתִּ֖י בְּתוֹכָֽם",
    "en": "Let them make me a sanctuary, that I may dwell among them.",
    "query": "שכן"
  },
  "amad": {
    "ref": "Gen.18.22",
    "where": "Genesis 18:22",
    "he": "וַיִּפְנ֤וּ מִשָּׁם֙ הָֽאֲנָשִׁ֔ים וַיֵּלְכ֖וּ סְדֹ֑מָה וְאַ֨בְרָהָ֔ם עוֹדֶ֥נּוּ עֹמֵ֖ד לִפְנֵ֥י יְהוָֽה",
    "en": "The men turned from there, and went toward Sodom, but Abraham stood yet before Yahweh.",
    "query": "עמד"
  },
  "avad": {
    "ref": "Gen.2.15",
    "where": "Genesis 2:15",
    "he": "וַיִּקַּ֛ח יְהוָ֥ה אֱלֹהִ֖ים אֶת הָֽאָדָ֑ם וַיַּנִּחֵ֣הוּ בְגַן עֵ֔דֶן לְעָבְדָ֖הּ וּלְשָׁמְרָֽהּ",
    "en": "Yahweh God took the man, and put him into the garden of Eden to cultivate and keep it.",
    "query": "עבד"
  },
  "halak": {
    "ref": "Gen.12.4",
    "where": "Genesis 12:4",
    "he": "וַיֵּ֣לֶךְ אַבְרָ֗ם כַּאֲשֶׁ֨ר דִּבֶּ֤ר אֵלָיו֙ יְהוָ֔ה וַיֵּ֥לֶךְ אִתּ֖וֹ ל֑וֹט וְאַבְרָ֗ם בֶּן חָמֵ֤שׁ שָׁנִים֙ וְשִׁבְעִ֣ים שָׁנָ֔ה בְּצֵאת֖וֹ מֵחָרָֽן",
    "en": "So Abram went, as Yahweh had told him. Lot went with him. Abram was seventy-five years old when he departed from Haran.",
    "query": "הלך"
  },
  "amar": {
    "ref": "Gen.1.3",
    "where": "Genesis 1:3",
    "he": "וַיֹּ֥אמֶר אֱלֹהִ֖ים יְהִ֣י א֑וֹר וַֽיְהִי אֽוֹר",
    "en": "God said, “Let there be light,” and there was light.",
    "query": "אמר"
  },
  "shaal": {
    "ref": "Gen.24.57",
    "where": "Genesis 24:57",
    "he": "וַיֹּאמְר֖וּ נִקְרָ֣א לַֽנַּעֲרָ֑ וְנִשְׁאֲלָ֖ה אֶת פִּֽיהָ",
    "en": "They said, “We will call the young lady, and ask her.”",
    "query": "שאל"
  },
  "bachar": {
    "ref": "Deut.7.6",
    "where": "Deuteronomy 7:6",
    "he": "כִּ֣י עַ֤ם קָדוֹשׁ֙ אַתָּ֔ה לַיהוָ֖ה אֱלֹהֶ֑יךָ בְּךָ֞ בָּחַ֣ר יְהוָ֣ה אֱלֹהֶ֗יךָ לִהְי֥וֹת לוֹ֙ לְעַ֣ם סְגֻלָּ֔ה מִכֹּל֙ הָֽעַמִּ֔ים אֲשֶׁ֖ר עַל פְּנֵ֥י הָאֲדָמָֽה",
    "en": "For you are a holy people to Yahweh your God. Yahweh your God has chosen you to be a people for his own possession, above all peoples who are on the face of the earth.",
    "query": "בחר"
  },
  "barak": {
    "ref": "Gen.1.22",
    "where": "Genesis 1:22",
    "he": "וַיְבָ֧רֶךְ אֹתָ֛ם אֱלֹהִ֖ים לֵאמֹ֑ר פְּר֣וּ וּרְב֗וּ וּמִלְא֤וּ אֶת הַמַּ֨יִם֙ בַּיַּמִּ֔ים וְהָע֖וֹף יִ֥רֶב בָּאָֽרֶץ",
    "en": "God blessed them, saying, “Be fruitful, and multiply, and fill the waters in the seas, and let birds multiply on the earth.”",
    "query": "ברך"
  },
  "shama": {
    "ref": "Gen.3.8",
    "where": "Genesis 3:8",
    "he": "וַֽיִּשְׁמְע֞וּ אֶת ק֨וֹל יְהוָ֧ה אֱלֹהִ֛ים מִתְהַלֵּ֥ךְ בַּגָּ֖ן לְר֣וּחַ הַיּ֑וֹם וַיִּתְחַבֵּ֨א הָֽאָדָ֜ם וְאִשְׁתּ֗וֹ מִפְּנֵי֙ יְהוָ֣ה אֱלֹהִ֔ים בְּת֖וֹךְ עֵ֥ץ הַגָּֽן",
    "en": "They heard Yahweh God’s voice walking in the garden in the cool of the day, and the man and his wife hid themselves from the presence of Yahweh God among the trees of the garden.",
    "query": "שמע"
  },
  "shalach": {
    "ref": "Gen.3.23",
    "where": "Genesis 3:23",
    "he": "וַֽיְשַׁלְּחֵ֛הוּ יְהוָ֥ה אֱלֹהִ֖ים מִגַּן עֵ֑דֶן לַֽעֲבֹד֙ אֶת הָ֣אֲדָמָ֔ה אֲשֶׁ֥ר לֻקַּ֖ח מִשָּֽׁם",
    "en": "Therefore Yahweh God sent him out from the garden of Eden, to till the ground from which he was taken.",
    "query": "שלח"
  },
  "matsa": {
    "ref": "Gen.6.8",
    "where": "Genesis 6:8",
    "he": "וְנֹ֕חַ מָ֥צָא חֵ֖ן בְּעֵינֵ֥י יְהוָֽה",
    "en": "But Noah found favor in Yahweh’s eyes.",
    "query": "מצא"
  },
  "qara": {
    "ref": "Gen.1.5",
    "where": "Genesis 1:5",
    "he": "וַיִּקְרָ֨א אֱלֹהִ֤ים לָאוֹר֙ י֔וֹם וְלַחֹ֖שֶׁךְ קָ֣רָא לָ֑יְלָה וַֽיְהִי עֶ֥רֶב וַֽיְהִי בֹ֖קֶר י֥וֹם אֶחָֽד",
    "en": "God called the light “day”, and the darkness he called “night”. There was evening and there was morning, the first day.",
    "query": "קרא"
  },
  "asah": {
    "ref": "Gen.1.7",
    "where": "Genesis 1:7",
    "he": "וַיַּ֣עַשׂ אֱלֹהִים֮ אֶת הָרָקִיעַ֒ וַיַּבְדֵּ֗ל בֵּ֤ין הַמַּ֨יִם֙ אֲשֶׁר֙ מִתַּ֣חַת לָרָקִ֔יעַ וּבֵ֣ין הַמַּ֔יִם אֲשֶׁ֖ר מֵעַ֣ל לָרָקִ֑יעַ וַֽיְהִי כֵֽן",
    "en": "God made the expanse, and divided the waters which were under the expanse from the waters which were above the expanse; and it was so.",
    "query": "עשה"
  },
  "banah": {
    "ref": "Gen.2.22",
    "where": "Genesis 2:22",
    "he": "וַיִּבֶן֩ יְהוָ֨ה אֱלֹהִ֧ים אֶֽת הַצֵּלָ֛ע אֲשֶׁר לָקַ֥ח מִן הָֽאָדָ֖ם לְאִשָּׁ֑ה וַיְבִאֶ֖הָ אֶל הָֽאָדָֽם",
    "en": "Yahweh God made a woman from the rib which he had taken from the man, and brought her to the man.",
    "query": "בנה"
  },
  "raah": {
    "ref": "Gen.1.4",
    "where": "Genesis 1:4",
    "he": "וַיַּ֧רְא אֱלֹהִ֛ים אֶת הָא֖וֹר כִּי ט֑וֹב וַיַּבְדֵּ֣ל אֱלֹהִ֔ים בֵּ֥ין הָא֖וֹר וּבֵ֥ין הַחֹֽשֶׁךְ",
    "en": "God saw the light, and saw that it was good. God divided the light from the darkness.",
    "query": "ראה"
  },
  "hayah": {
    "ref": "Gen.1.3",
    "where": "Genesis 1:3",
    "he": "וַיֹּ֥אמֶר אֱלֹהִ֖ים יְהִ֣י א֑וֹר וַֽיְהִי אֽוֹר",
    "en": "God said, “Let there be light,” and there was light.",
    "query": "היה"
  },
  "nafal": {
    "ref": "Gen.2.21",
    "where": "Genesis 2:21",
    "he": "וַיַּפֵּל֩ יְהוָ֨ה אֱלֹהִ֧ים תַּרְדֵּמָ֛ה עַל הָאָדָ֖ם וַיִּישָׁ֑ן וַיִּקַּ֗ח אַחַת֙ מִצַּלְעֹתָ֔יו וַיִּסְגֹּ֥ר בָּשָׂ֖ר תַּחְתֶּֽנָּה",
    "en": "Yahweh God caused the man to fall into a deep sleep. As the man slept, he took one of his ribs, and closed up the flesh in its place.",
    "query": "נפל"
  },
  "nagash": {
    "ref": "Gen.18.23",
    "where": "Genesis 18:23",
    "he": "וַיִּגַּ֥שׁ אַבְרָהָ֖ם וַיֹּאמַ֑ר הַאַ֣ף תִּסְפֶּ֔ה צַדִּ֖יק עִם רָשָֽׁע",
    "en": "Abraham came near, and said, “Will you consume the righteous with the wicked?",
    "query": "נגש"
  },
  "natan": {
    "ref": "Gen.1.29",
    "where": "Genesis 1:29",
    "he": "וַיֹּ֣אמֶר אֱלֹהִ֗ים הִנֵּה֩ נָתַ֨תִּי לָכֶ֜ם אֶת כָּל עֵ֣שֶׂב זֹרֵ֣עַ זֶ֗רַע אֲשֶׁר֙ עַל פְּנֵ֣י כָל הָאָ֔רֶץ וְאֶת כָּל הָעֵ֛ץ אֲשֶׁר בּ֥וֹ פְרִי עֵ֖ץ זֹרֵ֣עַ זָ֑רַע לָכֶ֥ם יִֽהְיֶ֖ה לְאָכְלָֽה",
    "en": "God said, “Behold, I have given you every herb yielding seed, which is on the surface of all the earth, and every tree, which bears fruit yielding seed. It will be your food.",
    "query": "נתן"
  },
  "yashav": {
    "ref": "Gen.13.12",
    "where": "Genesis 13:12",
    "he": "אַבְרָ֖ם יָשַׁ֣ב בְּאֶֽרֶץ כְּנָ֑עַן וְל֗וֹט יָשַׁב֙ בְּעָרֵ֣י הַכִּכָּ֔ר וַיֶּאֱהַ֖ל עַד סְדֹֽם",
    "en": "Abram lived in the land of Canaan, and Lot lived in the cities of the plain, and moved his tent as far as Sodom.",
    "query": "ישב"
  },
  "yarad": {
    "ref": "Gen.11.5",
    "where": "Genesis 11:5",
    "he": "וַיֵּ֣רֶד יְהוָ֔ה לִרְאֹ֥ת אֶת הָעִ֖יר וְאֶת הַמִּגְדָּ֑ל אֲשֶׁ֥ר בָּנ֖וּ בְּנֵ֥י הָאָדָֽם",
    "en": "Yahweh came down to see the city and the tower, which the children of men built.",
    "query": "ירד"
  },
  "yatsa": {
    "ref": "Gen.8.7",
    "where": "Genesis 8:7",
    "he": "וַיְשַׁלַּ֖ח אֶת הָֽעֹרֵ֑ב וַיֵּצֵ֤א יָצוֹא֙ וָשׁ֔וֹב עַד יְבֹ֥שֶׁת הַמַּ֖יִם מֵעַ֥ל הָאָֽרֶץ",
    "en": "and he sent out a raven. It went back and forth, until the waters were dried up from the earth.",
    "query": "יצא"
  },
  "qum": {
    "ref": "Gen.13.17",
    "where": "Genesis 13:17",
    "he": "ק֚וּם הִתְהַלֵּ֣ךְ בָּאָ֔רֶץ לְאָרְכָּ֖הּ וּלְרָחְבָּ֑הּ כִּ֥י לְךָ֖ אֶתְּנֶֽנָּה",
    "en": "Arise, walk through the land in its length and in its width; for I will give it to you.”",
    "query": "קום"
  },
  "bo": {
    "ref": "Gen.7.1",
    "where": "Genesis 7:1",
    "he": "וַיֹּ֤אמֶר יְהוָה֙ לְנֹ֔חַ בֹּֽא אַתָּ֥ה וְכָל בֵּיתְךָ֖ אֶל הַתֵּבָ֑ה כִּֽי אֹתְךָ֥ רָאִ֛יתִי צַדִּ֥יק לְפָנַ֖י בַּדּ֥וֹר הַזֶּֽה",
    "en": "Yahweh said to Noah, “Come with all of your household into the ship, for I have seen your righteousness before me in this generation.",
    "query": "בוא"
  },
  "sim": {
    "ref": "Gen.2.8",
    "where": "Genesis 2:8",
    "he": "וַיִּטַּ֞ע יְהוָ֧ה אֱלֹהִ֛ים גַּן בְעֵ֖דֶן מִקֶּ֑דֶם וַיָּ֣שֶׂם שָׁ֔ם אֶת הָֽאָדָ֖ם אֲשֶׁ֥ר יָצָֽר",
    "en": "Yahweh God planted a garden eastward, in Eden, and there he put the man whom he had formed.",
    "query": "שים"
  },
  "savav": {
    "ref": "Gen.2.11",
    "where": "Genesis 2:11",
    "he": "שֵׁ֥ם הָֽאֶחָ֖ד פִּישׁ֑וֹן ה֣וּא הַסֹּבֵ֗ב אֵ֚ת כָּל אֶ֣רֶץ הַֽחֲוִילָ֔ה אֲשֶׁר שָׁ֖ם הַזָּהָֽב",
    "en": "The name of the first is Pishon: it flows through the whole land of Havilah, where there is gold;",
    "query": "סבב"
  }
};

export function passageForRoot(id: string): VerbalPassage | null {
  return VERBAL_PASSAGES[id] ?? null;
}
