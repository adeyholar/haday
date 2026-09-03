import { CONSONANTS } from "./alphabet";

export type Pos = "noun" | "verb" | "adj" | "prep" | "particle" | "name" | "pron";

export type VocabItem = {
  id: string;
  hebrew: string;
  translit: string;
  gloss: string;
  alts: string[];
  hebrewAlts?: string[];
  pos: Pos;
  chapter: number;
  freq: number;
};

export const VOCAB: VocabItem[] = [
  // Ch 2 — BBH 3rd ed. proper names
  { id: "abraham", hebrew: "אַבְרָהָם", translit: "ʾabrāhām", gloss: "Abraham", alts: [], pos: "name", chapter: 2, freq: 175 },
  { id: "aaron", hebrew: "אַהֲרֹן", translit: "ʾahărōn", gloss: "Aaron", alts: [], pos: "name", chapter: 2, freq: 347 },
  { id: "david", hebrew: "דָּוִד", translit: "dāwīd", gloss: "David", alts: [], pos: "name", chapter: 2, freq: 1075 },
  { id: "judah", hebrew: "יְהוּדָה", translit: "yəhûdâ", gloss: "Judah", alts: [], pos: "name", chapter: 2, freq: 820 },
  { id: "yhwh", hebrew: "יהוה", translit: "YHWH", gloss: "Yahweh, the LORD", alts: ["the lord", "yahweh", "lord", "hashem", "yhwh"], pos: "name", chapter: 2, freq: 6828 },
  { id: "joshua", hebrew: "יְהוֹשׁוּעַ", translit: "yəhôšuaʿ", gloss: "Joshua", alts: [], hebrewAlts: ["יְהוֹשֻׁעַ"], pos: "name", chapter: 2, freq: 218 },
  { id: "joseph", hebrew: "יוֹסֵף", translit: "yôsēp", gloss: "Joseph", alts: [], pos: "name", chapter: 2, freq: 213 },
  { id: "jacob", hebrew: "יַעֲקֹב", translit: "yaʿăqōb", gloss: "Jacob", alts: [], pos: "name", chapter: 2, freq: 349 },
  { id: "isaac", hebrew: "יִצְחָק", translit: "yiṣḥāq", gloss: "Isaac", alts: [], pos: "name", chapter: 2, freq: 108 },
  { id: "jerusalem", hebrew: "יְרוּשָׁלַםִ", translit: "yərûšālayim", gloss: "Jerusalem", alts: [], hebrewAlts: ["יְרוּשָׁלַיִם", "יְרוּשָׁלַ͏ִם", "יְרוּשָׁלָם", "יְרוּשָׁלַם"], pos: "name", chapter: 2, freq: 643 },
  { id: "jeremiah", hebrew: "יִרְמְיָהוּ", translit: "yirməyāhû", gloss: "Jeremiah", alts: ["yirmeyahu"], hebrewAlts: ["יִרְמְיָה"], pos: "name", chapter: 2, freq: 147 },
  { id: "israel", hebrew: "יִשְׂרָאֵל", translit: "yiśrāʾēl", gloss: "Israel", alts: [], pos: "name", chapter: 2, freq: 2507 },
  { id: "canaan", hebrew: "כְּנַעַן", translit: "kənaʿan", gloss: "Canaan", alts: [], pos: "name", chapter: 2, freq: 93 },
  { id: "egypt", hebrew: "מִצְרַיִם", translit: "miṣrayim", gloss: "Egypt", alts: [], pos: "name", chapter: 2, freq: 682 },
  { id: "moses", hebrew: "מֹשֶׁה", translit: "mōšeh", gloss: "Moses", alts: [], pos: "name", chapter: 2, freq: 766 },
  { id: "esau", hebrew: "עֵשָׂו", translit: "ʿēśāw", gloss: "Esau", alts: [], pos: "name", chapter: 2, freq: 99 },
  { id: "pharaoh", hebrew: "פַּרְעֹה", translit: "parʿōh", gloss: "Pharaoh", alts: [], pos: "name", chapter: 2, freq: 274 },
  { id: "zion", hebrew: "צִיּוֹן", translit: "ṣiyyôn", gloss: "Zion", alts: ["tsion"], pos: "name", chapter: 2, freq: 154 },
  { id: "saul", hebrew: "שָׁאוּל", translit: "šāʾûl", gloss: "Saul", alts: ["shaul"], pos: "name", chapter: 2, freq: 406 },
  { id: "solomon", hebrew: "שְׁלֹמֹה", translit: "šəlōmōh", gloss: "Solomon", alts: ["shlomo"], pos: "name", chapter: 2, freq: 293 },
  { id: "samuel", hebrew: "שְׁמוּאֵל", translit: "šəmûʾēl", gloss: "Samuel", alts: [], pos: "name", chapter: 2, freq: 140 },

  // Ch 3 — BBH 3rd ed. nouns
  { id: "ab", hebrew: "אָב", translit: "ʾāb", gloss: "father, ancestor", alts: ["father", "ancestor"], pos: "noun", chapter: 3, freq: 1210 },
  { id: "adon", hebrew: "אָדוֹן", translit: "ʾādôn", gloss: "lord, master", alts: ["lord", "master", "adonai"], hebrewAlts: ["אֲדֹנָי"], pos: "noun", chapter: 3, freq: 774 },
  { id: "adam", hebrew: "אָדָם", translit: "ʾādām", gloss: "man, mankind, Adam", alts: ["man", "mankind", "adam", "human", "humankind"], pos: "noun", chapter: 3, freq: 546 },
  { id: "adamah", hebrew: "אֲדָמָה", translit: "ʾădāmâ", gloss: "ground, land, earth", alts: ["ground", "land", "earth", "soil"], pos: "noun", chapter: 3, freq: 222 },
  { id: "ah", hebrew: "אָח", translit: "ʾāḥ", gloss: "brother", alts: [], pos: "noun", chapter: 3, freq: 629 },
  { id: "achot", hebrew: "אָחוֹת", translit: "ʾāḥôt", gloss: "sister, relative, loved one", alts: ["sister", "relative", "loved one"], pos: "noun", chapter: 3, freq: 119 },
  { id: "ish", hebrew: "אִישׁ", translit: "ʾîš", gloss: "man, husband", alts: ["man", "husband", "person"], pos: "noun", chapter: 3, freq: 2188 },
  { id: "el-god", hebrew: "אֵל", translit: "ʾēl", gloss: "God, god", alts: ["god", "el"], pos: "noun", chapter: 3, freq: 237 },
  { id: "elohim", hebrew: "אֱלֹהִים", translit: "ʾĕlōhîm", gloss: "God, gods", alts: ["god", "gods"], pos: "noun", chapter: 3, freq: 2602 },
  { id: "em", hebrew: "אֵם", translit: "ʾēm", gloss: "mother", alts: [], pos: "noun", chapter: 3, freq: 220 },
  { id: "erets", hebrew: "אֶרֶץ", translit: "ʾereṣ", gloss: "land, earth, ground", alts: ["land", "earth", "ground"], pos: "noun", chapter: 3, freq: 2505 },
  { id: "ishah", hebrew: "אִשָּׁה", translit: "ʾiššâ", gloss: "woman, wife", alts: ["woman", "wife"], pos: "noun", chapter: 3, freq: 781 },
  { id: "bayit", hebrew: "בַּיִת", translit: "bayit", gloss: "house, household", alts: ["house", "household", "home", "dynasty"], pos: "noun", chapter: 3, freq: 2047 },
  { id: "ben", hebrew: "בֵּן", translit: "bēn", gloss: "son", alts: ["child"], pos: "noun", chapter: 3, freq: 4941 },
  { id: "bat", hebrew: "בַּת", translit: "bat", gloss: "daughter", alts: [], pos: "noun", chapter: 3, freq: 587 },
  { id: "dabar", hebrew: "דָּבָר", translit: "dābār", gloss: "word, matter, thing", alts: ["word", "matter", "thing", "affair"], pos: "noun", chapter: 3, freq: 1454 },
  { id: "yom", hebrew: "יוֹם", translit: "yôm", gloss: "day", alts: [], pos: "noun", chapter: 3, freq: 2301 },
  { id: "laylah", hebrew: "לַיְלָה", translit: "laylâ", gloss: "night", alts: [], pos: "noun", chapter: 3, freq: 234 },
  { id: "naar", hebrew: "נַעַר", translit: "naʿar", gloss: "boy, youth, servant", alts: ["boy", "youth", "lad", "servant"], pos: "noun", chapter: 3, freq: 240 },
  { id: "naarah", hebrew: "נַעֲרָה", translit: "naʿărâ", gloss: "young girl, maidservant", alts: ["young girl", "girl", "maidservant", "maiden"], pos: "noun", chapter: 3, freq: 76 },

  // Ch 4 — BBH 3rd ed. 4.10 nouns
  { id: "goy", hebrew: "גּוֹי", translit: "gôy", gloss: "nation, people", alts: ["nation", "people"], pos: "noun", chapter: 4, freq: 567 },
  { id: "derek", hebrew: "דֶּ֫רֶךְ", translit: "derek", gloss: "way, road, journey", alts: ["way", "road", "journey", "path"], hebrewAlts: ["דֶּרֶךְ"], pos: "noun", chapter: 4, freq: 712 },
  { id: "har", hebrew: "הַר", translit: "har", gloss: "mountain, hill, hill country", alts: ["mountain", "hill", "hill country"], pos: "noun", chapter: 4, freq: 558 },
  { id: "kohen", hebrew: "כֹּהֵן", translit: "kōhēn", gloss: "priest", alts: [], pos: "noun", chapter: 4, freq: 750 },
  { id: "leb", hebrew: "לֵב", translit: "lēb", gloss: "heart, mind, will", alts: ["heart", "mind", "will"], hebrewAlts: ["לֵבָב"], pos: "noun", chapter: 4, freq: 854 },
  { id: "mayim", hebrew: "מַ֫יִם", translit: "mayim", gloss: "water", alts: ["waters"], hebrewAlts: ["מַיִם", "מֵי"], pos: "noun", chapter: 4, freq: 585 },
  { id: "melek", hebrew: "מֶ֫לֶךְ", translit: "melek", gloss: "king, ruler", alts: ["king", "ruler"], hebrewAlts: ["מֶלֶךְ"], pos: "noun", chapter: 4, freq: 2530 },
  { id: "nabi", hebrew: "נָבִיא", translit: "nābîʾ", gloss: "prophet", alts: [], pos: "noun", chapter: 4, freq: 317 },
  { id: "nephesh", hebrew: "נֶ֫פֶשׁ", translit: "nepeš", gloss: "soul, life, person, neck, throat", alts: ["soul", "life", "person", "neck", "throat", "self"], pos: "noun", chapter: 4, freq: 757 },
  { id: "sus", hebrew: "סוּס", translit: "sûs", gloss: "horse", alts: [], pos: "noun", chapter: 4, freq: 138 },
  { id: "sefer", hebrew: "סֵ֫פֶר", translit: "sēper", gloss: "book, scroll, document", alts: ["book", "scroll", "document"], hebrewAlts: ["סֵפֶר"], pos: "noun", chapter: 4, freq: 191 },
  { id: "ebed", hebrew: "עֶ֫בֶד", translit: "ʿebed", gloss: "slave, servant", alts: ["slave", "servant"], hebrewAlts: ["עֶבֶד"], pos: "noun", chapter: 4, freq: 803 },
  { id: "ayin", hebrew: "עַ֫יִן", translit: "ʿayin", gloss: "eye, spring", alts: ["eye", "spring"], hebrewAlts: ["עַיִן", "עֵין"], pos: "noun", chapter: 4, freq: 900 },
  { id: "ir", hebrew: "עִיר", translit: "ʿîr", gloss: "city, town", alts: ["city", "town"], hebrewAlts: ["עָרִים"], pos: "noun", chapter: 4, freq: 1088 },
  { id: "tsaba", hebrew: "צָבָא", translit: "ṣābāʾ", gloss: "host, army, war, service", alts: ["host", "army", "war", "service"], hebrewAlts: ["צְבָאוֹת"], pos: "noun", chapter: 4, freq: 487 },
  { id: "qol", hebrew: "קוֹל", translit: "qôl", gloss: "voice, sound, noise", alts: ["voice", "sound", "noise"], hebrewAlts: ["קֹל"], pos: "noun", chapter: 4, freq: 505 },
  { id: "rosh", hebrew: "רֹאשׁ", translit: "rōš", gloss: "head, top, chief", alts: ["head", "top", "chief", "beginning"], pos: "noun", chapter: 4, freq: 600 },
  { id: "shem", hebrew: "שֵׁם", translit: "šēm", gloss: "name, reputation", alts: ["name", "reputation"], pos: "noun", chapter: 4, freq: 864 },
  { id: "shanah", hebrew: "שָׁנָה", translit: "šānâ", gloss: "year", alts: [], pos: "noun", chapter: 4, freq: 878 },
  { id: "torah", hebrew: "תּוֹרָה", translit: "tôrâ", gloss: "law, instruction, teaching", alts: ["law", "instruction", "teaching"], pos: "noun", chapter: 4, freq: 223 },

  // Ch 5 — BBH 3rd ed. 5.9 nouns + article and vav
  { id: "esh", hebrew: "אֵשׁ", translit: "ʾēš", gloss: "fire", alts: [], pos: "noun", chapter: 5, freq: 376 },
  { id: "hekal", hebrew: "הֵיכָל", translit: "hêkāl", gloss: "temple, palace", alts: ["temple", "palace"], pos: "noun", chapter: 5, freq: 80 },
  { id: "zahav", hebrew: "זָהָב", translit: "zāhāb", gloss: "gold", alts: [], pos: "noun", chapter: 5, freq: 392 },
  { id: "hereb", hebrew: "חֶרֶב", translit: "ḥereb", gloss: "sword", alts: [], pos: "noun", chapter: 5, freq: 413 },
  { id: "yeled", hebrew: "יֶלֶד", translit: "yeled", gloss: "child, boy, youth", alts: ["child", "boy", "youth"], pos: "noun", chapter: 5, freq: 89 },
  { id: "yam", hebrew: "יָם", translit: "yām", gloss: "sea", alts: [], pos: "noun", chapter: 5, freq: 396 },
  { id: "kesef", hebrew: "כֶּסֶף", translit: "kesep", gloss: "silver, money", alts: ["silver", "money"], pos: "noun", chapter: 5, freq: 403 },
  { id: "mizbeah", hebrew: "מִזְבֵּחַ", translit: "mizbēaḥ", gloss: "altar", alts: [], pos: "noun", chapter: 5, freq: 403 },
  { id: "maqom", hebrew: "מָקוֹם", translit: "māqôm", gloss: "place, location", alts: ["place", "location"], pos: "noun", chapter: 5, freq: 401 },
  { id: "mishpat", hebrew: "מִשְׁפָּט", translit: "mišpāṭ", gloss: "judgment, decision, ordinance, law, custom", alts: ["judgment", "decision", "ordinance", "law", "custom", "justice"], pos: "noun", chapter: 5, freq: 425 },
  { id: "neum", hebrew: "נְאֻם", translit: "nəʾum", gloss: "utterance, announcement, revelation", alts: ["utterance", "announcement", "revelation", "declares", "says"], pos: "noun", chapter: 5, freq: 376 },
  { id: "olam", hebrew: "עוֹלָם", translit: "ʿôlām", gloss: "forever, everlasting, ancient", alts: ["forever", "everlasting", "ancient", "eternity"], hebrewAlts: ["עֹלָם"], pos: "noun", chapter: 5, freq: 439 },
  { id: "anan", hebrew: "עָנָן", translit: "ʿānān", gloss: "cloud, clouds", alts: ["cloud", "clouds"], pos: "noun", chapter: 5, freq: 87 },
  { id: "ruah", hebrew: "רוּחַ", translit: "rûaḥ", gloss: "spirit, wind, breath", alts: ["spirit", "wind", "breath"], pos: "noun", chapter: 5, freq: 378 },
  { id: "sar", hebrew: "שַׂר", translit: "śar", gloss: "ruler, prince", alts: ["ruler", "prince", "official", "chief"], pos: "noun", chapter: 5, freq: 421 },
  { id: "shamayim", hebrew: "שָׁמַיִם", translit: "šāmayim", gloss: "heaven, sky", alts: ["heaven", "heavens", "sky"], pos: "noun", chapter: 5, freq: 421 },
  { id: "shaar", hebrew: "שַׁעַר", translit: "šaʿar", gloss: "gate", alts: [], pos: "noun", chapter: 5, freq: 373 },
  { id: "ha", hebrew: "הַ", translit: "ha", gloss: "the", alts: ["the", "definite article"], pos: "particle", chapter: 5, freq: 24058 },
  { id: "we", hebrew: "וְ", translit: "wə", gloss: "and, but, also, even, then", alts: ["and", "but", "also", "even", "then"], pos: "particle", chapter: 5, freq: 50524 },

  // Ch 6 — BBH 3rd ed. 6.9 prepositions
  { id: "achar", hebrew: "אַחַר", translit: "ʾaḥar", gloss: "after, behind", alts: ["after", "behind"], hebrewAlts: ["אַחֲרֵי"], pos: "prep", chapter: 6, freq: 718 },
  { id: "el", hebrew: "אֶל", translit: "ʾel", gloss: "to, toward, into", alts: ["to", "toward", "into", "unto"], pos: "prep", chapter: 6, freq: 5518 },
  { id: "et-with", hebrew: "אֵת", translit: "ʾēt", gloss: "with, beside", alts: ["with", "beside"], hebrewAlts: ["אֶת"], pos: "prep", chapter: 6, freq: 890 },
  { id: "be", hebrew: "בְּ", translit: "bə", gloss: "in, at, with, by, against", alts: ["in", "at", "with", "by", "against"], pos: "prep", chapter: 6, freq: 15559 },
  { id: "ben-prep", hebrew: "בֵּין", translit: "bên", gloss: "between", alts: [], pos: "prep", chapter: 6, freq: 409 },
  { id: "betokh", hebrew: "בְּתוֹךְ", translit: "bətôk", gloss: "in the midst of, inside", alts: ["in the midst", "inside", "in the middle of", "midst"], hebrewAlts: ["תָּוֶךְ"], pos: "prep", chapter: 6, freq: 319 },
  { id: "ke", hebrew: "כְּ", translit: "kə", gloss: "as, like, according to", alts: ["as", "like", "according to"], pos: "prep", chapter: 6, freq: 3053 },
  { id: "le", hebrew: "לְ", translit: "lə", gloss: "to, toward, for", alts: ["to", "toward", "for"], pos: "prep", chapter: 6, freq: 20321 },
  { id: "lemaan", hebrew: "לְמַעַן", translit: "ləmaʿan", gloss: "on account of, for the sake of", alts: ["on account of", "for the sake of", "so that"], pos: "prep", chapter: 6, freq: 272 },
  { id: "min", hebrew: "מִן", translit: "min", gloss: "from, out of", alts: ["from", "out of", "than"], hebrewAlts: ["מִ"], pos: "prep", chapter: 6, freq: 7592 },
  { id: "maal", hebrew: "מַעַל", translit: "maʿal", gloss: "above, upward, on top of", alts: ["above", "upward", "on top of"], pos: "prep", chapter: 6, freq: 140 },
  { id: "ever", hebrew: "עֵבֶר", translit: "ʿēber", gloss: "beyond, other side, edge, bank", alts: ["beyond", "other side", "edge", "bank"], pos: "prep", chapter: 6, freq: 92 },
  { id: "ad", hebrew: "עַד", translit: "ʿad", gloss: "until, as far as", alts: ["until", "as far as", "up to"], pos: "prep", chapter: 6, freq: 1263 },
  { id: "al", hebrew: "עַל", translit: "ʿal", gloss: "on, upon, on account of, according to", alts: ["on", "upon", "on account of", "according to", "over", "concerning"], pos: "prep", chapter: 6, freq: 5777 },
  { id: "im", hebrew: "עִם", translit: "ʿim", gloss: "with, together with", alts: ["with", "together with"], pos: "prep", chapter: 6, freq: 1048 },
  { id: "panim", hebrew: "פָּנִים", translit: "pānîm", gloss: "face, front", alts: ["face", "front", "presence", "before", "in front of"], hebrewAlts: ["לִפְנֵי"], pos: "noun", chapter: 6, freq: 2126 },
  { id: "tahat", hebrew: "תַּחַת", translit: "taḥat", gloss: "under, below, instead of", alts: ["under", "below", "instead of", "beneath"], pos: "prep", chapter: 6, freq: 510 },
  { id: "et", hebrew: "אֵת", translit: "ʾēt", gloss: "direct object marker", alts: ["object marker", "direct object", "not translated"], hebrewAlts: ["אֶת"], pos: "particle", chapter: 6, freq: 10978 },
  { id: "kol", hebrew: "כֹּל", translit: "kōl", gloss: "all, each, every", alts: ["all", "each", "every", "whole"], hebrewAlts: ["כָּל"], pos: "noun", chapter: 6, freq: 5415 },

  // Ch 7 — BBH 3rd ed. 7.9 adjectives
  { id: "qodesh", hebrew: "קֹדֶשׁ", translit: "qōdeš", gloss: "holiness, something that is holy", alts: ["holiness", "holy", "holy thing", "sanctuary"], pos: "noun", chapter: 7, freq: 470 },
  { id: "raah-evil", hebrew: "רָעָה", translit: "rāʿâ", gloss: "evil, wickedness, calamity, disaster", alts: ["evil", "wickedness", "calamity", "disaster"], pos: "noun", chapter: 7, freq: 354 },
  { id: "gadol", hebrew: "גָּדוֹל", translit: "gādôl", gloss: "great, big, large", alts: ["great", "big", "large"], pos: "adj", chapter: 7, freq: 527 },
  { id: "zaqen", hebrew: "זָקֵן", translit: "zāqēn", gloss: "old; elder, old man", alts: ["old", "elder", "old man"], pos: "adj", chapter: 7, freq: 180 },
  { id: "zar", hebrew: "זָר", translit: "zār", gloss: "foreign, strange", alts: ["foreign", "strange", "stranger"], pos: "adj", chapter: 7, freq: 70 },
  { id: "hay", hebrew: "חַי", translit: "ḥay", gloss: "living, alive", alts: ["living", "alive", "live"], hebrewAlts: ["חַיִּים"], pos: "adj", chapter: 7, freq: 70 },
  { id: "hakam", hebrew: "חָכָם", translit: "ḥākām", gloss: "wise, skillful, experienced", alts: ["wise", "skillful", "experienced"], pos: "adj", chapter: 7, freq: 138 },
  { id: "tov", hebrew: "טוֹב", translit: "ṭôb", gloss: "good, pleasant", alts: ["good", "pleasant"], pos: "adj", chapter: 7, freq: 530 },
  { id: "yashar", hebrew: "יָשָׁר", translit: "yāšār", gloss: "upright, just", alts: ["upright", "just"], pos: "adj", chapter: 7, freq: 119 },
  { id: "meat", hebrew: "מְעַט", translit: "məʿaṭ", gloss: "little, few", alts: ["little", "few"], pos: "adj", chapter: 7, freq: 101 },
  { id: "tsaddiq", hebrew: "צַדִּיק", translit: "ṣaddîq", gloss: "righteous, just, innocent", alts: ["righteous", "just", "innocent"], pos: "adj", chapter: 7, freq: 206 },
  { id: "qadosh", hebrew: "קָדוֹשׁ", translit: "qādôš", gloss: "holy, set apart", alts: ["holy", "set apart", "sacred"], pos: "adj", chapter: 7, freq: 117 },
  { id: "qaton", hebrew: "קָטֹן", translit: "qāṭōn", gloss: "small, young, insignificant", alts: ["small", "young", "insignificant", "little"], hebrewAlts: ["קְטַנָּה"], pos: "adj", chapter: 7, freq: 74 },
  { id: "qarov", hebrew: "קָרוֹב", translit: "qārôb", gloss: "near, close", alts: ["near", "close"], pos: "adj", chapter: 7, freq: 75 },
  { id: "rab", hebrew: "רַב", translit: "rab", gloss: "great, many", alts: ["great", "many", "much", "abundant"], hebrewAlts: ["רַבִּים"], pos: "adj", chapter: 7, freq: 419 },
  { id: "rachoq", hebrew: "רָחוֹק", translit: "rāḥôq", gloss: "distant, remote, far away", alts: ["distant", "remote", "far", "far away"], pos: "adj", chapter: 7, freq: 84 },
  { id: "ra", hebrew: "רַע", translit: "raʿ", gloss: "bad, evil, wicked, worthless", alts: ["bad", "evil", "wicked", "worthless"], hebrewAlts: ["רָע"], pos: "adj", chapter: 7, freq: 312 },
  { id: "rasha", hebrew: "רָשָׁע", translit: "rāšāʿ", gloss: "wicked, guilty", alts: ["wicked", "guilty"], pos: "adj", chapter: 7, freq: 264 },
  { id: "meod", hebrew: "מְאֹד", translit: "məʾōd", gloss: "very, exceedingly", alts: ["very", "exceedingly"], pos: "particle", chapter: 7, freq: 300 },

  // Ch 8 — BBH 3rd ed. 8.12 pronouns, demonstratives, interrogatives
  { id: "anahnu", hebrew: "אֲנַחְנוּ", translit: "ʾănaḥnû", gloss: "we", alts: ["we", "us"], pos: "pron", chapter: 8, freq: 121 },
  { id: "ani", hebrew: "אֲנִי", translit: "ʾănî", gloss: "I", alts: ["i", "me"], pos: "pron", chapter: 8, freq: 874 },
  { id: "anoki", hebrew: "אָנֹכִי", translit: "ʾānōkî", gloss: "I", alts: ["i", "i myself"], pos: "pron", chapter: 8, freq: 359 },
  { id: "attah", hebrew: "אַתָּה", translit: "ʾattâ", gloss: "you", alts: ["you", "thou"], pos: "pron", chapter: 8, freq: 749 },
  { id: "attem", hebrew: "אַתֶּם", translit: "ʾattem", gloss: "you", alts: ["you", "you all"], pos: "pron", chapter: 8, freq: 283 },
  { id: "hu", hebrew: "הוּא", translit: "hûʾ", gloss: "he, it; that", alts: ["he", "it", "that"], pos: "pron", chapter: 8, freq: 1398 },
  { id: "hi", hebrew: "הִיא", translit: "hîʾ", gloss: "she, it; that", alts: ["she", "it", "that"], hebrewAlts: ["הִוא"], pos: "pron", chapter: 8, freq: 491 },
  { id: "hem", hebrew: "הֵם", translit: "hēm", gloss: "they, those", alts: ["they", "those"], hebrewAlts: ["הֵמָּה"], pos: "pron", chapter: 8, freq: 565 },
  { id: "elleh", hebrew: "אֵלֶּה", translit: "ʾēlleh", gloss: "these", alts: ["these"], pos: "pron", chapter: 8, freq: 744 },
  { id: "zot", hebrew: "זֹאת", translit: "zōʾt", gloss: "this", alts: ["this"], pos: "pron", chapter: 8, freq: 605 },
  { id: "zeh", hebrew: "זֶה", translit: "zeh", gloss: "this", alts: ["this"], pos: "pron", chapter: 8, freq: 1178 },
  { id: "ha-int", hebrew: "הֲ", translit: "hă", gloss: "interrogative particle (yes/no question)", alts: ["interrogative", "question particle", "whether"], pos: "particle", chapter: 8, freq: 664 },
  { id: "lama", hebrew: "לָמָּה", translit: "lāmmâ", gloss: "why", alts: ["why"], hebrewAlts: ["לָמָה"], pos: "particle", chapter: 8, freq: 178 },
  { id: "mah", hebrew: "מָה", translit: "mâ", gloss: "what", alts: ["what"], hebrewAlts: ["מַה", "מֶה"], pos: "particle", chapter: 8, freq: 571 },
  { id: "maddua", hebrew: "מַדּוּעַ", translit: "maddûaʿ", gloss: "why", alts: ["why"], pos: "particle", chapter: 8, freq: 72 },
  { id: "mi", hebrew: "מִי", translit: "mî", gloss: "who", alts: ["who"], pos: "particle", chapter: 8, freq: 424 },
  { id: "acher", hebrew: "אַחֵר", translit: "ʾaḥēr", gloss: "other, another", alts: ["other", "another"], hebrewAlts: ["אַחֶרֶת"], pos: "adj", chapter: 8, freq: 166 },
  { id: "asher", hebrew: "אֲשֶׁר", translit: "ʾăšer", gloss: "who, that, which", alts: ["who", "that", "which", "whom"], pos: "particle", chapter: 8, freq: 5503 },
  { id: "ki", hebrew: "כִּי", translit: "kî", gloss: "that, because, but, indeed", alts: ["that", "because", "but", "except", "indeed", "truly", "for"], hebrewAlts: ["כִּי־אִם"], pos: "particle", chapter: 8, freq: 4487 },
  { id: "she", hebrew: "שֶׁ", translit: "še", gloss: "who, which, that (prefixed)", alts: ["who", "which", "that"], pos: "particle", chapter: 8, freq: 143 },

  // Ch 9 — BBH 3rd ed. 9.17 nouns and particles
  { id: "aph", hebrew: "אַף", translit: "ʾap", gloss: "nostril, nose, anger", alts: ["nostril", "nose", "anger"], pos: "noun", chapter: 9, freq: 277 },
  { id: "baqar", hebrew: "בָּקָר", translit: "bāqār", gloss: "cattle, herd", alts: ["cattle", "herd"], pos: "noun", chapter: 9, freq: 183 },
  { id: "boqer", hebrew: "בֹּקֶר", translit: "bōqer", gloss: "morning", alts: [], pos: "noun", chapter: 9, freq: 213 },
  { id: "berakah", hebrew: "בְּרָכָה", translit: "bərākâ", gloss: "blessing, gift", alts: ["blessing", "gift"], pos: "noun", chapter: 9, freq: 71 },
  { id: "hattat", hebrew: "חַטָּאת", translit: "ḥaṭṭāʾt", gloss: "sin, sin offering", alts: ["sin", "sin offering"], pos: "noun", chapter: 9, freq: 298 },
  { id: "kavod", hebrew: "כָּבוֹד", translit: "kābôd", gloss: "glory, splendor, honor, abundance", alts: ["glory", "splendor", "honor", "abundance"], pos: "noun", chapter: 9, freq: 200 },
  { id: "keli", hebrew: "כְּלִי", translit: "kəlî", gloss: "vessel, implement, weapon", alts: ["vessel", "implement", "weapon", "article"], pos: "noun", chapter: 9, freq: 325 },
  { id: "lehem", hebrew: "לֶחֶם", translit: "leḥem", gloss: "bread, food", alts: ["bread", "food"], pos: "noun", chapter: 9, freq: 340 },
  { id: "milhamah", hebrew: "מִלְחָמָה", translit: "milḥāmâ", gloss: "war, battle, struggle", alts: ["war", "battle", "struggle"], pos: "noun", chapter: 9, freq: 319 },
  { id: "mishpahah", hebrew: "מִשְׁפָּחָה", translit: "mišpāḥâ", gloss: "family, clan", alts: ["family", "clan"], pos: "noun", chapter: 9, freq: 304 },
  { id: "am", hebrew: "עַם", translit: "ʿam", gloss: "people", alts: ["people", "nation"], pos: "noun", chapter: 9, freq: 1869 },
  { id: "ets", hebrew: "עֵץ", translit: "ʿēṣ", gloss: "tree, wood", alts: ["tree", "wood"], pos: "noun", chapter: 9, freq: 330 },
  { id: "o", hebrew: "אוֹ", translit: "ʾô", gloss: "or", alts: [], pos: "particle", chapter: 9, freq: 321 },
  { id: "ein", hebrew: "אֵין", translit: "ʾên", gloss: "is not, are not, nothing", alts: ["is not", "are not", "there is not", "nothing", "none"], hebrewAlts: ["אַיִן"], pos: "particle", chapter: 9, freq: 790 },
  { id: "gam", hebrew: "גַּם", translit: "gam", gloss: "also, even", alts: ["also", "even"], pos: "particle", chapter: 9, freq: 769 },
  { id: "hen", hebrew: "הֵן", translit: "hēn", gloss: "behold, if", alts: ["behold", "if", "lo"], pos: "particle", chapter: 9, freq: 107 },
  { id: "hinneh", hebrew: "הִנֵּה", translit: "hinnēh", gloss: "behold, look", alts: ["behold", "look", "here"], hebrewAlts: ["הִנְנִי"], pos: "particle", chapter: 9, freq: 1061 },
  { id: "yesh", hebrew: "יֵשׁ", translit: "yēš", gloss: "there is, there are", alts: ["there is", "there are"], pos: "particle", chapter: 9, freq: 138 },
  { id: "levad", hebrew: "לְבַד", translit: "ləbad", gloss: "alone, by oneself", alts: ["alone", "by oneself"], pos: "particle", chapter: 9, freq: 161 },
  { id: "saviv", hebrew: "סָבִיב", translit: "sābîb", gloss: "around, about, surroundings", alts: ["around", "about", "surroundings"], pos: "particle", chapter: 9, freq: 338 },

  // Ch 10 — BBH 3rd ed. 10.5 nouns
  { id: "eben", hebrew: "אֶבֶן", translit: "ʾeben", gloss: "stone", alts: [], pos: "noun", chapter: 10, freq: 276 },
  { id: "oyeb", hebrew: "אֹיֵב", translit: "ʾōyēb", gloss: "enemy", alts: [], hebrewAlts: ["אוֹיֵב"], pos: "noun", chapter: 10, freq: 285 },
  { id: "berit", hebrew: "בְּרִית", translit: "bərît", gloss: "covenant", alts: ["covenant", "treaty"], pos: "noun", chapter: 10, freq: 287 },
  { id: "basar", hebrew: "בָּשָׂר", translit: "bāśār", gloss: "flesh, meat, skin", alts: ["flesh", "meat", "skin", "body"], pos: "noun", chapter: 10, freq: 270 },
  { id: "gebul", hebrew: "גְּבוּל", translit: "gəbûl", gloss: "border, boundary, territory", alts: ["border", "boundary", "territory"], pos: "noun", chapter: 10, freq: 251 },
  { id: "hodesh", hebrew: "חֹדֶשׁ", translit: "ḥōdeš", gloss: "month, new moon", alts: ["month", "new moon"], pos: "noun", chapter: 10, freq: 283 },
  { id: "hayil", hebrew: "חַיִל", translit: "ḥayil", gloss: "strength, wealth, army", alts: ["strength", "wealth", "army", "valor"], pos: "noun", chapter: 10, freq: 246 },
  { id: "hesed", hebrew: "חֶסֶד", translit: "ḥesed", gloss: "loyalty, faithfulness, steadfast love", alts: ["loyalty", "faithfulness", "steadfast love", "lovingkindness", "kindness", "mercy"], pos: "noun", chapter: 10, freq: 249 },
  { id: "yad", hebrew: "יָד", translit: "yād", gloss: "hand, power", alts: ["hand", "power"], pos: "noun", chapter: 10, freq: 1627 },
  { id: "midbar", hebrew: "מִדְבָּר", translit: "midbār", gloss: "wilderness, desert, pasture", alts: ["wilderness", "desert", "pasture"], pos: "noun", chapter: 10, freq: 269 },
  { id: "mavet", hebrew: "מָוֶת", translit: "māwet", gloss: "death, dying", alts: ["death", "dying"], hebrewAlts: ["מוֹת"], pos: "noun", chapter: 10, freq: 153 },
  { id: "matteh", hebrew: "מַטֶּה", translit: "maṭṭeh", gloss: "staff, rod, tribe", alts: ["staff", "rod", "tribe"], pos: "noun", chapter: 10, freq: 252 },
  { id: "olah", hebrew: "עֹלָה", translit: "ʿōlâ", gloss: "whole burnt offering", alts: ["burnt offering", "whole burnt offering", "offering"], pos: "noun", chapter: 10, freq: 286 },
  { id: "et-time", hebrew: "עֵת", translit: "ʿēt", gloss: "time, point of time", alts: ["time", "season", "point of time"], pos: "noun", chapter: 10, freq: 296 },
  { id: "tson", hebrew: "צֹאן", translit: "ṣōʾn", gloss: "flock, flock of sheep and goats", alts: ["flock", "flocks", "sheep"], pos: "noun", chapter: 10, freq: 274 },
  { id: "regel", hebrew: "רֶגֶל", translit: "regel", gloss: "foot", alts: [], pos: "noun", chapter: 10, freq: 251 },
  { id: "sadeh", hebrew: "שָׂדֶה", translit: "śādeh", gloss: "field, pastureland", alts: ["field", "pastureland", "pasture"], pos: "noun", chapter: 10, freq: 329 },

  // Ch 11 — BBH 3rd ed. 11.8 measures and numbers
  { id: "ammah", hebrew: "אַמָּה", translit: "ʾammâ", gloss: "cubit, forearm", alts: ["cubit", "forearm"], pos: "noun", chapter: 11, freq: 249 },
  { id: "orek", hebrew: "אֹרֶךְ", translit: "ʾōrek", gloss: "length", alts: [], pos: "noun", chapter: 11, freq: 95 },
  { id: "hatsi", hebrew: "חֲצִי", translit: "ḥăṣî", gloss: "half, middle", alts: ["half", "middle"], pos: "noun", chapter: 11, freq: 125 },
  { id: "rohab", hebrew: "רֹחַב", translit: "rōḥab", gloss: "width, breadth, expanse", alts: ["width", "breadth", "expanse"], pos: "noun", chapter: 11, freq: 101 },
  { id: "ehad", hebrew: "אֶחָד", translit: "ʾeḥād", gloss: "one", alts: ["one", "1"], hebrewAlts: ["אַחַת"], pos: "adj", chapter: 11, freq: 976 },
  { id: "shenayim", hebrew: "שְׁנַיִם", translit: "šənayim", gloss: "two", alts: ["two", "2"], hebrewAlts: ["שְׁתַּיִם"], pos: "noun", chapter: 11, freq: 769 },
  { id: "shalosh", hebrew: "שָׁלֹשׁ", translit: "šālōš", gloss: "three", alts: ["three", "3", "thirty"], hebrewAlts: ["שְׁלֹשָׁה", "שְׁלֹשִׁים"], pos: "noun", chapter: 11, freq: 606 },
  { id: "arba", hebrew: "אַרְבַּע", translit: "ʾarbaʿ", gloss: "four", alts: ["four", "4", "forty"], hebrewAlts: ["אַרְבָּעָה", "אַרְבָּעִים"], pos: "noun", chapter: 11, freq: 455 },
  { id: "hamesh", hebrew: "חָמֵשׁ", translit: "ḥāmēš", gloss: "five", alts: ["five", "5", "fifty"], hebrewAlts: ["חֲמִשָּׁה", "חֲמִשִּׁים"], pos: "noun", chapter: 11, freq: 508 },
  { id: "shesh", hebrew: "שֵׁשׁ", translit: "šēš", gloss: "six", alts: ["six", "6", "sixty"], hebrewAlts: ["שִׁשָּׁה", "שֵׁשֶׁת", "שִׁשִּׁים"], pos: "noun", chapter: 11, freq: 274 },
  { id: "sheba", hebrew: "שֶׁבַע", translit: "šebaʿ", gloss: "seven", alts: ["seven", "7", "seventy"], hebrewAlts: ["שִׁבְעָה", "שִׁבְעִים"], pos: "noun", chapter: 11, freq: 490 },
  { id: "shemoneh", hebrew: "שְׁמֹנֶה", translit: "šəmōneh", gloss: "eight", alts: ["eight", "8", "eighty"], hebrewAlts: ["שְׁמֹנָה", "שְׁמֹנִים"], pos: "noun", chapter: 11, freq: 147 },
  { id: "tesha", hebrew: "תֵּשַׁע", translit: "tēšaʿ", gloss: "nine", alts: ["nine", "9", "ninety"], hebrewAlts: ["תִּשְׁעָה", "תִּשְׁעִים"], pos: "noun", chapter: 11, freq: 78 },
  { id: "eser", hebrew: "עֶשֶׂר", translit: "ʿeśer", gloss: "ten", alts: ["ten", "10"], hebrewAlts: ["עָשָׂר", "עֲשָׂרָה", "עֶשְׂרֵה"], pos: "noun", chapter: 11, freq: 337 },
  { id: "meah", hebrew: "מֵאָה", translit: "mēʾâ", gloss: "hundred", alts: ["hundred", "100"], hebrewAlts: ["מֵאוֹת", "מָאתַיִם"], pos: "noun", chapter: 11, freq: 583 },
  { id: "eleph", hebrew: "אֶלֶף", translit: "ʾelep", gloss: "thousand", alts: ["thousand", "1000"], hebrewAlts: ["אַלְפַּיִם"], pos: "noun", chapter: 11, freq: 496 },
  { id: "rishon", hebrew: "רִאשׁוֹן", translit: "riʾšôn", gloss: "first, former", alts: ["first", "former", "1st"], hebrewAlts: ["רִאשׁוֹנָה"], pos: "adj", chapter: 11, freq: 182 },
  { id: "sheni", hebrew: "שֵׁנִי", translit: "šēnî", gloss: "second", alts: ["second", "2nd"], hebrewAlts: ["שֵׁנִית"], pos: "adj", chapter: 11, freq: 156 },
  { id: "shelishi", hebrew: "שְׁלִישִׁי", translit: "šəlîšî", gloss: "third", alts: ["third", "3rd"], hebrewAlts: ["שְׁלִישִׁית", "שְׁלִישִׁיָּה"], pos: "adj", chapter: 11, freq: 108 },
  { id: "shebii", hebrew: "שְׁבִיעִי", translit: "šəbîʿî", gloss: "seventh", alts: ["seventh", "7th"], hebrewAlts: ["שְׁבִיעִית"], pos: "adj", chapter: 11, freq: 98 },

  // Ch 12 — BBH 3rd ed. 12.18 Qal verbs and particles
  { id: "akol", hebrew: "אָכַל", translit: "ʾākal", gloss: "to eat, consume", alts: ["eat", "consume"], pos: "verb", chapter: 12, freq: 820 },
  { id: "amar", hebrew: "אָמַר", translit: "ʾāmar", gloss: "to say", alts: ["say", "speak"], pos: "verb", chapter: 12, freq: 5316 },
  { id: "hayah", hebrew: "הָיָה", translit: "hāyâ", gloss: "to be, become, happen", alts: ["be", "become", "happen", "occur"], pos: "verb", chapter: 12, freq: 3576 },
  { id: "halak", hebrew: "הָלַךְ", translit: "hālak", gloss: "to go, walk", alts: ["go", "walk", "behave"], pos: "verb", chapter: 12, freq: 1554 },
  { id: "yatsa", hebrew: "יָצָא", translit: "yāṣāʾ", gloss: "to go out, come out", alts: ["go out", "come out", "exit"], pos: "verb", chapter: 12, freq: 1076 },
  { id: "yashab", hebrew: "יָשַׁב", translit: "yāšab", gloss: "to sit, dwell, inhabit", alts: ["sit", "dwell", "inhabit"], pos: "verb", chapter: 12, freq: 1088 },
  { id: "nagash", hebrew: "נָגַשׁ", translit: "nāgaš", gloss: "to draw near, approach", alts: ["draw near", "approach"], pos: "verb", chapter: 12, freq: 125 },
  { id: "natan", hebrew: "נָתַן", translit: "nātan", gloss: "to give, put, place, set", alts: ["give", "put", "place", "set"], pos: "verb", chapter: 12, freq: 2014 },
  { id: "asah", hebrew: "עָשָׂה", translit: "ʿāśâ", gloss: "to do, make", alts: ["do", "make"], pos: "verb", chapter: 12, freq: 2632 },
  { id: "raah", hebrew: "רָאָה", translit: "rāʾâ", gloss: "to see, perceive, understand", alts: ["see", "perceive", "understand", "look"], pos: "verb", chapter: 12, freq: 1311 },
  { id: "shama", hebrew: "שָׁמַע", translit: "šāmaʿ", gloss: "to hear, listen, obey", alts: ["hear", "listen", "understand", "obey"], pos: "verb", chapter: 12, freq: 1165 },
  { id: "ak", hebrew: "אַךְ", translit: "ʾak", gloss: "only, surely, nevertheless", alts: ["only", "surely", "nevertheless"], pos: "particle", chapter: 12, freq: 161 },
  { id: "al-neg", hebrew: "אַל", translit: "ʾal", gloss: "no, not", alts: ["no", "not", "do not", "don't"], pos: "particle", chapter: 12, freq: 729 },
  { id: "im-if", hebrew: "אִם", translit: "ʾim", gloss: "if", alts: ["if", "whether"], hebrewAlts: ["כִּי־אִם"], pos: "particle", chapter: 12, freq: 1070 },
  { id: "bal", hebrew: "בַּל", translit: "bal", gloss: "no, never", alts: ["no", "never", "not"], pos: "particle", chapter: 12, freq: 73 },
  { id: "lo", hebrew: "לֹא", translit: "lōʾ", gloss: "no, not", alts: ["no", "not"], hebrewAlts: ["לוֹא"], pos: "particle", chapter: 12, freq: 5189 },
  { id: "attah-now", hebrew: "עַתָּה", translit: "ʿattâ", gloss: "now, after all, at last, then", alts: ["now", "after all", "at last", "then"], pos: "particle", chapter: 12, freq: 435 },
  { id: "tamid", hebrew: "תָּמִיד", translit: "tāmîd", gloss: "continually", alts: ["continually", "always", "continually"], pos: "particle", chapter: 12, freq: 104 },

  // Ch 13 — BBH 3rd ed. 13.14 verbs and particles
  { id: "barak", hebrew: "בָּרַךְ", translit: "bārak", gloss: "to bless, praise", alts: ["bless", "praise", "blessed", "praised"], pos: "verb", chapter: 13, freq: 327 },
  { id: "zakar-v", hebrew: "זָכַר", translit: "zākar", gloss: "to remember", alts: ["remember", "remind"], pos: "verb", chapter: 13, freq: 235 },
  { id: "hazaq", hebrew: "חָזַק", translit: "ḥāzaq", gloss: "to be strong, have courage", alts: ["be strong", "become strong", "have courage", "strengthen", "seize"], pos: "verb", chapter: 13, freq: 290 },
  { id: "yada", hebrew: "יָדַע", translit: "yādaʿ", gloss: "to know", alts: ["know"], pos: "verb", chapter: 13, freq: 956 },
  { id: "kaved", hebrew: "כָּבֵד", translit: "kābēd", gloss: "to be heavy, honored", alts: ["be heavy", "be honored", "honor", "harden"], pos: "verb", chapter: 13, freq: 114 },
  { id: "katab", hebrew: "כָּתַב", translit: "kātab", gloss: "to write", alts: ["write", "register", "record"], pos: "verb", chapter: 13, freq: 225 },
  { id: "male", hebrew: "מָלֵא", translit: "mālēʾ", gloss: "to be full, fill", alts: ["be full", "fill"], pos: "verb", chapter: 13, freq: 252 },
  { id: "malak", hebrew: "מָלַךְ", translit: "mālak", gloss: "to reign, be king", alts: ["reign", "be king", "be queen", "rule"], pos: "verb", chapter: 13, freq: 350 },
  { id: "natsa", hebrew: "מָצָא", translit: "māṣāʾ", gloss: "to find", alts: ["find", "find out", "reach", "obtain"], pos: "verb", chapter: 13, freq: 457 },
  { id: "paqad", hebrew: "פָּקַד", translit: "pāqad", gloss: "to attend, number, appoint", alts: ["attend", "pay attention", "miss", "number", "appoint", "visit"], pos: "verb", chapter: 13, freq: 304 },
  { id: "shakab", hebrew: "שָׁכַב", translit: "šākab", gloss: "to lie down", alts: ["lie down", "sleep"], pos: "verb", chapter: 13, freq: 213 },
  { id: "shalach", hebrew: "שָׁלַח", translit: "šālaḥ", gloss: "to send, stretch out", alts: ["send", "stretch out", "send away"], pos: "verb", chapter: 13, freq: 847 },
  { id: "shamar", hebrew: "שָׁמַר", translit: "šāmar", gloss: "to watch, guard, keep", alts: ["watch", "guard", "keep", "observe", "preserve", "protect"], pos: "verb", chapter: 13, freq: 469 },
  { id: "koh", hebrew: "כֹּה", translit: "kōh", gloss: "thus, here", alts: ["thus", "here", "so"], pos: "particle", chapter: 13, freq: 577 },
  { id: "ken", hebrew: "כֵּן", translit: "kēn", gloss: "so, thus", alts: ["so", "thus"], pos: "particle", chapter: 13, freq: 741 },
  { id: "od", hebrew: "עוֹד", translit: "ʿôd", gloss: "again, still, as long as", alts: ["again", "still", "yet", "as long as"], pos: "particle", chapter: 13, freq: 491 },

  // Ch 14 — BBH 3rd ed. 14.16 motion verbs
  { id: "bo", hebrew: "בּוֹא", translit: "bôʾ", gloss: "to go in, enter, come", alts: ["go in", "enter", "come", "come to"], pos: "verb", chapter: 14, freq: 2592 },
  { id: "banah", hebrew: "בָּנָה", translit: "bānâ", gloss: "to build", alts: ["build", "rebuild"], pos: "verb", chapter: 14, freq: 377 },
  { id: "yalad", hebrew: "יָלַד", translit: "yālad", gloss: "to bear, give birth, beget", alts: ["bear", "give birth", "beget"], pos: "verb", chapter: 14, freq: 499 },
  { id: "yare", hebrew: "יָרֵא", translit: "yārēʾ", gloss: "to fear, be afraid, revere", alts: ["fear", "be afraid", "revere", "be in awe"], pos: "verb", chapter: 14, freq: 317 },
  { id: "yarad", hebrew: "יָרַד", translit: "yārad", gloss: "to go down, descend", alts: ["go down", "descend"], pos: "verb", chapter: 14, freq: 382 },
  { id: "laqah", hebrew: "לָקַח", translit: "lāqaḥ", gloss: "to take, grasp, seize", alts: ["take", "grasp", "capture", "seize"], pos: "verb", chapter: 14, freq: 967 },
  { id: "mut", hebrew: "מוּת", translit: "mût", gloss: "to die", alts: ["die"], pos: "verb", chapter: 14, freq: 845 },
  { id: "naphal", hebrew: "נָפַל", translit: "nāpal", gloss: "to fall", alts: ["fall", "fall upon"], pos: "verb", chapter: 14, freq: 435 },
  { id: "natan-nasa", hebrew: "נָשָׂא", translit: "nāśāʾ", gloss: "to lift, carry, bear", alts: ["lift", "carry", "raise", "bear", "take away"], pos: "verb", chapter: 14, freq: 659 },
  { id: "abar", hebrew: "עָבַר", translit: "ʿābar", gloss: "to pass over, through, by", alts: ["pass over", "pass through", "pass by", "cross"], pos: "verb", chapter: 14, freq: 553 },
  { id: "alah", hebrew: "עָלָה", translit: "ʿālâ", gloss: "to go up, ascend", alts: ["go up", "ascend", "offer up"], pos: "verb", chapter: 14, freq: 894 },
  { id: "amad", hebrew: "עָמַד", translit: "ʿāmad", gloss: "to stand", alts: ["stand", "stand up", "stand still"], pos: "verb", chapter: 14, freq: 524 },
  { id: "qum", hebrew: "קוּם", translit: "qûm", gloss: "to rise, arise, stand", alts: ["rise", "arise", "get up", "stand"], pos: "verb", chapter: 14, freq: 627 },
  { id: "qara", hebrew: "קָרָא", translit: "qārāʾ", gloss: "to call, proclaim, read", alts: ["call", "summon", "proclaim", "read", "name"], pos: "verb", chapter: 14, freq: 739 },
  { id: "sim", hebrew: "שִׂים", translit: "śîm", gloss: "to set, put, place", alts: ["set", "put", "place", "establish"], hebrewAlts: ["שׂוּם"], pos: "verb", chapter: 14, freq: 588 },
  { id: "shub", hebrew: "שׁוּב", translit: "šûb", gloss: "to turn back, return", alts: ["turn back", "turn", "return", "restore"], pos: "verb", chapter: 14, freq: 1075 },
  { id: "poh", hebrew: "פֹּה", translit: "pōh", gloss: "here, at this place", alts: ["here", "at this place"], hebrewAlts: ["פּוֹ", "פֹה"], pos: "particle", chapter: 14, freq: 82 },
  { id: "raq", hebrew: "רַק", translit: "raq", gloss: "only, still, but, however", alts: ["only", "still", "but", "however"], pos: "particle", chapter: 14, freq: 109 },

  // Ch 15 — BBH 3rd ed. 15.10 live, serve, answer
  { id: "hayah-live", hebrew: "חָיָה", translit: "ḥāyâ", gloss: "to live, be alive, revive", alts: ["live", "be alive", "revive", "restore to life"], pos: "verb", chapter: 15, freq: 283 },
  { id: "yakol", hebrew: "יָכֹל", translit: "yākōl", gloss: "to be able, prevail", alts: ["be able", "can", "prevail", "endure"], pos: "verb", chapter: 15, freq: 193 },
  { id: "karat", hebrew: "כָּרַת", translit: "kārat", gloss: "to cut, cut off, make a covenant", alts: ["cut", "cut off", "cut down", "make a covenant"], pos: "verb", chapter: 15, freq: 289 },
  { id: "sur", hebrew: "סוּר", translit: "sûr", gloss: "to turn aside, leave, remove", alts: ["turn aside", "turn off", "leave", "desist", "remove"], pos: "verb", chapter: 15, freq: 298 },
  { id: "abad", hebrew: "עָבַד", translit: "ʿābad", gloss: "to work, serve, toil", alts: ["work", "serve", "toil", "worship"], pos: "verb", chapter: 15, freq: 289 },
  { id: "anah", hebrew: "עָנָה", translit: "ʿānâ", gloss: "to answer, respond, testify", alts: ["answer", "respond", "reply", "testify"], pos: "verb", chapter: 15, freq: 316 },
  { id: "ozen", hebrew: "אֹזֶן", translit: "ʾōzen", gloss: "ear", alts: [], pos: "noun", chapter: 15, freq: 188 },
  { id: "ayil", hebrew: "אַיִל", translit: "ʾayil", gloss: "ram, ruler", alts: ["ram", "ruler", "mighty"], pos: "noun", chapter: 15, freq: 171 },
  { id: "zebah", hebrew: "זֶבַח", translit: "zebaḥ", gloss: "sacrifice", alts: [], pos: "noun", chapter: 15, freq: 162 },
  { id: "hayyim", hebrew: "חַיִּים", translit: "ḥayyîm", gloss: "life, lifetime", alts: ["life", "lifetime"], pos: "noun", chapter: 15, freq: 140 },
  { id: "tsedaqah", hebrew: "צְדָקָה", translit: "ṣədāqâ", gloss: "righteousness, justice", alts: ["righteousness", "righteous act", "justice"], pos: "noun", chapter: 15, freq: 159 },
  { id: "tsaphon", hebrew: "צָפוֹן", translit: "ṣāpôn", gloss: "north, northern", alts: ["north", "northern"], pos: "noun", chapter: 15, freq: 153 },
  { id: "az", hebrew: "אָז", translit: "ʾāz", gloss: "then, since, before", alts: ["then", "since", "before"], pos: "particle", chapter: 15, freq: 141 },
  { id: "aph-also", hebrew: "אַף", translit: "ʾap", gloss: "also, indeed, even", alts: ["also", "indeed", "even"], pos: "particle", chapter: 15, freq: 133 },
  { id: "gibbor", hebrew: "גִּבּוֹר", translit: "gibbôr", gloss: "mighty, valiant, hero", alts: ["mighty", "valiant", "heroic", "hero"], pos: "adj", chapter: 15, freq: 160 },
  { id: "pen", hebrew: "פֶּן", translit: "pen", gloss: "lest, otherwise", alts: ["lest", "otherwise"], hebrewAlts: ["פֶּן־"], pos: "particle", chapter: 15, freq: 133 },

  // Ch 16 — BBH 3rd ed. 16.20 redeem, atone, forsake
  { id: "gaal", hebrew: "גָּאַל", translit: "gāʾal", gloss: "to redeem, act as kinsman", alts: ["redeem", "act as kinsman", "avenge"], pos: "verb", chapter: 16, freq: 104 },
  { id: "hata", hebrew: "חָטָא", translit: "ḥāṭāʾ", gloss: "to sin, miss", alts: ["sin", "miss", "commit a sin"], pos: "verb", chapter: 16, freq: 240 },
  { id: "yasaph", hebrew: "יָסַף", translit: "yāsap", gloss: "to add, continue", alts: ["add", "continue", "do again", "increase"], pos: "verb", chapter: 16, freq: 213 },
  { id: "yarash", hebrew: "יָרַשׁ", translit: "yāraš", gloss: "to inherit, possess, dispossess", alts: ["inherit", "possess", "dispossess", "take possession"], pos: "verb", chapter: 16, freq: 232 },
  { id: "kipper", hebrew: "כָּפַר", translit: "kāpar", gloss: "to cover, atone", alts: ["cover", "atone", "make atonement"], hebrewAlts: ["כִּפֶּר"], pos: "verb", chapter: 16, freq: 102 },
  { id: "natah", hebrew: "נָטָה", translit: "nāṭâ", gloss: "to stretch out, spread out, pitch", alts: ["stretch out", "spread out", "extend", "pitch", "turn", "bend"], pos: "verb", chapter: 16, freq: 216 },
  { id: "azab", hebrew: "עָזַב", translit: "ʿāzab", gloss: "to leave, forsake, abandon", alts: ["leave", "leave behind", "forsake", "abandon", "set free"], pos: "verb", chapter: 16, freq: 214 },
  { id: "qarab", hebrew: "קָרַב", translit: "qārab", gloss: "to approach, draw near", alts: ["approach", "draw near", "come near", "offer"], pos: "verb", chapter: 16, freq: 280 },
  { id: "rabah", hebrew: "רָבָה", translit: "rābâ", gloss: "to be many, multiply, increase", alts: ["be many", "become numerous", "multiply", "increase"], pos: "verb", chapter: 16, freq: 229 },
  { id: "shatah", hebrew: "שָׁתָה", translit: "šātâ", gloss: "to drink", alts: ["drink"], pos: "verb", chapter: 16, freq: 217 },
  { id: "kaph", hebrew: "כַּף", translit: "kap", gloss: "hand, palm, sole", alts: ["hand", "palm", "sole"], pos: "noun", chapter: 16, freq: 195 },
  { id: "peh", hebrew: "פֶּה", translit: "peh", gloss: "mouth, opening", alts: ["mouth", "opening"], hebrewAlts: ["פִּי"], pos: "noun", chapter: 16, freq: 498 },
  { id: "rea", hebrew: "רֵעַ", translit: "rēaʿ", gloss: "friend, companion, neighbor", alts: ["friend", "companion", "neighbor"], pos: "noun", chapter: 16, freq: 188 },
  { id: "neged", hebrew: "נֶגֶד", translit: "neged", gloss: "opposite, in front of", alts: ["opposite", "in front of"], pos: "prep", chapter: 16, freq: 151 },
  { id: "sham", hebrew: "שָׁם", translit: "šām", gloss: "there, then, at that time", alts: ["there", "then", "at that time"], pos: "particle", chapter: 16, freq: 835 },

  // Ch 17 — BBH 3rd ed. 17.10 perish, love, judge
  { id: "abad-perish", hebrew: "אָבַד", translit: "ʾābad", gloss: "to perish, be lost, destroy", alts: ["perish", "vanish", "be lost", "go astray", "destroy"], pos: "verb", chapter: 17, freq: 185 },
  { id: "ahab", hebrew: "אָהַב", translit: "ʾāhēb", gloss: "to love", alts: ["love"], pos: "verb", chapter: 17, freq: 217 },
  { id: "asaph", hebrew: "אָסַף", translit: "ʾāsap", gloss: "to gather, take away", alts: ["gather", "take in", "take away", "assemble"], pos: "verb", chapter: 17, freq: 200 },
  { id: "galah", hebrew: "גָּלָה", translit: "gālâ", gloss: "to uncover, reveal, go into exile", alts: ["uncover", "reveal", "disclose", "exile"], pos: "verb", chapter: 17, freq: 187 },
  { id: "taher", hebrew: "טָהֵר", translit: "ṭāhēr", gloss: "to be clean, purify", alts: ["be clean", "be pure", "purify", "cleanse"], pos: "verb", chapter: 17, freq: 94 },
  { id: "kalah", hebrew: "כָּלָה", translit: "kālâ", gloss: "to be complete, finish", alts: ["be complete", "be finished", "finish", "bring to an end"], pos: "verb", chapter: 17, freq: 207 },
  { id: "rum", hebrew: "רוּם", translit: "rûm", gloss: "to be high, exalted, rise", alts: ["be high", "be exalted", "rise", "raise", "lift up", "exalt"], pos: "verb", chapter: 17, freq: 197 },
  { id: "shaphat", hebrew: "שָׁפַט", translit: "šāpaṭ", gloss: "to judge, decide", alts: ["judge", "decide", "settle"], pos: "verb", chapter: 17, freq: 204 },
  { id: "ohel", hebrew: "אֹהֶל", translit: "ʾōhel", gloss: "tent", alts: [], pos: "noun", chapter: 17, freq: 348 },
  { id: "emet", hebrew: "אֱמֶת", translit: "ʾĕmet", gloss: "truth, fidelity", alts: ["truth", "fidelity", "faithfulness"], pos: "noun", chapter: 17, freq: 127 },
  { id: "dam", hebrew: "דָּם", translit: "dām", gloss: "blood, bloodshed", alts: ["blood", "bloodshed"], pos: "noun", chapter: 17, freq: 361 },
  { id: "kisse", hebrew: "כִּסֵּא", translit: "kissēʾ", gloss: "seat, chair, throne", alts: ["seat", "chair", "throne"], pos: "noun", chapter: 17, freq: 135 },
  { id: "mispar", hebrew: "מִסְפָּר", translit: "mispār", gloss: "number", alts: [], pos: "noun", chapter: 17, freq: 134 },
  { id: "shemesh", hebrew: "שֶׁמֶשׁ", translit: "šemeš", gloss: "sun", alts: [], pos: "noun", chapter: 17, freq: 134 },

  // Ch 18 — BBH 3rd ed. 18.14 choose, seek, holy
  { id: "bahar", hebrew: "בָּחַר", translit: "bāḥar", gloss: "to choose, examine", alts: ["choose", "test", "examine"], pos: "verb", chapter: 18, freq: 172 },
  { id: "bin", hebrew: "בִּין", translit: "bîn", gloss: "to understand, perceive", alts: ["understand", "perceive", "consider", "give heed"], pos: "verb", chapter: 18, freq: 171 },
  { id: "darash", hebrew: "דָּרַשׁ", translit: "dāraš", gloss: "to seek, inquire, require", alts: ["seek", "inquire", "investigate", "require", "demand"], pos: "verb", chapter: 18, freq: 165 },
  { id: "harag", hebrew: "הָרַג", translit: "hārag", gloss: "to kill, slay", alts: ["kill", "slay"], pos: "verb", chapter: 18, freq: 167 },
  { id: "haphets", hebrew: "חָפֵץ", translit: "ḥāpēṣ", gloss: "to delight in, desire", alts: ["delight", "take pleasure", "desire", "be willing"], pos: "verb", chapter: 18, freq: 74 },
  { id: "qadash", hebrew: "קָדַשׁ", translit: "qādaš", gloss: "to be holy, consecrate", alts: ["be holy", "set apart", "consecrate", "sanctify"], pos: "verb", chapter: 18, freq: 171 },
  { id: "raah-pasture", hebrew: "רָעָה", translit: "rāʿâ", gloss: "to pasture, shepherd, feed", alts: ["pasture", "tend", "shepherd", "feed"], pos: "verb", chapter: 18, freq: 167 },
  { id: "shaal", hebrew: "שָׁאַל", translit: "šāʾal", gloss: "to ask, inquire, request", alts: ["ask", "inquire", "request", "demand"], pos: "verb", chapter: 18, freq: 176 },
  { id: "baal", hebrew: "בַּעַל", translit: "baʿal", gloss: "owner, master, husband, Baal", alts: ["owner", "master", "husband", "baal"], pos: "noun", chapter: 18, freq: 161 },
  { id: "shebet", hebrew: "שֵׁבֶט", translit: "šēbeṭ", gloss: "rod, staff, scepter, tribe", alts: ["rod", "staff", "scepter", "tribe"], pos: "noun", chapter: 18, freq: 190 },
  { id: "shalom", hebrew: "שָׁלוֹם", translit: "šālôm", gloss: "peace, welfare, wholeness", alts: ["peace", "welfare", "wholeness"], pos: "noun", chapter: 18, freq: 237 },
  { id: "baad", hebrew: "בַּעַד", translit: "baʿad", gloss: "behind, through", alts: ["behind", "through", "for"], pos: "prep", chapter: 18, freq: 104 },
  { id: "yaan", hebrew: "יַעַן", translit: "yaʿan", gloss: "on account of, because", alts: ["on account of", "because"], hebrewAlts: ["יַעַן אֲשֶׁר"], pos: "particle", chapter: 18, freq: 100 },
  { id: "na", hebrew: "נָא", translit: "nāʾ", gloss: "please, now, surely", alts: ["please", "now", "surely", "I pray"], pos: "particle", chapter: 18, freq: 405 },

  // Ch 19 — BBH 3rd ed. 19.11 trust, work, iniquity
  { id: "batah", hebrew: "בָּטַח", translit: "bāṭaḥ", gloss: "to trust, rely upon", alts: ["trust", "rely upon", "feel secure"], pos: "verb", chapter: 19, freq: 118 },
  { id: "bakah", hebrew: "בָּכָה", translit: "bākâ", gloss: "to weep", alts: ["weep", "cry", "weep for"], pos: "verb", chapter: 19, freq: 114 },
  { id: "labash", hebrew: "לָבַשׁ", translit: "lābaš", gloss: "to put on, clothe", alts: ["put on", "wear", "clothe", "be clothed"], pos: "verb", chapter: 19, freq: 112 },
  { id: "saraf", hebrew: "שָׂרַף", translit: "śārap", gloss: "to burn, destroy", alts: ["burn", "burn completely", "destroy"], pos: "verb", chapter: 19, freq: 117 },
  { id: "shillem", hebrew: "שָׁלֵם", translit: "šālēm", gloss: "to be complete, restore, repay", alts: ["be complete", "finish", "restore", "repay", "reward"], hebrewAlts: ["שִׁלֵּם"], pos: "verb", chapter: 19, freq: 116 },
  { id: "dor", hebrew: "דּוֹר", translit: "dôr", gloss: "generation", alts: [], hebrewAlts: ["דֹּר"], pos: "noun", chapter: 19, freq: 167 },
  { id: "zera", hebrew: "זֶרַע", translit: "zeraʿ", gloss: "seed, offspring, descendants", alts: ["seed", "offspring", "descendants"], pos: "noun", chapter: 19, freq: 229 },
  { id: "huts", hebrew: "חוּץ", translit: "ḥûṣ", gloss: "outside, street", alts: ["outside", "street"], hebrewAlts: ["מִחוּץ"], pos: "noun", chapter: 19, freq: 164 },
  { id: "melakah", hebrew: "מְלָאכָה", translit: "məlāʾkâ", gloss: "work, occupation, service", alts: ["work", "occupation", "service"], pos: "noun", chapter: 19, freq: 167 },
  { id: "avon", hebrew: "עָוֹן", translit: "ʿāwōn", gloss: "iniquity, guilt, punishment", alts: ["iniquity", "transgression", "guilt", "punishment"], hebrewAlts: ["עֲוֹנוֹת"], pos: "noun", chapter: 19, freq: 233 },
  { id: "par", hebrew: "פַּר", translit: "par", gloss: "bull, ox, steer", alts: ["bull", "ox", "steer"], pos: "noun", chapter: 19, freq: 133 },
  { id: "petah", hebrew: "פֶּתַח", translit: "petaḥ", gloss: "opening, entrance, doorway", alts: ["opening", "entrance", "doorway", "door"], pos: "noun", chapter: 19, freq: 164 },
  { id: "rob", hebrew: "רֹב", translit: "rōb", gloss: "multitude, abundance, greatness", alts: ["multitude", "abundance", "greatness"], pos: "noun", chapter: 19, freq: 150 },
  { id: "safah", hebrew: "שָׂפָה", translit: "śāpâ", gloss: "lip, language, edge, shore", alts: ["lip", "language", "edge", "shore"], pos: "noun", chapter: 19, freq: 178 },

  // extras parked until their BBH chapter arrives
  { id: "at", hebrew: "אַתְּ", translit: "ʾatt", gloss: "you (f.s.)", alts: ["you"], pos: "pron", chapter: 20, freq: 74 },

  { id: "hadash", hebrew: "חָדָשׁ", translit: "ḥādāš", gloss: "new", alts: [], pos: "adj", chapter: 20, freq: 53 },
  { id: "zakar", hebrew: "זָכָר", translit: "zākār", gloss: "male", alts: [], pos: "noun", chapter: 20, freq: 82 },
  { id: "neqebah", hebrew: "נְקֵבָה", translit: "nəqēbâ", gloss: "female", alts: [], pos: "noun", chapter: 20, freq: 22 },

  // extras parked from earlier ch 3 (not BBH ch. 3)

  // Ch 6 — world / body / cult

  // Ch 7 — theological nouns
  { id: "or", hebrew: "אוֹר", translit: "ʾôr", gloss: "light", alts: [], pos: "noun", chapter: 20, freq: 120 },
  { id: "hoshek", hebrew: "חֹשֶׁךְ", translit: "ḥōšek", gloss: "darkness", alts: [], pos: "noun", chapter: 20, freq: 80 },
  { id: "mitsvah", hebrew: "מִצְוָה", translit: "miṣwâ", gloss: "commandment", alts: ["commandment", "command"], pos: "noun", chapter: 20, freq: 181 },
  { id: "shabbat", hebrew: "שַׁבָּת", translit: "šabbāt", gloss: "Sabbath", alts: ["sabbath"], pos: "noun", chapter: 20, freq: 111 },

  // Ch 8 — core verbs
  { id: "diber", hebrew: "דִּבֶּר", translit: "dibber", gloss: "to speak", alts: ["speak"], pos: "verb", chapter: 20, freq: 1136 },

  // Ch 9 — more verbs
  { id: "bara", hebrew: "בָּרָא", translit: "bārāʾ", gloss: "to create", alts: ["create"], pos: "verb", chapter: 20, freq: 54 },

  // Ch 10
  { id: "gadal", hebrew: "גָּדַל", translit: "gādal", gloss: "to be great, grow", alts: ["be great", "grow", "magnify"], pos: "verb", chapter: 20, freq: 117 },
  { id: "lamad", hebrew: "לָמַד", translit: "lāmad", gloss: "to learn, teach", alts: ["learn", "teach"], pos: "verb", chapter: 20, freq: 87 },
  { id: "sane", hebrew: "שָׂנֵא", translit: "śānēʾ", gloss: "to hate", alts: ["hate"], pos: "verb", chapter: 20, freq: 148 },

  // Ch 11
  { id: "yasha", hebrew: "יָשַׁע", translit: "yāšaʿ", gloss: "to save", alts: ["save", "deliver"], pos: "verb", chapter: 20, freq: 205 },
  { id: "azar", hebrew: "עָזַר", translit: "ʿāzar", gloss: "to help", alts: ["help"], pos: "verb", chapter: 20, freq: 82 },
  { id: "baqash", hebrew: "בִּקֵּשׁ", translit: "biqqēš", gloss: "to seek", alts: ["seek"], pos: "verb", chapter: 20, freq: 225 },
  { id: "hithpallel", hebrew: "הִתְפַּלֵּל", translit: "hitpallēl", gloss: "to pray", alts: ["pray"], pos: "verb", chapter: 20, freq: 84 },
  { id: "hishtahawah", hebrew: "הִשְׁתַּחֲוָה", translit: "hištaḥăwâ", gloss: "to bow down, worship", alts: ["bow down", "worship", "prostrate"], pos: "verb", chapter: 20, freq: 172 },
  { id: "hallel", hebrew: "הִלֵּל", translit: "hillēl", gloss: "to praise", alts: ["praise"], pos: "verb", chapter: 20, freq: 146 },
  { id: "salah", hebrew: "סָלַח", translit: "sālaḥ", gloss: "to forgive", alts: ["forgive", "pardon"], pos: "verb", chapter: 20, freq: 47 },
  { id: "shakah", hebrew: "שָׁכַח", translit: "šākaḥ", gloss: "to forget", alts: ["forget"], pos: "verb", chapter: 20, freq: 102 },
  { id: "tsaaq", hebrew: "צָעַק", translit: "ṣāʿaq", gloss: "to cry out", alts: ["cry out", "call out"], pos: "verb", chapter: 20, freq: 55 },
  { id: "nathan-natsal", hebrew: "נָצַל", translit: "nāṣal", gloss: "to deliver, snatch", alts: ["deliver", "rescue", "snatch"], pos: "verb", chapter: 20, freq: 213 },

  // Ch 12
  { id: "patah", hebrew: "פָּתַח", translit: "pātaḥ", gloss: "to open", alts: ["open"], pos: "verb", chapter: 20, freq: 136 },
  { id: "sagar", hebrew: "סָגַר", translit: "sāgar", gloss: "to close, shut", alts: ["close", "shut"], pos: "verb", chapter: 20, freq: 91 },
  { id: "kasah", hebrew: "כָּסָה", translit: "kāsâ", gloss: "to cover", alts: ["cover", "conceal"], pos: "verb", chapter: 20, freq: 153 },
  { id: "zabah", hebrew: "זָבַח", translit: "zābaḥ", gloss: "to sacrifice", alts: ["sacrifice", "slaughter"], pos: "verb", chapter: 20, freq: 134 },
  { id: "mashah", hebrew: "מָשַׁח", translit: "māšaḥ", gloss: "to anoint", alts: ["anoint"], pos: "verb", chapter: 20, freq: 70 },
  { id: "tame", hebrew: "טָמֵא", translit: "ṭāmēʾ", gloss: "to be unclean", alts: ["be unclean", "defile"], pos: "verb", chapter: 20, freq: 162 },
  { id: "qabar", hebrew: "קָבַר", translit: "qābar", gloss: "to bury", alts: ["bury"], pos: "verb", chapter: 20, freq: 133 },
  { id: "nata", hebrew: "נָטַע", translit: "nāṭaʿ", gloss: "to plant", alts: ["plant"], pos: "verb", chapter: 20, freq: 59 },

  // Ch 13
  { id: "laham", hebrew: "לָחַם", translit: "lāḥam", gloss: "to fight", alts: ["fight", "wage war"], pos: "verb", chapter: 20, freq: 177 },
  { id: "nakah", hebrew: "נָכָה", translit: "nākâ", gloss: "to strike", alts: ["strike", "smite", "hit"], pos: "verb", chapter: 20, freq: 501 },
  { id: "shabar", hebrew: "שָׁבַר", translit: "šābar", gloss: "to break", alts: ["break"], pos: "verb", chapter: 20, freq: 148 },
  { id: "radaph", hebrew: "רָדַף", translit: "rādap", gloss: "to pursue", alts: ["pursue", "chase"], pos: "verb", chapter: 20, freq: 144 },
  { id: "nus", hebrew: "נוּס", translit: "nûs", gloss: "to flee", alts: ["flee"], pos: "verb", chapter: 20, freq: 160 },
  { id: "lakad", hebrew: "לָכַד", translit: "lākad", gloss: "to capture", alts: ["capture", "catch"], pos: "verb", chapter: 20, freq: 121 },
  { id: "ganab", hebrew: "גָּנַב", translit: "gānab", gloss: "to steal", alts: ["steal"], pos: "verb", chapter: 20, freq: 40 },
  { id: "shamad", hebrew: "שָׁמַד", translit: "šāmad", gloss: "to destroy", alts: ["destroy", "annihilate"], pos: "verb", chapter: 20, freq: 90 },
  { id: "asar", hebrew: "אָסַר", translit: "ʾāsar", gloss: "to bind, imprison", alts: ["bind", "imprison", "tie"], pos: "verb", chapter: 20, freq: 73 },
  { id: "natsar", hebrew: "נָצַר", translit: "nāṣar", gloss: "to watch, guard", alts: ["watch", "guard", "keep"], pos: "verb", chapter: 20, freq: 63 },

  // Ch 14
  { id: "makar", hebrew: "מָכַר", translit: "mākar", gloss: "to sell", alts: ["sell"], pos: "verb", chapter: 20, freq: 80 },
  { id: "qanah", hebrew: "קָנָה", translit: "qānâ", gloss: "to acquire, buy", alts: ["buy", "acquire", "get"], pos: "verb", chapter: 20, freq: 85 },
  { id: "saphar", hebrew: "סָפַר", translit: "sāpar", gloss: "to count, recount", alts: ["count", "tell", "recount"], pos: "verb", chapter: 20, freq: 107 },
  { id: "hashab", hebrew: "חָשַׁב", translit: "ḥāšab", gloss: "to think, reckon", alts: ["think", "reckon", "plan", "consider"], pos: "verb", chapter: 20, freq: 124 },
  { id: "naba", hebrew: "נָבָא", translit: "nābāʾ", gloss: "to prophesy", alts: ["prophesy"], pos: "verb", chapter: 20, freq: 115 },
  { id: "halam", hebrew: "חָלַם", translit: "ḥālam", gloss: "to dream", alts: ["dream"], pos: "verb", chapter: 20, freq: 55 },
  { id: "zaqen-v", hebrew: "זָקֵן", translit: "zāqēn", gloss: "to be old", alts: ["be old", "grow old"], pos: "verb", chapter: 20, freq: 27 },
  { id: "hadal", hebrew: "חָדַל", translit: "ḥādal", gloss: "to cease", alts: ["cease", "stop"], pos: "verb", chapter: 20, freq: 55 },
  { id: "madad", hebrew: "מָדַד", translit: "mādad", gloss: "to measure", alts: ["measure"], pos: "verb", chapter: 20, freq: 52 },
  { id: "yaats", hebrew: "יָעַץ", translit: "yāʿaṣ", gloss: "to advise", alts: ["advise", "counsel"], pos: "verb", chapter: 20, freq: 80 },

  // Ch 15
  { id: "naga", hebrew: "נָגַע", translit: "nāgaʿ", gloss: "to touch, strike", alts: ["touch", "strike", "reach"], pos: "verb", chapter: 20, freq: 150 },
  { id: "haphak", hebrew: "הָפַךְ", translit: "hāpak", gloss: "to turn, overturn", alts: ["turn", "overturn", "change"], pos: "verb", chapter: 20, freq: 94 },
  { id: "sabab", hebrew: "סָבַב", translit: "sābab", gloss: "to go around", alts: ["surround", "go around", "turn"], pos: "verb", chapter: 20, freq: 163 },
  { id: "shakan", hebrew: "שָׁכַן", translit: "šākan", gloss: "to dwell", alts: ["dwell", "settle", "abide"], pos: "verb", chapter: 20, freq: 129 },
  { id: "dabaq", hebrew: "דָּבַק", translit: "dābaq", gloss: "to cling", alts: ["cling", "cleave", "stick"], pos: "verb", chapter: 20, freq: 54 },
  { id: "parad", hebrew: "פָּרַד", translit: "pārad", gloss: "to separate", alts: ["separate", "divide"], pos: "verb", chapter: 20, freq: 26 },
  { id: "qarah", hebrew: "קָרָה", translit: "qārâ", gloss: "to happen, meet", alts: ["happen", "meet", "befall"], pos: "verb", chapter: 20, freq: 37 },
  { id: "nuah", hebrew: "נוּחַ", translit: "nûaḥ", gloss: "to rest", alts: ["rest", "settle"], pos: "verb", chapter: 20, freq: 140 },

  // Ch 16
  { id: "tsiwwah", hebrew: "צִוָּה", translit: "ṣiwwâ", gloss: "to command", alts: ["command", "charge"], pos: "verb", chapter: 20, freq: 496 },
  { id: "higgid", hebrew: "הִגִּיד", translit: "higgîd", gloss: "to tell, declare", alts: ["tell", "declare", "report"], pos: "verb", chapter: 20, freq: 371 },
  { id: "nishba", hebrew: "נִשְׁבַּע", translit: "nišbaʿ", gloss: "to swear", alts: ["swear", "take an oath"], pos: "verb", chapter: 20, freq: 186 },
  { id: "nadar", hebrew: "נָדַר", translit: "nādar", gloss: "to vow", alts: ["vow"], pos: "verb", chapter: 20, freq: 31 },
  { id: "qillel", hebrew: "קִלֵּל", translit: "qillēl", gloss: "to curse", alts: ["curse"], pos: "verb", chapter: 20, freq: 40 },
  { id: "arar", hebrew: "אָרַר", translit: "ʾārar", gloss: "to curse", alts: ["curse"], pos: "verb", chapter: 20, freq: 63 },
  { id: "hodia", hebrew: "הוֹדִיעַ", translit: "hôdîaʿ", gloss: "to make known", alts: ["make known", "inform"], pos: "verb", chapter: 20, freq: 71 },
  { id: "sipper", hebrew: "סִפֵּר", translit: "sipper", gloss: "to tell, recount", alts: ["tell", "recount", "narrate"], pos: "verb", chapter: 20, freq: 107 },
  { id: "yadah", hebrew: "יָדָה", translit: "yādâ", gloss: "to give thanks, praise", alts: ["give thanks", "praise", "confess"], pos: "verb", chapter: 20, freq: 111 },
  { id: "anah-sing", hebrew: "עָנָה", translit: "ʿānâ", gloss: "to sing, answer", alts: ["sing", "answer"], pos: "verb", chapter: 20, freq: 15 },

  // Ch 17
  { id: "hasah", hebrew: "חָסָה", translit: "ḥāsâ", gloss: "to take refuge", alts: ["take refuge", "seek refuge"], pos: "verb", chapter: 20, freq: 37 },
  { id: "qawah", hebrew: "קָוָה", translit: "qāwâ", gloss: "to wait, hope", alts: ["wait", "hope", "look for"], pos: "verb", chapter: 20, freq: 49 },
  { id: "sakal", hebrew: "שָׂכַל", translit: "śākal", gloss: "to be prudent, understand", alts: ["understand", "prosper", "be prudent"], pos: "verb", chapter: 20, freq: 63 },
  { id: "pachad", hebrew: "פָּחַד", translit: "pāḥad", gloss: "to dread", alts: ["dread", "be afraid"], pos: "verb", chapter: 20, freq: 25 },
  { id: "kashal", hebrew: "כָּשַׁל", translit: "kāšal", gloss: "to stumble", alts: ["stumble", "stagger"], pos: "verb", chapter: 20, freq: 65 },
  { id: "taah", hebrew: "תָּעָה", translit: "tāʿâ", gloss: "to wander, err", alts: ["wander", "err", "go astray"], pos: "verb", chapter: 20, freq: 50 },
  { id: "ragaz", hebrew: "רָגַז", translit: "rāgaz", gloss: "to tremble", alts: ["tremble", "quake", "be agitated"], pos: "verb", chapter: 20, freq: 41 },
  { id: "hakam-v", hebrew: "חָכַם", translit: "ḥākam", gloss: "to be wise", alts: ["be wise"], pos: "verb", chapter: 20, freq: 27 },
  { id: "yahal", hebrew: "יָחַל", translit: "yāḥal", gloss: "to wait, hope", alts: ["wait", "hope"], pos: "verb", chapter: 20, freq: 42 },
  { id: "shaqad", hebrew: "שָׁקַד", translit: "šāqad", gloss: "to watch, be alert", alts: ["watch", "be alert"], pos: "verb", chapter: 20, freq: 12 },

  // Ch 18
  { id: "ratsah", hebrew: "רָצָה", translit: "rāṣâ", gloss: "to be pleased", alts: ["be pleased", "accept"], pos: "verb", chapter: 20, freq: 56 },
  { id: "hanan", hebrew: "חָנַן", translit: "ḥānan", gloss: "to be gracious", alts: ["be gracious", "show favor"], pos: "verb", chapter: 20, freq: 78 },
  { id: "raham", hebrew: "רִחַם", translit: "riḥam", gloss: "to have compassion", alts: ["have compassion", "show mercy"], pos: "verb", chapter: 20, freq: 47 },
  { id: "naham", hebrew: "נָחַם", translit: "nāḥam", gloss: "to comfort, relent", alts: ["comfort", "relent", "repent"], pos: "verb", chapter: 20, freq: 108 },
  { id: "samah", hebrew: "שָׂמַח", translit: "śāmaḥ", gloss: "to rejoice", alts: ["rejoice", "be glad"], pos: "verb", chapter: 20, freq: 156 },
  { id: "qana", hebrew: "קָנָא", translit: "qānāʾ", gloss: "to be jealous", alts: ["be jealous", "be zealous"], pos: "verb", chapter: 20, freq: 34 },
  { id: "harah", hebrew: "חָרָה", translit: "ḥārâ", gloss: "to burn with anger", alts: ["be angry", "burn"], pos: "verb", chapter: 20, freq: 93 },
  { id: "abal", hebrew: "אָבַל", translit: "ʾābal", gloss: "to mourn", alts: ["mourn"], pos: "verb", chapter: 20, freq: 39 },
  { id: "shir", hebrew: "שִׁיר", translit: "šîr", gloss: "to sing", alts: ["sing"], pos: "verb", chapter: 20, freq: 87 },
  { id: "gil", hebrew: "גִּיל", translit: "gîl", gloss: "to rejoice, exult", alts: ["rejoice", "exult"], pos: "verb", chapter: 20, freq: 45 },
  { id: "ranan", hebrew: "רָנַן", translit: "rānan", gloss: "to shout for joy", alts: ["shout", "sing for joy"], pos: "verb", chapter: 20, freq: 53 },

  // Ch 19
  { id: "mashal", hebrew: "מָשַׁל", translit: "māšal", gloss: "to rule", alts: ["rule", "have dominion"], pos: "verb", chapter: 20, freq: 81 },
  { id: "nahag", hebrew: "נָהַג", translit: "nāhag", gloss: "to lead, drive", alts: ["lead", "drive"], pos: "verb", chapter: 20, freq: 31 },
  { id: "nahah", hebrew: "נָחָה", translit: "nāḥâ", gloss: "to lead, guide", alts: ["lead", "guide"], pos: "verb", chapter: 20, freq: 39 },
  { id: "kun", hebrew: "כּוּן", translit: "kûn", gloss: "to establish, be firm", alts: ["establish", "prepare", "be firm"], pos: "verb", chapter: 20, freq: 219 },
  { id: "haras", hebrew: "הָרַס", translit: "hāras", gloss: "to tear down", alts: ["tear down", "destroy"], pos: "verb", chapter: 20, freq: 43 },
  { id: "samak", hebrew: "סָמַךְ", translit: "sāmak", gloss: "to support, lay (hands)", alts: ["support", "lay hands", "lean"], pos: "verb", chapter: 20, freq: 48 },
  { id: "yasad", hebrew: "יָסַד", translit: "yāsad", gloss: "to found", alts: ["found", "establish", "lay a foundation"], pos: "verb", chapter: 20, freq: 42 },
  { id: "radah", hebrew: "רָדָה", translit: "rādâ", gloss: "to have dominion", alts: ["have dominion", "rule", "tread"], pos: "verb", chapter: 20, freq: 27 },
  { id: "amets", hebrew: "אָמֵץ", translit: "ʾāmēṣ", gloss: "to be strong, courageous", alts: ["be strong", "be courageous"], pos: "verb", chapter: 20, freq: 41 },
  { id: "sabal", hebrew: "סָבַל", translit: "sābal", gloss: "to bear, carry a load", alts: ["bear", "carry"], pos: "verb", chapter: 20, freq: 18 },
  { id: "nathats", hebrew: "נָתַץ", translit: "nātaṣ", gloss: "to break down", alts: ["break down", "tear down"], pos: "verb", chapter: 20, freq: 42 },
  { id: "shakan-mishkan", hebrew: "מִשְׁכָּן", translit: "miškān", gloss: "tabernacle, dwelling", alts: ["tabernacle", "dwelling"], pos: "noun", chapter: 20, freq: 139 },
];

