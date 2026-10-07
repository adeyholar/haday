/** Week 7 midterm mock. Review-sheet items from the class meeting, not the exam's exact lines. */

export type Week7Kind = "parse" | "type" | "code" | "gloss";

export type Week7Item = {
  id: string;
  section: string;
  hebrew: string;
  kind: Week7Kind;
  /** What the student should produce. First entry is what we show. */
  accept: string[];
  /** Forced wrong meanings for a vocabulary card. */
  traps?: string[];
};

export type Week7Run = {
  order: string[];
  index: number;
  /** First answer only. Later tries do not change the grade. */
  first: Record<string, boolean>;
  choices: Record<string, string[]>;
};

export const PARSE_CHOICES = [
  "masculine singular",
  "feminine singular",
  "masculine plural",
  "feminine plural",
] as const;

export const WEEK7_SECTIONS: { id: string; title: string; ask: string }[] = [
  { id: "parse", title: "Gender and number", ask: "Choose the gender and number. You do not translate this one." },
  { id: "prefix", title: "And, the, and a preposition", ask: "Type the English. No capitals, except I. No punctuation." },
  { id: "suffix", title: "Pronoun suffix", ask: "Type the code, such as 3ms. A short translation also counts." },
  { id: "adj", title: "Adjective", ask: "Type the English. If only one word has “the,” use is or are." },
  { id: "pron", title: "Pronoun or demonstrative", ask: "Type the English. Word order tells you “this is” or “this.”" },
  { id: "construct", title: "Construct", ask: "Type the English. The last word decides whether the chain is “the.”" },
  { id: "vocab", title: "Vocabulary", ask: "Choose the meaning. These are the words on the review list." },
];

const PARSE: Week7Item[] = [
  item("p-sus", "parse", "סוּס", "parse", ["masculine singular"]),
  item("p-susa", "parse", "סוּסָה", "parse", ["feminine singular"]),
  item("p-susot", "parse", "סוּסוֹת", "parse", ["feminine plural"]),
  item("p-susim", "parse", "סוּסִים", "parse", ["masculine plural"]),
  item("p-devarim", "parse", "דְּבָרִים", "parse", ["masculine plural"]),
  item("p-torot", "parse", "תּוֹרוֹת", "parse", ["feminine plural"]),
  item("p-malka", "parse", "מַלְכָּה", "parse", ["feminine singular"]),
];

const PREFIX: Week7Item[] = [
  item("x-pharaoh", "prefix", "וּפַרְעֹה", "type", ["and Pharaoh", "and the Pharaoh"]),
  item("x-bread", "prefix", "וָלֶחֶם", "type", ["and bread"]),
  item("x-torah", "prefix", "הַתּוֹרָה", "type", ["the law", "the torah"]),
  item("x-land", "prefix", "וְהָאָרֶץ", "type", ["and the land", "and the earth"]),
  item("x-the-bread", "prefix", "וְהַלֶּחֶם", "type", ["and the bread"]),
  item("x-from-king", "prefix", "מִן־הַמֶּלֶךְ", "type", ["from the king"]),
  item("x-in-the-wild", "prefix", "בַּמִּדְבָּר", "type", ["in the wilderness"]),
  item("x-and-horse", "prefix", "וְסוּס", "type", ["and a horse", "and horse"]),
  item("x-in-a-wild", "prefix", "בְּמִדְבָּר", "type", ["in a wilderness", "in wilderness"]),
  item("x-like-word", "prefix", "כַּדָּבָר", "type", ["like the word", "as the word"]),
  item("x-to-king", "prefix", "לַמֶּלֶךְ", "type", ["to the king", "for the king"]),
];

const SUFFIX: Week7Item[] = [
  code("s-artzo", "אַרְצוֹ", "3ms", "his land"),
  code("s-susah", "סוּסָהּ", "3fs", "her horse"),
  code("s-torotihen", "תּוֹרוֹתֵיהֶן", "3fp", "their laws"),
  code("s-achi", "אָחִי", "1cs", "my brother"),
  code("s-achai", "אַחַי", "1cs", "my brothers"),
  code("s-achicha", "אָחִיךָ", "2ms", "your brother"),
  code("s-malcheihem", "מַלְכֵיהֶם", "3mp", "their kings"),
];

