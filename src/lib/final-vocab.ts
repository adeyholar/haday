import { normAnswer } from "@/lib/week7-mock";

/** Final exam vocabulary. The professor's Week 15 slides, in slide order. */
export type FinalVocabItem = {
  id: string;
  hebrew: string;
  accept: string[];
  traps?: string[];
};

export type FinalVocabRun = {
  order: string[];
  index: number;
  first: Record<string, boolean>;
  choices: Record<string, string[]>;
};

export const FINAL_VOCAB: FinalVocabItem[] = [
  item("f-01", "בָּנָה", "to build", ["to bless, kneel"]),
  item("f-02", "שָׁאַל", "to ask, inquire, request"),
  item("f-03", "אֹהֶל", "tent", ["ram; ruler; terebinth"]),
  item("f-04", "נֶגֶד", "in front of, opposite, in the sight of"),
  item("f-05", "טָהֵר", "to be clean, be pure"),
  item("f-06", "הָלַךְ", "to go, walk", ["to come, go in, enter"]),
  item("f-07", "נָגַשׁ", "to draw near, approach", ["to find, reach"]),
  item("f-08", "מָצָא", "to find, reach"),
  item("f-09", "חַיִּים", "life", ["to die"]),
  item("f-10", "שָׁלֵם", "to be complete, finished; to repay", ["to be full, fill"]),
  item("f-11", "אַל", "not (used with jussive or imperative)", ["not (used in poetry)"]),
  item("f-12", "אֵיל", "ram; ruler; terebinth"),
  item("f-13", "חוּץ", "outside, street", ["in front of, opposite, in the sight of"]),
  item("f-14", "כֵּן", "so, thus; right, honest"),
  item("f-15", "אָכַל", "to eat, consume", ["to burn, consume with fire"]),
  item("f-16", "צָעַק", "to cry out, call for help", ["to weep, cry"]),
  item("f-17", "שָׁמַר", "to keep, watch, guard", ["to hear, listen to, obey"]),
  item("f-18", "פֹּה", "here", ["now"]),
  item("f-19", "שֵׁבֶט", "rod, staff, scepter; tribe"),
  item("f-20", "יָרַד", "to go down, descend"),
  item("f-21", "פָּתַח", "to open", ["to build"]),
  item("f-22", "גָּאַל", "to redeem, act as kinsman-redeemer", ["to atone, make atonement"]),
  item("f-23", "שֶׁמֶשׁ", "sun", ["name, reputation"]),
  item("f-24", "דּוֹר", "generation, period"),
  item("f-25", "קוּם", "to arise, stand up", ["to sit, remain, dwell"]),
  item("f-26", "מָלֵא", "to be full, fill", ["to be many, multiply, be great"]),
  item("f-27", "קָדַשׁ", "to be holy, consecrate", ["to be clean, be pure"]),
  item("f-28", "הָיָה", "to be, become, happen", ["to go, walk"]),
  item("f-29", "פַּר", "bull, young bull", ["ram; ruler; terebinth"]),
  item("f-30", "מְלָאכָה", "work, occupation, business"),
  item("f-31", "שָׁכַב", "to lie down"),
  item("f-32", "חָזַק", "to be strong, grow firm, have courage", ["to be heavy, be honored, be glorified"]),
  item("f-33", "שָׂרַף", "to burn, consume with fire"),
  item("f-34", "רָעַע", "to be evil, be bad"),
  item("f-35", "עָבַד", "to work, serve, worship", ["work, occupation, business"]),
  item("f-36", "נָשָׂא", "to lift up, carry, take"),
  item("f-37", "רוּם", "to be high, rise, be exalted", ["to go up, ascend, offer"]),
  item("f-38", "שֵׁם", "name, reputation", ["rod, staff, scepter; tribe"]),
  item("f-39", "עָלָה", "to go up, ascend, offer", ["to go down, descend"]),
  item("f-40", "עַתָּה", "now"),
  item("f-41", "יָשַׁב", "to sit, remain, dwell", ["to lie down"]),
  item("f-42", "סוּר", "to turn aside, depart", ["to go out, come out"]),
  item("f-43", "בָּכָה", "to weep, cry"),
  item("f-44", "פֶּה", "mouth; opening, edge"),
  item("f-45", "כָּפַר", "to atone, make atonement"),
  item("f-46", "אָהַב", "to love", ["to delight in, take pleasure in"]),
  item("f-47", "אַף", "also, even; nostril, anger", ["so, thus; right, honest"]),
  item("f-48", "לָבַשׁ", "to put on, wear, clothe", ["to put, place, set"]),
  item("f-49", "עָנָה", "to answer, respond", ["to ask, inquire, request"]),
  item("f-50", "שִׂים", "to put, place, set"),
  item("f-51", "כּוּן", "to be established, be firm, prepare", ["to be strong, grow firm, have courage"]),
  item("f-52", "יָסַף", "to add, do again, continue"),
  item("f-53", "אָמַר", "to say, speak, think", ["to answer, respond"]),
  item("f-54", "דָּם", "blood", ["generation, period"]),
  item("f-55", "בְּעַד", "behind, through, on behalf of", ["in front of, opposite, in the sight of"]),
  item("f-56", "כִּסֵּא", "seat, throne", ["palm of hand; sole of foot; spoon"]),
  item("f-57", "יָלַד", "to bear, give birth to, beget", ["to die"]),
  item("f-58", "כָּבֵד", "to be heavy, be honored, be glorified"),
  item("f-59", "דָּרַשׁ", "to seek, inquire, require", ["to ask, inquire, request"]),
  item("f-60", "בּוֹא", "to come, go in, enter", ["to go out, come out"]),
  item("f-61", "רֵעַ", "friend, companion, neighbor", ["to be evil, be bad"]),
  item("f-62", "עָזַב", "to leave, forsake, abandon", ["to turn aside, depart"]),
  item("f-63", "בַּל", "not (used in poetry)"),
  item("f-64", "יָצָא", "to go out, come out"),
  item("f-65", "עָשָׂה", "to do, make", ["to build"]),
  item("f-66", "בָּחַר", "to choose, select", ["to weep, cry"]),
  item("f-67", "כַּף", "palm of hand; sole of foot; spoon", ["mouth; opening, edge"]),
  item("f-68", "בִּין", "to understand, discern, perceive", ["to seek, inquire, require"]),
  item("f-69", "בָּרַךְ", "to bless, kneel"),
  item("f-70", "שָׁמַע", "to hear, listen to, obey"),
  item("f-71", "שָׁפַט", "to judge, govern", ["to seek, inquire, require"]),
  item("f-72", "צָפוֹן", "north, northern", ["number, count"]),
  item("f-73", "מִסְפָּר", "number, count"),
  item("f-74", "הָרַג", "to kill, slay", ["to die"]),
  item("f-75", "אֱמֶת", "truth, faithfulness", ["to be holy, consecrate"]),
  item("f-76", "רָבָה", "to be many, multiply, be great"),
  item("f-77", "מוּת", "to die"),
  item("f-78", "כָּרַת", "to cut, cut off; to make a covenant", ["to atone, make atonement"]),
  item("f-79", "חָפֵץ", "to delight in, take pleasure in"),
  item("f-80", "יָכֹל", "to be able, prevail", ["to add, do again, continue"]),
];