export const CHAPTERS = Array.from({ length: 18 }, (_, i) => i + 2);

/** Same BBH 3rd-ed. lemmas Game uses (Ch. 2–19). Extra Ch. 20 dump is not in this set. */
export function bbhVocab(): VocabItem[] {
  return VOCAB.filter((v) => v.chapter >= 2 && v.chapter <= 19);
}

export function alphabetVocab(): VocabItem[] {
  return CONSONANTS.map((l) => ({
    id: `ch1-${l.id}`,
    hebrew: l.letter,
    translit: l.translit,
    gloss: l.name,
    alts: [l.name.toLowerCase(), l.id, l.sound, l.translit, ...(l.id === "vav" ? ["waw"] : [])].filter(Boolean),
    pos: "particle" as const,
    chapter: 1,
    freq: 0,
  }));
}

export const GAME_CHAPTER_TITLES: Record<number, string> = {
  1: "Alphabet",
  2: "Names",
  3: "Nouns",
  4: "More nouns",
  5: "Article & nouns",
  6: "Prepositions",
  7: "Adjectives",
  8: "Pronouns",
  9: "More nouns",
  10: "Construct nouns",
  11: "Numbers",
  12: "Qal verbs",
  13: "More Qal",
  14: "Come & go",
  15: "Live & serve",
  16: "Redeem",
  17: "Love & judge",
  18: "Choose & seek",
  19: "Trust & work",
};