const ADJ: Week7Item[] = [
  item("a-tova", "adj", "טוֹבָה הָעִיר", "type", ["the city is good", "good is the city"]),
  item("a-tova-attr", "adj", "הָעִיר הַטּוֹבָה", "type", ["the good city"]),
  item("a-wise", "adj", "סוּסוֹת חֲכָמוֹת", "type", ["wise horses", "wise mares"]),
  item("a-wise-the", "adj", "הַסּוּסוֹת הַחֲכָמוֹת", "type", ["the wise horses", "the wise mares"]),
  item("a-wise-pred", "adj", "הַסּוּסוֹת חֲכָמוֹת", "type", ["the horses are wise", "the mares are wise"]),
  item("a-good-horse", "adj", "סוּס טוֹב", "type", ["a good horse", "good horse"]),
  item("a-old", "adj", "הָאִישׁ הַזָּקֵן", "type", ["the old man"]),
  item("a-evil", "adj", "הַיֶּלֶד רַע", "type", ["the boy is evil", "the child is evil", "the boy is bad", "the child is bad"]),
];

const PRON: Week7Item[] = [
  item("d-zot", "pron", "זֹאת הָאִשָּׁה", "type", ["this is the woman"]),
  item("d-zeh", "pron", "זֶה הָאִישׁ", "type", ["this is the man"]),
  item("d-har", "pron", "הוּא הָהָר", "type", ["it is the mountain", "he is the mountain"]),
  item("d-anan", "pron", "עָנָן הוּא", "type", ["that cloud"]),
  item("d-hemma", "pron", "הֵמָּה הֶהָרִים", "type", ["those are the mountains", "they are the mountains"]),
  item("d-melech", "pron", "הוּא הַמֶּלֶךְ", "type", ["he is the king", "that is the king"]),
  item("d-atta", "pron", "אַתָּה מֶלֶךְ", "type", ["you are a king"]),
  item("d-elleh", "pron", "אֵלֶּה הַתּוֹרוֹת", "type", ["these are the laws"]),
  item("d-hem", "pron", "הֵם הָעַמִּים", "type", ["they are the peoples", "they are the people"]),
  item("d-anachnu", "pron", "אֲנַחְנוּ יְלָדִים", "type", ["we are children"]),
  item("d-torot", "pron", "תּוֹרוֹת אֵלֶּה", "type", ["these laws"]),
];

const CONSTRUCT: Week7Item[] = [
  item("c-daughters", "construct", "בְּנוֹת הַמַּלְכָּה", "type", ["the daughters of the queen"]),
  item("c-egypt", "construct", "מֶלֶךְ בֵּית עֶבֶד עִיר אֱלֹהֵי מִצְרַיִם", "type", [
    "the king of the house of the servant of the city of the gods of Egypt",
    "the king of the house of the servant of the city of the god of Egypt",
  ]),
  item("c-voice", "construct", "קוֹל סוּס אִישׁ בַּת אִשָּׁה", "type", [
    "a voice of a horse of a man of a daughter of a woman",
    "voice of a horse of a man of a daughter of a woman",
  ]),
  item("c-david", "construct", "תּוֹרוֹת בְּנֵי דָוִד", "type", ["the laws of the sons of David"]),
  item("c-my-city", "construct", "מֶלֶךְ בֵּית עֶבֶד אֱלֹהֵי עִירִי", "type", [
    "the king of the house of the servant of the gods of my city",
    "the king of the house of the servant of the god of my city",
  ]),
  item("c-nations", "construct", "אֱלֹהֵי הַגּוֹיִם", "type", ["the gods of the nations", "the god of the nations"]),
  item("c-house", "construct", "אִישׁ הַבַּיִת", "type", ["the man of the house"]),
];