const BY_ID = new Map(FINAL_VOCAB.map((item) => [item.id, item]));

export function finalVocabItem(id: string): FinalVocabItem | null {
  return BY_ID.get(id) ?? null;
}

export function finalVocabChoices(item: FinalVocabItem, stored?: string[]): string[] {
  return stored ?? [item.accept[0]];
}

export function startFinalVocab(seed = 1): FinalVocabRun {
  const rng = mulberry(seed);
  const choices: Record<string, string[]> = {};
  for (const item of FINAL_VOCAB) choices[item.id] = glossChoices(item, rng);
  return { order: shuffle(FINAL_VOCAB.map((item) => item.id), rng), index: 0, first: {}, choices };
}

export function takeFinalVocab(run: FinalVocabRun, raw: string): { run: FinalVocabRun; ok: boolean } {
  const id = run.order[run.index];
  const item = id ? finalVocabItem(id) : null;
  if (!item) return { run, ok: false };
  const got = normAnswer(raw);
  const ok = Boolean(got) && item.accept.some((answer) => normAnswer(answer) === got);
  const first = { ...run.first };
  if (!(id in first)) first[id] = ok;
  const order = run.order.slice();
  if (!ok) order.push(id);
  return { run: { order, index: run.index + 1, first, choices: run.choices }, ok };
}

export function finalVocabGrade(run: FinalVocabRun): { held: number; total: number; pct: number } {
  const total = FINAL_VOCAB.length;
  const held = FINAL_VOCAB.filter((item) => run.first[item.id] === true).length;
  return { held, total, pct: total === 0 ? 0 : Math.round((held / total) * 100) };
}

export function finalVocabCurrent(run: FinalVocabRun): FinalVocabItem | null {
  const id = run.order[run.index];
  return id ? finalVocabItem(id) : null;
}

function item(id: string, hebrew: string, answer: string, traps?: string[]): FinalVocabItem {
  return { id, hebrew, accept: [answer], traps };
}

function glossChoices(item: FinalVocabItem, rng: () => number): string[] {
  const answer = item.accept[0];
  const pool = FINAL_VOCAB.filter((other) => other.accept[0] !== answer).map((other) => other.accept[0]);
  const picks = [...(item.traps ?? [])];
  for (const gloss of shuffle(pool, rng)) {
    if (picks.length >= 3) break;
    if (!picks.includes(gloss)) picks.push(gloss);
  }
  return shuffle([answer, ...picks.slice(0, 3)], rng);
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const next = list.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
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