/** week 30 = all Game chapters; 31–49 = Game Ch. 1–19 */
export const ALL_GAME_WEEK = 30;
export const GAME_CHAPTER_WEEK_BASE = 30;

export function weekForGameChapter(chapter: number): number {
  return GAME_CHAPTER_WEEK_BASE + chapter;
}

export function itemsForChapter(chapter: number): VocabItem[] {
  if (chapter === 1) return alphabetVocab();
  return VOCAB.filter((v) => v.chapter === chapter);
}

export function weekForChapter(chapter: number): number {
  if (chapter <= 2) return 1;
  if (chapter === 3) return 2;
  if (chapter <= 5) return 3;
  if (chapter <= 7) return 4;
  if (chapter <= 9) return 5;
  if (chapter <= 11) return 6;
  if (chapter <= 13) return 8;
  if (chapter === 14) return 9;
  if (chapter === 15) return 10;
  if (chapter === 16) return 11;
  if (chapter === 17) return 12;
  if (chapter === 18) return 13;
  return 14;
}

export const COURSE_WEEKS = [
  { week: 1, label: "Week 1", chapters: [1, 2], hint: "Alphabet + names" },
  { week: 2, label: "Week 2", chapters: [3], hint: "Core nouns" },
  { week: 3, label: "Week 3", chapters: [4, 5], hint: "More nouns, article, vav" },
  { week: 4, label: "Week 4", chapters: [6, 7], hint: "Prepositions & adjectives" },
  { week: 5, label: "Week 5", chapters: [8, 9], hint: "Pronouns, particles, nouns" },
  { week: 6, label: "Week 6", chapters: [10, 11], hint: "Construct nouns & numbers" },
  { week: 7, label: "Week 7", chapters: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], hint: "Midterm · Ch. 2–11" },
  { week: 8, label: "Week 8", chapters: [12, 13], hint: "Core Qal verbs" },
  { week: 9, label: "Week 9", chapters: [14], hint: "Come, go, rise, return" },
  { week: 10, label: "Week 10", chapters: [15], hint: "Live, serve, answer" },
  { week: 11, label: "Week 11", chapters: [16], hint: "Redeem, atone, forsake" },
  { week: 12, label: "Week 12", chapters: [17], hint: "Love, judge, tent, sun" },
  { week: 13, label: "Week 13", chapters: [18], hint: "Choose, seek, peace" },
  { week: 14, label: "Week 14", chapters: [19], hint: "Trust, work, iniquity" },
  { week: 15, label: "Week 15", chapters: CHAPTERS, hint: "All Game · Ch. 2–19" },
] as const;

