import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { SYLLABLE_UNITS } from "@/lib/syllables";
import { VERSES, type VerseEx } from "@/lib/verses";
import { VOCAB, itemsForWeek, shuffle, type VocabItem } from "@/lib/vocab";

const FORM_VERSES: Record<string, VerseEx> = {};

const CLITICS = new Set(["ו", "ה", "ב", "ל", "כ"]);

function tokenLetters(s: string): string {
  return foldFinals(lettersOnly(s));
}

/** True when a verse token is the surface, or the surface plus extra clitics in front. */
function tokenCoversSurface(tok: string, surface: string): boolean {
  const t = tokenLetters(tok);
  const s = tokenLetters(surface);
  if (!t || !s) return false;
  if (t === s) return true;
  if (t.length <= s.length || !t.endsWith(s)) return false;
  return [...t.slice(0, t.length - s.length)].every((ch) => CLITICS.has(ch));
}

/** The verse word that is this surface (or this surface with a ו/ב/ל/כ/ה in front). */
export function verseTokenFor(he: string, surface: string): string | undefined {
  for (const chunk of he.split(/[\s,;:.]+/)) {
    if (!chunk) continue;
    if (tokenCoversSurface(chunk, surface)) return chunk.replace(/[־–—]$/, "");
    for (const part of chunk.split(/[־–—]/)) {
      if (tokenCoversSurface(part, surface)) return part;
    }
  }
  return undefined;
}

/** Noun/prep endings, longest first, always regular (non-final) letters. */
const SUFFIXES = [
  "יהם",
  "יהן",
  "יכם",
  "יכן",
  "ינו",
  "ות",
  "ים",
  "ית",
  "יך",
  "יו",
  "יה",
  "נו",
  "כם",
  "כן",
  "הם",
  "הן",
  "ך",
  "ו",
  "י",
  "ה",
  "ן",
  "ם",
].map((s) => foldFinals(s));

function afterClitics(s: string): string[] {
  const out = [s];
  if (s.length < 3) return out;
  if (CLITICS.has(s[0]!)) {
    out.push(s.slice(1));
    if (s.length >= 4 && s[0] === "ו" && CLITICS.has(s[1]!)) out.push(s.slice(2));
  }
  return out;
}

/**
 * Surface is the lemma plus Hebrew clitics / endings — not a longer word that
 * merely contains the lemma letters (אשית is “I will put”, not fire).
 */
export function isInflected(surface: string, lemmaHe: string): boolean {
  const s = foldFinals(lettersOnly(surface));
  const r = foldFinals(lettersOnly(lemmaHe));
  if (s.length < 2 || r.length < 2) return false;
  if (s === r) return true;
  if (s.length <= r.length) return false;

  const short = r.length < 3;
  if (short) {
    const bodies = "והבלכ".includes(s[0]!) ? [s, s.slice(1)] : [s];
    for (const body of bodies) {
      if (body === r) return true;
      if (body.length === r.length + 1 && body.endsWith("י") && body.slice(0, r.length) === r) return true;
    }
    return false;
  }

  for (const body of afterClitics(s)) {
    if (body === r) return true;
    if (r.endsWith("ה")) {
      const bare = r.slice(0, -1);
      if (body === `${bare}ת` || body === `${bare}ים` || body === `${bare}ות`) return true;
    }
    // masculine plural construct: אלהים → אלהי, then אלהינו
    if (r.endsWith("ימ") && r.length >= 4) {
      const cons = `${r.slice(0, -2)}י`;
      if (body === cons) return true;
      if (body.startsWith(cons)) {
        const rest = body.slice(cons.length);
        if (SUFFIXES.includes(rest) || rest === "י") return true;
      }
    }
    for (const suf of SUFFIXES) {
      if (suf === "ית") continue;
      if (body.length <= r.length || !body.endsWith(suf)) continue;
      const core = foldFinals(body.slice(0, body.length - suf.length));
      if (core === r) return true;
      if (r.endsWith("ה") && core === `${r.slice(0, -1)}ת`) return true;
    }
    if (body.endsWith("ית") && foldFinals(body.slice(0, -2)) === r) return true;
  }
  return false;
}

function closedClass(v: VocabItem): boolean {
  return v.pos === "particle" || v.pos === "pron";
}

/** True when this surface may be shown as that lemma in a drill. */
export function formFitsLemma(surface: string, lemma: VocabItem): boolean {
  const s = foldFinals(lettersOnly(surface));
  const r = foldFinals(lettersOnly(lemma.hebrew));
  if (s.length < 2 || r.length < 2) return false;
  if (s === r) return true;
  if (lemma.pos === "verb") return false;
  if (closedClass(lemma)) return s.startsWith("ו") && s.slice(1) === r;
  if (r.length < 3) {
    const c = s[0]!;
    if ("והבלכ".includes(c) && s.slice(1) === r) return true;
    const rest = c === "ו" || c === "ה" ? s.slice(1) : s;
    if (lemma.pos === "noun" && rest.endsWith("י") && rest.slice(0, -1) === r) return true;
    return false;
  }
  return isInflected(surface, lemma.hebrew);
}

export function lemmaForSurface(surface: string): VocabItem | undefined {
  const surf = foldFinals(lettersOnly(surface));
  if (surf.length < 2) return undefined;
  let exact: VocabItem | undefined;
  let best: VocabItem | undefined;
  let bestLen = 0;
  for (const v of VOCAB) {
    const root = foldFinals(lettersOnly(v.hebrew));
    if (root.length < 2) continue;
    if (surf === root) {
      if (!exact || v.freq > exact.freq) exact = v;
      continue;
    }
    if (!formFitsLemma(surface, v)) continue;
    if (!best || root.length > bestLen || (root.length === bestLen && v.freq > best.freq)) {
      best = v;
      bestLen = root.length;
    }
  }
  return exact ?? best;
}

