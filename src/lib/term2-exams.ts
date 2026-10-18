/** Closed-book items for Semester 2. Original questions. Not a textbook table. */

export type Term2ExamQ = {
  q: string;
  he?: string;
  choices: string[];
  answer: string;
  why: string;
};

type Row = [q: string, he: string, answer: string, w1: string, w2: string, w3: string, why: string];

function add(rows: Row[]): Term2ExamQ[] {
  return rows.map(([q, he, answer, w1, w2, w3, why]) => ({
    q,
    he: he || undefined,
    choices: [answer, w1, w2, w3],
    answer,
    why,
  }));
}

const BANK: Record<number, Term2ExamQ[]> = {
  20: add([
    ["What is this form?", "קְטֹל", "Qal infinitive construct", "Qal infinitive absolute", "Niphal perfect", "Hiphil imperfect", "Shewa, then holem, is the construct. The absolute opens with qamets."],
    ["What does the ל add?", "לִקְטֹל", "Purpose: in order to", "A past, he killed", "The negative", "When, as a finite verb", "ל glued to the infinitive construct is purpose or result."],
    ["How is an infinitive construct negated?", "", "With לְבִלְתִּי", "With לֹא", "With אַל", "With אֵין", "לֹא and אַל do not negate this form."],
    ["What is this?", "בְּנוֹת", "Infinitive construct of בָּנָה", "Qal perfect of בָּנָה", "Infinitive absolute of בָּנָה", "Niphal of בָּנָה", "A III-ה construct drops ה and ends in וֹת."],
    ["What is לִשְׁחֹט doing in Genesis 22:10?", "לִשְׁחֹט", "Purpose: in order to slaughter", "A finished past", "A command: slaughter", "A passive: he was slaughtered", "ל plus the construct is “in order to.”"],
    ["An I-guttural infinitive construct takes what under the first letter?", "", "A hateph vowel", "A plain shewa", "Qamets", "A dagesh in the second letter", "A guttural will not hold a plain shewa. עֲזֹב and אֱמֹר are the pattern."],
    ["Does the infinitive construct mark person?", "", "No. It is a verbal noun", "Yes, like the perfect", "Yes, like the imperfect", "Only in the plural", "Person, gender, and number are not marked on it."],
    ["What does בְּ add on this form?", "בִּקְטֹל", "When or while", "He", "Not", "The", "בְּ and כְּ on the construct are “when” or “while.”"],
    ["A pronoun suffix on the infinitive construct can be what?", "", "The doer or the one acted on", "Only a preposition", "Only the negative", "Only a second verb", "The sentence decides which of the two the suffix is."],
    ["What keeps קְטֹל apart from the infinitive absolute?", "קְטֹל", "The shewa under the first letter", "The holem alone", "A final ת", "A dagesh", "Both can show holem. The construct opens with shewa."],
  ]),
  21: add([
    ["What is this form?", "קָטוֹל", "Qal infinitive absolute", "Qal infinitive construct", "Qal imperative only", "Qal active participle", "Qamets, then holem, is the absolute."],
    ["What does the infinitive absolute refuse?", "", "A preposition or a suffix", "A root", "A holem", "A qamets", "Nothing is glued to the front or the end."],
    ["Beside a finite verb of the same root, it usually means what?", "", "Surely, or completely", "The subject", "A question", "The object marker", "English often says “surely” or “certainly.”"],
    ["What does this line say?", "מוֹת יוּמַת", "He shall surely be put to death", "He died yesterday", "Do not die", "He was a dying man", "The absolute stands next to the finite verb and intensifies it."],
    ["How is the holem of the absolute often written?", "", "Without the vav", "Only as holem-vav", "As tsere", "As shewa", "קָטֹל with qamets is still the absolute."],
    ["Besides intensifying a finite verb, the absolute can stand in for what?", "", "A stronger command", "A Niphal", "The article", "A construct chain", "It can take the place of an imperative and speak more strongly."],
    ["Which vowel separates the absolute from the construct?", "", "Qamets under the first letter", "Shewa under the first letter", "Dagesh in the second letter", "A nun prefix", "Shewa is the construct. Qamets is the absolute."],
    ["How many forms does the infinitive absolute have?", "", "One. It is a verbal noun", "Ten, one for each person", "Only a masculine plural", "A full derived stem", "Like the construct, it does not conjugate for person."],
    ["Which of these do you not do to the absolute?", "", "Glue לְ to it for purpose", "Set it next to a finite verb", "Hear “surely” in English", "See holem in the middle", "Purpose לְ belongs to the construct, not the absolute."],
    ["קָטֹל with qamets and no vav is still what?", "קָטֹל", "The infinitive absolute", "The infinitive construct", "The participle", "The Hiphil", "The qamets is the mark, whether or not the holem has a vav."],
  ]),
  22: add([
    ["What is this form?", "קֹטֵל", "Qal active participle", "Qal passive participle", "Infinitive construct", "Hiphil perfect", "Holem after the first letter, then tsere."],
    ["What is the mark of the active participle?", "", "Holem after the first letter, then tsere", "Qamets, then holem", "Shewa, then holem", "Hireq on a ה", "Holem or holem-vav in that slot is the same mark."],
    ["What does a participle have?", "", "Gender and number, not person", "Person, like the perfect", "No gender", "Only a plural", "It wears adjective clothes. It does not take a person ending."],
    ["What is the vav doing here?", "קוֹטֵל", "Writing the same holem", "Making it Hiphil", "Making it plural", "Serving as the root", "Holem-vav is still the participle’s holem."],
    ["A common feminine singular is which?", "", "קֹטֶלֶת", "קֹטְלִים", "קָטוֹל", "נִקְטַל", "Feminine singular is קֹטֶלֶת, and also קֹטְלָה."],
    ["Standing alone, the participle names what?", "", "The one doing it", "A completed past", "A prohibition", "The infinitive", "שׁוֹמֵר is “the keeper,” the one who keeps."],
    ["What is שׁוֹמֵר in Psalm 121:4?", "שׁוֹמֵר", "The keeper", "He kept", "In order to keep", "He was kept", "The participle names the doer. Israel’s keeper does not sleep."],
    ["What is this form?", "קָטוּל", "Qal passive participle", "Qal active participle", "Pual perfect", "Infinitive absolute", "Qamets, then shureq, is the passive participle of a strong verb."],
    ["After a noun, and matching its article, the participle does what?", "", "It describes", "It becomes a finite verb", "It is negated by בִּלְתִּי", "It becomes Hiphil", "Matching the article, it works as an adjective."],
    ["Before the noun, or with no article, it can make what?", "", "A clause: the fire is consuming", "Only a construct chain", "A Niphal", "An infinitive absolute", "That order is a clause, not a mistake."],
  ]),
  23: add([
    ["What is the ordinary narrative order?", "", "Verb, then subject, then object", "Subject, then verb", "Object, then verb, then subject", "A sentence with no words in front", "English puts the subject first. Hebrew narrative usually does not."],
    ["What is fronted in this line?", "וַיִּזְכֹּר אֱלֹהִים אֶת נֹחַ", "Nothing. The verb leads", "Noah", "God, in front of the verb", "The object marker", "The verb is first. That is the unmarked line."],
    ["What does אֵת do?", "", "It flags the object", "It flags the subject", "It negates the verb", "It makes a construct chain", "The order does not have to show the object, because אֵת can."],
    ["Can a Hebrew sentence lack a finite verb?", "", "Yes. It can still be a sentence", "No. Every sentence needs a perfect", "No. Every sentence needs an imperfect", "Only in a list of names", "Subject then predicate, with no finite verb, can still identify."],
    ["Subject, then predicate, with no finite verb, often does what?", "", "It identifies", "It is a mistake", "It is Hiphil", "It asks a question", "“The man is a prophet” is that shape, even with no verb written."],
    ["Predicate, then subject, often does what?", "", "It describes", "It is forbidden", "It is the infinitive absolute", "It negates the line", "Description often puts the describing word first."],
    ["A word standing before the verb is what?", "", "Marked. It is the point of the line", "Always the object", "Ungrammatical", "Always an infinitive construct", "Fronting is contrast, topic, or the thing being answered."],
    ["What may stand in front of the verb?", "", "A noun, a pronoun, a negative, or הִנֵּה", "Only the object marker", "Only a participle", "Only אַל", "Any of those makes the line marked."],
    ["Fronting should be read as what?", "", "The thing the line wants noticed", "A copying error", "A derived stem", "The article", "Do not treat fronting as a broken “normal” order."],
    ["Verb-first is what kind of line?", "", "The ordinary background", "The marked line", "Only poetry", "Only a command", "The normal order is the background. The fronted word is the point."],
  ]),
  24: add([
    ["What stem is this?", "נִקְטַל", "Niphal perfect", "Qal perfect", "Piel perfect", "Hiphil perfect", "The perfect opens with נִ."],
    ["What can a Niphal mean?", "", "Passive, reflexive, or reciprocal", "Only causative", "Only “surely”", "Only a participle", "“He was killed,” “he did it to himself,” or “they did it to one another.”"],
    ["What is the dagesh in this form?", "יִקָּטֵל", "The nun that assimilated", "A Piel dagesh", "The article", "A mappiq", "In the imperfect the nun does not stay as its own letter."],
    ["Once the nun is gone, what vowel often sits under the first root letter?", "", "Qamets or tsere", "Only shewa", "Hireq on ה", "Qibbuts", "That vowel, with the dagesh, is the mark."],
    ["How does נִלְחַם usually come out in English?", "נִלְחַם", "He fought", "He was fought", "He caused a fight", "He is a fight", "Some Niphal roots are active in English. This one means he fought."],
    ["What stem is וְנִבְרְכוּ in Genesis 12:3?", "וְנִבְרְכוּ", "Niphal", "Qal", "Piel", "Hithpael", "The nun is still there. The families will be blessed."],
    ["What do you name first?", "", "The stem, then the person", "The English gloss, then ignore the nun", "The object, then the stem", "The root, before you look at the prefix", "The nun, or the dagesh it left, names the stem."],
    ["Where does the nun stay as its own letter?", "", "In the perfect", "In the imperfect", "In the imperative", "In the infinitive", "Elsewhere it assimilates and leaves a dagesh."],
    ["A Niphal that is active in English is still what stem?", "", "Niphal", "Qal, because the English is active", "Hiphil", "Piel", "The stem is the form, not the English voice."],
    ["Why is הִקְטִיל not Niphal?", "הִקְטִיל", "It opens with הִ and an i-vowel", "It has a nun", "Its dagesh is an assimilated nun", "It is a perfect", "הִ plus an i-vowel is Hiphil, not Niphal."],
  ]),
  25: add([
    ["What does a weak letter do to a Niphal?", "", "It changes a vowel. It does not invent a new stem", "It creates a Hophal", "It removes the Niphal mark", "It makes the form Qal", "Find נִ, or the dagesh the nun left, before you rebuild the root."],
    ["An I-guttural Niphal perfect often shows what under the guttural?", "", "A hateph vowel", "A plain shewa", "Qibbuts", "No prefix at all", "A guttural will not hold a plain shewa. You know this from the Qal."],
    ["What happens to III-ה in many Niphal forms?", "", "The final ה drops", "The ה always stays", "The form becomes Piel", "The nun is deleted and not replaced", "The endings are the ones you already parse on a III-ה."],
    ["What is וַיִּשָּׁאֶר?", "וַיִּשָּׁאֶר", "Niphal: he was left", "Qal perfect of a different stem", "Hiphil: he caused to remain", "Piel", "The dagesh is the nun. Only Noah was left."],
    ["When do you restore the lexical root?", "", "After the stem is named", "Before you look at the prefix", "By deleting every dagesh", "From the English alone", "If you restore the root first, a doubled letter can look like part of it."],
    ["A doubled letter in a Niphal may be what?", "", "The assimilated nun, not a root letter", "Always the Piel’s middle letter", "Always the article", "A mappiq in ה", "Name the stem before you decide the root."],
    ["What do III-ע and III-ח do in the Niphal?", "", "They keep the strong Niphal marks", "They have no Niphal", "They take Hiphil hireq", "They always lose the dagesh", "A guttural at the end does not invent a new stem."],
    ["What can I-נ do in this stem?", "", "Hide the nun", "Add a ה at the front", "Become an infinitive absolute", "Take qibbuts as its mark", "The nun assimilates. The next letter holds the dagesh."],
    ["What do you look for first?", "", "נִ, or the dagesh the nun left", "The English gloss", "The object marker", "Qamets hatuf", "The weak letter is the second question."],
    ["What goes wrong if you restore the root first?", "", "A doubled letter can look like the root", "The stem becomes obvious", "The nun returns as ה", "The form must be Pual", "The dagesh may be the nun, not a second root letter."],
  ]),
  26: add([
    ["What stem is this?", "הִקְטִיל", "Hiphil perfect", "Hophal perfect", "Niphal perfect", "Qal infinitive", "הִ and a long i-vowel. The stem’s name is הִפְעִיל."],
    ["What is the voice of the Hiphil?", "", "Causative and active", "Passive of the Qal", "Reflexive", "“Surely”", "“He was king” becomes “he made someone king.”"],
    ["If the Qal is “he was king,” the Hiphil is what?", "", "He made someone king", "He was king", "He was made king", "Kings, a noun", "Hiphil causes the action. Hophal is the one who was caused."],
    ["In the second person perfect, the stem vowel shortens to what?", "", "Patach", "Holem", "Shewa", "Qibbuts", "The long i-vowel of the third person becomes patach."],
    ["What is this form?", "יַקְטִיל", "Hiphil imperfect", "Hiphil perfect", "Niphal imperfect", "Piel imperfect", "The ה drops. Patach sits under the prefix."],
    ["What does the Hiphil imperfect drop?", "", "The ה of the perfect", "The first root letter", "The person", "The causative sense", "Patach on the prefix, and no ה, is the imperfect."],
    ["What is this form?", "מַקְטִיל", "Hiphil participle", "Piel participle", "Hophal participle", "Qal participle", "The participle keeps the patach prefix and the i-vowel."],
    ["What does the patach prefix of וַיַּשְׁכֵּם say?", "וַיַּשְׁכֵּם", "Hiphil imperfect", "Qal", "Niphal", "Infinitive construct", "Abraham rose early. The prefix is Hiphil, not Qal."],
    ["The Hiphil perfect wants what?", "", "הִ and a long i-vowel", "A patach prefix and no ה", "Qibbuts", "A nun", "Do not swap the perfect’s הִ with the imperfect’s patach."],
    ["A patach prefix with no ה is which Hiphil form?", "", "The imperfect, not the perfect", "The perfect", "The infinitive absolute", "A Niphal", "The perfect still wears הִ."],
  ]),
  27: add([
    ["Why does this perfect use segol?", "הֶעֱמִיד", "The first root letter is a guttural", "It is Hophal", "It is Qal", "The ה is the article", "I-guttural prefers הֶ and a hateph, not hireq."],
    ["What is the imperfect of that same verb?", "", "יַעֲמִיד", "יִקָּטֵל", "קִטֵּל", "הֻקְטַל", "The imperfect goes back to the patach prefix."],
    ["What does III-ה do in the Hiphil?", "", "It drops the root ה and uses Hiphil endings", "It becomes Niphal", "It keeps every ה", "It becomes an infinitive absolute", "The endings are the ones you already know from Qal III-ה."],
    ["What does I-נ often do in the Hiphil?", "", "It assimilates and leaves a dagesh", "It adds nun at the end", "It becomes Pual", "It loses the prefix", "The dagesh is the nun, not a new stem."],
    ["What does a hollow verb show in the Hiphil?", "", "Its long middle vowel as the stem vowel", "A doubled guttural", "Qibbuts as the mark", "Shewa only", "The prefix still says Hiphil. The middle vowel is the hollow root."],
    ["How do you read וַיּוֹלֶד?", "וַיּוֹלֶד", "Name Hiphil from the prefix, then rebuild the root", "Call it Qal because English says “fathered”", "Call the dagesh Piel", "Ignore the prefix", "He fathered. The prefix is the stem. Then put the root back."],
    ["Do weak vowels cancel the Hiphil prefix?", "", "No", "Yes. Every weak form is Qal", "Yes. They remove the causation", "Only when לֹא is present", "The prefix still says Hiphil when a weak letter has changed the vowel."],
    ["What should you master before the weak Hiphil?", "", "The strong marks", "The English of every weak root", "The Pual", "The infinitive absolute", "The weak class keeps those marks, with a changed vowel."],
    ["הֶ instead of הִ on an I-guttural perfect is still what?", "הֶעֱמִיד", "Hiphil", "Hophal", "Niphal", "The article", "Segol is the guttural’s vowel. The stem is still causative."],
    ["A dagesh left by an assimilated nun is what?", "", "The nun, not a new stem", "Proof of Piel", "The article", "A mappiq", "Name Hiphil from the prefix. Then account for the nun."],
  ]),
  28: add([
    ["What is the Hophal?", "", "The passive of the Hiphil", "The passive of the Qal", "The same stem as Piel", "An infinitive", "“He made someone king” becomes “he was made king.”"],
    ["How does English usually say a Hophal?", "", "A form of “was,” plus the caused action", "A form of “surely”", "“In order to”", "A reflexive “himself”", "The cause happened to the subject."],
    ["What vowel is on the ה?", "הֻקְטַל", "Qibbuts, the u-class", "Hireq", "Tsere", "Shewa", "הֻ is the u-class perfect."],
    ["What is qamets hatuf doing here?", "הָקְטַל", "Marking the o-class Hophal", "Marking the article", "Marking a Qal perfect", "Marking the infinitive absolute", "הָ with qamets hatuf is the o-class, not Hiphil’s הִ."],
    ["What is the stem vowel of the strong Hophal?", "", "Patach", "Hireq-yod", "Holem", "Tsere", "Hiphil wants an i-vowel. Hophal wants patach."],
    ["Why is a stem i-vowel not Hophal?", "", "Hiphil wants that i-vowel", "Hophal wants hireq-yod", "Patach would be Qal", "An o prefix is Niphal", "U or o on the prefix, and patach in the stem, is Hophal."],
    ["Which conjugations are you asked to know now?", "", "Perfect, imperfect, and participle", "All seven, including the rare ones", "Only the imperative", "Only the infinitive absolute", "The other conjugations can wait until a text brings them."],
    ["What is וַיֻּגַּד?", "וַיֻּגַּד", "Hophal: it was told", "Hiphil: he told", "Qal: he was great", "Niphal of a different story", "It was told to Abraham. The u prefix is the passive causative."],
    ["The Hophal imperfect puts what under its prefix?", "", "The same o or u vowel", "Hireq on ה", "Shewa and a Piel dagesh", "A nun", "The prefix vowel is the mark, in the perfect and the imperfect."],
    ["Do not read the o-class הָ as what?", "הָקְטַל", "Hiphil הִ", "Hophal", "A passive", "Patach in the stem", "Hiphil is הִ plus an i-vowel. This הָ is Hophal."],
  ]),
  29: add([
    ["Where do you mostly meet the Hophal?", "", "On weak roots", "On the strong verb קטל in long lists", "Only on Qal participles", "Only on infinitives", "Strong Hophal forms are few. The weak ones are the ones in the text."],
    ["What does I-guttural prefer?", "", "The o-class prefix and a hateph qamets", "Hireq and a plain shewa", "A Piel dagesh", "A nun prefix", "The guttural takes the hateph. The prefix is still o-class Hophal."],
    ["What is וַיֻּכּוּ?", "וַיֻּכּוּ", "Hophal of נָכָה: they were beaten", "Qal of נָכָה", "Piel of a hollow root", "Hiphil of הָלַךְ", "The u prefix is Hophal. The dagesh is the nun of נָכָה."],
    ["What is that dagesh in the kaf?", "וַיֻּכּוּ", "The assimilated nun", "A Piel middle letter", "The article", "A vowel letter", "I-נ leaves the dagesh behind. It is not a new stem."],
    ["What does III-ה do in the Hophal?", "", "It drops the root ה and keeps the o-class prefix", "It becomes an infinitive absolute", "It adds הִת", "It loses the passive", "The endings are the ones you already know."],
    ["What names the Hophal on a weak root?", "", "The u or o prefix", "A doubled middle letter", "Qamets then holem", "Shewa then holem", "The weak letter changes a vowel. The prefix still names the stem."],
    ["A patach stem vowel, with Hiphil’s ה missing, is not automatically what?", "", "Qal", "Able to be Hophal", "Passive", "A weak verb", "Do not call it Qal just because the ה of Hiphil is gone."],
    ["What does the missing ה of the Hiphil not prove?", "", "That the form is Qal", "That you should look at the prefix vowel", "That a weak root can hide a letter", "That Hophal uses patach", "Look at the u or o prefix before you name the stem."],
    ["The endings on a weak Hophal are what?", "", "The endings you already know", "A new set of ten", "Only plural endings", "Only feminine endings", "Do not learn a second ending chart for this stem."],
    ["On a weak root, the Hophal mark is still what?", "", "U or o on the prefix, not a doubled letter", "Dagesh in every letter", "A nun that must be visible", "A glued ל", "Doubling can be a hidden nun. The prefix is the stem."],
  ]),
  30: add([
    ["What marks this stem?", "קִטֵּל", "Dagesh in the second root letter", "A nun prefix", "A הִ prefix", "Holem after the first letter", "That dagesh is the Piel mark. Hireq and tsere are the perfect’s vowels."],
    ["What are the perfect vowels?", "קִטֵּל", "Hireq, then tsere", "Qamets, then holem", "Shewa, then holem", "Qibbuts, then patach", "Qibbuts in that first slot would be Pual."],
    ["What vowel is under the prefix?", "יְקַטֵּל", "Shewa", "Patach", "Hireq", "Qibbuts", "Imperfect and participle put shewa under the prefix, then patach in the stem."],
    ["What is this form?", "מְקַטֵּל", "Piel participle", "Hiphil participle", "Qal participle", "Hophal participle", "Shewa under מ, and the dagesh, are Piel. Hiphil’s participle is מַ."],
    ["Is the Piel gloss always “intensive”?", "", "No", "Yes", "Only when it is passive", "Only when it means “he caused”", "Sometimes it is heavier. Sometimes it makes a verb transitive. Sometimes it is just how that root is used."],
    ["An intransitive Qal can become what in the Piel?", "", "Transitive", "An infinitive", "A noun only", "Hophal", "“He was holy” can become “he sanctified something.”"],
    ["What stem is וַיְדַבֵּר?", "וַיְדַבֵּר", "Piel", "Qal", "Niphal", "Hiphil", "God spoke. Shewa on the prefix and dagesh in the middle are Piel."],
    ["What decides the stem?", "", "The dagesh", "The English gloss alone", "The person ending", "The object marker", "Let the word list decide the gloss. Let the dagesh decide the stem."],
    ["Qibbuts under the first root letter of a doubled verb is what?", "", "Pual, not Piel", "Still Piel", "Hiphil", "Niphal", "Piel has hireq there in the perfect, or patach after a shewa prefix."],
    ["Which of these is a root that simply lives in the Piel?", "", "He spoke, he commanded, or he blessed", "The verb “he was”", "The article", "The negative לֹא", "Do not force “intensive” onto “he spoke.”"],
  ]),
  31: add([
    ["What does a middle guttural do to the Piel dagesh?", "", "It refuses the dagesh", "It always takes the dagesh", "It turns the stem into Qal", "It adds a nun", "ר, and the other gutturals, cannot hold dagesh forte."],
    ["Why is וַיְבָרֶךְ still Piel?", "וַיְבָרֶךְ", "The prefix shewa is there, and ר has refused the dot", "The qamets proves Qal", "A missing ה proves Hiphil", "It is an infinitive construct", "God blessed them. The missing dot is the guttural, not a new stem."],
    ["What is virtual doubling?", "", "The short vowel stays, though the dagesh cannot", "The verb becomes passive", "The root gains a letter", "The form is Hithpael", "The vowel that would have sat with the dagesh stays short."],
    ["What is compensatory lengthening?", "", "The vowel before the guttural lengthens", "A suffix is added", "The nun assimilates", "The form becomes an absolute", "The vowel makes up for the dagesh the guttural refused."],
    ["What does III-ה do in the Piel?", "", "It keeps the Piel marks and uses ה endings", "It becomes Niphal", "It drops the prefix shewa", "It becomes Hophal", "The ה endings are the familiar ones. The stem is still Piel."],
    ["When may a geminate drop the dagesh?", "", "When shewa follows the doubled letter", "Whenever the verb is Qal", "When a suffix ת is added to a noun", "Only in the participle of Hiphil", "The other Piel marks are still there, so the stem does not change."],
    ["If the other Piel marks are still there, what about the stem?", "", "It does not change", "It must be Qal", "It is Hiphil", "It is an infinitive absolute", "A missing dot on a geminate, with shewa after it, is not a new stem."],
    ["A missing dagesh on ר is what?", "וַיְבָרֶךְ", "The guttural’s refusal, not a different stem", "Proof that the verb is Qal", "Proof of Hiphil", "The article", "Do not call it Qal because the dagesh is missing."],
    ["What do most weak classes keep?", "", "Shewa on the prefix, and dagesh in the second letter", "None of the Piel marks", "Only a participle", "A הִ prefix", "Weakness changes a letter. It does not erase the stem."],
    ["What decides the gloss of a Piel?", "", "The word list", "Whether ר can hold a dagesh", "The prefix vowel alone", "A rule that every Piel is intensive", "The dagesh, or its refusal, decides the stem. The list decides the English."],
  ]),
  32: add([
    ["What is the Pual?", "", "The passive of the Piel", "The passive of the Qal", "Another name for Hiphil", "An infinitive", "“He smashed” becomes “it was smashed.”"],
    ["Besides the dagesh, what marks this form?", "קֻטַּל", "Qibbuts under the first root letter", "Hireq under the first root letter", "Holem after the first letter", "Shewa under the first letter", "Piel has hireq there. Pual has qibbuts."],
    ["Why is the dagesh alone not enough?", "", "Piel and Hithpael also double the middle letter", "Only Pual doubles a letter", "Dagesh is always the article", "Nouns never double", "You need the vowel under the first root letter."],
    ["What does English need for a Pual?", "", "A form of “was”", "“Surely”", "“In order to”", "“Do not”", "The subject receives the action."],
    ["What do the imperfect and the participle still have?", "", "Shewa under the prefix, then qibbuts", "Hireq on ה", "A nun prefix", "Holem-vav as the mark", "The prefix shewa is shared with Piel. The qibbuts is Pual’s."],
    ["What stem is מְהֻלָּל?", "מְהֻלָּל", "Pual participle", "Piel participle", "Qal passive participle", "Hophal", "The name of the LORD is praised. Qibbuts with the dagesh is Pual."],
    ["Qibbuts where Piel would have put hireq or patach means what?", "", "Say Pual before you translate", "Call it Qal", "Ignore the dagesh", "Call it Hiphil", "The vowel is the difference between the active and the passive."],
    ["“He smashed,” put in the Pual, is what?", "", "It was smashed", "He smashed", "Smash, as a command", "He caused smashing", "Pual is passive. Hiphil is the causative."],
    ["Which forms are you asked to know?", "", "Perfect, imperfect, and participle", "Only the infinitive absolute", "The full Hithpael", "No participle", "The other conjugations can wait."],
    ["Hireq under the first letter of a doubled perfect is what?", "קִטֵּל", "Piel, not Pual", "Pual", "Hophal", "Niphal", "Swap hireq for qibbuts and the same dagesh becomes Pual."],
  ]),
  33: add([
    ["What should you learn before the weak Pual?", "", "The strong diagnostics", "The English of every weak root", "Hishtaphel", "The infinitive absolute", "III-א and III-ה keep those strong marks."],
    ["What do III-א and III-ה keep?", "", "The qibbuts and the dagesh", "None of the passive marks", "A change into Qal", "A הִת prefix", "The final letter is weak. The stem marks stay."],
    ["A final ה on some of these forms is often what?", "", "A vowel letter, not the third root letter", "Always the third root letter", "The article", "The negative", "You already know that vowel letter from Qal and Piel."],
    ["What does a middle guttural do?", "", "It rejects the dagesh", "It requires a stronger dagesh", "It makes the form Hiphil", "It always removes the qibbuts", "The same refusal you saw in the Piel."],
    ["What stem is מְבֹרָךְ?", "מְבֹרָךְ", "Pual", "Qal passive participle", "Hiphil", "Infinitive absolute", "The qibbuts has lengthened before ר, which cannot hold the dagesh."],
    ["What is that lengthened vowel before ר?", "מְבֹרָךְ", "Compensatory lengthening", "The infinitive absolute’s holem", "A plural ending", "The article", "The vowel makes up for the dagesh. The stem is still Pual."],
    ["Lengthening in front of a middle guttural does not do what?", "", "Turn a Pual into a Qal", "Happen before ר", "Keep the passive", "Belong in this chapter", "The missing dot is the guttural, not a Qal stem."],
    ["What is virtual doubling?", "", "The short vowel stays", "The prefix is deleted", "The form is only Niphal", "The form is the absolute", "Either the short vowel stays, or the vowel lengthens. Both can be Pual."],
    ["The missing dot in מְבֹרָךְ is what?", "מְבֹרָךְ", "The guttural", "Proof of Qal", "A suffix", "A copying error", "ר refuses dagesh. The passive stem remains."],
    ["What does Psalm 113:2 say with מְבֹרָךְ?", "מְבֹרָךְ", "May the name be blessed", "He blessed", "Bless, as a command to one man", "He was king", "The participle is passive. The name is blessed."],
  ]),
  34: add([
    ["What names this stem?", "הִתְקַטֵּל", "The prefix הִתְ", "The prefix הִ alone", "The prefix נִ", "The prefix מַ", "הִתְ is enough. You do not need to hesitate."],
    ["What is the imperfect prefix?", "", "יִתְ", "יַ", "יְ", "יִקָּ", "Perfect הִתְ, imperfect יִתְ, participle מִתְ."],
    ["What is the participle prefix?", "", "מִתְ", "מַ", "מְ with no ת", "שׁוֹ", "מִתְ is the participle. מַ would be Hiphil."],
    ["Under that prefix, the stem looks like what?", "", "Piel, with dagesh in the middle", "A Qal participle", "A Hiphil perfect", "An infinitive construct", "Patach under the first root letter, and dagesh in the second."],
    ["The voice is often what?", "", "Reflexive", "Causative passive", "“Surely”", "A construct chain", "He sanctified himself. They hid themselves."],
    ["It can also be what?", "", "Reciprocal, or simply that root’s normal stem", "Only a noun", "Only feminine", "The article", "Not every הִתְ wants the word “himself” in English."],
    ["What is the class gloss of הִתְפַּלֵּל?", "הִתְפַּלֵּל", "He prayed", "He prayed himself", "He was caused to pray", "Do not pray", "This root lives in the Hithpael. The gloss is “he prayed.”"],
    ["What is הִתְפַּלֵּל in Numbers 21:7?", "הִתְפַּלֵּל", "An imperative: pray", "A story about a prayer long finished", "A Hophal", "An infinitive absolute", "The people ask Moses to pray to the LORD."],
    ["What do you use to name the stem?", "", "The prefix, before you parse the root", "The English word “self”", "The dagesh alone", "The object marker", "הִתְ, יִתְ, or מִתְ comes first."],
    ["When may you skip “himself” in English?", "", "When the word list gives a plain gloss", "Whenever you see הִתְ", "When the middle letter is doubled", "When the form is perfect", "הִתְפַּלֵּל is “he prayed,” not “he prayed himself.”"],
  ]),
  35: add([
    ["What do geminate and III-ה keep?", "", "The Hithpael prefixes", "None of the prefixes", "A change into Qal", "A Hophal u-vowel", "Apart from the usual weak endings, the strong marks stay."],
    ["When may a geminate drop the dagesh?", "", "When shewa follows", "When the prefix is gone", "When the word is a noun", "When ל is added", "Some forms of הִתְפַּלֵּל do this. The prefix still decides."],
    ["If the dagesh drops, what is still decisive?", "", "The prefix", "The English", "A vowel letter at the end", "The object marker", "הִתְ, יִתְ, or מִתְ names the stem."],
    ["What does a middle guttural do?", "", "It refuses the dagesh and may lengthen the vowel", "It always shows the dagesh", "It makes the form Niphal", "It makes the form an absolute", "The same two ways you saw in Piel and Pual."],
    ["How is the verb of bowing and worship pointed?", "חָוָה", "Hishtaphel, not an ordinary Hithpael", "Ordinary Hithpael with ת", "Qal", "Pual", "You know it by הִשְׁתַּ or יִשְׁתַּ, and by the root חָוָה."],
    ["What is the mark of that worship verb?", "", "הִשְׁתַּ or יִשְׁתַּ", "הִתְ only", "A nun prefix", "Qamets then holem", "The shin-tav prefix is the mark, on every person."],
    ["What does וְנִשְׁתַּחֲוֶה mean?", "וְנִשְׁתַּחֲוֶה", "We will worship", "We were caused to live", "We spoke", "We were blessed", "Genesis 22:5. We will worship, and we will return."],
    ["It is III-ה, so what changes?", "", "The endings", "The prefix disappears", "It cannot be parsed", "It becomes a noun", "The endings change. The prefix does not."],
    ["When the endings change, what does the prefix do?", "", "It stays", "It becomes הִ", "It becomes a nun", "It drops the shin", "הִשְׁתַּחֲוָה keeps that prefix on every person."],
    ["When you see הִשְׁתַּ, what do you say first?", "", "Worship, or bow down, then the person", "Piel", "Ignore the shin", "Treat it as לֹא", "The prefix is the stem. Then parse the person."],
  ]),
};

export function term2Exam(chapter: number): Term2ExamQ[] {
  return BANK[chapter] ?? [];
}

export function term2ExamChapters(): number[] {
  return Object.keys(BANK)
    .map(Number)
    .sort((a, b) => a - b);
}