export function itemsForChapters(chapters: number[]): VocabItem[] {
  const set = new Set(chapters);
  const out = VOCAB.filter((v) => set.has(v.chapter));
  if (set.has(1)) return [...alphabetVocab(), ...out];
  return out;
}

export function itemsForWeek(week: number): VocabItem[] {
  if (week === ALL_GAME_WEEK || week === 15) return bbhVocab();
  if (week >= 31 && week <= 49) return itemsForChapter(week - GAME_CHAPTER_WEEK_BASE);
  const w = COURSE_WEEKS.find((x) => x.week === week);
  if (!w) return [];
  if (week === 7) return VOCAB.filter((v) => v.chapter >= 2 && v.chapter <= 11);
  return itemsForChapters([...w.chapters]);
}

export function studySetMeta(week: number): { label: string; hint: string } {
  if (week === ALL_GAME_WEEK) return { label: "All Game", hint: "Corrected BBH Ch. 2–19" };
  if (week >= 31 && week <= 49) {
    const ch = week - GAME_CHAPTER_WEEK_BASE;
    return { label: `Chapter ${ch}`, hint: GAME_CHAPTER_TITLES[ch] ?? "Game chapter" };
  }
  const w = COURSE_WEEKS.find((x) => x.week === week);
  if (w) return { label: w.label, hint: w.hint };
  return { label: "Study set", hint: "" };
}