const VOCAB: Week7Item[] = [
  gloss("v-eben", "אֶבֶן", "stone"),
  gloss("v-adon", "אָדוֹן", "lord, master"),
  gloss("v-achot", "אָחוֹת", "sister"),
  gloss("v-acher", "אַחֵר", "other, another", ["after"]),
  gloss("v-oyev", "אֹיֵב", "enemy"),
  gloss("v-elleh", "אֵלֶּה", "these"),
  gloss("v-elohim", "אֱלֹהִים", "God, gods"),
  gloss("v-elef", "אֶלֶף", "thousand"),
  gloss("v-ammah", "אַמָּה", "cubit"),
  gloss("v-eretz", "אֶרֶץ", "land, earth"),
  gloss("v-esh", "אֵשׁ", "fire"),
  gloss("v-et", "אֵת", "object marker", ["with"]),
  gloss("v-attem", "אַתֶּם", "you (plural)"),
  gloss("v-bayit", "בַּיִת", "house"),
  gloss("v-baqar", "בָּקָר", "cattle"),
  gloss("v-berit", "בְּרִית", "covenant"),
  gloss("v-berakhah", "בְּרָכָה", "blessing"),
  gloss("v-basar", "בָּשָׂר", "flesh"),
  gloss("v-bat", "בַּת", "daughter"),
  gloss("v-betokh", "בְּתוֹךְ", "in the midst of"),
  gloss("v-gevul", "גְּבוּל", "border"),
  gloss("v-derekh", "דֶּרֶךְ", "way"),
  gloss("v-ha", "הֲ", "question marker"),
  gloss("v-hu", "הוּא", "he, it, that"),
  gloss("v-hi", "הִיא", "she"),
  gloss("v-hekhal", "הֵיכָל", "temple, palace"),
  gloss("v-hem", "הֵם", "they (masculine)", ["they (feminine)"]),
  gloss("v-hen", "הֵן", "they (feminine)", ["behold"]),
  gloss("v-hinneh", "הִנֵּה", "behold", ["they (feminine)"]),
  gloss("v-zot", "זֹאת", "this (feminine)"),
  gloss("v-zeh", "זֶה", "this (masculine)"),
  gloss("v-zaqen", "זָקֵן", "old"),
  gloss("v-zar", "זָר", "strange, foreign"),
  gloss("v-chodesh", "חֹדֶשׁ", "month"),
  gloss("v-chatat", "חַטָּאת", "sin"),
  gloss("v-chai", "חַי", "alive"),
  gloss("v-chamesh", "חָמֵשׁ", "five"),
  gloss("v-tov", "טוֹב", "good"),
  gloss("v-yehoshua", "יְהוֹשֻׁעַ", "Joshua"),
  gloss("v-yom", "יוֹם", "day"),
  gloss("v-yeled", "יֶלֶד", "child"),
  gloss("v-yesh", "יֵשׁ", "there is"),
  gloss("v-kohen", "כֹּהֵן", "priest"),
  gloss("v-ki", "כִּי", "because, that"),
  gloss("v-kol", "כֹּל", "all"),
  gloss("v-kesef", "כֶּסֶף", "silver"),
  gloss("v-meod", "מְאֹד", "very"),
  gloss("v-meah", "מֵאָה", "hundred"),
  gloss("v-midbar", "מִדְבָּר", "wilderness"),
  gloss("v-mizbeach", "מִזְבֵּחַ", "altar"),
  gloss("v-matteh", "מַטֶּה", "tribe"),
  gloss("v-mi", "מִי", "who"),
  gloss("v-milchamah", "מִלְחָמָה", "war"),
  gloss("v-maal", "מַעַל", "above"),
  gloss("v-mishpachah", "מִשְׁפָּחָה", "family"),
  gloss("v-mishpat", "מִשְׁפָּט", "judgment"),
  gloss("v-navi", "נָבִיא", "prophet"),
  gloss("v-naar", "נַעַר", "boy"),
  gloss("v-sus", "סוּס", "horse"),
  gloss("v-am", "עַם", "people"),
  gloss("v-etz", "עֵץ", "tree"),
  gloss("v-eser", "עֶשֶׂר", "ten"),
  gloss("v-et-time", "עֵת", "time"),
  gloss("v-panim", "פָּנִים", "face"),
  gloss("v-tson", "צֹאן", "flock"),
  gloss("v-tsava", "צָבָא", "army, host"),
  gloss("v-tsiyon", "צִיּוֹן", "Zion"),
  gloss("v-qadosh", "קָדוֹשׁ", "holy"),
  gloss("v-rosh", "רֹאשׁ", "head"),
  gloss("v-regel", "רֶגֶל", "foot"),
  gloss("v-ruach", "רוּחַ", "spirit, wind"),
  gloss("v-rachoq", "רָחוֹק", "far"),
  gloss("v-ra", "רַע", "evil, bad", ["disaster", "wicked"]),
  gloss("v-raah", "רָעָה", "disaster", ["evil, bad", "wicked"]),
  gloss("v-rasha", "רָשָׁע", "wicked", ["evil, bad", "disaster"]),
  gloss("v-sheva", "שֶׁבַע", "seven"),
  gloss("v-shelishi", "שְׁלִישִׁי", "third"),
  gloss("v-shemoneh", "שְׁמֹנֶה", "eight"),
  gloss("v-shaar", "שַׁעַר", "gate"),
  gloss("v-shesh", "שֵׁשׁ", "six"),
  gloss("v-tachat", "תַּחַת", "under"),
];