/** Attested inflected / prefixed Tanakh forms tied to BBH lemmas. */
const EXTRA: Record<string, Array<{ he: string; ref: string; verse?: string; en?: string }>> = {
  ben: [
    { he: "בִּנְךָ", ref: "Gen 22:2", verse: "קַח־נָא אֶת־בִּנְךָ אֶת־יְחִידְךָ אֲשֶׁר־אָהַבְתָּ", en: "Take your son, your only one, whom you love." },
    { he: "בְּנוֹ", ref: "Gen 22:3", verse: "וַיֵּלֶךְ אֶל־הַמָּקוֹם אֲשֶׁר־אָמַר־לוֹ הָאֱלֹהִים וַיִּקַּח אֶת־בְּנוֹ", en: "He went to the place God had told him, and he took his son." },
    { he: "בָּנִים", ref: "Gen 3:16", verse: "בְּעֶצֶב תֵּלְדִי בָנִים", en: "In pain you shall bear children." },
    { he: "בְּנֵי", ref: "Exod 1:1", verse: "וְאֵלֶּה שְׁמוֹת בְּנֵי יִשְׂרָאֵל", en: "These are the names of the sons of Israel." },
    { he: "הַבֵּן", ref: "Exod 1:16", verse: "אִם־בֵּן הוּא וַהֲמִתֶּן אֹתוֹ", en: "If it is a son, you shall put him to death." },
  ],
  ab: [
    { he: "אָבִיךָ", ref: "Exod 20:12", verse: "כַּבֵּד אֶת־אָבִיךָ וְאֶת־אִמֶּךָ", en: "Honor your father and your mother." },
    { he: "אָבִיו", ref: "Gen 27:19", verse: "וַיֹּאמֶר יַעֲקֹב אֶל־אָבִיו", en: "Jacob said to his father." },
    { he: "אֲבוֹת", ref: "Exod 3:15", verse: "יְהוָה אֱלֹהֵי אֲבֹתֵיכֶם", en: "YHWH, God of your fathers." },
    { he: "אָבִי", ref: "Gen 27:12", verse: "אוּלַי יְמֻשֵּׁנִי אָבִי", en: "Perhaps my father will feel me." },
  ],
  ah: [
    { he: "אָחִיךָ", ref: "Gen 4:9", verse: "וַיֹּאמֶר יְהוָה אֶל־קַיִן אֵי הֶבֶל אָחִיךָ", en: "YHWH said to Cain, “Where is Abel your brother?”" },
    { he: "אַחִים", ref: "Gen 13:8", verse: "כִּי־אֲנָשִׁים אַחִים אֲנָחְנוּ", en: "For we are men, brothers." },
    { he: "אֶחָיו", ref: "Gen 37:4", verse: "וַיִּרְאוּ אֶחָיו כִּי־אֹתוֹ אָהַב אֲבִיהֶם", en: "His brothers saw that their father loved him." },
  ],
  em: [
    { he: "אִמֶּךָ", ref: "Exod 20:12", verse: "כַּבֵּד אֶת־אָבִיךָ וְאֶת־אִמֶּךָ", en: "Honor your father and your mother." },
    { he: "אִמּוֹ", ref: "Gen 27:14", verse: "וַיֵּלֶךְ וַיִּקַּח וַיָּבֵא לְאִמּוֹ", en: "He went and took and brought to his mother." },
  ],
  ish: [
    { he: "הָאִישׁ", ref: "Gen 24:21", verse: "וְהָאִישׁ מִשְׁתָּאֵה לָהּ מַחֲרִישׁ", en: "The man gazed at her, keeping silent." },
    { he: "אֲנָשִׁים", ref: "Gen 13:8", verse: "כִּי־אֲנָשִׁים אַחִים אֲנָחְנוּ", en: "For we are men, brothers." },
    { he: "וְאִישׁ", ref: "Exod 12:4", verse: "וְאִם־יִמְעַט הַבַּיִת מִהְיוֹת מִשֶּׂה וְלָקַח הוּא וּשְׁכֵנוֹ הַקָּרֹב אֶל־בֵּיתוֹ", en: "If the household is too small for a lamb, he and his neighbor nearest his house shall take one." },
  ],
  ishah: [
    { he: "הָאִשָּׁה", ref: "Gen 3:13", verse: "וַיֹּאמֶר יְהוָה אֱלֹהִים לָאִשָּׁה", en: "YHWH God said to the woman." },
    { he: "אִשְׁתּוֹ", ref: "Gen 2:24", verse: "וְדָבַק בְּאִשְׁתּוֹ וְהָיוּ לְבָשָׂר אֶחָד", en: "He clings to his wife, and they become one flesh." },
    { he: "נָשִׁים", ref: "Exod 1:19", verse: "כִּי חָיוֹת הֵנָּה בְּטֶרֶם תָּבוֹא אֲלֵהֶן הַמְיַלֶּדֶת וְיָלָדוּ", en: "They are lively; before the midwife comes to them, they have given birth." },
  ],
  bayit: [
    { he: "וּבֵיתִי", ref: "Josh 24:15", verse: "וְאָנֹכִי וּבֵיתִי נַעֲבֹד אֶת־יְהוָה", en: "As for me and my house, we will serve YHWH." },
    { he: "הַבַּיִת", ref: "Exod 12:7", verse: "וְלָקְחוּ מִן־הַדָּם וְנָתְנוּ עַל־שְׁתֵּי הַמְּזוּזֹת וְעַל־הַמַּשְׁקוֹף עַל הַבָּתִּים", en: "They shall take some of the blood and put it on the two doorposts and on the lintel, on the houses." },
    { he: "בֵּיתוֹ", ref: "Gen 12:17", verse: "וַיְנַגַּע יְהוָה אֶת־פַּרְעֹה נְגָעִים גְּדֹלִים וְאֶת־בֵּיתוֹ", en: "YHWH struck Pharaoh with great plagues, and his house." },
    { he: "בֵּית", ref: "Gen 28:17", verse: "אֵין זֶה כִּי אִם־בֵּית אֱלֹהִים", en: "This is none other than the house of God." },
  ],
  erets: [
    { he: "הָאָרֶץ", ref: "Gen 1:1", verse: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth." },
    { he: "בָּאָרֶץ", ref: "Gen 6:5", verse: "וַיַּרְא יְהוָה כִּי רַבָּה רָעַת הָאָדָם בָּאָרֶץ", en: "YHWH saw that the evil of humankind was great on the earth." },
    { he: "אָרְצָה", ref: "Gen 12:5", verse: "וַיֵּצְאוּ לָלֶכֶת אַרְצָה כְּנַעַן", en: "They set out to go toward the land of Canaan." },
  ],
  elohim: [
    { he: "אֱלֹהֵינוּ", ref: "Deut 6:4", verse: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", en: "Hear, Israel: YHWH our God, YHWH is one." },
    { he: "אֱלֹהֶיךָ", ref: "Exod 20:2", verse: "אָנֹכִי יְהוָה אֱלֹהֶיךָ", en: "I am YHWH your God." },
    { he: "הָאֱלֹהִים", ref: "Gen 22:3", verse: "וַיֵּלֶךְ אֶל־הַמָּקוֹם אֲשֶׁר־אָמַר־לוֹ הָאֱלֹהִים", en: "He went to the place that God had told him." },
  ],
  yhwh: [
    { he: "לַיהוָה", ref: "Ps 24:8", verse: "מִי זֶה מֶלֶךְ הַכָּבוֹד יְהוָה עִזּוּז וְגִבּוֹר", en: "Who is this king of glory? YHWH, strong and mighty." },
    { he: "בַּיהוָה", ref: "Ps 125:1", verse: "הַבֹּטְחִים בַּיהוָה כְּהַר־צִיּוֹן", en: "Those who trust in YHWH are like Mount Zion." },
  ],
  dabar: [
    { he: "דְבַר", ref: "Gen 15:1", verse: "הָיָה דְבַר־יְהוָה אֶל־אַבְרָם בַּמַּחֲזֶה", en: "The word of YHWH came to Abram in a vision." },
    { he: "הַדְּבָרִים", ref: "Deut 1:1", verse: "אֵלֶּה הַדְּבָרִים אֲשֶׁר דִּבֶּר מֹשֶׁה", en: "These are the words that Moses spoke." },
    { he: "דְּבָרִים", ref: "Exod 20:1", verse: "וַיְדַבֵּר אֱלֹהִים אֵת כָּל־הַדְּבָרִים הָאֵלֶּה", en: "God spoke all these words." },
    { he: "הַדָּבָר", ref: "Gen 18:14", verse: "הֲיִפָּלֵא מֵיְהוָה דָּבָר", en: "Is anything too wonderful for YHWH?" },
  ],
  yom: [
    { he: "הַיּוֹם", ref: "Deut 11:26", verse: "רְאֵה אָנֹכִי נֹתֵן לִפְנֵיכֶם הַיּוֹם בְּרָכָה וּקְלָלָה", en: "See, I am setting before you today a blessing and a curse." },
    { he: "יָמִים", ref: "Gen 1:14", verse: "וְהָיוּ לְאֹתֹת וּלְמוֹעֲדִים וּלְיָמִים וְשָׁנִים", en: "Let them be for signs, for appointed times, for days and years." },
    { he: "בַּיּוֹם", ref: "Gen 2:17", verse: "כִּי בְּיוֹם אֲכָלְךָ מִמֶּנּוּ מוֹת תָּמוּת", en: "For in the day you eat from it, you shall surely die." },
  ],
  melek: [
    { he: "הַמֶּלֶךְ", ref: "2 Sam 7:1", verse: "וַיְהִי כִּי־יָשַׁב הַמֶּלֶךְ בְּבֵיתוֹ", en: "When the king sat in his house." },
    { he: "מַלְכֵי", ref: "Gen 14:9", verse: "אֶת־כְּדָרְלָעֹמֶר מֶלֶךְ עֵילָם", en: "With Chedorlaomer king of Elam." },
    { he: "מְלָכִים", ref: "Ps 72:11", verse: "וְיִשְׁתַּחֲווּ־לוֹ כָל־מְלָכִים", en: "May all kings bow down to him." },
  ],
  am: [
    { he: "הָעָם", ref: "Exod 19:8", verse: "וַיַּעֲנוּ כָל־הָעָם יַחְדָּו", en: "All the people answered together." },
    { he: "הָעַמִּים", ref: "Exod 19:5", verse: "וִהְיִיתֶם לִי סְגֻלָּה מִכָּל־הָעַמִּים", en: "You shall be my treasured possession out of all the peoples." },
    { he: "עַמִּי", ref: "Exod 5:1", verse: "שַׁלַּח אֶת־עַמִּי וְיָחֹגּוּ לִי בַּמִּדְבָּר", en: "Let my people go, that they may feast to me in the wilderness." },
  ],
  ir: [
    { he: "הָעִיר", ref: "Gen 18:26", verse: "אִם־אֶמְצָא בִסְדֹם חֲמִשִּׁים צַדִּיקִם בְּתוֹךְ הָעִיר", en: "If I find in Sodom fifty righteous in the city." },
    { he: "עָרִים", ref: "Gen 19:25", verse: "וַיַּהֲפֹךְ אֶת־הֶעָרִים הָאֵל", en: "He overthrew those cities." },
  ],
  shem: [
    { he: "שְׁמֶךָ", ref: "Gen 12:2", verse: "וַאֲגַדְּלָה שְׁמֶךָ", en: "I will make your name great." },
    { he: "שְׁמוֹ", ref: "Exod 3:15", verse: "זֶה־שְּׁמִי לְעֹלָם וְזֶה זִכְרִי לְדֹר דֹּר", en: "This is my name forever, and this is my memorial from generation to generation." },
    { he: "בְּשֵׁם", ref: "Gen 4:26", verse: "אָז הוּחַל לִקְרֹא בְּשֵׁם יְהוָה", en: "Then people began to call on the name of YHWH." },
    { he: "שֵׁמוֹת", ref: "Exod 1:1", verse: "וְאֵלֶּה שְׁמוֹת בְּנֵי יִשְׂרָאֵל", en: "These are the names of the sons of Israel." },
  ],
  panim: [
    { he: "פָּנָיו", ref: "Num 6:25", verse: "יָאֵר יְהוָה פָּנָיו אֵלֶיךָ", en: "YHWH make his face shine upon you." },
    { he: "לִפְנֵי", ref: "Exod 34:6", verse: "וַיַּעֲבֹר יְהוָה עַל־פָּנָיו", en: "YHWH passed before his face." },
    { he: "פָּנֶיךָ", ref: "Ps 27:8", verse: "אֶת־פָּנֶיךָ יְהוָה אֲבַקֵּשׁ", en: "Your face, YHWH, I seek." },
  ],
  leb: [
    { he: "לִבּוֹ", ref: "Gen 6:5", verse: "וְכָל־יֵצֶר מַחְשְׁבֹת לִבּוֹ רַק רַע כָּל־הַיּוֹם", en: "Every inclination of the thoughts of his heart was only evil all the day." },
    { he: "לֵבָב", ref: "Deut 6:5", verse: "וְאָהַבְתָּ אֵת יְהוָה אֱלֹהֶיךָ בְּכָל־לְבָבְךָ", en: "You shall love YHWH your God with all your heart." },
  ],
  yad: [
    { he: "יָדוֹ", ref: "Exod 14:27", verse: "וַיֵּט מֹשֶׁה אֶת־יָדוֹ עַל־הַיָּם", en: "Moses stretched out his hand over the sea." },
    { he: "יָדְךָ", ref: "Exod 4:2", verse: "מַה־זֶּה בְיָדֶךָ", en: "What is that in your hand?" },
    { he: "בְּיַד", ref: "Exod 9:35", verse: "כַּאֲשֶׁר דִּבֶּר יְהוָה בְּיַד־מֹשֶׁה", en: "As YHWH had spoken by the hand of Moses." },
  ],
  derek: [
    { he: "הַדֶּרֶךְ", ref: "Gen 3:24", verse: "לִשְׁמֹר אֶת־דֶּרֶךְ עֵץ הַחַיִּים", en: "To guard the way of the tree of life." },
    { he: "בַּדֶּרֶךְ", ref: "Exod 13:17", verse: "וְלֹא־נָחָם אֱלֹהִים דֶּרֶךְ אֶרֶץ פְּלִשְׁתִּים", en: "God did not lead them by the way of the land of the Philistines." },
  ],
  ebed: [
    { he: "עַבְדְּךָ", ref: "1 Sam 3:10", verse: "דַּבֵּר כִּי שֹׁמֵעַ עַבְדֶּךָ", en: "Speak, for your servant is listening." },
    { he: "הָעֶבֶד", ref: "Gen 24:53", verse: "וַיּוֹצֵא הָעֶבֶד כְּלֵי־כֶסֶף", en: "The servant brought out vessels of silver." },
    { he: "עֲבָדִים", ref: "Exod 1:13", verse: "וַיַּעֲבִדוּ מִצְרַיִם אֶת־בְּנֵי יִשְׂרָאֵל בְּפָרֶךְ", en: "Egypt made the sons of Israel serve with rigor." },
  ],
  kohen: [
    { he: "הַכֹּהֵן", ref: "Lev 1:9", verse: "וְהִקְטִיר הַכֹּהֵן אֶת־הַכֹּל הַמִּזְבֵּחָה", en: "The priest shall turn the whole into smoke on the altar." },
    { he: "הַכֹּהֲנִים", ref: "Exod 19:22", verse: "וְגַם הַכֹּהֲנִים הַנִּגָּשִׁים אֶל־יְהוָה יִתְקַדָּשׁוּ", en: "The priests who draw near to YHWH shall also consecrate themselves." },
  ],
  shamayim: [
    { he: "הַשָּׁמַיִם", ref: "Gen 1:1", verse: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth." },
  ],
  mayim: [
    { he: "הַמַּיִם", ref: "Gen 1:2", verse: "וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם", en: "And the spirit of God was hovering over the face of the waters." },
    { he: "מַיִם", ref: "Exod 15:22", verse: "וְלֹא־מָצְאוּ מָיִם", en: "They did not find water." },
  ],
  har: [
    { he: "הָהָר", ref: "Exod 19:3", verse: "וּמֹשֶׁה עָלָה אֶל־הָאֱלֹהִים וַיִּקְרָא אֵלָיו יְהוָה מִן־הָהָר", en: "Moses went up to God, and YHWH called to him from the mountain." },
    { he: "בָּהָר", ref: "Exod 24:18", verse: "וַיְהִי מֹשֶׁה בָּהָר אַרְבָּעִים יוֹם", en: "Moses was on the mountain forty days." },
  ],
  yam: [
    { he: "הַיָּם", ref: "Exod 14:21", verse: "וַיּוֹלֶךְ יְהוָה אֶת־הַיָּם בְּרוּחַ קָדִים עַזָּה", en: "YHWH drove the sea back by a strong east wind." },
    { he: "בַּיָּם", ref: "Exod 15:1", verse: "סוּס וְרֹכְבוֹ רָמָה בַיָּם", en: "Horse and its rider he hurled into the sea." },
  ],
  torah: [
    { he: "הַתּוֹרָה", ref: "Josh 1:8", verse: "לֹא־יָמוּשׁ סֵפֶר הַתּוֹרָה הַזֶּה מִפִּיךָ", en: "This book of the instruction shall not depart from your mouth." },
    { he: "תּוֹרַת", ref: "Ps 19:8", verse: "תּוֹרַת יְהוָה תְּמִימָה מְשִׁיבַת נָפֶשׁ", en: "The instruction of YHWH is perfect, restoring the soul." },
  ],
  berit: [
    { he: "הַבְּרִית", ref: "Gen 17:7", verse: "וַהֲקִמֹתִי אֶת־בְּרִיתִי בֵּינִי וּבֵינֶךָ", en: "I will establish my covenant between me and you." },
    { he: "בְּרִיתִי", ref: "Gen 17:7", verse: "וַהֲקִמֹתִי אֶת־בְּרִיתִי בֵּינִי וּבֵינֶךָ", en: "I will establish my covenant between me and you." },
  ],
  hesed: [
    { he: "חַסְדּוֹ", ref: "Ps 136:1", verse: "הוֹדוּ לַיהוָה כִּי־טוֹב כִּי לְעוֹלָם חַסְדּוֹ", en: "Give thanks to YHWH, for he is good, for his loyalty is forever." },
  ],
  qol: [
    { he: "הַקּוֹל", ref: "Gen 3:10", verse: "וָאֶשְׁמַע אֶת־קֹלְךָ בַּגָּן", en: "I heard your voice in the garden." },
    { he: "קוֹלוֹ", ref: "Deut 5:24", verse: "וְאֶת־קֹלוֹ שָׁמַעְנוּ מִתּוֹךְ הָאֵשׁ", en: "We heard his voice from the midst of the fire." },
  ],
  nephesh: [
    { he: "נַפְשׁוֹ", ref: "Gen 2:7", verse: "וַיְהִי הָאָדָם לְנֶפֶשׁ חַיָּה", en: "The human became a living soul." },
    { he: "הַנֶּפֶשׁ", ref: "Lev 17:11", verse: "כִּי נֶפֶשׁ הַבָּשָׂר בַּדָּם הִוא", en: "For the life of the flesh is in the blood." },
  ],
  goy: [
    { he: "לְגוֹי", ref: "Gen 12:2", verse: "וְאֶעֶשְׂךָ לְגוֹי גָּדוֹל", en: "I will make you a great nation." },
    { he: "הַגּוֹיִם", ref: "Gen 18:18", verse: "וְנִבְרְכוּ בוֹ כֹּל גּוֹיֵי הָאָרֶץ", en: "All the nations of the earth shall be blessed in him." },
  ],
  sadeh: [
    { he: "הַשָּׂדֶה", ref: "Gen 2:5", verse: "וְכֹל שִׂיחַ הַשָּׂדֶה טֶרֶם יִהְיֶה בָאָרֶץ", en: "No shrub of the field was yet on the earth." },
  ],
  midbar: [
    { he: "הַמִּדְבָּר", ref: "Exod 5:1", verse: "שַׁלַּח אֶת־עַמִּי וְיָחֹגּוּ לִי בַּמִּדְבָּר", en: "Let my people go, that they may feast to me in the wilderness." },
    { he: "בַּמִּדְבָּר", ref: "Exod 19:2", verse: "וַיִּסְעוּ מֵרְפִידִים וַיָּבֹאוּ מִדְבַּר סִינַי", en: "They set out from Rephidim and came to the wilderness of Sinai." },
  ],
  mavet: [
    { he: "הַמָּוֶת", ref: "Ps 23:4", verse: "גַּם כִּי־אֵלֵךְ בְּגֵיא צַלְמָוֶת", en: "Even though I walk through a valley of death-shadow." },
  ],
  adam: [
    { he: "הָאָדָם", ref: "Gen 2:7", verse: "וַיִּיצֶר יְהוָה אֱלֹהִים אֶת־הָאָדָם עָפָר מִן־הָאֲדָמָה", en: "YHWH God formed the human of dust from the ground." },
  ],
  adamah: [
    { he: "הָאֲדָמָה", ref: "Gen 2:7", verse: "וַיִּיצֶר יְהוָה אֱלֹהִים אֶת־הָאָדָם עָפָר מִן־הָאֲדָמָה", en: "YHWH God formed the human of dust from the ground." },
  ],
  bat: [
    { he: "בִּתּוֹ", ref: "Exod 2:5", verse: "וַתֵּרֶד בַּת־פַּרְעֹה לִרְחֹץ עַל־הַיְאֹר", en: "The daughter of Pharaoh came down to bathe at the Nile." },
    { he: "בָּנוֹת", ref: "Gen 6:2", verse: "וַיִּרְאוּ בְנֵי־הָאֱלֹהִים אֶת־בְּנוֹת הָאָדָם", en: "The sons of God saw the daughters of humankind." },
  ],
  rosh: [
    { he: "בְּרֵאשִׁית", ref: "Gen 1:1", verse: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", en: "In the beginning God created the heavens and the earth." },
    { he: "רֹאשׁוֹ", ref: "Gen 3:15", verse: "הוּא יְשׁוּפְךָ רֹאשׁ", en: "He shall strike you on the head." },
  ],
  tsaba: [
    { he: "צְבָאוֹת", ref: "Ps 24:10", verse: "יְהוָה צְבָאוֹת הוּא מֶלֶךְ הַכָּבוֹד", en: "YHWH of hosts — he is the king of glory." },
  ],
  amar: [
    { he: "וַיֹּאמֶר", ref: "Gen 1:3", verse: "וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר", en: "God said, “Let there be light.”" },
    { he: "וַיֹּאמְרוּ", ref: "Gen 11:3", verse: "וַיֹּאמְרוּ אִישׁ אֶל־רֵעֵהוּ", en: "They said, one to his neighbor." },
    { he: "וַתֹּאמֶר", ref: "Gen 3:2", verse: "וַתֹּאמֶר הָאִשָּׁה אֶל־הַנָּחָשׁ", en: "The woman said to the serpent." },
    { he: "לֵאמֹר", ref: "Gen 1:22", verse: "וַיְבָרֶךְ אֹתָם אֱלֹהִים לֵאמֹר", en: "God blessed them, saying." },
    { he: "אָמַרְתִּי", ref: "Gen 20:11", verse: "כִּי אָמַרְתִּי רַק אֵין־יִרְאַת אֱלֹהִים בַּמָּקוֹם הַזֶּה", en: "For I said, surely there is no fear of God in this place." },
  ],
  hayah: [
    { he: "וַיְהִי", ref: "Gen 1:3", verse: "וַיְהִי־אוֹר", en: "And there was light." },
    { he: "וְהָיָה", ref: "Gen 4:14", verse: "וְהָיָה כָל־מֹצְאִי יַהַרְגֵנִי", en: "It will be that whoever finds me will kill me." },
    { he: "הָיְתָה", ref: "Gen 1:2", verse: "וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ", en: "The earth was formless and void." },
  ],
  halak: [
    { he: "וַיֵּלֶךְ", ref: "Gen 12:4", verse: "וַיֵּלֶךְ אַבְרָם כַּאֲשֶׁר דִּבֶּר אֵלָיו יְהוָה", en: "Abram went as YHWH had spoken to him." },
    { he: "לֵךְ", ref: "Gen 12:1", verse: "לֶךְ־לְךָ מֵאַרְצְךָ", en: "Go for yourself from your land." },
    { he: "הָלְכוּ", ref: "Gen 22:6", verse: "וַיֵּלְכוּ שְׁנֵיהֶם יַחְדָּו", en: "The two of them walked on together." },
  ],
  natan: [
    { he: "וַיִּתֵּן", ref: "Gen 1:17", verse: "וַיִּתֵּן אֹתָם אֱלֹהִים בִּרְקִיעַ הַשָּׁמָיִם", en: "God set them in the expanse of the heavens." },
    { he: "נָתַתִּי", ref: "Gen 1:29", verse: "הִנֵּה נָתַתִּי לָכֶם אֶת־כָּל־עֵשֶׂב", en: "Behold, I have given you every plant." },
    { he: "תִּתֵּן", ref: "Exod 20:12", verse: "לְמַעַן יַאֲרִכוּן יָמֶיךָ", en: "That your days may be long." },
  ],
  asah: [
    { he: "וַיַּעַשׂ", ref: "Gen 1:7", verse: "וַיַּעַשׂ אֱלֹהִים אֶת־הָרָקִיעַ", en: "God made the expanse." },
    { he: "עָשִׂיתָ", ref: "Gen 3:13", verse: "מַה־זֹּאת עָשִׂית", en: "What is this you have done?" },
  ],
  raah: [
    { he: "וַיַּרְא", ref: "Gen 1:4", verse: "וַיַּרְא אֱלֹהִים אֶת־הָאוֹר כִּי־טוֹב", en: "God saw the light, that it was good." },
    { he: "רָאִיתִי", ref: "Exod 3:9", verse: "וְגַם־רָאִיתִי אֶת־הַלַּחַץ", en: "I have also seen the oppression." },
  ],
  shama: [
    { he: "וַיִּשְׁמַע", ref: "Gen 21:17", verse: "וַיִּשְׁמַע אֱלֹהִים אֶת־קוֹל הַנַּעַר", en: "God heard the voice of the boy." },
    { he: "שְׁמַע", ref: "Deut 6:4", verse: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", en: "Hear, Israel: YHWH our God, YHWH is one." },
    { he: "שָׁמְעוּ", ref: "Exod 4:31", verse: "וַיַּאֲמֵן הָעָם וַיִּשְׁמְעוּ", en: "The people believed, and they heard." },
  ],
  akol: [
    { he: "וַיֹּאכַל", ref: "Gen 3:6", verse: "וַתִּתֵּן גַּם־לְאִישָׁהּ עִמָּהּ וַיֹּאכַל", en: "She also gave to her husband with her, and he ate." },
    { he: "אֲכָלְךָ", ref: "Gen 2:17", verse: "כִּי בְּיוֹם אֲכָלְךָ מִמֶּנּוּ מוֹת תָּמוּת", en: "In the day you eat from it, you shall surely die." },
  ],
  yatsa: [
    { he: "וַיֵּצֵא", ref: "Gen 8:18", verse: "וַיֵּצֵא־נֹחַ", en: "Noah went out." },
    { he: "הוֹצֵאתִיךָ", ref: "Exod 20:2", verse: "אֲשֶׁר הוֹצֵאתִיךָ מֵאֶרֶץ מִצְרַיִם", en: "Who brought you out from the land of Egypt." },
  ],
  yashab: [
    { he: "וַיֵּשֶׁב", ref: "Gen 4:16", verse: "וַיֵּשֶׁב בְּאֶרֶץ־נוֹד", en: "He settled in the land of Nod." },
    { he: "יֹשֵׁב", ref: "Gen 4:20", verse: "הוּא הָיָה אֲבִי יֹשֵׁב אֹהֶל וּמִקְנֶה", en: "He was the father of those who dwell in tents and have livestock." },
  ],
  bo: [
    { he: "וַיָּבֹא", ref: "Gen 7:7", verse: "וַיָּבֹא נֹחַ וּבָנָיו", en: "Noah and his sons came." },
    { he: "בֹּא", ref: "Gen 7:1", verse: "בֹּא־אַתָּה וְכָל־בֵּיתְךָ אֶל־הַתֵּבָה", en: "Come, you and all your house, into the ark." },
    { he: "וַיָּבֹאוּ", ref: "Gen 7:9", verse: "שְׁנַיִם שְׁנַיִם בָּאוּ אֶל־נֹחַ", en: "Two by two they came to Noah." },
  ],
  laqah: [
    { he: "וַיִּקַּח", ref: "Gen 2:15", verse: "וַיִּקַּח יְהוָה אֱלֹהִים אֶת־הָאָדָם", en: "YHWH God took the human." },
    { he: "קַח", ref: "Gen 22:2", verse: "קַח־נָא אֶת־בִּנְךָ", en: "Take your son." },
  ],
  mut: [
    { he: "וַיָּמָת", ref: "Gen 5:5", verse: "וַיָּמֹת", en: "And he died." },
    { he: "תָּמוּת", ref: "Gen 2:17", verse: "מוֹת תָּמוּת", en: "You shall surely die." },
    { he: "מֵת", ref: "Gen 23:2", verse: "וַתָּמָת שָׂרָה", en: "Sarah died." },
  ],
  qara: [
    { he: "וַיִּקְרָא", ref: "Gen 1:5", verse: "וַיִּקְרָא אֱלֹהִים לָאוֹר יוֹם", en: "God called the light Day." },
    { he: "קְרָא", ref: "Exod 34:6", verse: "וַיִּקְרָא יְהוָה יְהוָה אֵל רַחוּם וְחַנּוּן", en: "YHWH called, “YHWH, YHWH, a God compassionate and gracious.”" },
  ],
  qum: [
    { he: "וַיָּקָם", ref: "Gen 4:8", verse: "וַיָּקָם קַיִן אֶל־הֶבֶל אָחִיו", en: "Cain rose up against Abel his brother." },
    { he: "קוּם", ref: "Gen 13:17", verse: "קוּם הִתְהַלֵּךְ בָּאָרֶץ", en: "Rise, walk through the land." },
  ],
  shub: [
    { he: "וַיָּשָׁב", ref: "Gen 8:9", verse: "וַתָּשָׁב אֵלָיו אֶל־הַתֵּבָה", en: "She returned to him, to the ark." },
    { he: "שׁוּב", ref: "Gen 16:9", verse: "שׁוּבִי אֶל־גְּבִרְתֵּךְ", en: "Return to your mistress." },
  ],
  alah: [
    { he: "וַיַּעַל", ref: "Gen 8:20", verse: "וַיַּעַל עֹלֹת בַּמִּזְבֵּחַ", en: "He offered burnt offerings on the altar." },
    { he: "עֲלֵה", ref: "Exod 24:12", verse: "עֲלֵה אֵלַי הָהָרָה", en: "Come up to me on the mountain." },
  ],
  yada: [
    { he: "יָדַעְתִּי", ref: "Gen 22:12", verse: "עַתָּה יָדַעְתִּי כִּי־יְרֵא אֱלֹהִים אַתָּה", en: "Now I know that you fear God." },
    { he: "וְיָדַעְתָּ", ref: "Exod 6:7", verse: "וִידַעְתֶּם כִּי אֲנִי יְהוָה אֱלֹהֵיכֶם", en: "You shall know that I am YHWH your God." },
  ],
  shamar: [
    { he: "שְׁמֹר", ref: "Exod 20:8", verse: "זָכוֹר אֶת־יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ", en: "Remember the sabbath day, to keep it holy." },
    { he: "וְשָׁמַרְתָּ", ref: "Gen 17:9", verse: "וְאַתָּה אֶת־בְּרִיתִי תִשְׁמֹר", en: "As for you, you shall keep my covenant." },
  ],
  barak: [
    { he: "וַיְבָרֶךְ", ref: "Gen 1:22", verse: "וַיְבָרֶךְ אֹתָם אֱלֹהִים", en: "God blessed them." },
    { he: "בָּרוּךְ", ref: "Gen 14:19", verse: "בָּרוּךְ אַבְרָם לְאֵל עֶלְיוֹן", en: "Blessed be Abram by God Most High." },
  ],
  ahab: [
    { he: "וְאָהַבְתָּ", ref: "Deut 6:5", verse: "וְאָהַבְתָּ אֵת יְהוָה אֱלֹהֶיךָ בְּכָל־לְבָבְךָ", en: "You shall love YHWH your God with all your heart." },
    { he: "אָהַבְתָּ", ref: "Gen 22:2", verse: "אֶת־בִּנְךָ אֶת־יְחִידְךָ אֲשֶׁר־אָהַבְתָּ", en: "Your son, your only one, whom you love." },
  ],
  karat: [
    { he: "כָּרַת", ref: "Gen 15:18", verse: "בַּיּוֹם הַהוּא כָּרַת יְהוָה אֶת־אַבְרָם בְּרִית", en: "On that day YHWH cut a covenant with Abram." },
  ],
  abad: [
    { he: "נַעֲבֹד", ref: "Josh 24:15", verse: "וְאָנֹכִי וּבֵיתִי נַעֲבֹד אֶת־יְהוָה", en: "As for me and my house, we will serve YHWH." },
    { he: "לַעֲבֹד", ref: "Gen 2:15", verse: "וַיַּנִּחֵהוּ בְגַן־עֵדֶן לְעָבְדָהּ וּלְשָׁמְרָהּ", en: "He set him in the garden of Eden to work it and to keep it." },
  ],
  lo: [
    { he: "וְלֹא", ref: "Gen 2:25", verse: "וְלֹא יִתְבֹּשָׁשׁוּ", en: "And they were not ashamed." },
  ],
  el: [
    { he: "אֵלַי", ref: "Gen 4:10", verse: "קוֹל דְּמֵי אָחִיךָ צֹעֲקִים אֵלַי מִן־הָאֲדָמָה", en: "The voice of your brother’s blood is crying to me from the ground." },
    { he: "אֵלֶיךָ", ref: "Num 6:25", verse: "יָאֵר יְהוָה פָּנָיו אֵלֶיךָ", en: "YHWH make his face shine upon you." },
  ],
  min: [
    { he: "מִן", ref: "Gen 2:7", verse: "עָפָר מִן־הָאֲדָמָה", en: "Dust from the ground." },
    { he: "מִמֶּנּוּ", ref: "Gen 2:17", verse: "כִּי בְּיוֹם אֲכָלְךָ מִמֶּנּוּ", en: "In the day you eat from it." },
  ],
  al: [
    { he: "עָלֶיךָ", ref: "Num 6:25", verse: "יָאֵר יְהוָה פָּנָיו אֵלֶיךָ וִיחֻנֶּךָּ", en: "YHWH make his face shine upon you and be gracious to you." },
    { he: "עָלָיו", ref: "Isa 11:2", verse: "וְנָחָה עָלָיו רוּחַ יְהוָה", en: "And the spirit of YHWH shall rest upon him." },
  ],
  esh: [
    { he: "הָאֵשׁ", ref: "Deut 5:24", verse: "וְאֶת־קֹלוֹ שָׁמַעְנוּ מִתּוֹךְ הָאֵשׁ", en: "We heard his voice from the midst of the fire." },
  ],
  zahav: [
    { he: "הַזָּהָב", ref: "Exod 25:11", verse: "וְצִפִּיתָ אֹתוֹ זָהָב טָהוֹר", en: "You shall overlay it with pure gold." },
  ],
  kesef: [
    { he: "הַכֶּסֶף", ref: "Gen 23:16", verse: "וַיִּשְׁקֹל אַבְרָהָם לְעֶפְרֹן אֶת־הַכֶּסֶף", en: "Abraham weighed out for Ephron the silver." },
  ],
  shalom: [
    { he: "שָׁלוֹם", ref: "Num 6:26", verse: "יִשָּׂא יְהוָה פָּנָיו אֵלֶיךָ וְיָשֵׂם לְךָ שָׁלוֹם", en: "YHWH lift his face toward you and set peace for you." },
  ],
  tov: [
    { he: "כִּי־טוֹב", ref: "Gen 1:4", verse: "וַיַּרְא אֱלֹהִים אֶת־הָאוֹר כִּי־טוֹב", en: "God saw the light, that it was good." },
  ],
  gadol: [
    { he: "גָּדוֹל", ref: "Deut 7:21", verse: "כִּי יְהוָה אֱלֹהֶיךָ בְּקִרְבֶּךָ אֵל גָּדוֹל וְנוֹרָא", en: "For YHWH your God is in your midst, a great and fearsome God." },
    { he: "הַגָּדֹל", ref: "Deut 4:7", verse: "כִּי מִי־גוֹי גָּדוֹל", en: "For what great nation." },
  ],
  qadosh: [
    { he: "קְדֹשִׁים", ref: "Lev 19:2", verse: "קְדֹשִׁים תִּהְיוּ כִּי קָדוֹשׁ אֲנִי יְהוָה", en: "You shall be holy, for I, YHWH, am holy." },
  ],
  ehad: [
    { he: "אַחַת", ref: "Gen 11:1", verse: "וַיְהִי כָל־הָאָרֶץ שָׂפָה אֶחָת וּדְבָרִים אֲחָדִים", en: "The whole earth was one language and the same words." },
    { he: "אֶחָד", ref: "Deut 6:4", verse: "יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", en: "YHWH our God, YHWH is one." },
  ],
};

let cached: VocabItem[] | null = null;

function addForm(
  out: VocabItem[],
  seen: Set<string>,
  surface: string,
  lemma: VocabItem,
  verse: VerseEx | undefined,
) {
  const letters = lettersOnly(surface);
  if (letters.length < 2) return;
  if (letters === lettersOnly(lemma.hebrew)) return;
  const key = letters + ":" + lemma.id;
  if (seen.has(key)) return;
  seen.add(key);
  const id = `tv:${lemma.id}:${out.length}`;
  const hitTok = verse?.he ? verseTokenFor(verse.he, surface) : undefined;
  if (hitTok && verse) {
    FORM_VERSES[id] = {
      ref: verse.ref,
      he: verse.he,
      en: verse.en,
      hit: hitTok,
      hitEn: verse.hitEn,
    };
  }
  out.push({
    id,
    hebrew: surface,
    translit: lemma.translit,
    gloss: lemma.gloss,
    alts: lemma.alts,
    hebrewAlts: [lemma.hebrew, ...(lemma.hebrewAlts ?? [])],
    pos: lemma.pos,
    chapter: lemma.chapter,
    freq: lemma.freq,
  });
}

function harvestVerse(out: VocabItem[], seen: Set<string>, verse: VerseEx, lemmaHint?: VocabItem) {
  if (lemmaHint && verse.hit) addForm(out, seen, verse.hit, lemmaHint, verse);
}

/** Distinct Tanakh surface forms tied to BBH lemmas. */
export function tanakhForms(): VocabItem[] {
  if (cached) return cached;
  const seen = new Set<string>();
  const out: VocabItem[] = [];

  for (const [id, verse] of Object.entries(VERSES)) {
    const lemma = VOCAB.find((v) => v.id === id);
    harvestVerse(out, seen, verse, lemma);
  }

  for (const unit of SYLLABLE_UNITS) {
    for (const verse of unit.verses) harvestVerse(out, seen, verse);
    for (const sample of unit.samples) {
      const found = lemmaForSurface(sample.word);
      if (!found || !formFitsLemma(sample.word, found)) continue;
      const verse: VerseEx | undefined = sample.ref
        ? { ref: sample.ref, he: sample.word, en: sample.note, hit: sample.word }
        : undefined;
      addForm(out, seen, sample.word, found, verse);
    }
  }

  for (const lemma of VOCAB) {
    for (const alt of lemma.hebrewAlts ?? []) addForm(out, seen, alt, lemma, VERSES[lemma.id]);
    for (const extra of EXTRA[lemma.id] ?? []) {
      addForm(out, seen, extra.he, lemma, extra.verse
        ? { ref: extra.ref, he: extra.verse, en: extra.en ?? lemma.gloss, hit: extra.he }
        : VERSES[lemma.id]);
    }
  }

  cached = out;
  return out;
}

export function tanakhVerseFor(id: string): VerseEx | undefined {
  if (FORM_VERSES[id]) return FORM_VERSES[id];
  if (!cached) tanakhForms();
  return FORM_VERSES[id];
}

export function lemmaIdOf(id: string): string {
  if (id.startsWith("tv:")) return id.split(":")[1] ?? id;
  return id;
}

export function findStudyItem(id: string): VocabItem | undefined {
  if (id.startsWith("alef:") || id.startsWith("ch1-")) return undefined;
  const lemma = VOCAB.find((v) => v.id === id);
  if (lemma) return lemma;
  return tanakhForms().find((v) => v.id === id);
}

export function tanakhFormsForChapter(chapter: number, cap = 24): VocabItem[] {
  const all = shuffle(tanakhForms().filter((v) => v.chapter === chapter));
  if (all.length <= cap) return all;
  const picked: VocabItem[] = [];
  const used = new Set<string>();
  for (const item of all) {
    const lemma = lemmaIdOf(item.id);
    if (used.has(lemma)) continue;
    used.add(lemma);
    picked.push(item);
    if (picked.length >= cap) return picked;
  }
  for (const item of all) {
    if (picked.includes(item)) continue;
    picked.push(item);
    if (picked.length >= cap) break;
  }
  return picked;
}

/** Quiz / Match pool: the week’s BBH lemmas, same forms as the class book. */
export function weekPlayPool(week: number): VocabItem[] {
  return itemsForWeek(week);
}