export function normalizeGloss(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function glossMatches(item: VocabItem, input: string): boolean {
  const n = normalizeGloss(input);
  if (!n) return false;
  const pool = [item.gloss, ...item.alts].map(normalizeGloss);
  if (pool.includes(n)) return true;
  return pool.some((g) => g.split(/,|\/|\s+or\s+/).map((p) => p.trim()).includes(n));
}

export function liveGloss(item: VocabItem, input: string): "empty" | "prefix" | "exact" | "off" {
  const n = normalizeGloss(input);
  if (!n) return "empty";
  if (glossMatches(item, input)) return "exact";
  const pool = [item.gloss, ...item.alts].map(normalizeGloss);
  if (pool.some((g) => g.startsWith(n))) return "prefix";
  return "off";
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function quizChoices(item: VocabItem, pool: VocabItem[], n = 4): string[] {
  const same = pool.filter((x) => x.id !== item.id && x.pos === item.pos);
  const rest = pool.filter((x) => x.id !== item.id && x.pos !== item.pos);
  const distractors = shuffle([...same, ...rest])
    .map((x) => x.gloss)
    .filter((g, i, arr) => g !== item.gloss && arr.indexOf(g) === i)
    .slice(0, n - 1);
  return shuffle([item.gloss, ...distractors]);
}

export const POS_LABEL: Record<Pos, string> = {
  noun: "Noun",
  verb: "Verb",
  adj: "Adjective",
  prep: "Preposition",
  particle: "Particle",
  name: "Name",
  pron: "Pronoun",
};
