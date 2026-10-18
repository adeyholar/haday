/** Original Semester 2 lessons. Class forms and Tanakh lines. Not a textbook reprint. */

export type Term2Lesson = {
  chapter: number;
  title: string;
  short: string;
  blurb: string;
  paras: readonly [string, string];
  exampleHe: string;
  exampleEn: string;
  exampleWhere: string;
  hold: string;
};

export const TERM2_LESSONS: readonly Term2Lesson[] = [
  {
    chapter: 20,
    title: "Infinitive construct",
    short: "To do, when doing",
    blurb: "One form, no person. לְ for purpose. בְּ or כְּ for when. Not negated by לֹא or אַל.",
    paras: [
      "The infinitive construct is a verbal noun. It has no person, gender, or number. On a strong verb the shape is shewa plus holem: קְטֹל. That is the same look as the masculine singular imperative, so the sentence decides which one you have. A guttural in first position takes a hateph vowel, as in עֲזֹב and אֱמֹר. A III-ה root does not keep the ה. It ends in וֹת: בָּנָה becomes בְּנוֹת.",
      "Only this form takes a preposition glued on the front. לְקְטֹל is purpose or result, “in order to.” בִּ and כִּ are “when” or “while.” A suffix on the end can be the doer or the one acted on. You do not negate it with לֹא or אַל. The negative is בִּלְתִּי or לְבִלְתִּי, “so as not to.”",
    ],
    exampleHe: "וַיִּקַּח אֶת הַמַּאֲכֶלֶת לִשְׁחֹט אֶת בְּנוֹ",
    exampleEn: "And he took the knife in order to slaughter his son.",
    exampleWhere: "Genesis 22:10",
    hold: "A verb with בְּ, כְּ, or לְ glued on is an infinitive construct.",
  },
  {
    chapter: 21,
    title: "Infinitive absolute",
    short: "Surely, completely",
    blurb: "Qamets plus holem. No prefix and no suffix. Beside a finite verb it says “surely.”",
    paras: [
      "The infinitive absolute is also one form, and it is also a verbal noun. The strong shape is קָטוֹל: qamets under the first letter, holem-vav in the middle. The holem is often written without the vav, קָטֹל. The qamets is what keeps it apart from the imperative and the infinitive construct, which both open with shewa.",
      "It does not take a preposition or a suffix. Its common job is to stand next to a finite verb of the same root and intensify it. English often says “surely,” “certainly,” or “completely.” It can also stand in the place of an imperative and give the command a stronger voice.",
    ],
    exampleHe: "מוֹת יוּמַת הָאִישׁ",
    exampleEn: "The man shall surely be put to death.",
    exampleWhere: "Numbers 15:35",
    hold: "Qamets under the first letter marks the absolute. Shewa marks the construct.",
  },
  {
    chapter: 22,
    title: "Participle",
    short: "The one doing",
    blurb: "Holem after the first letter. It agrees like an adjective, and it can stand as a noun.",
    paras: [
      "A participle is a verb in adjective clothes. It has voice, active or passive, and it has gender and number. It does not have person. The active strong form is קֹטֵל. The holem after the first root letter is the mark, whether it is written as holem or as holem-vav, קוֹטֵל. Feminine singular is usually קֹטֶלֶת, and also קֹטְלָה. The plurals use the noun endings.",
      "Read it first as an “-ing” word, then decide the job. After a noun, and matching its article, it describes. Before the noun, or without the article, it makes a clause: the fire is consuming. Standing alone, it names the doer: the keeper, the one who keeps. A passive participle of the strong verb is קָטוּל.",
    ],
    exampleHe: "הִנֵּה לֹא יָנוּם וְלֹא יִישָׁן שׁוֹמֵר יִשְׂרָאֵל",
    exampleEn: "See: the keeper of Israel does not slumber or sleep.",
    exampleWhere: "Psalm 121:4",
    hold: "Holem after the first letter, then tsere, is the Qal active participle.",
  },
  {
    chapter: 23,
    title: "Sentence order",
    short: "Verb, then who",
    blurb: "A story usually leads with the verb. What stands in front of the verb is what the line wants noticed.",
    paras: [
      "English puts the subject first. Hebrew narrative usually puts the verb first, then the subject, then the object. That is the unmarked line. The object marker אֵת flags the object, so the order does not have to. A clause can also have no finite verb at all and still be a sentence. Subject then predicate often identifies. Predicate then subject often describes.",
      "When a noun, a pronoun, a negative, or הִנֵּה stands before the verb, that fronted piece is marked. It may be contrast, topic, or the thing the speaker is answering. Do not treat fronting as a mistake in the “normal” order. The normal order is the background. The fronted word is the point.",
    ],
    exampleHe: "וַיִּזְכֹּר אֱלֹהִים אֶת נֹחַ",
    exampleEn: "And God remembered Noah.",
    exampleWhere: "Genesis 8:1",
    hold: "Verb first is the ordinary line. Whatever is pulled in front of the verb is being pointed at.",
  },
  {
    chapter: 24,
    title: "Niphal, strong verbs",
    short: "Was done",
    blurb: "Nun in the perfect. In the imperfect the nun assimilates and leaves a dagesh.",
    paras: [
      "Niphal is the first derived stem. The perfect opens with נִ: נִקְטַל, often “he was killed,” sometimes “he did it to himself,” sometimes “they did it to one another.” A few roots live mostly here and come out active in English: נִלְחַם “he fought,” נִשְׁבַּע “he swore.”",
      "In the imperfect, the imperative, and the infinitive the nun does not stay as its own letter. It assimilates into the first root letter as a dagesh: יִקָּטֵל. That dagesh, with a qamets or tsere under the first root letter, is the mark once the nun is gone. Name the stem before you name the person.",
    ],
    exampleHe: "וְנִבְרְכוּ בְךָ כֹּל מִשְׁפְּחֹת הָאֲדָמָה",
    exampleEn: "And all the families of the earth will be blessed in you.",
    exampleWhere: "Genesis 12:3",
    hold: "Perfect נִ. Elsewhere, a dagesh where the nun used to be.",
  },
  {
    chapter: 25,
    title: "Niphal, weak verbs",
    short: "The nun still tells",
    blurb: "A weak letter changes a vowel. It does not invent a new stem.",
    paras: [
      "III-ע and III-ח keep the strong Niphal marks. An I-guttural perfect often shows a hateph vowel under the guttural, because a guttural will not hold a plain shewa. You already know that pattern from the Qal. Here the נִ, or the assimilated dagesh, is still what names the stem.",
      "III-ה drops the final ה in many forms and uses the endings you already parse. I-נ and geminate roots can hide a letter. Reconstruct the lexical root only after the stem is named. If you restore the root first, a doubled letter will look like part of the root.",
    ],
    exampleHe: "וַיִּשָּׁאֶר אַךְ נֹחַ",
    exampleEn: "And only Noah was left.",
    exampleWhere: "Genesis 7:23",
    hold: "Find the Niphal mark first. Then put back the weak letter the form dropped.",
  },
  {
    chapter: 26,
    title: "Hiphil, strong verbs",
    short: "He caused it",
    blurb: "הִ in the perfect, and an i-vowel in the stem. The imperfect wears a patach and no ה.",
    paras: [
      "Hiphil is causative and active. If the Qal is “he was king,” the Hiphil is “he made someone king.” English uses “caused,” “made,” or a verb that already includes the cause: he reminded, he brought near, he presented. The stem’s name keeps the clue: הִפְעִיל.",
      "The perfect is הִקְטִיל: hireq on the ה, and hireq-yod or tsere as the stem vowel. Second and first person perfects shorten that stem vowel to patach. The imperfect drops the ה and puts patach under the prefix: יַקְטִיל. The participle is מַקְטִיל. Patach on the prefix, not hireq, is how you keep the imperfect apart from the perfect.",
    ],
    exampleHe: "וַיַּשְׁכֵּם אַבְרָהָם בַּבֹּקֶר",
    exampleEn: "And Abraham rose early in the morning.",
    exampleWhere: "Genesis 22:3",
    hold: "הִ plus a long i-vowel is Hiphil perfect. A patach prefix and hireq-yod is Hiphil imperfect.",
  },
  {
    chapter: 27,
    title: "Hiphil, weak verbs",
    short: "Same cause, different vowel",
    blurb: "I-guttural perfect uses segol. III-ה still ends like a III-ה. The causative prefixes stay.",
    paras: [
      "Master the strong marks before these. Most weak classes keep them. An I-guttural perfect prefers segol and a hateph under the guttural: הֶעֱמִיד, “he caused to stand,” not hireq. The imperfect of that class goes back to the patach prefix: יַעֲמִיד.",
      "III-ה drops the root ה and uses the Hiphil endings you can already parse from the Qal of that class. I-נ often assimilates, so the next letter carries a dagesh. Hollow verbs show their long middle vowel as the stem vowel of the Hiphil. Name the stem from the prefix, then rebuild the root.",
    ],
    exampleHe: "וַיּוֹלֶד בִּדְמוּתוֹ כְּצַלְמוֹ",
    exampleEn: "And he fathered a son in his likeness, according to his image.",
    exampleWhere: "Genesis 5:3",
    hold: "The prefix still says Hiphil when a weak letter has changed the vowel.",
  },
  {
    chapter: 28,
    title: "Hophal, strong verbs",
    short: "Was caused",
    blurb: "The passive of the Hiphil. An o-vowel or a u-vowel on the prefix, and patach in the stem.",
    paras: [
      "Hophal is uncommon. It is the passive of the Hiphil. “He made someone king” becomes “he was made king.” Translate with a form of “was” plus the caused action. You need the perfect, the imperfect, and the participle. The other conjugations are rare enough to meet later, in a text, not as a list to memorize.",
      "The perfect prefix is הָ with qamets hatuf, the o-class, or הֻ with qibbuts, the u-class. Then silent shewa, then patach in the stem: הָקְטַל or הֻקְטַל. The imperfect uses that same o or u vowel under its prefix. Do not read the o-class הָ as the Hiphil הִ. Hiphil wants an i-vowel in the stem. Hophal wants patach.",
    ],
    exampleHe: "וַיֻּגַּד לְאַבְרָהָם",
    exampleEn: "And it was told to Abraham.",
    exampleWhere: "Genesis 22:20",
    hold: "U or o on the prefix, and patach in the stem, is the passive causative.",
  },
  {
    chapter: 29,
    title: "Hophal, weak verbs",
    short: "The passive on a weak root",
    blurb: "Weak Hophal forms are more common than the strong ones. The o or u prefix remains the mark.",
    paras: [
      "There are few strong Hophal forms in the Tanakh. The weak ones are the ones you will actually meet. I-guttural prefers the o-class prefix and a hateph qamets under the guttural. III-ה drops the root ה and keeps the o-class prefix. The endings are the ones you already know.",
      "I-נ assimilates. The dagesh left behind is the nun, not a new stem. וַיֻּכּוּ is “they were beaten,” Hophal of נָכָה, with the nun gone. Name Hophal from the u or o prefix. Then restore the weak letter. Do not call a patach stem vowel a Qal just because the ה of Hiphil is missing.",
    ],
    exampleHe: "וַיֻּכּוּ שֹׁטְרֵי בְּנֵי יִשְׂרָאֵל",
    exampleEn: "And the foremen of the sons of Israel were beaten.",
    exampleWhere: "Exodus 5:14",
    hold: "On a weak root, the Hophal mark is still the u or o prefix, not a doubled letter.",
  },
  {
    chapter: 30,
    title: "Piel, strong verbs",
    short: "The middle letter doubles",
    blurb: "Dagesh in the second root letter. Shewa under an imperfect prefix. The gloss is not always “intensive.”",
    paras: [
      "Piel is marked by a dagesh forte in the second root letter. The perfect is קִטֵּל: hireq under the first letter, tsere in the stem. The imperfect and the participle put shewa under the prefix: יְקַטֵּל, מְקַטֵּל, with patach under the first root letter.",
      "The meaning is not one English idea. Sometimes the action is heavier than the Qal. Sometimes an intransitive Qal becomes transitive: “he was holy” becomes “he sanctified something.” Sometimes the Piel is simply how that root is used: he spoke, he commanded, he blessed. Let this word list decide the gloss. Let the dagesh decide the stem.",
    ],
    exampleHe: "וַיְדַבֵּר אֱלֹהִים אֶל נֹחַ",
    exampleEn: "And God spoke to Noah.",
    exampleWhere: "Genesis 8:15",
    hold: "Dagesh in the middle letter, and hireq or patach under the first, is Piel. Qibbuts there would be Pual.",
  },
  {
    chapter: 31,
    title: "Piel, weak verbs",
    short: "The dagesh stays, unless a guttural refuses it",
    blurb: "III-ה and geminate keep the Piel marks. A guttural in the middle cannot take the dagesh.",
    paras: [
      "Most weak classes keep every Piel mark: shewa on the prefix, and dagesh in the second letter. III-ה uses the familiar ה endings and is still Piel. A geminate may give up the dagesh when the doubled letter is followed by shewa. The other marks are still there, so the stem does not change.",
      "Only a guttural in the middle refuses the dagesh. Then either the short vowel stays, which is virtual doubling, or the vowel before the guttural lengthens. וַיְבָרֶךְ has no dagesh in the ר. The prefix shewa and the root still say Piel. Do not call it Qal because the dagesh is missing.",
    ],
    exampleHe: "וַיְבָרֶךְ אֹתָם אֱלֹהִים",
    exampleEn: "And God blessed them.",
    exampleWhere: "Genesis 1:22",
    hold: "A missing dagesh on a middle guttural is the guttural’s refusal, not a different stem.",
  },
  {
    chapter: 32,
    title: "Pual, strong verbs",
    short: "Was done, middle doubled",
    blurb: "Same dagesh as the Piel. Qibbuts under the first root letter makes it passive.",
    paras: [
      "Pual is the passive of the Piel. “He smashed” becomes “it was smashed.” English needs a form of “was.” The dagesh in the second root letter is shared with Piel and Hithpael, so the dagesh alone is not enough.",
      "Pual’s own mark is qibbuts under the first root letter: קֻטַּל. Piel has hireq there in the perfect. Imperfect and participle still put shewa under the prefix, then the qibbuts. You need perfect, imperfect, and participle. If you see qibbuts where Piel would have put hireq or patach, say Pual before you translate.",
    ],
    exampleHe: "מְהֻלָּל שֵׁם יְהוָה",
    exampleEn: "The name of the LORD is praised.",
    exampleWhere: "Psalm 113:3",
    hold: "Qibbuts under the first root letter, with the middle doubled, is Pual.",
  },
  {
    chapter: 33,
    title: "Pual, weak verbs",
    short: "The qibbuts still marks the passive",
    blurb: "III-א and III-ה keep the strong marks. A middle guttural refuses the dagesh and may lengthen the vowel.",
    paras: [
      "Learn the strong diagnostics before the weak ones. III-א and III-ה keep them, including the qibbuts and the dagesh. The final ה you see on some forms is a vowel letter, not the third root letter. You already know that from Qal and Piel.",
      "A guttural in second position rejects the dagesh. Virtual doubling keeps the short vowel. Compensatory lengthening changes it. מְבֹרָךְ is still the passive of Piel: the qibbuts has lengthened before ר, which cannot hold the dagesh. The stem is Pual. The missing dot is the guttural.",
    ],
    exampleHe: "יְהִי שֵׁם יְהוָה מְבֹרָךְ",
    exampleEn: "May the name of the LORD be blessed.",
    exampleWhere: "Psalm 113:2",
    hold: "Lengthening in front of a middle guttural does not turn a Pual into a Qal.",
  },
  {
    chapter: 34,
    title: "Hithpael, strong verbs",
    short: "He did it to himself",
    blurb: "The prefix הִתְ is enough to name it. The middle letter is doubled, as in Piel.",
    paras: [
      "Hithpael is the easiest derived stem to see. The perfect prefix is הִתְ. The imperfect is יִתְ. The participle is מִתְ. Under that prefix the stem looks like Piel: patach under the first root letter, dagesh in the second, הִתְקַטֵּל.",
      "The voice is often reflexive: he sanctified himself, they hid themselves. It can also be reciprocal, “they did it to each other,” or simply the normal stem of that root. הִתְפַּלֵּל is “he prayed,” not “he prayed himself.” Learn the prefix first. Then let the word list tell you the voice.",
    ],
    exampleHe: "הִתְפַּלֵּל אֶל יְהוָה",
    exampleEn: "Pray to the LORD.",
    exampleWhere: "Numbers 21:7",
    hold: "הִתְ, יִתְ, or מִתְ names Hithpael before you look at the root.",
  },
  {
    chapter: 35,
    title: "Hithpael, weak verbs",
    short: "The prefix holds",
    blurb: "Geminate and III-ה keep the prefix. A middle guttural refuses the dagesh. Worship is its own pattern.",
    paras: [
      "Geminate and III-ה keep the Hithpael prefixes and, apart from the usual weak endings, the strong marks. A geminate may drop the dagesh when shewa follows, as in some forms of הִתְפַּלֵּל. The prefix is still decisive. II-guttural refuses the dagesh and either keeps the patach or lengthens it, the same two ways you saw in Piel and Pual.",
      "One verb of bowing and worship is pointed as Hishtaphel, not as an ordinary Hithpael. You know it by הִשְׁתַּ or יִשְׁתַּ on the front, and by the root חָוָה. It is III-ה, so the endings change, but the prefix does not. When you see that prefix, say “worship” or “bow down” and then parse the person.",
    ],
    exampleHe: "וְנִשְׁתַּחֲוֶה וְנָשׁוּבָה אֲלֵיכֶם",
    exampleEn: "And we will worship, and we will return to you.",
    exampleWhere: "Genesis 22:5",
    hold: "הִשְׁתַּחֲוָה is the worship verb. The שׁת prefix is the mark, on every person.",
  },
];

export function term2Lesson(chapter: number): Term2Lesson | undefined {
  return TERM2_LESSONS.find((lesson) => lesson.chapter === chapter);
}