export const WEEK7_ITEMS: Week7Item[] = [
  ...PARSE,
  ...PREFIX,
  ...SUFFIX,
  ...ADJ,
  ...PRON,
  ...CONSTRUCT,
  ...VOCAB,
];

const BY_ID = new Map(WEEK7_ITEMS.map((item) => [item.id, item]));

export function week7Item(id: string): Week7Item | null {
  return BY_ID.get(id) ?? null;
}

export function week7Section(id: string) {
  return WEEK7_SECTIONS.find((section) => section.id === id) ?? WEEK7_SECTIONS[0];
}

export function normAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.,;:!?"""''()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function answerMatches(item: Week7Item, raw: string): boolean {
  const got = normAnswer(raw);
  if (!got) return false;
  return item.accept.some((ok) => normAnswer(ok) === got);
}

export function week7Choices(item: Week7Item, stored?: string[]): string[] {
  if (item.kind === "parse") return stored?.length ? stored : [...PARSE_CHOICES];
  if (item.kind === "gloss") return stored ?? [item.accept[0]];
  return [];
}

export function startWeek7Run(seed = 1): Week7Run {
  const rng = mulberry(seed);
  const choices: Record<string, string[]> = {};
  for (const item of WEEK7_ITEMS) {
    if (item.kind === "parse") choices[item.id] = shuffle([...PARSE_CHOICES], rng);
    if (item.kind === "gloss") choices[item.id] = glossChoices(item, rng);
  }
  const order = WEEK7_SECTIONS.flatMap((section) =>
    shuffle(
      WEEK7_ITEMS.filter((item) => item.section === section.id).map((item) => item.id),
      rng,
    ),
  );
  return { order, index: 0, first: {}, choices };
}

export function takeWeek7(run: Week7Run, raw: string): { run: Week7Run; ok: boolean; done: boolean } {
  const id = run.order[run.index];
  const item = id ? week7Item(id) : null;
  if (!item) return { run, ok: false, done: true };
  const ok = answerMatches(item, raw);
  const first = { ...run.first };
  if (!(id in first)) first[id] = ok;
  const order = run.order.slice();
  let index = run.index + 1;
  if (!ok) order.push(id);
  const next = { order, index, first, choices: run.choices };
  return { run: next, ok, done: index >= order.length };
}

export function week7Grade(run: Week7Run): { held: number; total: number; pct: number } {
  const total = WEEK7_ITEMS.length;
  const held = WEEK7_ITEMS.filter((item) => run.first[item.id] === true).length;
  const pct = total === 0 ? 0 : Math.round((held / total) * 100);
  return { held, total, pct };
}

export function week7Current(run: Week7Run): Week7Item | null {
  const id = run.order[run.index];
  return id ? week7Item(id) : null;
}

function item(id: string, section: string, hebrew: string, kind: Week7Kind, accept: string[], traps?: string[]): Week7Item {
  return { id, section, hebrew, kind, accept, traps };
}

function gloss(id: string, hebrew: string, answer: string, traps?: string[]): Week7Item {
  return item(id, "vocab", hebrew, "gloss", [answer], traps);
}

function code(id: string, hebrew: string, mark: string, translation: string): Week7Item {
  const n = mark[0];
  const g = mark[1] === "m" ? "masculine" : mark[1] === "f" ? "feminine" : "common";
  const num = mark[2] === "s" ? "singular" : "plural";
  const person = n === "1" ? "first" : n === "2" ? "second" : "third";
  const ord = n === "1" ? "1st" : n === "2" ? "2nd" : "3rd";
  return item(id, "suffix", hebrew, "code", [
    mark,
    `${n} ${mark.slice(1)}`,
    `${n} ${mark[1]} ${mark[2]}`,
    `${person} person ${g} ${num}`,
    `${ord} ${g} ${num}`,
    translation,
  ]);
}

function glossChoices(item: Week7Item, rng: () => number): string[] {
  const answer = item.accept[0];
  const pool = WEEK7_ITEMS.filter((other) => other.kind === "gloss" && other.accept[0] !== answer).map(
    (other) => other.accept[0],
  );
  const picks = [...(item.traps ?? [])];
  const bag = shuffle(pool, rng);
  for (const glossText of bag) {
    if (picks.length >= 3) break;
    if (!picks.includes(glossText)) picks.push(glossText);
  }
  return shuffle([answer, ...picks.slice(0, 3)], rng);
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const next = list.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
