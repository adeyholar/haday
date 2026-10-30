/**
 * Verbal System: the academy’s name for the binyanim and their conjugations.
 * A Tanakh root, a stem, and a conjugation decide which lists the builder shows.
 */

import {
  DAG,
  HATEF_LETTER,
  HOLAM_VAV,
  SHUREQ,
  V,
  canForte,
  isDental,
  isSibilant,
  lene,
  mark,
  medial,
  withTone,
  type Dot,
  type VowelId,
} from "@/lib/verbal-marks";

export const ROUND = 10;
export const PASS = 90;

export type StemId = "qal" | "niphal" | "piel" | "pual" | "hiphil" | "hophal" | "hithpael";
export type ConjId =
  | "perfect"
  | "imperfect"
  | "wayyiqtol"
  | "jussive"
  | "cohortative"
  | "imperative"
  | "inf-const"
  | "inf-abs"
  | "participle";

export type RootClass =
  | "strong"
  | "assim"
  | "I-gutt"
  | "I-aleph"
  | "II-gutt"
  | "III-gutt"
  | "III-aleph"
  | "III-he"
  | "I-nun"
  | "I-yod"
  | "hollow"
  | "geminate";

export type VerbRoot = {
  id: string;
  letters: [string, string, string];
  dots: [Dot, Dot, Dot];
  gloss: string;
  cls: RootClass;
  cite: string;
  assim?: "t" | "n";
  hollow?: "u" | "o" | "i";
};

export type Opt = { id: string; label: string; mark: string };
export type Slot = { id: string; label: string; options: Opt[] };
export type Cell = {
  id: string;
  label: string;
  note: string;
  answer: Record<string, string>;
  form: string;
};
export type Pattern = {
  root: VerbRoot;
  stem: StemId;
  conj: ConjId;
  blurb: string;
  slots: Slot[];
  cells: Cell[];
  render: (picks: Record<string, string>) => string;
};

type Seed = { id: string; label: string; note: string; answer: Record<string, string> };
type Engine = { slots: Slot[]; cells: Seed[]; render: (root: VerbRoot, picks: Record<string, string>) => string; blurb: string };

export const CLASS_LABEL: Record<RootClass, string> = {
  strong: "Strong",
  assim: "Assimilating ending",
  "I-gutt": "I-guttural",
  "I-aleph": "I-aleph",
  "II-gutt": "II-guttural",
  "III-gutt": "III-guttural",
  "III-aleph": "III-aleph",
  "III-he": "III-he",
  "I-nun": "I-nun",
  "I-yod": "I-yod",
  hollow: "Hollow",
  geminate: "Geminate",
};

export type RootPool = "tri" | "bi" | "geminate" | "other";

export const POOLS: { id: RootPool; en: string; line: string }[] = [
  { id: "tri", en: "Three consonants", line: "A strong root. Three letters, and none of them is weak." },
  { id: "bi", en: "Two consonants", line: "Hollow. The middle letter hides, so the word shows two." },
  { id: "geminate", en: "Geminate", line: "The last two letters are the same letter." },
  { id: "other", en: "Other consonants", line: "A guttural, nun, yod, he, or aleph changes the build." },
];

export function poolOf(root: VerbRoot): RootPool {
  if (root.cls === "hollow") return "bi";
  if (root.cls === "geminate") return "geminate";
  if (root.cls === "strong") return "tri";
  return "other";
}

export function rootsInPool(pool: RootPool): VerbRoot[] {
  return ROOTS.filter((root) => poolOf(root) === pool);
}

const LETTER_NAME: Record<string, string> = {
  א: "aleph",
  ב: "bet",
  ג: "gimel",
  ד: "dalet",
  ה: "he",
  ו: "vav",
  ז: "zayin",
  ח: "het",
  ט: "tet",
  י: "yod",
  כ: "kaf",
  ל: "lamed",
  מ: "mem",
  נ: "nun",
  ס: "samekh",
  ע: "ayin",
  פ: "pe",
  צ: "tsade",
  ק: "qof",
  ר: "resh",
  ש: "shin",
  ת: "tav",
};

const LETTER_ORDER = "אבגדהוזחטיכלמנסעפצקרשת";

/** The consonant a student is practicing. Strong roots are chosen by any of their three letters. */
export function practiceLetter(root: VerbRoot): string {
  if (root.cls === "hollow" || root.cls === "geminate" || root.cls === "II-gutt") return root.letters[1];
  if (root.cls === "III-gutt" || root.cls === "III-aleph" || root.cls === "III-he") return root.letters[2];
  if (root.cls === "assim") return root.assim === "n" ? "נ" : "ת";
  return root.letters[0];
}

export function consonantsInPool(pool: RootPool): { letter: string; en: string }[] {
  const seen = new Set<string>();
  for (const root of rootsInPool(pool)) {
    if (pool === "tri") root.letters.forEach((letter) => seen.add(letter));
    else seen.add(practiceLetter(root));
  }
  return [...seen]
    .sort((a, b) => LETTER_ORDER.indexOf(a) - LETTER_ORDER.indexOf(b))
    .map((letter) => ({ letter, en: LETTER_NAME[letter] ?? letter }));
}

export function rootsForConsonant(pool: RootPool, letter: string): VerbRoot[] {
  return rootsInPool(pool).filter((root) =>
    pool === "tri" ? root.letters.includes(letter) : practiceLetter(root) === letter,
  );
}

export const STEMS: { id: StemId; en: string; he: string }[] = [
  { id: "qal", en: "Qal", he: "קַל" },
  { id: "niphal", en: "Niphal", he: "נִפְעַל" },
  { id: "piel", en: "Piel", he: "פִּעֵל" },
  { id: "pual", en: "Pual", he: "פֻּעַל" },
  { id: "hiphil", en: "Hiphil", he: "הִפְעִיל" },
  { id: "hophal", en: "Hophal", he: "הֻפְעַל" },
  { id: "hithpael", en: "Hithpael", he: "הִתְפַּעֵל" },
];

export const CONJS: { id: ConjId; en: string }[] = [
  { id: "perfect", en: "Perfect" },
  { id: "imperfect", en: "Imperfect" },
  { id: "wayyiqtol", en: "Wayyiqtol" },
  { id: "jussive", en: "Jussive" },
  { id: "cohortative", en: "Cohortative" },
  { id: "imperative", en: "Imperative" },
  { id: "inf-const", en: "Infinitive construct" },
  { id: "inf-abs", en: "Infinitive absolute" },
  { id: "participle", en: "Participle" },
];

const stemEn = Object.fromEntries(STEMS.map((s) => [s.id, s.en])) as Record<StemId, string>;
const conjEn = Object.fromEntries(CONJS.map((s) => [s.id, s.en])) as Record<ConjId, string>;

export const ROOTS: VerbRoot[] = [
  { id: "qatal", letters: ["ק", "ט", "ל"], dots: ["", "", ""], gloss: "kill", cls: "strong", cite: "קָטַל" },
  { id: "shamar", letters: ["ש", "מ", "ר"], dots: ["shin", "", ""], gloss: "keep, guard", cls: "strong", cite: "שָׁמַר" },
  { id: "katav", letters: ["כ", "ת", "ב"], dots: ["", "", ""], gloss: "write", cls: "strong", cite: "כָּתַב" },
  { id: "paqad", letters: ["פ", "ק", "ד"], dots: ["", "", ""], gloss: "attend, number", cls: "strong", cite: "פָּקַד" },
  { id: "zakar", letters: ["ז", "כ", "ר"], dots: ["", "", ""], gloss: "remember", cls: "strong", cite: "זָכַר" },
  { id: "shafat", letters: ["ש", "פ", "ט"], dots: ["shin", "", ""], gloss: "judge", cls: "strong", cite: "שָׁפַט" },
  { id: "lamad", letters: ["ל", "מ", "ד"], dots: ["", "", ""], gloss: "learn", cls: "strong", cite: "לָמַד" },
  { id: "malak", letters: ["מ", "ל", "כ"], dots: ["", "", ""], gloss: "reign", cls: "strong", cite: "מָלַךְ" },
  { id: "karat", letters: ["כ", "ר", "ת"], dots: ["", "", ""], gloss: "cut", cls: "assim", cite: "כָּרַת", assim: "t" },
  { id: "shakan", letters: ["ש", "כ", "ן"], dots: ["shin", "", ""], gloss: "dwell", cls: "assim", cite: "שָׁכַן", assim: "n" },
  { id: "amad", letters: ["ע", "מ", "ד"], dots: ["", "", ""], gloss: "stand", cls: "I-gutt", cite: "עָמַד" },
  { id: "avad", letters: ["ע", "ב", "ד"], dots: ["", "", ""], gloss: "serve, work", cls: "I-gutt", cite: "עָבַד" },
  { id: "halak", letters: ["ה", "ל", "ך"], dots: ["", "", ""], gloss: "walk, go", cls: "I-gutt", cite: "הָלַךְ" },
  { id: "amar", letters: ["א", "מ", "ר"], dots: ["", "", ""], gloss: "say", cls: "I-aleph", cite: "אָמַר" },
  { id: "shaal", letters: ["ש", "א", "ל"], dots: ["shin", "", ""], gloss: "ask", cls: "II-gutt", cite: "שָׁאַל" },
  { id: "bachar", letters: ["ב", "ח", "ר"], dots: ["", "", ""], gloss: "choose", cls: "II-gutt", cite: "בָּחַר" },
  { id: "barak", letters: ["ב", "ר", "כ"], dots: ["", "", ""], gloss: "bless", cls: "II-gutt", cite: "בֵּרַךְ" },
  { id: "shama", letters: ["ש", "מ", "ע"], dots: ["shin", "", ""], gloss: "hear", cls: "III-gutt", cite: "שָׁמַע" },
  { id: "shalach", letters: ["ש", "ל", "ח"], dots: ["shin", "", ""], gloss: "send", cls: "III-gutt", cite: "שָׁלַח" },
  { id: "matsa", letters: ["מ", "צ", "א"], dots: ["", "", ""], gloss: "find", cls: "III-aleph", cite: "מָצָא" },
  { id: "qara", letters: ["ק", "ר", "א"], dots: ["", "", ""], gloss: "call", cls: "III-aleph", cite: "קָרָא" },
  { id: "asah", letters: ["ע", "ש", "ה"], dots: ["", "sin", ""], gloss: "do, make", cls: "III-he", cite: "עָשָׂה" },
  { id: "banah", letters: ["ב", "נ", "ה"], dots: ["", "", ""], gloss: "build", cls: "III-he", cite: "בָּנָה" },
  { id: "raah", letters: ["ר", "א", "ה"], dots: ["", "", ""], gloss: "see", cls: "III-he", cite: "רָאָה" },
  { id: "hayah", letters: ["ה", "י", "ה"], dots: ["", "", ""], gloss: "be, become", cls: "III-he", cite: "הָיָה" },
  { id: "nafal", letters: ["נ", "פ", "ל"], dots: ["", "", ""], gloss: "fall", cls: "I-nun", cite: "נָפַל" },
  { id: "nagash", letters: ["נ", "ג", "ש"], dots: ["", "", ""], gloss: "draw near", cls: "I-nun", cite: "נָגַשׁ" },
  { id: "natan", letters: ["נ", "ת", "ן"], dots: ["", "", ""], gloss: "give", cls: "I-nun", cite: "נָתַן" },
  { id: "yashav", letters: ["י", "ש", "ב"], dots: ["", "shin", ""], gloss: "sit, dwell", cls: "I-yod", cite: "יָשַׁב" },
  { id: "yarad", letters: ["י", "ר", "ד"], dots: ["", "", ""], gloss: "go down", cls: "I-yod", cite: "יָרַד" },
  { id: "yatsa", letters: ["י", "צ", "א"], dots: ["", "", ""], gloss: "go out", cls: "I-yod", cite: "יָצָא" },
  { id: "qum", letters: ["ק", "ו", "ם"], dots: ["", "", ""], gloss: "rise", cls: "hollow", cite: "קָם", hollow: "u" },
  { id: "bo", letters: ["ב", "ו", "א"], dots: ["", "", ""], gloss: "come", cls: "hollow", cite: "בָּא", hollow: "o" },
  { id: "sim", letters: ["ש", "י", "ם"], dots: ["sin", "", ""], gloss: "set, put", cls: "hollow", cite: "שָׂם", hollow: "i" },
  { id: "savav", letters: ["ס", "ב", "ב"], dots: ["", "", ""], gloss: "turn, surround", cls: "geminate", cite: "סָבַב" },
];

const byId = Object.fromEntries(ROOTS.map((r) => [r.id, r])) as Record<string, VerbRoot>;

export function rootById(id: string): VerbRoot | undefined {
  return byId[id];
}

export function rootFace(root: VerbRoot): string {
  return root.letters
    .map((ch, i) => mark(ch, "", false, root.dots[i], i === 2))
    .join(" · ");
}

const CIRC = "\u25CC";

function vow(id: string, label: string, markOn = ""): Opt {
  return { id, label, mark: markOn || CIRC + (V[id as VowelId] ?? "") };
}

const VOWEL_BOOK: Record<string, Opt> = {
  none: vow("none", "no vowel"),
  qamets: vow("qamets", "qamets"),
  patah: vow("patah", "patah"),
  shewa: vow("shewa", "shewa"),
  hatef: vow("hatef", "hatef patah"),
  hatefS: vow("hatefS", "hatef segol"),
  hireq: vow("hireq", "hireq"),
  tsere: vow("tsere", "tsere"),
  segol: vow("segol", "segol"),
  holem: vow("holem", "holem"),
  qibbuts: vow("qibbuts", "qibbuts"),
  iy: vow("iy", "hireq-yod", CIRC + V.hireq + "י"),
  oy: vow("oy", "holem-vav", HOLAM_VAV),
  shureq: vow("shureq", "shureq", SHUREQ),
};

function vowels(ids: string[]): Opt[] {
  return ids.map((id) => VOWEL_BOOK[id]);
}

function slot(id: string, label: string, options: Opt[]): Slot {
  return { id, label, options };
}

const PF_END: Opt[] = [
  { id: "none", label: "no ending", mark: "—" },
  { id: "ah", label: "qamets he", mark: CIRC + V.qamets + "ה" },
  { id: "u", label: "shureq", mark: SHUREQ },
  { id: "ta", label: "tav qamets", mark: "ת" + DAG + V.qamets },
  { id: "tf", label: "tav shewa", mark: "ת" + DAG + V.shewa },
  { id: "ti", label: "tav hireq yod", mark: "ת" + DAG + V.hireq + "י" },
  { id: "tem", label: "tav segol mem", mark: "ת" + DAG + V.segol + "ם" },
  { id: "ten", label: "tav segol nun", mark: "ת" + DAG + V.segol + "ן" },
  { id: "nu", label: "nun shureq", mark: "נ" + SHUREQ },
];

const IMPF_END: Opt[] = [
  { id: "none", label: "no ending", mark: "—" },
  { id: "iy", label: "hireq yod", mark: CIRC + V.hireq + "י" },
  { id: "u", label: "shureq", mark: SHUREQ },
  { id: "nah", label: "nun qamets he", mark: "נ" + V.qamets + "ה" },
];

const MERGE: Opt[] = [
  { id: "no", label: "Write the root letter and the ending separately", mark: "—" },
  { id: "yes", label: "Write that letter once, with a dagesh", mark: CIRC + DAG },
];

const TONE: Opt[] = [
  { id: "none", label: "No accent and no meteg", mark: "—" },
  { id: "accent", label: "Accent on the second letter", mark: CIRC + "\u05AB" },
  { id: "meteg", label: "Meteg under the first letter", mark: CIRC + "\u05BD" },
];

const QAL_TONE: Record<string, string> = {
  "3fs": "meteg",
  "3cp": "meteg",
  "2ms": "accent",
  "1cs": "accent",
  "1cp": "accent",
};

function M(root: VerbRoot, i: 0 | 1 | 2, vowel = "", dagesh = false, asFinal = false): string {
  return mark(root.letters[i], vowel, dagesh, root.dots[i], asFinal);
}

function vowelChar(id: string | undefined): string {
  if (!id || id === "none" || id === "iy" || id === "oy" || id === "shureq") return "";
  return V[id as VowelId] ?? "";
}

function endTail(end: string | undefined): { c3: string; tail: string; final: boolean } {
  switch (end) {
    case "ah":
      return { c3: V.qamets, tail: "ה", final: false };
    case "u":
      return { c3: "", tail: SHUREQ, final: false };
    case "ta":
      return { c3: V.shewa, tail: "ת" + DAG + V.qamets, final: false };
    case "tf":
      return { c3: V.shewa, tail: "ת" + DAG + V.shewa, final: false };
    case "ti":
      return { c3: V.shewa, tail: "ת" + DAG + V.hireq + "י", final: false };
    case "tem":
      return { c3: V.shewa, tail: "ת" + DAG + V.segol + "ם", final: false };
    case "ten":
      return { c3: V.shewa, tail: "ת" + DAG + V.segol + "ן", final: false };
    case "nu":
      return { c3: V.shewa, tail: "נ" + SHUREQ, final: false };
    case "iy":
      return { c3: V.hireq, tail: "י", final: false };
    case "nah":
      return { c3: V.shewa, tail: "נ" + V.qamets + "ה", final: false };
    default:
      return { c3: "", tail: "", final: true };
  }
}

function renderQalPf(root: VerbRoot, picks: Record<string, string>): string {
  const v1 = vowelChar(picks.v1);
  const v2 = vowelChar(picks.v2);
  const v3 = vowelChar(picks.v3);
  const tone = picks.tone === "accent" || picks.tone === "meteg" ? picks.tone : "none";
  const finish = (body: string) => withTone(body, tone);
  const A = M(root, 0, v1, lene(root.letters[0], false));
  const B = M(root, 1, v2, false);
  if (picks.merge === "yes" && root.assim === "t" && medial(root.letters[2]) === "ת") {
    const moved: Record<string, { tail: string }> = {
      ta: { tail: "" },
      tf: { tail: "" },
      ti: { tail: "י" },
      tem: { tail: "ם" },
      ten: { tail: "ן" },
    };
    const on = moved[picks.end ?? ""];
    if (on) return finish(A + B + M(root, 2, v3, true) + on.tail);
  }
  if (picks.merge === "yes" && root.assim === "n" && picks.end === "nu") {
    return finish(A + B + M(root, 2, v3, true) + SHUREQ);
  }
  const end = endTail(picks.end);
  return finish(A + B + M(root, 2, v3, false, end.final) + end.tail);
}

const QAL_PF: Seed[] = [
  ["3ms", "3rd masc. sing.", "qamets", "patah", "none", "No ending. This is the citation when the stem is Qal."],
  ["3fs", "3rd fem. sing.", "qamets", "shewa", "ah", "A vowel ending. The second vowel reduces. The meteg keeps the first qamets long."],
  ["2ms", "2nd masc. sing.", "qamets", "patah", "ta", "A consonant ending keeps both stem vowels. The accent sits on the second letter."],
  ["2fs", "2nd fem. sing.", "qamets", "patah", "tf", "Same vowels as 2ms. The tav is bare. The stress stays at the end, so there is no accent mark."],
  ["1cs", "1st common sing.", "qamets", "patah", "ti", "Tav, hireq, yod. The accent sits on the second letter."],
  ["3cp", "3rd common plural", "qamets", "shewa", "u", "Shureq. The second vowel reduces. The meteg keeps the first qamets long."],
  ["2mp", "2nd masc. plural", "shewa", "patah", "tem", "A heavy ending. The first vowel reduces."],
  ["2fp", "2nd fem. plural", "shewa", "patah", "ten", "Same as 2mp, with nun."],
  ["1cp", "1st common plural", "qamets", "patah", "nu", "Nun and shureq. The accent sits on the second letter."],
].map(([id, label, v1, v2, end, note]) => ({ id, label, note, answer: { v1, v2, end } }));

function thirdOf(end: string, merged: boolean): string {
  if (merged && end === "nu") return "none";
  if (merged) {
    if (end === "ta") return "qamets";
    if (end === "tf") return "shewa";
    if (end === "ti") return "hireq";
    if (end === "tem" || end === "ten") return "segol";
  }
  if (end === "ah") return "qamets";
  if (end === "iy") return "hireq";
  if (!end || end === "none" || end === "u") return "none";
  return "shewa";
}

const QAL_PF_END: Opt[] = PF_END.map((opt) => (opt.id === "ah" ? { id: "ah", label: "he", mark: "ה" } : opt));

function qalPerfect(root: VerbRoot): Engine {
  const heavy = HATEF_LETTER.has(medial(root.letters[0])) ? "hatef" : "shewa";
  const reduced = HATEF_LETTER.has(medial(root.letters[1])) ? "hatef" : "shewa";
  const cells = QAL_PF.map((cell) => {
    const answer = { ...cell.answer };
    if (answer.v1 === "shewa") answer.v1 = heavy;
    if (answer.v2 === "shewa") answer.v2 = reduced;
    if (root.assim === "t") answer.merge = ["ta", "tf", "ti", "tem", "ten"].includes(answer.end) ? "yes" : "no";
    if (root.assim === "n") answer.merge = answer.end === "nu" ? "yes" : "no";
    answer.tone = QAL_TONE[cell.id] ?? "none";
    answer.v3 = thirdOf(answer.end, answer.merge === "yes");
    return { ...cell, answer };
  });
  const v1ids = heavy === "hatef" ? ["qamets", "hatef", "shewa", "patah"] : ["qamets", "shewa", "patah", "hireq"];
  const v2ids = reduced === "hatef" ? ["patah", "hatef", "shewa", "qamets"] : ["patah", "shewa", "qamets", "hireq"];
  const v3 = vowels(["none", "shewa", "hatef", "patah", "qamets", "segol", "tsere", "hireq", "holem", "qibbuts"]);
  const slots = [
    slot("v1", "Vowel under the first root letter", vowels(v1ids)),
    slot("v2", "Vowel under the second root letter", vowels(v2ids)),
    slot("v3", "Vowel under the third root letter", v3),
    slot("end", "Ending", QAL_PF_END),
  ];
  if (root.assim) slots.push(slot("merge", "Same letter in the root and the ending", MERGE));
  slots.push(slot("tone", "Accent or meteg", TONE));
  return {
    slots,
    cells,
    render: renderQalPf,
    blurb: "Qal perfect. You choose the vowel under each root letter, the ending, and the accent or the meteg.",
  };
}

function person(kind: "hireq" | "patah" | "wayy-hireq" | "wayy-patah" | "piel" | "wayy-piel" | "iyod" | "wayy-iyod"): Opt[] {
  const P = V.patah;
  const H = V.hireq;
  const S = V.shewa;
  const E = V.segol;
  const T = V.tsere;
  if (kind === "hireq") {
    return [
      { id: "yi", label: "yod hireq", mark: mark("י", H) },
      { id: "ti", label: "tav hireq", mark: mark("ת", H) },
      { id: "ee", label: "alef segol", mark: mark("א", E) },
      { id: "ni", label: "nun hireq", mark: mark("נ", H) },
    ];
  }
  if (kind === "patah") {
    return [
      { id: "ya", label: "yod patah", mark: mark("י", P) },
      { id: "ta", label: "tav patah", mark: mark("ת", P) },
      { id: "ee", label: "alef segol", mark: mark("א", E) },
      { id: "na", label: "nun patah", mark: mark("נ", P) },
    ];
  }
  if (kind === "wayy-hireq") {
    return [
      { id: "wyi", label: "vav patah, yod hireq", mark: mark("ו", P) + mark("י", H, true) },
      { id: "wti", label: "vav patah, tav hireq", mark: mark("ו", P) + mark("ת", H, true) },
      { id: "wee", label: "vav qamets, alef segol", mark: mark("ו", V.qamets) + mark("א", E) },
      { id: "wni", label: "vav patah, nun hireq", mark: mark("ו", P) + mark("נ", H, true) },
    ];
  }
  if (kind === "wayy-patah") {
    return [
      { id: "wya", label: "vav patah, yod patah", mark: mark("ו", P) + mark("י", P, true) },
      { id: "wta", label: "vav patah, tav patah", mark: mark("ו", P) + mark("ת", P, true) },
      { id: "wee", label: "vav qamets, alef segol", mark: mark("ו", V.qamets) + mark("א", E) },
      { id: "wna", label: "vav patah, nun patah", mark: mark("ו", P) + mark("נ", P, true) },
    ];
  }
  if (kind === "piel") {
    return [
      { id: "ys", label: "yod shewa", mark: mark("י", S) },
      { id: "ts", label: "tav shewa", mark: mark("ת", S, true) },
      { id: "ah", label: "alef hatef patah", mark: mark("א", V.hatef) },
      { id: "ns", label: "nun shewa", mark: mark("נ", S) },
    ];
  }
  if (kind === "wayy-piel") {
    return [
      { id: "wys", label: "vav patah, yod shewa", mark: mark("ו", P) + mark("י", S) },
      { id: "wts", label: "vav patah, tav shewa", mark: mark("ו", P) + mark("ת", S, true) },
      { id: "wah", label: "vav qamets, alef hatef", mark: mark("ו", V.qamets) + mark("א", V.hatef) },
      { id: "wns", label: "vav patah, nun shewa", mark: mark("ו", P) + mark("נ", S) },
    ];
  }
  if (kind === "iyod") {
    return [
      { id: "ye", label: "yod tsere", mark: mark("י", T) },
      { id: "te", label: "tav tsere", mark: mark("ת", T, true) },
      { id: "ae", label: "alef tsere", mark: mark("א", T) },
      { id: "ne", label: "nun tsere", mark: mark("נ", T) },
    ];
  }
  return [
    { id: "wye", label: "vav patah, yod tsere", mark: mark("ו", P) + mark("י", T, true) },
    { id: "wte", label: "vav patah, tav tsere", mark: mark("ו", P) + mark("ת", T, true) },
    { id: "wae", label: "vav qamets, alef tsere", mark: mark("ו", V.qamets) + mark("א", T) },
    { id: "wne", label: "vav patah, nun tsere", mark: mark("ו", P) + mark("נ", T, true) },
  ];
}

const PRE_MARK: Record<string, string> = Object.fromEntries(
  (["hireq", "patah", "wayy-hireq", "wayy-patah", "piel", "wayy-piel", "iyod", "wayy-iyod"] as const).flatMap((kind) =>
    person(kind).map((opt) => [opt.id, opt.mark]),
  ),
);

function renderPrefixed(root: VerbRoot, picks: Record<string, string>, dropFirst: boolean): string {
  const pre = PRE_MARK[picks.pre ?? ""] ?? "";
  const v1 = vowelChar(picks.v1);
  const v2 = vowelChar(picks.v2);
  const silent = picks.v1 === "shewa";
  const bDag = (silent && lene(root.letters[1], false)) || picks.forte === "yes";
  const end = endTail(picks.end);
  if (dropFirst) {
    const B = M(root, 1, v2, picks.forte === "yes" || bDag);
    return pre + B + M(root, 2, end.c3, false, end.final) + end.tail;
  }
  const A = M(root, 0, v1, false);
  const B = M(root, 1, v2, bDag && canForte(root.letters[1]) ? bDag : bDag && lene(root.letters[1], false));
  return pre + A + B + M(root, 2, end.c3, false, end.final) + end.tail;
}

function finish(root: VerbRoot, engine: Engine, stem: StemId, conj: ConjId): Pattern {
  return {
    root,
    stem,
    conj,
    blurb: engine.blurb,
    slots: engine.slots,
    render: (picks) => engine.render(root, picks),
    cells: engine.cells.map((cell) => ({ ...cell, form: engine.render(root, cell.answer) })),
  };
}

function seed(id: string, label: string, note: string, answer: Record<string, string>): Seed {
  return { id, label, note, answer };
}

const IMPF_PEOPLE: [string, string, string][] = [
  ["3ms", "3rd masc. sing.", "yi"],
  ["3fs", "3rd fem. sing.", "ti"],
  ["2ms", "2nd masc. sing.", "ti"],
  ["2fs", "2nd fem. sing.", "ti"],
  ["1cs", "1st common sing.", "ee"],
  ["3mp", "3rd masc. plural", "yi"],
  ["3fp", "3rd fem. plural", "ti"],
  ["2mp", "2nd masc. plural", "ti"],
  ["2fp", "2nd fem. plural", "ti"],
  ["1cp", "1st common plural", "ni"],
];

function qalImpf(root: VerbRoot, theme: "holem" | "patah", family: "strong" | "igutt"): Engine {
  const reduced = new Set(["2fs", "3mp", "2mp"]);
  const femininePlural = new Set(["3fp", "2fp"]);
  const cells = IMPF_PEOPLE.map(([id, label, pre]) => {
    let prefix = pre;
    let v1 = "shewa";
    if (family === "igutt") {
      prefix = pre === "yi" ? "ya" : pre === "ti" ? "ta" : pre === "ni" ? "na" : "ee";
      v1 = reduced.has(id) ? "patah" : "hatef";
    }
    const v2 = reduced.has(id) ? "shewa" : theme;
    const end = id === "2fs" ? "iy" : id.endsWith("mp") ? "u" : femininePlural.has(id) ? "nah" : "none";
    return seed(id, label, "Prefix for the person. The stem vowel follows the root class.", { pre: prefix, v1, v2, end });
  });
  const pres = family === "igutt" ? person("patah") : person("hireq");
  const v1 = family === "igutt" ? vowels(["hatef", "patah", "shewa", "hireq"]) : vowels(["shewa", "hireq", "patah"]);
  const v2 = vowels(theme === "holem" ? ["holem", "patah", "shewa", "tsere"] : ["patah", "holem", "shewa", "segol"]);
  return {
    slots: [slot("pre", "Prefix", pres), slot("v1", "Vowel under the first root letter", v1), slot("v2", "Vowel under the second root letter", v2), slot("end", "Ending", IMPF_END)],
    cells,
    render: (r, picks) => renderPrefixed(r, picks, false),
    blurb: family === "igutt"
      ? "I-guttural imperfect. The prefix takes patah, and the guttural takes a hatef, except 1cs."
      : theme === "patah"
        ? "III-guttural imperfect. The theme vowel is patah, not holem."
        : "Qal imperfect. 1cs is alef with segol. A vowel ending reduces the theme vowel.",
  };
}

function qalWayy(root: VerbRoot, theme: "holem" | "patah", family: "strong" | "igutt"): Engine {
  const base = qalImpf(root, theme, family);
  const map: Record<string, string> = family === "igutt"
    ? { ya: "wya", ta: "wta", ee: "wee", na: "wna" }
    : { yi: "wyi", ti: "wti", ee: "wee", ni: "wni" };
  const cells = base.cells.map((cell) => ({ ...cell, answer: { ...cell.answer, pre: map[cell.answer.pre] ?? cell.answer.pre } }));
  return {
    ...base,
    cells,
    slots: [slot("pre", "Prefix", person(family === "igutt" ? "wayy-patah" : "wayy-hireq")), ...base.slots.slice(1)],
    blurb: "Wayyiqtol. Vav with patah, and dagesh in the prefix, unless the prefix is alef. The feminine plural ending is the same one the imperfect uses.",
  };
}

function qalJussive(root: VerbRoot, theme: "holem" | "patah", family: "strong" | "igutt"): Engine {
  const base = qalImpf(root, theme, family);
  return {
    ...base,
    cells: base.cells.filter((cell) => cell.id !== "1cs" && cell.id !== "1cp"),
    blurb: "Jussive. The Tanakh uses the second and third persons. In a strong root the shape matches the imperfect.",
  };
}

function qalCohort(root: VerbRoot): Engine {
  return {
    slots: [
      slot("pre", "Prefix", person("hireq")),
      slot("v1", "Vowel under the first root letter", vowels(["shewa", "hatef", "patah"])),
      slot("v2", "Vowel under the second root letter", vowels(["shewa", "holem", "patah"])),
      slot("end", "Ending", [PF_END.find((opt) => opt.id === "ah")!]),
    ],
    cells: [
      seed("1cs", "1st common sing.", "Alef with segol, then qamets he. The theme vowel reduces.", { pre: "ee", v1: "shewa", v2: "shewa", end: "ah" }),
      seed("1cp", "1st common plural", "Nun with hireq, then the same qamets he.", { pre: "ni", v1: "shewa", v2: "shewa", end: "ah" }),
    ],
    render: (r, picks) => renderPrefixed(r, picks, false),
    blurb: "Cohortative. Only the first person. The Tanakh adds qamets he.",
  };
}

function qalImpv(root: VerbRoot, theme: "holem" | "patah"): Engine {
  const gutt = HATEF_LETTER.has(medial(root.letters[0]));
  const rows: [string, string, string, string, string][] = [
    ["ms", "masc. sing.", gutt ? "hatef" : "shewa", theme, "none"],
    ["fs", "fem. sing.", "hireq", "shewa", "iy"],
    ["mp", "masc. plural", "hireq", "shewa", "u"],
    ["fp", "fem. plural", gutt ? "hatef" : "shewa", theme, "nah"],
  ];
  return {
    slots: [
      slot("v1", "Vowel under the first root letter", vowels(gutt ? ["hatef", "shewa", "hireq", "patah"] : ["shewa", "hireq", "patah"])),
      slot("v2", "Vowel under the second root letter", vowels([theme, "shewa", "patah", "holem"])),
      slot("end", "Ending", IMPF_END),
    ],
    cells: rows.map(([id, label, v1, v2, end]) => seed(id, label, "A command has no person prefix.", { v1, v2, end })),
    render: (r, picks) => {
      const v1 = vowelChar(picks.v1);
      const initial = lene(r.letters[0], false);
      const A = M(r, 0, v1, initial && picks.v1 !== "hatef" && picks.v1 !== "hatefS");
      const silent = picks.v1 === "shewa" || picks.v1 === "hireq";
      const B = M(r, 1, vowelChar(picks.v2), silent && picks.v1 === "shewa" ? false : false);
      const end = endTail(picks.end);
      return A + B + M(r, 2, end.c3, false, end.final) + end.tail;
    },
    blurb: "Imperative. Same shape as the infinitive construct in the masculine singular. The vowels still change with the ending.",
  };
}

function qalInfc(root: VerbRoot): Engine {
  const gutt = HATEF_LETTER.has(medial(root.letters[0]));
  const engine = qalImpv(root, "holem");
  return {
    ...engine,
    cells: [seed("cst", "infinitive construct", "Shewa, or a hatef on a guttural, then holem. No person.", { v1: gutt ? "hatef" : "shewa", v2: "holem", end: "none" })],
    blurb: "Infinitive construct. One form. A guttural in first position takes a hatef.",
  };
}

function qalInfa(root: VerbRoot): Engine {
  return {
    slots: [slot("pattern", "Pattern", [vow("qamets", "qamets then holem-vav"), vow("shewa", "shewa then holem")])],
    cells: [seed("abs", "infinitive absolute", "Qamets under the first letter, holem-vav in the middle.", { pattern: "qamets" })],
    render: (r, picks) => {
      if (picks.pattern === "shewa") return M(r, 0, V.shewa, lene(r.letters[0], false)) + M(r, 1, V.holem) + M(r, 2, "", false, true);
      return M(r, 0, V.qamets, lene(r.letters[0], false)) + M(r, 1, "") + HOLAM_VAV + M(r, 2, "", false, true);
    },
    blurb: "Infinitive absolute. Qamets, then holem-vav. It does not take a preposition.",
  };
}

function qalPtc(root: VerbRoot): Engine {
  const rows: [string, string, string][] = [
    ["ms", "masc. sing. active", "active-ms"],
    ["fs", "fem. sing. active", "active-fs"],
    ["mp", "masc. plural active", "active-mp"],
    ["fp", "fem. plural active", "active-fp"],
    ["mpc", "masc. plural construct", "active-mpc"],
    ["pass", "masc. sing. passive", "passive"],
    ["pass-fs", "fem. sing. passive", "passive-fs"],
    ["pass-mp", "masc. plural passive", "passive-mp"],
    ["pass-fp", "fem. plural passive", "passive-fp"],
  ];
  return {
    slots: [slot("shape", "Participle shape", [
      { id: "active-ms", label: "holem, tsere", mark: CIRC + V.holem + " " + CIRC + V.tsere },
      { id: "active-fs", label: "holem, segol, tav", mark: CIRC + V.holem + " " + CIRC + V.segol + "ת" },
      { id: "active-mp", label: "holem, then ים", mark: CIRC + V.holem + "ִים" },
      { id: "active-fp", label: "holem, then וֹת", mark: CIRC + V.holem + "וֹת" },
      { id: "active-mpc", label: "holem, then tsere yod", mark: CIRC + V.holem + "ֵי" },
      { id: "passive", label: "qamets, shureq", mark: CIRC + V.qamets + " " + SHUREQ },
      { id: "passive-fs", label: "shureq, qamets he", mark: SHUREQ + CIRC + V.qamets + "ה" },
      { id: "passive-mp", label: "shureq, then ים", mark: SHUREQ + "ִים" },
      { id: "passive-fp", label: "shureq, then וֹת", mark: SHUREQ + "וֹת" },
    ])],
    cells: rows.map(([id, label, shape]) => seed(id, label, "Holem after the first letter is the active participle. Qamets and shureq is passive.", { shape })),
    render: (r, picks) => {
      const dag = lene(r.letters[0], false);
      if (picks.shape === "active-fs") return M(r, 0, V.holem, dag) + M(r, 1, V.segol) + M(r, 2, "") + "ת";
      if (picks.shape === "active-mp") return M(r, 0, V.holem, dag) + M(r, 1, V.shewa) + M(r, 2, V.hireq) + "ים";
      if (picks.shape === "active-fp") return M(r, 0, V.holem, dag) + M(r, 1, V.shewa) + M(r, 2, "") + HOLAM_VAV + "ת";
      if (picks.shape === "active-mpc") return M(r, 0, V.holem, dag) + M(r, 1, V.shewa) + M(r, 2, V.tsere) + "י";
      if (picks.shape === "passive") return M(r, 0, V.qamets, dag) + M(r, 1, "") + SHUREQ + M(r, 2, "", false, true);
      if (picks.shape === "passive-fs") return M(r, 0, V.shewa, dag) + M(r, 1, "") + SHUREQ + M(r, 2, V.qamets) + "ה";
      if (picks.shape === "passive-mp") return M(r, 0, V.shewa, dag) + M(r, 1, "") + SHUREQ + M(r, 2, V.hireq) + "ים";
      if (picks.shape === "passive-fp") return M(r, 0, V.shewa, dag) + M(r, 1, "") + SHUREQ + M(r, 2, "") + HOLAM_VAV + "ת";
      return M(r, 0, V.holem, dag) + M(r, 1, V.tsere) + M(r, 2, "", false, true);
    },
    blurb: "Qal participle. Active: holem after the first letter. Passive: qamets and shureq.",
  };
}

function doubled(root: VerbRoot, where: "c1" | "c2"): boolean {
  const ch = where === "c1" ? root.letters[0] : root.letters[1];
  return canForte(ch);
}

function renderPielPf(root: VerbRoot, picks: Record<string, string>, passive: boolean): string {
  const v1 = passive ? V.qibbuts : vowelChar(picks.v1);
  const A = M(root, 0, v1, lene(root.letters[0], false));
  const v2id = picks.v2 ?? "";
  const v2 = vowelChar(v2id);
  const B = M(root, 1, v2, doubled(root, "c2"));
  const end = endTail(picks.end);
  return A + B + M(root, 2, end.c3, false, end.final) + end.tail;
}

function pielPerfect(root: VerbRoot, passive: boolean): Engine {
  const v1 = passive ? "qibbuts" : "hireq";
  const rows: [string, string, string, string][] = [
    ["3ms", "3rd masc. sing.", passive ? "patah" : "tsere", "none"],
    ["3fs", "3rd fem. sing.", "shewa", "ah"],
    ["2ms", "2nd masc. sing.", "patah", "ta"],
    ["2fs", "2nd fem. sing.", "patah", "tf"],
    ["1cs", "1st common sing.", "patah", "ti"],
    ["3cp", "3rd common plural", "shewa", "u"],
    ["2mp", "2nd masc. plural", "patah", "tem"],
    ["2fp", "2nd fem. plural", "patah", "ten"],
    ["1cp", "1st common plural", "patah", "nu"],
  ];
  const slots = [
    slot("v2", "Vowel under the second root letter", vowels(["tsere", "patah", "shewa", "qamets"])),
    slot("end", "Ending", PF_END),
  ];
  if (!passive) slots.unshift(slot("v1", "Vowel under the first root letter", vowels(["hireq", "tsere", "qibbuts", "patah"])));
  else slots.unshift(slot("v1", "Vowel under the first root letter", vowels(["qibbuts", "hireq", "holem", "patah"])));
  return {
    slots,
    cells: rows.map(([id, label, v2, end]) => seed(id, label, passive ? "Qibbuts and the doubled middle is Pual." : "Hireq and tsere, with dagesh in the middle letter, is Piel perfect. A consonant ending shortens tsere to patah.", { v1, v2, end })),
    render: (r, picks) => renderPielPf(r, picks, false),
    blurb: passive
      ? "Pual perfect. Same doubling as Piel. Qibbuts under the first letter makes it passive."
      : "Piel perfect. Dagesh in the middle letter. Tsere in 3ms; patah before a consonant ending.",
  };
}

function renderPielImpf(root: VerbRoot, picks: Record<string, string>): string {
  const pre = PRE_MARK[picks.pre ?? ""] ?? "";
  const A = M(root, 0, vowelChar(picks.v1), false);
  const B = M(root, 1, vowelChar(picks.v2), doubled(root, "c2"));
  const end = endTail(picks.end);
  return pre + A + B + M(root, 2, end.c3, false, end.final) + end.tail;
}

function pielImpf(root: VerbRoot, passive: boolean, wayy: boolean): Engine {
  const v1 = passive ? "qibbuts" : "patah";
  const people: [string, string, string, boolean][] = [
    ["3ms", "3rd masc. sing.", wayy ? "wys" : "ys", false],
    ["3fs", "3rd fem. sing.", wayy ? "wts" : "ts", false],
    ["2ms", "2nd masc. sing.", wayy ? "wts" : "ts", false],
    ["2fs", "2nd fem. sing.", wayy ? "wts" : "ts", true],
    ["1cs", "1st common sing.", wayy ? "wah" : "ah", false],
    ["3mp", "3rd masc. plural", wayy ? "wys" : "ys", true],
    ["2mp", "2nd masc. plural", wayy ? "wts" : "ts", true],
    ["1cp", "1st common plural", wayy ? "wns" : "ns", false],
  ];
  if (!passive) {
    people.push(
      ["3fp", "3rd fem. plural", wayy ? "wts" : "ts", false],
      ["2fp", "2nd fem. plural", wayy ? "wts" : "ts", false],
    );
  }
  return {
    slots: [
      slot("pre", "Prefix", person(wayy ? "wayy-piel" : "piel")),
      slot("v1", "Vowel under the first root letter", vowels(passive ? ["qibbuts", "patah", "hireq"] : ["patah", "qibbuts", "hireq", "shewa"])),
      slot("v2", "Vowel under the second root letter", vowels(["tsere", "shewa", "patah"])),
      slot("end", "Ending", IMPF_END),
    ],
    cells: people.map(([id, label, pre, reduced]) => seed(id, label, "Shewa under the prefix. The middle letter stays doubled.", {
      pre, v1, v2: id.endsWith("fp") ? "tsere" : reduced ? "shewa" : passive ? "patah" : "tsere", end: id.endsWith("fp") ? "nah" : id === "2fs" ? "iy" : reduced ? "u" : "none",
    })),
    render: renderPielImpf,
    blurb: wayy
      ? "Piel wayyiqtol. Vav with patah, shewa on the yod, no dagesh in that yod."
      : passive
        ? "Pual imperfect. Shewa on the prefix, then qibbuts, and the middle letter doubled."
        : "Piel imperfect. Shewa on the prefix, patah under the first letter, dagesh in the second.",
  };
}

function pielImpv(root: VerbRoot): Engine {
  const rows: [string, string, string, string][] = [
    ["ms", "masc. sing.", "tsere", "none"],
    ["fs", "fem. sing.", "shewa", "iy"],
    ["mp", "masc. plural", "shewa", "u"],
    ["fp", "fem. plural", "tsere", "nah"],
  ];
  return {
    slots: [
      slot("v2", "Vowel under the second root letter", vowels(["tsere", "shewa", "patah"])),
      slot("end", "Ending", IMPF_END),
    ],
    cells: rows.map(([id, label, v2, end]) => seed(id, label, "No prefix. Patah under the first letter, dagesh in the second.", { v2, end })),
    render: (r, picks) => {
      const A = M(r, 0, V.patah, lene(r.letters[0], false));
      const B = M(r, 1, vowelChar(picks.v2), doubled(r, "c2"));
      const end = endTail(picks.end);
      return A + B + M(r, 2, end.c3, false, end.final) + end.tail;
    },
    blurb: "Piel imperative. Patah, dagesh, tsere. A vowel ending reduces the tsere.",
  };
}

function stemMiddle(root: VerbRoot, picks: Record<string, string>, dagesh: boolean): string {
  if (picks.stem === "iy") return M(root, 1, V.hireq, dagesh) + "י";
  return M(root, 1, vowelChar(picks.stem), dagesh);
}

function renderHiphilPf(root: VerbRoot, picks: Record<string, string>): string {
  const preV = picks.pref === "he" ? V.segol : picks.pref === "hu" ? V.qibbuts : V.hireq;
  const pre = mark("ה", preV);
  const c1 = vowelChar(picks.c1);
  const A = M(root, 0, c1, false);
  const bDag = picks.c1 === "shewa" && lene(root.letters[1], false);
  const B = stemMiddle(root, picks, bDag);
  const end = endTail(picks.end);
  return pre + A + B + M(root, 2, end.c3, false, end.final) + end.tail;
}

function hiphilPerfect(root: VerbRoot, guttural: boolean): Engine {
  const pref = guttural ? "he" : "hi";
  const c1 = guttural ? "hatefS" : "shewa";
  const rows: [string, string, string, string][] = [
    ["3ms", "3rd masc. sing.", "iy", "none"],
    ["3fs", "3rd fem. sing.", "iy", "ah"],
    ["2ms", "2nd masc. sing.", "patah", "ta"],
    ["2fs", "2nd fem. sing.", "patah", "tf"],
    ["1cs", "1st common sing.", "patah", "ti"],
    ["3cp", "3rd common plural", "iy", "u"],
    ["2mp", "2nd masc. plural", "patah", "tem"],
    ["1cp", "1st common plural", "patah", "nu"],
  ];
  return {
    slots: [
      slot("pref", "Vowel on the he prefix", [
        { id: "hi", label: "hireq", mark: mark("ה", V.hireq) },
        { id: "he", label: "segol", mark: mark("ה", V.segol) },
        { id: "hu", label: "qibbuts", mark: mark("ה", V.qibbuts) },
      ]),
      slot("c1", "Vowel under the first root letter", vowels(guttural ? ["hatefS", "hatef", "shewa"] : ["shewa", "hatef", "patah"])),
      slot("stem", "Stem vowel", vowels(["iy", "patah", "tsere", "shewa"])),
      slot("end", "Ending", PF_END),
    ],
    cells: rows.map(([id, label, stemV, end]) => seed(id, label, guttural ? "I-guttural Hiphil perfect prefers segol and hatef segol." : "Hireq on the he, and hireq-yod. A consonant ending shortens that vowel to patah.", { pref, c1, stem: stemV, end })),
    render: renderHiphilPf,
    blurb: guttural
      ? "Hiphil perfect of an I-guttural. Segol on the he, hatef segol under the guttural."
      : "Hiphil perfect. He with hireq, and an i-vowel in the stem.",
  };
}

function renderHiphilImpf(root: VerbRoot, picks: Record<string, string>, guttural: boolean): string {
  const pre = PRE_MARK[picks.pre ?? ""] ?? "";
  const c1v = guttural ? vowelChar(picks.c1) : V.shewa;
  const A = M(root, 0, c1v, false);
  const bDag = !guttural && lene(root.letters[1], false);
  const B = stemMiddle(root, picks, bDag);
  const end = endTail(picks.end);
  return pre + A + B + M(root, 2, end.c3, false, end.final) + end.tail;
}

function hiphilImpf(root: VerbRoot, guttural: boolean, wayy: boolean): Engine {
  const short = wayy;
  const people: [string, string, string][] = [
    ["3ms", "3rd masc. sing.", wayy ? "wya" : "ya"],
    ["3fs", "3rd fem. sing.", wayy ? "wta" : "ta"],
    ["2ms", "2nd masc. sing.", wayy ? "wta" : "ta"],
    ["2fs", "2nd fem. sing.", wayy ? "wta" : "ta"],
    ["1cs", "1st common sing.", wayy ? "waa" : "aa"],
    ["3mp", "3rd masc. plural", wayy ? "wya" : "ya"],
    ["3fp", "3rd fem. plural", wayy ? "wta" : "ta"],
    ["2mp", "2nd masc. plural", wayy ? "wta" : "ta"],
    ["2fp", "2nd fem. plural", wayy ? "wta" : "ta"],
    ["1cp", "1st common plural", wayy ? "wna" : "na"],
  ];
  const pres: Opt[] = wayy
    ? [
        { id: "wya", label: "vav patah, yod patah", mark: mark("ו", V.patah) + mark("י", V.patah, true) },
        { id: "wta", label: "vav patah, tav patah", mark: mark("ו", V.patah) + mark("ת", V.patah, true) },
        { id: "waa", label: "vav qamets, alef patah", mark: mark("ו", V.qamets) + mark("א", V.patah) },
        { id: "wna", label: "vav patah, nun patah", mark: mark("ו", V.patah) + mark("נ", V.patah, true) },
      ]
    : [
        { id: "ya", label: "yod patah", mark: mark("י", V.patah) },
        { id: "ta", label: "tav patah", mark: mark("ת", V.patah) },
        { id: "aa", label: "alef patah", mark: mark("א", V.patah) },
        { id: "na", label: "nun patah", mark: mark("נ", V.patah) },
      ];
  PRE_MARK.ya = mark("י", V.patah);
  PRE_MARK.ta = mark("ת", V.patah);
  PRE_MARK.aa = mark("א", V.patah);
  PRE_MARK.na = mark("נ", V.patah);
  PRE_MARK.wya = mark("ו", V.patah) + mark("י", V.patah, true);
  PRE_MARK.wta = mark("ו", V.patah) + mark("ת", V.patah, true);
  PRE_MARK.waa = mark("ו", V.qamets) + mark("א", V.patah);
  PRE_MARK.wna = mark("ו", V.patah) + mark("נ", V.patah, true);
  return {
    slots: [
      slot("pre", "Prefix", pres),
      ...(guttural ? [slot("c1", "Vowel under the guttural", vowels(["hatef", "hatefS", "shewa"]))] : []),
      slot("stem", "Stem vowel", vowels(["iy", "tsere", "patah"])),
      slot("end", "Ending", IMPF_END),
    ],
    cells: people.map(([id, label, pre]) => {
      const reducedEnding = id === "2fs" ? "iy" : id.endsWith("mp") ? "u" : id.endsWith("fp") ? "nah" : "none";
      const stemV = reducedEnding === "nah" || (short && reducedEnding === "none") ? "tsere" : "iy";
      const answer: Record<string, string> = { pre, stem: stemV, end: reducedEnding };
      if (guttural) answer.c1 = "hatef";
      return seed(id, label, short ? "The singular wayyiqtol shortens hireq-yod to tsere." : "Patah on the prefix. The he of the perfect is gone.", answer);
    }),
    render: (r, picks) => renderHiphilImpf(r, picks, guttural),
    blurb: short
      ? "Hiphil wayyiqtol. Patah on the prefix, and tsere in the unsuffixed singular."
      : "Hiphil imperfect. Patah under the prefix, hireq-yod in the stem.",
  };
}

function hiphilImpv(root: VerbRoot): Engine {
  const rows: [string, string, string, string][] = [
    ["ms", "masc. sing.", "tsere", "none"],
    ["fs", "fem. sing.", "iy", "iy"],
    ["mp", "masc. plural", "iy", "u"],
  ];
  return {
    slots: [
      slot("stem", "Stem vowel", vowels(["tsere", "iy", "patah"])),
      slot("end", "Ending", IMPF_END),
    ],
    cells: rows.map(([id, label, stemV, end]) => seed(id, label, "He with patah. Tsere in the masculine singular; hireq-yod before a vowel ending.", { stem: stemV, end })),
    render: (r, picks) => {
      const A = M(r, 0, V.shewa, false);
      const bDag = lene(r.letters[1], false);
      return mark("ה", V.patah) + A + stemMiddle(r, picks, bDag) + (() => {
        const end = endTail(picks.stem === "iy" && picks.end === "none" ? "none" : picks.end);
        if (picks.stem === "iy" && (!picks.end || picks.end === "none")) return M(r, 2, "", false, true);
        return M(r, 2, end.c3, false, end.final) + end.tail;
      })();
    },
    blurb: "Hiphil imperative. He with patah. Tsere, not hireq-yod, in the masculine singular.",
  };
}

function hiphilInfc(root: VerbRoot): Engine {
  return {
    slots: [slot("stem", "Stem vowel", vowels(["iy", "tsere", "holem"]))],
    cells: [seed("cst", "infinitive construct", "He with patah, then hireq-yod.", { stem: "iy" })],
    render: (r, picks) => mark("ה", V.patah) + M(r, 0, V.shewa) + stemMiddle(r, picks, lene(r.letters[1], false)) + M(r, 2, "", false, true),
    blurb: "Hiphil infinitive construct. He with patah, and hireq-yod.",
  };
}

function hiphilInfa(root: VerbRoot): Engine {
  return {
    slots: [slot("stem", "Stem vowel", vowels(["tsere", "iy"]))],
    cells: [seed("abs", "infinitive absolute", "He with patah, then tsere.", { stem: "tsere" })],
    render: (r, picks) => mark("ה", V.patah) + M(r, 0, V.shewa) + stemMiddle(r, picks, lene(r.letters[1], false)) + M(r, 2, "", false, true),
    blurb: "Hiphil infinitive absolute. He with patah, and tsere.",
  };
}

function hiphilPtc(root: VerbRoot): Engine {
  return {
    slots: [slot("shape", "Participle", [
      { id: "ms", label: "mem patah, hireq-yod", mark: mark("מ", V.patah) },
      { id: "mp", label: "mem patah, plural", mark: mark("מ", V.patah) + "ִים" },
    ])],
    cells: [
      seed("ms", "masc. sing.", "Mem with patah, hireq-yod.", { shape: "ms" }),
      seed("mp", "masc. plural", "Same stem, masculine plural ending.", { shape: "mp" }),
    ],
    render: (r, picks) => {
      const body = mark("מ", V.patah) + M(r, 0, V.shewa) + M(r, 1, V.hireq, lene(r.letters[1], false)) + "י";
      if (picks.shape === "mp") return body + M(r, 2, "") + "ים";
      return body + M(r, 2, "", false, true);
    },
    blurb: "Hiphil participle. Mem with patah, not shewa.",
  };
}

function hophalPerfect(root: VerbRoot): Engine {
  const rows: [string, string, string, string][] = [
    ["3ms", "3rd masc. sing.", "patah", "none"],
    ["3fs", "3rd fem. sing.", "shewa", "ah"],
    ["2ms", "2nd masc. sing.", "patah", "ta"],
    ["1cs", "1st common sing.", "patah", "ti"],
    ["3cp", "3rd common plural", "shewa", "u"],
    ["1cp", "1st common plural", "patah", "nu"],
  ];
  return {
    slots: [
      slot("pref", "Vowel on the he", [
        { id: "hu", label: "qibbuts", mark: mark("ה", V.qibbuts) },
        { id: "ho", label: "qamets hatuf", mark: mark("ה", V.qamets) },
      ]),
      slot("stem", "Stem vowel", vowels(["patah", "shewa", "iy"])),
      slot("end", "Ending", PF_END),
    ],
    cells: rows.map(([id, label, stemV, end]) => seed(id, label, "U-class Hophal. Patah in the stem, not an i-vowel.", { pref: "hu", stem: stemV, end })),
    render: (r, picks) => {
      const pre = mark("ה", picks.pref === "ho" ? V.qamets : V.qibbuts);
      const B = M(r, 1, vowelChar(picks.stem), lene(r.letters[1], false));
      const end = endTail(picks.end);
      return pre + M(r, 0, V.shewa) + B + M(r, 2, end.c3, false, end.final) + end.tail;
    },
    blurb: "Hophal perfect, u-class. Qibbuts on the he, patah in the stem. Hiphil would want an i-vowel.",
  };
}

function hophalImpf(root: VerbRoot): Engine {
  const people: [string, string, string][] = [
    ["3ms", "3rd masc. sing.", "yu"],
    ["3fs", "3rd fem. sing.", "tu"],
    ["1cs", "1st common sing.", "au"],
    ["3mp", "3rd masc. plural", "yu"],
    ["1cp", "1st common plural", "nu"],
  ];
  const pres: Opt[] = [
    { id: "yu", label: "yod qibbuts", mark: mark("י", V.qibbuts) },
    { id: "tu", label: "tav qibbuts", mark: mark("ת", V.qibbuts, true) },
    { id: "au", label: "alef qibbuts", mark: mark("א", V.qibbuts) },
    { id: "nu", label: "nun qibbuts", mark: mark("נ", V.qibbuts) },
  ];
  return {
    slots: [slot("pre", "Prefix", pres), slot("end", "Ending", IMPF_END)],
    cells: people.map(([id, label, pre]) => seed(id, label, "The u-vowel stays on the prefix.", { pre, end: id === "3mp" ? "u" : "none" })),
    render: (r, picks) => {
      const pre = pres.find((opt) => opt.id === picks.pre)?.mark ?? "";
      const end = endTail(picks.end);
      const B = M(r, 1, picks.end === "u" ? V.shewa : V.patah, lene(r.letters[1], false));
      return pre + M(r, 0, V.shewa) + B + M(r, 2, end.c3, false, end.final) + end.tail;
    },
    blurb: "Hophal imperfect. Qibbuts on the prefix, patah in the stem.",
  };
}

function hophalPtc(): Engine {
  return {
    slots: [slot("shape", "Participle", [{ id: "ms", label: "mem qibbuts, qamets", mark: mark("מ", V.qibbuts) }])],
    cells: [seed("ms", "masc. sing.", "Qibbuts on the mem, qamets in the stem.", { shape: "ms" })],
    render: (r) => mark("מ", V.qibbuts) + M(r, 0, V.shewa) + M(r, 1, V.qamets, lene(r.letters[1], false)) + M(r, 2, "", false, true),
    blurb: "Hophal participle. Qibbuts on the mem.",
  };
}

function hithOk(root: VerbRoot): boolean {
  const a = medial(root.letters[0]);
  return !isSibilant(a) && !isDental(a) && root.cls === "strong";
}

function hithSibilant(root: VerbRoot): boolean {
  return root.cls === "strong" && isSibilant(medial(root.letters[0]));
}

/** Tav trades places with a sibilant. Before zayin it is written dalet; before tsade, tet. */
function hithTav(root: VerbRoot): string {
  const a = medial(root.letters[0]);
  if (a === "ז") return "ד";
  if (a === "צ") return "ט";
  return "ת";
}

function renderHith(root: VerbRoot, picks: Record<string, string>, prefix: string): string {
  const A = M(root, 0, vowelChar(picks.v1) || V.patah, lene(root.letters[0], false));
  const B = M(root, 1, vowelChar(picks.v2), doubled(root, "c2"));
  const end = endTail(picks.end);
  return prefix + A + B + M(root, 2, end.c3, false, end.final) + end.tail;
}

function renderHithSib(root: VerbRoot, picks: Record<string, string>, head: string): string {
  const moved = M(root, 0, V.shewa);
  const tav = mark(hithTav(root), vowelChar(picks.v1) || V.patah);
  const B = M(root, 1, vowelChar(picks.v2), doubled(root, "c2"));
  const end = endTail(picks.end);
  return head + moved + tav + B + M(root, 2, end.c3, false, end.final) + end.tail;
}

function hithPerfect(root: VerbRoot): Engine {
  const rows: [string, string, string, string][] = [
    ["3ms", "3rd masc. sing.", "tsere", "none"],
    ["3fs", "3rd fem. sing.", "shewa", "ah"],
    ["2ms", "2nd masc. sing.", "patah", "ta"],
    ["2fs", "2nd fem. sing.", "patah", "tf"],
    ["1cs", "1st common sing.", "patah", "ti"],
    ["3cp", "3rd common plural", "shewa", "u"],
    ["1cp", "1st common plural", "patah", "nu"],
  ];
  const prefix = mark("ה", V.hireq) + mark("ת", V.shewa);
  return {
    slots: [
      slot("v1", "Vowel under the first root letter", vowels(["patah", "hireq", "qamets"])),
      slot("v2", "Vowel under the second root letter", vowels(["tsere", "patah", "shewa"])),
      slot("end", "Ending", PF_END),
    ],
    cells: rows.map(([id, label, v2, end]) => seed(id, label, "The הִתְ prefix names the stem. The middle letter is doubled.", { v1: "patah", v2, end })),
    render: (r, picks) => renderHith(r, picks, prefix),
    blurb: "Hithpael perfect. He, tav, shewa, then a Piel-like stem.",
  };
}

function hithImpf(root: VerbRoot): Engine {
  const people: [string, string, string][] = [
    ["3ms", "3rd masc. sing.", "yi"],
    ["3fs", "3rd fem. sing.", "ti"],
    ["2ms", "2nd masc. sing.", "ti"],
    ["2fs", "2nd fem. sing.", "ti"],
    ["1cs", "1st common sing.", "ee"],
    ["3mp", "3rd masc. plural", "yi"],
    ["3fp", "3rd fem. plural", "ti"],
    ["2mp", "2nd masc. plural", "ti"],
    ["2fp", "2nd fem. plural", "ti"],
    ["1cp", "1st common plural", "ni"],
  ];
  return {
    slots: [
      slot("pre", "Prefix", person("hireq")),
      slot("v2", "Vowel under the second root letter", vowels(["tsere", "shewa"])),
      slot("end", "Ending", IMPF_END),
    ],
    cells: people.map(([id, label, pre]) => seed(id, label, "Yod or tav with hireq, then tav shewa.", {
      pre, v2: id.endsWith("mp") || id === "2fs" ? "shewa" : "tsere", end: id === "2fs" ? "iy" : id.endsWith("mp") ? "u" : id.endsWith("fp") ? "nah" : "none",
    })),
    render: (r, picks) => renderHith(r, { ...picks, v1: "patah" }, (PRE_MARK[picks.pre ?? ""] ?? "") + mark("ת", V.shewa)),
    blurb: "Hithpael imperfect. The tav of הִתְ stays after the person prefix.",
  };
}

function hithPtc(): Engine {
  const prefix = mark("מ", V.hireq) + mark("ת", V.shewa);
  return {
    slots: [slot("shape", "Participle", [{ id: "ms", label: "mem hireq, tav", mark: prefix }])],
    cells: [seed("ms", "masc. sing.", "מִתְ, then the doubled stem.", { shape: "ms" })],
    render: (r) => renderHith(r, { v1: "patah", v2: "tsere", end: "none" }, prefix),
    blurb: "Hithpael participle. Mem hireq, tav, not the preposition min.",
  };
}

function hithSibPerfect(root: VerbRoot): Engine {
  const base = hithPerfect(root);
  const tav = hithTav(root) === "ת" ? "tav" : hithTav(root) === "ד" ? "dalet" : "tet";
  return {
    ...base,
    slots: [
      slot("v1", "Vowel under the moved tav", vowels(["patah", "hireq", "qamets"])),
      slot("v2", "Vowel under the second root letter", vowels(["tsere", "patah", "shewa"])),
      slot("end", "Ending", PF_END),
    ],
    render: (r, picks) => renderHithSib(r, picks, mark("ה", V.hireq)),
    blurb: `Hithpael perfect. The ${tav} trades places with the sibilant. The stem is still Hithpael.`,
  };
}

function hithSibImpf(root: VerbRoot): Engine {
  const base = hithImpf(root);
  return {
    ...base,
    slots: [
      slot("pre", "Prefix", person("hireq")),
      slot("v1", "Vowel under the moved tav", vowels(["patah", "shewa"])),
      slot("v2", "Vowel under the second root letter", vowels(["tsere", "shewa"])),
      slot("end", "Ending", IMPF_END),
    ],
    cells: base.cells.map((cell) => ({ ...cell, answer: { ...cell.answer, v1: "patah" } })),
    render: (r, picks) => renderHithSib(r, picks, PRE_MARK[picks.pre ?? ""] ?? ""),
    blurb: "Hithpael imperfect. The sibilant still stands before the tav.",
  };
}

function hithSibPtc(_root: VerbRoot): Engine {
  return {
    slots: [slot("shape", "Participle", [{ id: "ms", label: "mem hireq, metathesis", mark: mark("מ", V.hireq) }])],
    cells: [seed("ms", "masc. sing.", "Mem hireq, then the sibilant, then the tav.", { shape: "ms" })],
    render: (r) => renderHithSib(r, { v1: "patah", v2: "tsere", end: "none" }, mark("מ", V.hireq)),
    blurb: "Hithpael participle of a sibilant root. Metathesis stays.",
  };
}

function niphalPerfect(root: VerbRoot): Engine {
  const gutt = HATEF_LETTER.has(medial(root.letters[0]));
  const rows: [string, string, string, string, string, string][] = gutt
    ? [
        ["3ms", "3rd masc. sing.", "se", "hatefS", "patah", "none"],
        ["3fs", "3rd fem. sing.", "se", "segol", "shewa", "ah"],
        ["2ms", "2nd masc. sing.", "se", "hatefS", "patah", "ta"],
        ["1cs", "1st common sing.", "se", "hatefS", "patah", "ti"],
        ["3cp", "3rd common plural", "se", "segol", "shewa", "u"],
        ["1cp", "1st common plural", "se", "hatefS", "patah", "nu"],
      ]
    : [
        ["3ms", "3rd masc. sing.", "ni", "shewa", "patah", "none"],
        ["3fs", "3rd fem. sing.", "ni", "shewa", "shewa", "ah"],
        ["2ms", "2nd masc. sing.", "ni", "shewa", "patah", "ta"],
        ["2fs", "2nd fem. sing.", "ni", "shewa", "patah", "tf"],
        ["1cs", "1st common sing.", "ni", "shewa", "patah", "ti"],
        ["3cp", "3rd common plural", "ni", "shewa", "shewa", "u"],
        ["2mp", "2nd masc. plural", "ni", "shewa", "patah", "tem"],
        ["1cp", "1st common plural", "ni", "shewa", "patah", "nu"],
      ];
  return {
    slots: [
      slot("pref", "Nun prefix", [
        { id: "ni", label: "nun hireq", mark: mark("נ", V.hireq) },
        { id: "se", label: "nun segol", mark: mark("נ", V.segol) },
      ]),
      slot("v1", "Vowel under the first root letter", vowels(gutt ? ["hatefS", "segol", "shewa", "hatef"] : ["shewa", "hatef", "patah"])),
      slot("v2", "Vowel under the second root letter", vowels(["patah", "shewa", "qamets"])),
      slot("end", "Ending", PF_END),
    ],
    cells: rows.map(([id, label, pref, v1, v2, end]) => seed(id, label, "Niphal perfect opens with nun.", { pref, v1, v2, end })),
    render: (r, picks) => {
      const pre = picks.pref === "se" ? mark("נ", V.segol) : mark("נ", V.hireq);
      const A = M(r, 0, vowelChar(picks.v1), false);
      const B = M(r, 1, vowelChar(picks.v2), false);
      const end = endTail(picks.end);
      return pre + A + B + M(r, 2, end.c3, false, end.final) + end.tail;
    },
    blurb: gutturalNote(gutt, "Niphal perfect. Nun with hireq, then shewa and patah."),
  };
}

function gutturalNote(gutt: boolean, plain: string): string {
  return gutt ? "I-guttural Niphal. Segol on the nun, hatef segol under the guttural." : plain;
}

function niphalImpf(root: VerbRoot, wayy: boolean): Engine {
  const gutt = HATEF_LETTER.has(medial(root.letters[0]));
  if (gutt) {
    return {
      slots: [slot("pre", "Prefix", [{ id: "ye", label: "yod tsere", mark: mark("י", V.tsere) }, { id: "te", label: "tav tsere", mark: mark("ת", V.tsere, true) }])],
      cells: [
        seed("3ms", "3rd masc. sing.", "Tsere prefix, qamets under the guttural, tsere in the stem.", { pre: "ye" }),
        seed("2ms", "2nd masc. sing.", "Same stem. Tav for you or she.", { pre: "te" }),
      ],
      render: (r, picks) => (picks.pre === "te" ? mark("ת", V.tsere, true) : mark("י", V.tsere)) + M(r, 0, V.qamets) + M(r, 1, V.tsere) + M(r, 2, "", false, true),
      blurb: "I-guttural Niphal imperfect. The nun has assimilated, but a guttural takes no dagesh.",
    };
  }
  const people: [string, string, string, boolean][] = [
    ["3ms", "3rd masc. sing.", wayy ? "wyi" : "yi", false],
    ["3fs", "3rd fem. sing.", wayy ? "wti" : "ti", false],
    ["2ms", "2nd masc. sing.", wayy ? "wti" : "ti", false],
    ["2fs", "2nd fem. sing.", wayy ? "wti" : "ti", true],
    ["1cs", "1st common sing.", wayy ? "wee" : "ee", false],
    ["3mp", "3rd masc. plural", wayy ? "wyi" : "yi", true],
    ["3fp", "3rd fem. plural", wayy ? "wti" : "ti", false],
    ["2mp", "2nd masc. plural", wayy ? "wti" : "ti", true],
    ["2fp", "2nd fem. plural", wayy ? "wti" : "ti", false],
    ["1cp", "1st common plural", wayy ? "wni" : "ni", false],
  ];
  return {
    slots: [
      slot("pre", "Prefix", person(wayy ? "wayy-hireq" : "hireq")),
      slot("v2", "Vowel under the second root letter", vowels(["tsere", "shewa", "qamets", "patah"])),
      slot("end", "Ending", IMPF_END),
    ],
    cells: people.map(([id, label, pre, reduced]) => seed(id, label, "Dagesh in the first root letter is the nun that assimilated.", {
      pre, v2: id.endsWith("fp") ? "patah" : reduced ? "shewa" : "tsere", end: id === "2fs" ? "iy" : id.endsWith("fp") ? "nah" : reduced ? "u" : "none",
    })),
    render: (r, picks) => {
      const pre = PRE_MARK[picks.pre ?? ""] ?? "";
      const A = M(r, 0, V.qamets, canForte(r.letters[0]));
      const B = M(r, 1, vowelChar(picks.v2), false);
      const end = endTail(picks.end);
      return pre + A + B + M(r, 2, end.c3, false, end.final) + end.tail;
    },
    blurb: wayy ? "Niphal wayyiqtol. The assimilated nun is the dagesh in the first root letter." : "Niphal imperfect. The nun is gone. Dagesh and qamets remain.",
  };
}

function niphalImpv(root: VerbRoot): Engine {
  return {
    slots: [
      slot("v2", "Vowel under the second root letter", vowels(["tsere", "shewa"])),
      slot("end", "Ending", IMPF_END),
    ],
    cells: [
      seed("ms", "masc. sing.", "He hireq, qamets and dagesh, tsere.", { v2: "tsere", end: "none" }),
      seed("fs", "fem. sing.", "The theme vowel reduces.", { v2: "shewa", end: "iy" }),
      seed("mp", "masc. plural", "The theme vowel reduces.", { v2: "shewa", end: "u" }),
    ],
    render: (r, picks) => {
      const A = M(r, 0, V.qamets, canForte(r.letters[0]));
      const B = M(r, 1, vowelChar(picks.v2), false);
      const end = endTail(picks.end);
      return mark("ה", V.hireq) + A + B + M(r, 2, end.c3, false, end.final) + end.tail;
    },
    blurb: "Niphal imperative. He with hireq, and the dagesh of the assimilated nun.",
  };
}

function niphalPtc(root: VerbRoot): Engine {
  return {
    slots: [slot("end", "Ending", [
      { id: "none", label: "masculine singular", mark: "—" },
      { id: "ah", label: "feminine singular", mark: CIRC + V.qamets + "ה" },
      { id: "im", label: "masculine plural", mark: "ִים" },
    ])],
    cells: [
      seed("ms", "masc. sing.", "Nun hireq, qamets in the stem.", { end: "none" }),
      seed("fs", "fem. sing.", "Feminine singular.", { end: "ah" }),
      seed("mp", "masc. plural", "Masculine plural.", { end: "im" }),
    ],
    render: (r, picks) => {
      const stem = mark("נ", V.hireq) + M(r, 0, V.shewa) + M(r, 1, V.qamets);
      if (picks.end === "ah") return stem + M(r, 2, V.qamets) + "ה";
      if (picks.end === "im") return stem + M(r, 2, V.hireq) + "ים";
      return stem + M(r, 2, "", false, true);
    },
    blurb: "Niphal participle. Nun with hireq, qamets under the second letter.",
  };
}

function strongLike(root: VerbRoot): boolean {
  return root.cls === "strong" || root.cls === "assim" || root.cls === "I-gutt" || root.cls === "I-aleph" || root.cls === "II-gutt" || root.cls === "III-gutt";
}

function buildEngine(root: VerbRoot, stem: StemId, conj: ConjId): Engine | null {
  if (root.id === "barak" && (stem === "piel" || stem === "pual")) return barak(root, stem, conj);
  if (root.id === "halak" && stem === "qal" && (conj === "imperfect" || conj === "wayyiqtol" || conj === "imperative")) return halak(conj);
  if (root.id === "natan" && stem === "qal") return natan(conj);
  if (root.id === "hayah" && stem === "qal") return hayah(conj);
  if (root.cls === "III-he" && stem === "qal") return iiiHe(root, conj);
  if (root.cls === "III-aleph" && stem === "qal" && (conj === "perfect" || conj === "imperfect")) return iiiAlef(root, conj);
  if (root.cls === "I-aleph" && stem === "qal" && (conj === "imperfect" || conj === "wayyiqtol" || conj === "imperative")) return iAlef(root, conj);
  if (root.cls === "I-nun" && stem === "qal" && (conj === "imperfect" || conj === "wayyiqtol" || conj === "imperative")) return iNun(root, conj);
  if (root.cls === "I-yod" && stem === "qal" && (conj === "imperfect" || conj === "wayyiqtol" || conj === "imperative")) return iYod(root, conj);
  if (root.id === "yatsa" && stem === "qal" && conj === "perfect") return iiiAlef(root, "perfect");
  if ((root.cls === "I-nun" || root.cls === "I-yod") && stem === "qal" && root.id !== "natan") {
    if (conj === "perfect") return qalPerfect(root);
    if (conj === "participle") return qalPtc(root);
    if (conj === "inf-abs") return qalInfa(root);
  }
  if (root.cls === "I-yod" && root.id === "yatsa" && stem === "hiphil") return yatsaHiphil(conj);
  if (root.cls === "I-yod" && root.id === "yarad" && stem === "hophal") return yaradHophal(conj);
  if (root.cls === "hollow" && (stem === "qal" || (stem === "hiphil" && root.hollow === "u"))) return hollow(root, stem, conj);
  if (root.cls === "geminate" && stem === "qal") return geminate(root, conj);
  if (root.cls === "I-gutt" && stem === "hiphil") return hiphilGutt(conj);
  if (root.cls === "I-gutt" && stem === "niphal" && (conj === "perfect" || conj === "imperfect")) return conj === "perfect" ? niphalPerfect(root) : niphalImpf(root, false);

  const qalFamily = root.cls === "I-gutt" || root.cls === "I-aleph" ? "igutt" : "strong";
  const theme = root.cls === "III-gutt" ? "patah" : "holem";
  if (stem === "qal" && strongLike(root) && root.cls !== "III-he" && root.cls !== "III-aleph") {
    if (conj === "perfect") return qalPerfect(root);
    if (conj === "imperfect" && root.cls !== "I-nun" && root.cls !== "I-yod" && root.cls !== "I-aleph") return qalImpf(root, theme, root.cls === "I-gutt" ? "igutt" : "strong");
    if (conj === "wayyiqtol" && root.cls !== "I-nun" && root.cls !== "I-yod" && root.cls !== "I-aleph") return qalWayy(root, theme, qalFamily === "igutt" && root.cls === "I-gutt" ? "igutt" : "strong");
    if (conj === "jussive" && (root.cls === "strong" || root.cls === "III-gutt")) return qalJussive(root, theme, "strong");
    if (conj === "cohortative" && root.cls === "strong") return qalCohort(root);
    if (conj === "imperative" && root.cls !== "I-aleph") return qalImpv(root, theme);
    if (conj === "inf-const" && root.cls !== "III-gutt") return qalInfc(root);
    if (conj === "inf-abs") return qalInfa(root);
    if (conj === "participle") return qalPtc(root);
  }
  if (root.cls === "III-gutt" && stem === "qal" && conj === "inf-const") return qalInfc(root);
  if (stem === "niphal" && root.cls === "strong") {
    if (conj === "perfect") return niphalPerfect(root);
    if (conj === "imperfect") return niphalImpf(root, false);
    if (conj === "wayyiqtol") return niphalImpf(root, true);
    if (conj === "imperative" || conj === "inf-const") return conj === "inf-const" ? { ...niphalImpv(root), cells: [niphalImpv(root).cells[0]], blurb: "Niphal infinitive construct. Same shape as the masculine imperative." } : niphalImpv(root);
    if (conj === "participle") return niphalPtc(root);
  }
  if ((stem === "piel" || stem === "pual") && root.cls === "strong" && doubled(root, "c2")) {
    if (conj === "perfect") return pielPerfect(root, stem === "pual");
    if (conj === "imperfect") return pielImpf(root, stem === "pual", false);
    if (conj === "wayyiqtol" && stem === "piel") return pielImpf(root, false, true);
    if (conj === "imperative" && stem === "piel") return pielImpv(root);
    if (conj === "inf-const" && stem === "piel") return { ...pielImpv(root), cells: [pielImpv(root).cells[0]], blurb: "Piel infinitive construct. Patah, dagesh, tsere." };
    if (conj === "participle") return stem === "pual" ? pualPtc() : pielPtc();
  }
  if (stem === "hiphil" && root.cls === "strong") {
    if (conj === "perfect") return hiphilPerfect(root, false);
    if (conj === "imperfect") return hiphilImpf(root, false, false);
    if (conj === "wayyiqtol") return hiphilImpf(root, false, true);
    if (conj === "imperative") return hiphilImpv(root);
    if (conj === "inf-const") return hiphilInfc(root);
    if (conj === "inf-abs") return hiphilInfa(root);
    if (conj === "participle") return hiphilPtc(root);
  }
  if (stem === "hophal" && root.cls === "strong") {
    if (conj === "perfect") return hophalPerfect(root);
    if (conj === "imperfect") return hophalImpf(root);
    if (conj === "participle") return hophalPtc();
  }
  if (stem === "hithpael" && hithOk(root)) {
    if (conj === "perfect") return hithPerfect(root);
    if (conj === "imperfect") return hithImpf(root);
    if (conj === "imperative") return { ...hithPerfect(root), cells: [hithPerfect(root).cells[0]], blurb: "Hithpael imperative. Same הִתְ prefix as the perfect, masculine singular." };
    if (conj === "participle") return hithPtc();
  }
  if (stem === "hithpael" && hithSibilant(root)) {
    if (conj === "perfect") return hithSibPerfect(root);
    if (conj === "imperfect") return hithSibImpf(root);
    if (conj === "imperative") return { ...hithSibPerfect(root), cells: [hithSibPerfect(root).cells[0]], blurb: "Hithpael imperative. Same metathesis as the perfect, masculine singular." };
    if (conj === "participle") return hithSibPtc(root);
  }
  return null;
}

function pielPtc(): Engine {
  return {
    slots: [slot("shape", "Participle", [{ id: "ms", label: "mem shewa, patah, tsere", mark: mark("מ", V.shewa) }])],
    cells: [seed("ms", "masc. sing.", "Mem shewa. Do not confuse it with the Hiphil mem patah.", { shape: "ms" })],
    render: (r) => mark("מ", V.shewa) + M(r, 0, V.patah) + M(r, 1, V.tsere, doubled(r, "c2")) + M(r, 2, "", false, true),
    blurb: "Piel participle. Shewa on the mem, dagesh in the middle.",
  };
}

function pualPtc(): Engine {
  return {
    slots: [slot("shape", "Participle", [{ id: "ms", label: "mem shewa, qibbuts, qamets", mark: mark("מ", V.shewa) }])],
    cells: [seed("ms", "masc. sing.", "Qibbuts where Piel would have patah.", { shape: "ms" })],
    render: (r) => mark("מ", V.shewa) + M(r, 0, V.qibbuts) + M(r, 1, V.qamets, doubled(r, "c2")) + M(r, 2, "", false, true),
    blurb: "Pual participle. Shewa on the mem, qibbuts, dagesh, qamets.",
  };
}

function barak(root: VerbRoot, stem: StemId, conj: ConjId): Engine | null {
  if (stem === "piel" && conj === "wayyiqtol") {
    return {
      slots: [slot("shape", "Form", [{ id: "ms", label: "vav, yod shewa, qamets, tsere", mark: "וַיְבָרֶךְ" }])],
      cells: [seed("3ms", "3rd masc. sing.", "Resh refuses the dagesh. The patah lengthens to qamets. The stem is still Piel.", { shape: "ms" })],
      render: () => mark("ו", V.patah) + mark("י", V.shewa) + mark("ב", V.qamets) + mark("ר", V.tsere) + mark("כ", "", false, "", true),
      blurb: "Piel wayyiqtol of ברך. No dagesh in the resh, and no dagesh in the yod.",
    };
  }
  if (stem === "piel" && conj === "perfect") {
    return {
      slots: [slot("shape", "3rd masc. sing.", [{ id: "ms", label: "tsere, patah", mark: "בֵּרַךְ" }])],
      cells: [seed("3ms", "3rd masc. sing.", "Hireq lengthens to tsere before resh.", { shape: "ms" })],
      render: () => mark("ב", V.tsere, true) + mark("ר", V.patah) + mark("כ", "", false, "", true),
      blurb: "Piel perfect of ברך. Compensatory tsere. The dagesh is missing because of resh.",
    };
  }
  if (stem === "pual" && conj === "participle") {
    return {
      slots: [slot("shape", "Participle", [{ id: "ms", label: "mem shewa, holem, qamets", mark: "מְבֹרָךְ" }])],
      cells: [seed("ms", "masc. sing.", "Qibbuts lengthens to holem before resh. Still Pual.", { shape: "ms" })],
      render: () => mark("מ", V.shewa) + mark("ב", V.holem) + mark("ר", V.qamets) + mark("כ", "", false, "", true),
      blurb: "Pual participle of ברך. The lengthened holem is the qibbuts that resh would not hold.",
    };
  }
  return null;
}

function halak(conj: ConjId): Engine | null {
  if (conj === "imperfect") {
    return {
      slots: [slot("pre", "Prefix", person("iyod")), slot("end", "Ending", IMPF_END)],
      cells: [
        seed("3ms", "3rd masc. sing.", "The he drops. Tsere, like an I-yod.", { pre: "ye", end: "none" }),
        seed("2ms", "2nd masc. sing.", "Tav with tsere.", { pre: "te", end: "none" }),
        seed("1cs", "1st common sing.", "Alef with tsere.", { pre: "ae", end: "none" }),
        seed("3mp", "3rd masc. plural", "The plural ending reduces the stem.", { pre: "ye", end: "u" }),
        seed("1cp", "1st common plural", "Nun with tsere.", { pre: "ne", end: "none" }),
      ],
      render: (_r, picks) => {
        const pre = PRE_MARK[picks.pre ?? ""] ?? "";
        if (picks.end === "u") return pre + mark("ל", V.shewa) + mark("כ", "") + SHUREQ;
        return pre + mark("ל", V.tsere) + mark("ך", "", false, "", true);
      },
      blurb: "הלך in the imperfect drops the he. It looks like an I-yod.",
    };
  }
  if (conj === "wayyiqtol") {
    return {
      slots: [slot("pre", "Prefix", person("wayy-iyod"))],
      cells: [seed("3ms", "3rd masc. sing.", "Short wayyiqtol. Segol, not tsere.", { pre: "wye" })],
      render: () => mark("ו", V.patah) + mark("י", V.tsere, true) + mark("ל", V.segol) + mark("ך", "", false, "", true),
      blurb: "Wayyiqtol of הלך. And he went.",
    };
  }
  if (conj === "imperative") {
    return {
      slots: [slot("shape", "Command", [
        { id: "ms", label: "masc. sing.", mark: "לֵךְ" },
        { id: "fs", label: "fem. sing.", mark: "לְכִי" },
        { id: "mp", label: "masc. plural", mark: "לְכוּ" },
      ])],
      cells: [
        seed("ms", "masc. sing.", "The he is gone.", { shape: "ms" }),
        seed("fs", "fem. sing.", "Hireq yod.", { shape: "fs" }),
        seed("mp", "masc. plural", "Shureq.", { shape: "mp" }),
      ],
      render: (_r, picks) => {
        if (picks.shape === "fs") return mark("ל", V.shewa) + mark("כ", V.hireq) + "י";
        if (picks.shape === "mp") return mark("ל", V.shewa) + mark("כ", "") + SHUREQ;
        return mark("ל", V.tsere) + mark("ך", "", false, "", true);
      },
      blurb: "Imperative of הלך. Go. The he does not appear.",
    };
  }
  return null;
}

function natan(conj: ConjId): Engine | null {
  if (conj === "perfect") {
    return {
      slots: [
        slot("v1", "Vowel under the first root letter", vowels(["qamets", "shewa"])),
        slot("end", "Ending", PF_END),
        slot("merge", "Same letter in the root and the ending", MERGE),
      ],
      cells: [
        seed("3ms", "3rd masc. sing.", "Citation.", { v1: "qamets", end: "none", merge: "no" }),
        seed("3fs", "3rd fem. sing.", "The second vowel reduces.", { v1: "qamets", end: "ah", merge: "no" }),
        seed("2ms", "2nd masc. sing.", "Tav and tav are written once.", { v1: "qamets", end: "ta", merge: "yes" }),
        seed("1cs", "1st common sing.", "Tav and tav are written once.", { v1: "qamets", end: "ti", merge: "yes" }),
        seed("3cp", "3rd common plural", "Shureq.", { v1: "qamets", end: "u", merge: "no" }),
        seed("2mp", "2nd masc. plural", "Heavy ending, and the tav is written once.", { v1: "shewa", end: "tem", merge: "yes" }),
        seed("1cp", "1st common plural", "Nun and nun are written once.", { v1: "qamets", end: "nu", merge: "yes" }),
      ],
      render: (r, picks) => {
        const A = M(r, 0, vowelChar(picks.v1), lene(r.letters[0], false));
        const B = M(r, 1, picks.end === "ah" || picks.end === "u" ? V.shewa : V.patah);
        if (picks.merge === "yes" && picks.end === "nu") return A + B + M(r, 2, "", true) + SHUREQ;
        if (picks.merge === "yes") {
          const on: Record<string, string> = { ta: V.qamets, ti: V.hireq + "י", tem: V.segol + "ם" };
          return A + B + mark("ת", on[picks.end ?? ""] ?? "", true);
        }
        const end = endTail(picks.end);
        return A + B + M(r, 2, end.c3, false, end.final) + end.tail;
      },
      blurb: "נתן perfect. Tav endings and the nun of “we” are written once, with a dagesh.",
    };
  }
  if (conj === "imperfect") {
    return {
      slots: [slot("pre", "Prefix", person("hireq")), slot("end", "Ending", IMPF_END)],
      cells: [
        seed("3ms", "3rd masc. sing.", "The nun drops. Tsere, and dagesh in the tav.", { pre: "yi", end: "none" }),
        seed("2ms", "2nd masc. sing.", "Tav prefix, same stem.", { pre: "ti", end: "none" }),
        seed("1cs", "1st common sing.", "Alef with segol.", { pre: "ee", end: "none" }),
        seed("3mp", "3rd masc. plural", "Shureq.", { pre: "yi", end: "u" }),
        seed("1cp", "1st common plural", "Nun prefix. This nun is “we,” not the root.", { pre: "ni", end: "none" }),
      ],
      render: (r, picks) => {
        const pre = PRE_MARK[picks.pre ?? ""] ?? "";
        const end = endTail(picks.end);
        return pre + M(r, 1, picks.end === "u" ? V.shewa : V.tsere, true) + M(r, 2, end.c3, false, end.final && picks.end !== "u") + end.tail;
      },
      blurb: "נתן imperfect. The first nun drops and leaves a dagesh. The vowel is tsere.",
    };
  }
  if (conj === "imperative") {
    return {
      slots: [slot("shape", "Command", [{ id: "ms", label: "masc. sing.", mark: "תֵּן" }])],
      cells: [seed("ms", "masc. sing.", "Both nuns are gone.", { shape: "ms" })],
      render: (r) => M(r, 1, V.tsere, true) + mark("ן", "", false, "", true),
      blurb: "Imperative of נתן. Give.",
    };
  }
  if (conj === "wayyiqtol") {
    return {
      slots: [slot("pre", "Prefix", person("wayy-hireq"))],
      cells: [seed("3ms", "3rd masc. sing.", "And he gave. The root nun is the dagesh.", { pre: "wyi" })],
      render: (r) => mark("ו", V.patah) + mark("י", V.hireq, true) + M(r, 1, V.tsere, true) + mark("ן", "", false, "", true),
      blurb: "Wayyiqtol of נתן.",
    };
  }
  return null;
}

function hayah(conj: ConjId): Engine | null {
  if (conj === "perfect") return iiiHe(rootById("hayah") as VerbRoot, "perfect");
  if (conj === "imperfect") {
    return {
      slots: [slot("pre", "Prefix", [
        { id: "yi", label: "yod hireq", mark: mark("י", V.hireq) },
        { id: "ee", label: "alef segol", mark: mark("א", V.segol) },
        { id: "ti", label: "tav hireq", mark: mark("ת", V.hireq) },
      ])],
      cells: [
        seed("3ms", "3rd masc. sing.", "He will be.", { pre: "yi" }),
        seed("1cs", "1st common sing.", "I will be. Alef with segol.", { pre: "ee" }),
        seed("2ms", "2nd masc. sing.", "Tav with hireq.", { pre: "ti" }),
      ],
      render: (_r, picks) => {
        const pre = picks.pre === "ee" ? mark("א", V.segol) : picks.pre === "ti" ? mark("ת", V.hireq) : mark("י", V.hireq);
        return pre + mark("ה", V.shewa) + mark("י", V.segol) + "ה";
      },
      blurb: "היה imperfect. The he stays as a vowel letter.",
    };
  }
  if (conj === "wayyiqtol") {
    return {
      slots: [slot("shape", "Form", [{ id: "ms", label: "3rd masc.", mark: "וַיְהִי" }, { id: "fs", label: "3rd fem.", mark: "וַתְּהִי" }])],
      cells: [
        seed("3ms", "3rd masc. sing.", "And he was, and there was.", { shape: "ms" }),
        seed("fs", "3rd fem. sing.", "And she was.", { shape: "fs" }),
      ],
      render: (_r, picks) => picks.shape === "fs"
        ? mark("ו", V.patah) + mark("ת", V.shewa, true) + mark("ה", V.hireq) + "י"
        : mark("ו", V.patah) + mark("י", V.shewa) + mark("ה", V.hireq) + "י",
      blurb: "Wayyiqtol of היה. Short. The final he is gone.",
    };
  }
  return null;
}

function iiiHe(root: VerbRoot, conj: ConjId): Engine | null {
  const gutt = HATEF_LETTER.has(medial(root.letters[0]));
  if (conj === "perfect") {
    const heavy = root.id === "hayah" ? "hatefS" : gutt ? "hatef" : "shewa";
    const rows: [string, string, string, string][] = [
      ["3ms", "3rd masc. sing.", "qamets", "cite"],
      ["3fs", "3rd fem. sing.", "qamets", "tha"],
      ["2ms", "2nd masc. sing.", "qamets", "ita"],
      ["2fs", "2nd fem. sing.", "qamets", "it"],
      ["1cs", "1st common sing.", "qamets", "iti"],
      ["3cp", "3rd common plural", "qamets", "u"],
      ["2mp", "2nd masc. plural", heavy, "item"],
      ["1cp", "1st common plural", "qamets", "inu"],
    ];
    return {
      slots: [
        slot("v1", "Vowel under the first root letter", vowels(["qamets", "hatef", "hatefS", "shewa"])),
        slot("end", "Ending of a III-he", [
          { id: "cite", label: "qamets he, the citation", mark: CIRC + V.qamets + "ה" },
          { id: "tha", label: "tav qamets he", mark: "ת" + V.qamets + "ה" },
          { id: "ita", label: "yod tav qamets", mark: "י" + "ת" + V.qamets },
          { id: "it", label: "yod tav shewa", mark: "י" + "ת" + V.shewa },
          { id: "iti", label: "yod tav hireq yod", mark: "יתִי" },
          { id: "u", label: "shureq", mark: SHUREQ },
          { id: "item", label: "yod tav segol mem", mark: "יתֶם" },
          { id: "inu", label: "yod nun shureq", mark: "ינוּ" },
        ]),
      ],
      cells: rows.map(([id, label, v1, end]) => seed(id, label, "The final he drops as soon as an ending arrives. 2ms is yod, not the strong tav only.", { v1, end })),
      render: (r, picks) => {
        const A = M(r, 0, vowelChar(picks.v1), lene(r.letters[0], false) && picks.v1 === "qamets");
        const bHireq = picks.end === "ita" || picks.end === "it" || picks.end === "iti" || picks.end === "item" || picks.end === "inu";
        const bBare = picks.end === "u";
        const bShewa = picks.end === "tha";
        const B = bHireq
          ? medial(r.letters[1]) === "י"
            ? M(r, 1, V.hireq)
            : M(r, 1, V.hireq) + "י"
          : M(r, 1, bShewa ? V.shewa : bBare ? "" : V.qamets);
        const tails: Record<string, string> = {
          cite: "ה",
          tha: "ת" + V.qamets + "ה",
          ita: "ת" + V.qamets,
          it: "ת" + V.shewa,
          iti: "ת" + V.hireq + "י",
          u: SHUREQ,
          item: "ת" + DAG + V.segol + "ם",
          inu: "נ" + SHUREQ,
        };
        return A + B + (tails[picks.end ?? ""] ?? "");
      },
      blurb: "III-he perfect. The citation keeps ה. Every other person replaces it.",
    };
  }
  if (conj === "imperfect") {
    const preKind = gutt ? "patah" : "hireq";
    return {
      slots: [slot("pre", "Prefix", person(preKind === "patah" ? "patah" : "hireq")), slot("end", "Ending", [
        { id: "eh", label: "segol he", mark: CIRC + V.segol + "ה" },
        { id: "iy", label: "hireq yod", mark: CIRC + V.hireq + "י" },
        { id: "u", label: "shureq", mark: SHUREQ },
      ])],
      cells: [
        seed("3ms", "3rd masc. sing.", "Segol he.", { pre: gutt ? "ya" : "yi", end: "eh" }),
        seed("2ms", "2nd masc. sing.", "Tav.", { pre: gutt ? "ta" : "ti", end: "eh" }),
        seed("1cs", "1st common sing.", "Alef segol on a strong prefix; patah prefix if the first letter is a guttural.", { pre: "ee", end: "eh" }),
        seed("2fs", "2nd fem. sing.", "The he drops before hireq yod.", { pre: gutt ? "ta" : "ti", end: "iy" }),
        seed("3mp", "3rd masc. plural", "The he drops before shureq.", { pre: gutt ? "ya" : "yi", end: "u" }),
        seed("1cp", "1st common plural", "Nun.", { pre: gutt ? "na" : "ni", end: "eh" }),
      ],
      render: (r, picks) => {
        const pre = PRE_MARK[picks.pre ?? ""] ?? "";
        const c1 = gutt ? V.hatef : V.shewa;
        if (picks.end === "u") return pre + M(r, 0, c1) + M(r, 1, "") + SHUREQ;
        if (picks.end === "iy") return pre + M(r, 0, c1) + M(r, 1, V.hireq) + "י";
        return pre + M(r, 0, c1) + M(r, 1, V.segol) + "ה";
      },
      blurb: "III-he imperfect. Segol he in the unsuffixed forms.",
    };
  }
  if (conj === "wayyiqtol") {
    return {
      slots: [slot("shape", "Short form", [{ id: "ms", label: "3rd masc. sing.", mark: "וַיַּ" }])],
      cells: [seed("3ms", "3rd masc. sing.", "The he drops. The last vowel is short.", { shape: "ms" })],
      render: (r) => {
        if (r.id === "raah") return mark("ו", V.patah) + mark("י", V.patah, true) + mark("ר", V.shewa) + mark("א", "");
        if (r.id === "banah") return mark("ו", V.patah) + mark("י", V.hireq, true) + mark("ב", V.segol) + mark("ן", "", false, "", true);
        return mark("ו", V.patah) + mark("י", V.patah, true) + M(r, 0, V.patah) + M(r, 1, "");
      },
      blurb: "III-he wayyiqtol. Apocopated. The final he is not written.",
    };
  }
  if (conj === "imperative") {
    return {
      slots: [slot("shape", "Command", [
        { id: "ms", label: "masc. sing.", mark: CIRC + V.tsere + "ה" },
        { id: "fs", label: "fem. sing.", mark: CIRC + V.hireq + "י" },
        { id: "mp", label: "masc. plural", mark: SHUREQ },
      ])],
      cells: [
        seed("ms", "masc. sing.", "Tsere he.", { shape: "ms" }),
        seed("fs", "fem. sing.", "Hireq yod. The he is gone.", { shape: "fs" }),
        seed("mp", "masc. plural", "Shureq.", { shape: "mp" }),
      ],
      render: (r, picks) => {
        const A = M(r, 0, gutt ? V.hatef : V.shewa, lene(r.letters[0], false) && !gutt);
        if (picks.shape === "fs") return A + M(r, 1, V.hireq) + "י";
        if (picks.shape === "mp") return A + M(r, 1, "") + SHUREQ;
        return A + M(r, 1, V.tsere) + "ה";
      },
      blurb: "III-he imperative. Tsere he in the masculine singular.",
    };
  }
  if (conj === "inf-const") {
    return {
      slots: [slot("shape", "Infinitive", [{ id: "ot", label: "holem tav", mark: "וֹת" }])],
      cells: [seed("cst", "infinitive construct", "The he is replaced by וֹת.", { shape: "ot" })],
      render: (r) => M(r, 0, gutt ? V.hatef : V.shewa, lene(r.letters[0], false) && !gutt) + M(r, 1, "") + HOLAM_VAV + "ת",
      blurb: "III-he infinitive construct ends in וֹת.",
    };
  }
  if (conj === "participle") {
    return {
      slots: [slot("shape", "Participle", [{ id: "ms", label: "holem, segol he", mark: CIRC + V.holem }])],
      cells: [seed("ms", "masc. sing.", "Holem after the first letter, segol he.", { shape: "ms" })],
      render: (r) => M(r, 0, V.holem, lene(r.letters[0], false)) + M(r, 1, V.segol) + "ה",
      blurb: "III-he participle. Holem, then segol he.",
    };
  }
  return null;
}

function iiiAlef(root: VerbRoot, conj: ConjId): Engine | null {
  if (conj === "perfect") {
    const rows: [string, string, string, string][] = [
      ["3ms", "3rd masc. sing.", "qamets", "none"],
      ["3fs", "3rd fem. sing.", "qamets", "ah"],
      ["2ms", "2nd masc. sing.", "qamets", "qata"],
      ["1cs", "1st common sing.", "qamets", "qati"],
      ["3cp", "3rd common plural", "qamets", "u"],
      ["2mp", "2nd masc. plural", "shewa", "qatem"],
      ["1cp", "1st common plural", "qamets", "qanu"],
    ];
    return {
      slots: [
        slot("v1", "Vowel under the first root letter", vowels(["qamets", "shewa"])),
        slot("end", "Ending", [
          { id: "none", label: "no ending", mark: "—" },
          { id: "ah", label: "qamets he", mark: CIRC + V.qamets + "ה" },
          { id: "qata", label: "qamets tav qamets", mark: CIRC + V.qamets + "תָּ" },
          { id: "qati", label: "qamets tav hireq yod", mark: "ָתִי" },
          { id: "u", label: "shureq", mark: SHUREQ },
          { id: "qatem", label: "qamets tav segol mem", mark: "ָתֶם" },
          { id: "qanu", label: "qamets nun shureq", mark: "ָנוּ" },
        ]),
      ],
      cells: rows.map(([id, label, v1, end]) => seed(id, label, "Before a consonantal ending the vowel in front of alef is qamets. Alef is quiet.", { v1, end })),
      render: (r, picks) => {
        const A = M(r, 0, vowelChar(picks.v1), lene(r.letters[0], false) && picks.v1 !== "shewa");
        const B = M(r, 1, picks.end === "ah" || picks.end === "u" ? V.shewa : picks.v1 === "shewa" ? V.qamets : picks.end === "none" ? V.patah : V.qamets);
        if (picks.end === "none") return A + M(r, 1, V.patah) + M(r, 2, "");
        if (picks.end === "ah") return A + M(r, 1, V.shewa) + M(r, 2, V.qamets) + "ה";
        if (picks.end === "u") return A + M(r, 1, V.shewa) + M(r, 2, "") + SHUREQ;
        const tail = picks.end === "qata" ? "ת" + V.qamets : picks.end === "qati" ? "ת" + V.hireq + "י" : picks.end === "qatem" ? "ת" + DAG + V.segol + "ם" : "נ" + SHUREQ;
        return A + M(r, 1, V.qamets) + M(r, 2, "") + tail;
      },
      blurb: "III-aleph perfect. 2ms is qamets before the tav, because alef goes quiet.",
    };
  }
  if (conj === "imperfect") {
    return {
      slots: [slot("pre", "Prefix", person("hireq")), slot("end", "Ending", IMPF_END)],
      cells: [
        seed("3ms", "3rd masc. sing.", "Qamets under the alef.", { pre: "yi", end: "none" }),
        seed("2ms", "2nd masc. sing.", "Tav.", { pre: "ti", end: "none" }),
        seed("1cs", "1st common sing.", "Alef segol.", { pre: "ee", end: "none" }),
        seed("3mp", "3rd masc. plural", "Shureq. Alef stays.", { pre: "yi", end: "u" }),
        seed("1cp", "1st common plural", "Nun.", { pre: "ni", end: "none" }),
      ],
      render: (r, picks) => {
        const pre = PRE_MARK[picks.pre ?? ""] ?? "";
        if (picks.end === "u") return pre + M(r, 0, V.shewa) + M(r, 1, "") + M(r, 2, "") + SHUREQ;
        return pre + M(r, 0, V.shewa) + M(r, 1, "") + M(r, 2, V.qamets);
      },
      blurb: "III-aleph imperfect. Shewa, then qamets under the alef.",
    };
  }
  return null;
}

function iAlef(root: VerbRoot, conj: ConjId): Engine | null {
  if (conj === "imperfect") {
    return {
      slots: [slot("pre", "Prefix", [
        { id: "yo", label: "yod holem", mark: mark("י", V.holem) },
        { id: "to", label: "tav holem", mark: mark("ת", V.holem, true) },
        { id: "ao", label: "alef holem", mark: mark("א", V.holem) },
        { id: "no", label: "nun holem", mark: mark("נ", V.holem) },
      ]), slot("end", "Ending", IMPF_END)],
      cells: [
        seed("3ms", "3rd masc. sing.", "Holem on the prefix, not hireq. Patah under the alef.", { pre: "yo", end: "none" }),
        seed("2ms", "2nd masc. sing.", "Tav with holem.", { pre: "to", end: "none" }),
        seed("1cs", "1st common sing.", "The alef of “I” and the alef of the root meet.", { pre: "ao", end: "none" }),
        seed("3mp", "3rd masc. plural", "Shureq.", { pre: "yo", end: "u" }),
        seed("1cp", "1st common plural", "Nun with holem.", { pre: "no", end: "none" }),
      ],
      render: (r, picks) => {
        const pres: Record<string, string> = {
          yo: mark("י", V.holem),
          to: mark("ת", V.holem, true),
          ao: mark("א", V.holem),
          no: mark("נ", V.holem),
        };
        const pre = pres[picks.pre ?? ""] ?? "";
        if (picks.pre === "ao" && picks.end !== "u") return pre + mark("מ", V.patah) + M(r, 2, "", false, true);
        if (picks.end === "u") return pre + M(r, 0, "") + M(r, 1, V.shewa) + M(r, 2, "") + SHUREQ;
        return pre + M(r, 0, "") + M(r, 1, V.patah) + M(r, 2, "", false, true);
      },
      blurb: "I-aleph imperfect of אמר. Holem sits on the prefix: יֹאמַר.",
    };
  }
  if (conj === "wayyiqtol") {
    return {
      slots: [slot("shape", "Form", [{ id: "ms", label: "3rd masc.", mark: "וַיֹּאמֶר" }])],
      cells: [seed("3ms", "3rd masc. sing.", "Short. Segol, not patah.", { shape: "ms" })],
      render: () => mark("ו", V.patah) + mark("י", V.holem, true) + mark("א", "") + mark("מ", V.segol) + mark("ר"),
      blurb: "Wayyiqtol of אמר. And he said.",
    };
  }
  if (conj === "imperative") {
    return {
      slots: [slot("shape", "Command", [{ id: "ms", label: "masc. sing.", mark: "אֱמֹר" }])],
      cells: [seed("ms", "masc. sing.", "Hatef segol under the alef.", { shape: "ms" })],
      render: (r) => M(r, 0, V.hatefS) + M(r, 1, V.holem) + M(r, 2, "", false, true),
      blurb: "Imperative of אמר. Hatef segol, then holem.",
    };
  }
  return null;
}

function iNun(root: VerbRoot, conj: ConjId): Engine | null {
  const theme = root.id === "nagash" ? V.patah : V.holem;
  const themeId = root.id === "nagash" ? "patah" : "holem";
  if (conj === "imperfect" || conj === "wayyiqtol") {
    const wayy = conj === "wayyiqtol";
    return {
      slots: [
        slot("pre", "Prefix", person(wayy ? "wayy-hireq" : "hireq")),
        slot("v2", "Vowel on the doubled letter", vowels(["holem", "patah", "shewa", "tsere"])),
        slot("end", "Ending", IMPF_END),
      ],
      cells: [
        seed("3ms", "3rd masc. sing.", "The nun drops and leaves a dagesh.", { pre: wayy ? "wyi" : "yi", v2: themeId, end: "none" }),
        seed("2ms", "2nd masc. sing.", "Tav prefix.", { pre: wayy ? "wti" : "ti", v2: themeId, end: "none" }),
        seed("1cs", "1st common sing.", "Alef segol.", { pre: wayy ? "wee" : "ee", v2: themeId, end: "none" }),
        seed("3mp", "3rd masc. plural", "The vowel reduces.", { pre: wayy ? "wyi" : "yi", v2: "shewa", end: "u" }),
        seed("1cp", "1st common plural", "The prefix nun means we.", { pre: wayy ? "wni" : "ni", v2: themeId, end: "none" }),
      ],
      render: (r, picks) => {
        const pre = PRE_MARK[picks.pre ?? ""] ?? "";
        const B = M(r, 1, vowelChar(picks.v2) || theme, true);
        const end = endTail(picks.end);
        return pre + B + M(r, 2, end.c3, false, end.final) + end.tail;
      },
      blurb: "I-nun imperfect. The nun is the dagesh in the next letter.",
    };
  }
  if (conj === "imperative") {
    return {
      slots: [
        slot("v2", "Vowel", vowels(["holem", "patah", "shewa"])),
        slot("end", "Ending", IMPF_END),
      ],
      cells: [
        seed("ms", "masc. sing.", "The nun is gone.", { v2: themeId, end: "none" }),
        seed("fs", "fem. sing.", "Hireq yod.", { v2: "shewa", end: "iy" }),
        seed("mp", "masc. plural", "Shureq.", { v2: "shewa", end: "u" }),
      ],
      render: (r, picks) => {
        const B = M(r, 1, vowelChar(picks.v2) || theme, picks.end === "none");
        const end = endTail(picks.end);
        return B + M(r, 2, end.c3, false, end.final) + end.tail;
      },
      blurb: "I-nun imperative. The nun usually drops.",
    };
  }
  return null;
}

function iYod(root: VerbRoot, conj: ConjId): Engine | null {
  if (conj === "imperfect" || conj === "wayyiqtol") {
    const wayy = conj === "wayyiqtol";
    const stem = wayy ? "segol" : "tsere";
    return {
      slots: [
        slot("pre", "Prefix", person(wayy ? "wayy-iyod" : "iyod")),
        slot("v2", "Stem vowel", vowels(["tsere", "segol", "shewa"])),
        slot("end", "Ending", IMPF_END),
      ],
      cells: [
        seed("3ms", "3rd masc. sing.", wayy ? "Wayyiqtol shortens tsere to segol." : "The yod is absorbed into the tsere.", { pre: wayy ? "wye" : "ye", v2: stem, end: "none" }),
        seed("2ms", "2nd masc. sing.", "Tav.", { pre: wayy ? "wte" : "te", v2: stem, end: "none" }),
        seed("1cs", "1st common sing.", "Alef.", { pre: wayy ? "wae" : "ae", v2: stem, end: "none" }),
        seed("3mp", "3rd masc. plural", "Shureq.", { pre: wayy ? "wye" : "ye", v2: "shewa", end: "u" }),
        seed("1cp", "1st common plural", "Nun.", { pre: wayy ? "wne" : "ne", v2: stem, end: "none" }),
      ],
      render: (r, picks) => {
        const pre = PRE_MARK[picks.pre ?? ""] ?? "";
        const end = endTail(picks.end);
        return pre + M(r, 1, vowelChar(picks.v2), false) + M(r, 2, end.c3, false, end.final) + end.tail;
      },
      blurb: "I-yod. The first yod does not stay as its own letter.",
    };
  }
  if (conj === "imperative") {
    return {
      slots: [slot("end", "Ending", IMPF_END), slot("v2", "Vowel", vowels(["tsere", "shewa"]))],
      cells: [
        seed("ms", "masc. sing.", "The yod is gone.", { v2: "tsere", end: "none" }),
        seed("fs", "fem. sing.", "Hireq yod.", { v2: "shewa", end: "iy" }),
        seed("mp", "masc. plural", "Shureq.", { v2: "shewa", end: "u" }),
      ],
      render: (r, picks) => {
        const end = endTail(picks.end);
        return M(r, 1, vowelChar(picks.v2), lene(r.letters[1], false) && picks.v2 !== "tsere" ? false : picks.v2 === "tsere" && lene(r.letters[1], false)) + M(r, 2, end.c3, false, end.final) + end.tail;
      },
      blurb: "I-yod imperative. No yod at the front.",
    };
  }
  return null;
}

function yatsaHiphil(conj: ConjId): Engine | null {
  if (conj === "perfect") {
    return {
      slots: [slot("end", "Ending", PF_END)],
      cells: [
        seed("3ms", "3rd masc. sing.", "Holem-vav on the he. He brought out.", { end: "none" }),
        seed("1cs", "1st common sing.", "The stem vowel shortens before the ending.", { end: "ti" }),
        seed("3cp", "3rd common plural", "Shureq.", { end: "u" }),
      ],
      render: (r, picks) => {
        const pre = mark("ה", "") + HOLAM_VAV;
        if (picks.end === "ti") return pre + M(r, 1, V.tsere) + M(r, 2, "") + "ת" + V.hireq + "י";
        if (picks.end === "u") return pre + M(r, 1, V.hireq) + "י" + M(r, 2, "") + SHUREQ;
        return pre + M(r, 1, V.hireq) + "י" + M(r, 2, "");
      },
      blurb: "Hiphil of יצא. Holem-vav replaces the yod.",
    };
  }
  if (conj === "imperfect") {
    return {
      slots: [slot("pre", "Prefix", [{ id: "yo", label: "yod holem-vav", mark: "יוֹ" }])],
      cells: [seed("3ms", "3rd masc. sing.", "He will bring out.", { pre: "yo" })],
      render: (r) => mark("י", "") + HOLAM_VAV + M(r, 1, V.hireq) + "י" + M(r, 2, ""),
      blurb: "Hiphil imperfect of יצא.",
    };
  }
  if (conj === "wayyiqtol") {
    return {
      slots: [slot("shape", "Form", [{ id: "ms", label: "3rd masc.", mark: "וַיּוֹצֵא" }])],
      cells: [seed("3ms", "3rd masc. sing.", "Short tsere.", { shape: "ms" })],
      render: (r) => mark("ו", V.patah) + mark("י", "", true) + HOLAM_VAV + M(r, 1, V.tsere) + M(r, 2, ""),
      blurb: "Hiphil wayyiqtol of יצא.",
    };
  }
  return null;
}

function yaradHophal(conj: ConjId): Engine | null {
  if (conj === "perfect") {
    return {
      slots: [slot("end", "Ending", PF_END)],
      cells: [
        seed("3ms", "3rd masc. sing.", "Shureq on the he. He was brought down.", { end: "none" }),
        seed("3fs", "3rd fem. sing.", "Qamets he.", { end: "ah" }),
        seed("3cp", "3rd common plural", "Shureq on the plural.", { end: "u" }),
      ],
      render: (r, picks) => {
        const pre = mark("ה", "") + SHUREQ;
        if (picks.end === "ah") return pre + M(r, 1, "") + M(r, 2, V.qamets) + "ה";
        if (picks.end === "u") return pre + M(r, 1, "") + M(r, 2, "") + SHUREQ;
        return pre + M(r, 1, V.patah) + M(r, 2, "");
      },
      blurb: "Hophal of ירד. The yod is gone. Shureq on the he is the passive causative.",
    };
  }
  if (conj === "imperfect") {
    return {
      slots: [slot("shape", "Form", [{ id: "ms", label: "3rd masc.", mark: "יוּרַד" }])],
      cells: [seed("3ms", "3rd masc. sing.", "Shureq prefix.", { shape: "ms" })],
      render: (r) => mark("י", "") + SHUREQ + M(r, 1, V.patah) + M(r, 2, ""),
      blurb: "Hophal imperfect of ירד.",
    };
  }
  return null;
}

function hollow(root: VerbRoot, stem: StemId, conj: ConjId): Engine | null {
  if (stem === "hiphil") return hollowHiphil(root, conj);
  if (stem !== "qal") return null;
  const kind = root.hollow ?? "u";
  if (conj === "perfect") {
    const rows: [string, string, string, string][] = [
      ["3ms", "3rd masc. sing.", "qamets", "none"],
      ["3fs", "3rd fem. sing.", "qamets", "ah"],
      ["2ms", "2nd masc. sing.", kind === "o" ? "qamets" : "patah", "ta"],
      ["1cs", "1st common sing.", kind === "o" ? "qamets" : "patah", "ti"],
      ["3cp", "3rd common plural", "qamets", "u"],
      ["2mp", "2nd masc. plural", kind === "o" ? "qamets" : "patah", "tem"],
      ["1cp", "1st common plural", kind === "o" ? "qamets" : "patah", "nu"],
    ];
    return {
      slots: [slot("v1", "Vowel under the first letter", vowels(["qamets", "patah"])), slot("end", "Ending", PF_END)],
      cells: rows.map(([id, label, v1, end]) => seed(id, label, "The middle vowel letter returns only in some forms. Here the perfect often hides it.", { v1, end })),
      render: (r, picks) => {
        const A = M(r, 0, vowelChar(picks.v1), lene(r.letters[0], false));
        const end = endTail(picks.end);
        if (picks.end === "none") return A + M(r, 2, "", false, true);
        if (kind === "o" && picks.end !== "ah" && picks.end !== "u" && picks.end !== "none") {
          return A + M(r, 2, "") + end.tail.replace(V.shewa, "");
        }
        return A + M(r, 2, end.c3, false, false) + end.tail;
      },
      blurb: "Hollow perfect. 3ms is one syllable. A consonant ending uses patah in the u-class and the i-class.",
    };
  }
  if (conj === "imperfect" || conj === "wayyiqtol") {
    const wayy = conj === "wayyiqtol";
    const mater = kind === "u" ? "shureq" : kind === "o" ? "oy" : "iy";
    return {
      slots: [
        slot("pre", "Prefix", wayy ? [
          { id: "wya", label: "vav patah, yod qamets", mark: mark("ו", V.patah) + mark("י", V.qamets, true) },
          { id: "wta", label: "vav patah, tav qamets", mark: mark("ו", V.patah) + mark("ת", V.qamets, true) },
        ] : [
          { id: "ya", label: "yod qamets", mark: mark("י", V.qamets) },
          { id: "ta", label: "tav qamets", mark: mark("ת", V.qamets, true) },
          { id: "aa", label: "alef qamets", mark: mark("א", V.qamets) },
          { id: "na", label: "nun qamets", mark: mark("נ", V.qamets) },
        ]),
        slot("mid", "Middle vowel", [
          { id: "none", label: "the middle letter drops", mark: "—" },
          ...vowels(["shureq", "oy", "iy", "qibbuts"]),
        ]),
        slot("end", "Ending", IMPF_END),
      ],
      cells: wayy
        ? [
            seed("3ms", "3rd masc. sing.", "Short. The middle letter drops.", { pre: "wya", mid: "none", end: "none" }),
            seed("3fs", "3rd fem. sing.", "Tav.", { pre: "wta", mid: "none", end: "none" }),
            seed("3mp", "3rd masc. plural", "Qibbuts in the plural of the u-class.", { pre: "wya", mid: kind === "u" ? "qibbuts" : mater, end: "u" }),
          ]
        : [
            seed("3ms", "3rd masc. sing.", "Qamets on the prefix, and the long middle vowel.", { pre: "ya", mid: mater, end: "none" }),
            seed("2ms", "2nd masc. sing.", "Tav with qamets.", { pre: "ta", mid: mater, end: "none" }),
            seed("1cs", "1st common sing.", "Alef with qamets.", { pre: "aa", mid: mater, end: "none" }),
            seed("3mp", "3rd masc. plural", "Shureq ending.", { pre: "ya", mid: mater, end: "u" }),
            seed("1cp", "1st common plural", "Nun with qamets.", { pre: "na", mid: mater, end: "none" }),
          ],
      render: (r, picks) => {
        const pres: Record<string, string> = {
          ya: mark("י", V.qamets),
          ta: mark("ת", V.qamets, true),
          aa: mark("א", V.qamets),
          na: mark("נ", V.qamets),
          wya: mark("ו", V.patah) + mark("י", V.qamets, true),
          wta: mark("ו", V.patah) + mark("ת", V.qamets, true),
        };
        const pre = pres[picks.pre ?? ""] ?? "";
        const end = endTail(picks.end);
        if (wayy && picks.mid === "none") {
          if (kind === "o") return pre + M(r, 0, V.holem) + M(r, 2, "", false, true);
          if (picks.end === "u") return pre + M(r, 0, V.qibbuts) + M(r, 2, "") + SHUREQ;
          return pre + M(r, 0, V.qamets) + M(r, 2, "", false, true);
        }
        const mid = picks.mid === "oy" ? HOLAM_VAV : picks.mid === "iy" ? V.hireq + "י" : picks.mid === "shureq" ? SHUREQ : "";
        return pre + M(r, 0, "") + mid + M(r, 2, end.c3, false, end.final) + end.tail;
      },
      blurb: wayy ? "Hollow wayyiqtol is short. The middle vowel letter drops in the singular." : "Hollow imperfect. Qamets on the prefix, and the long middle vowel.",
    };
  }
  if (conj === "imperative") {
    return {
      slots: [slot("mid", "Middle vowel", vowels(["shureq", "oy", "iy"])), slot("end", "Ending", IMPF_END)],
      cells: [
        seed("ms", "masc. sing.", "The long vowel is the whole stem.", { mid: kind === "u" ? "shureq" : kind === "o" ? "oy" : "iy", end: "none" }),
        seed("mp", "masc. plural", "Shureq ending.", { mid: kind === "u" ? "shureq" : kind === "o" ? "oy" : "iy", end: "u" }),
      ],
      render: (r, picks) => {
        const mid = picks.mid === "oy" ? HOLAM_VAV : picks.mid === "iy" ? V.hireq + "י" : SHUREQ;
        const end = endTail(picks.end);
        return mid + M(r, 2, end.c3, false, end.final) + end.tail;
      },
      blurb: "Hollow imperative. Rise, come, or set. The first letter is not written.",
    };
  }
  if (conj === "participle") {
    return {
      slots: [slot("shape", "Participle", [{ id: "ms", label: "qamets", mark: CIRC + V.qamets }])],
      cells: [seed("ms", "masc. sing.", "Same look as the perfect 3ms.", { shape: "ms" })],
      render: (r) => M(r, 0, V.qamets, lene(r.letters[0], false)) + M(r, 2, "", false, true),
      blurb: "Hollow participle, masculine singular. Qamets, and the middle letter is not written.",
    };
  }
  return null;
}

function hollowHiphil(root: VerbRoot, conj: ConjId): Engine | null {
  if (conj === "perfect") {
    return {
      slots: [slot("end", "Ending", PF_END)],
      cells: [
        seed("3ms", "3rd masc. sing.", "Tsere on the he, hireq-yod.", { end: "none" }),
        seed("3fs", "3rd fem. sing.", "Qamets he.", { end: "ah" }),
        seed("3cp", "3rd common plural", "Shureq.", { end: "u" }),
      ],
      render: (r, picks) => {
        const pre = mark("ה", V.tsere);
        if (picks.end === "ah") return pre + mark("ק", V.hireq) + "י" + mark("מ", V.qamets) + "ה";
        if (picks.end === "u") return pre + mark("ק", V.hireq) + "י" + mark("מ", "") + SHUREQ;
        return pre + M(r, 0, V.hireq) + "י" + M(r, 2, "", false, true);
      },
      blurb: "Hiphil of a hollow u-class. He caused it to rise.",
    };
  }
  if (conj === "imperfect") {
    return {
      slots: [slot("pre", "Prefix", [{ id: "ya", label: "yod qamets", mark: mark("י", V.qamets) }])],
      cells: [seed("3ms", "3rd masc. sing.", "Qamets prefix, hireq-yod.", { pre: "ya" })],
      render: (r) => mark("י", V.qamets) + M(r, 0, V.hireq) + "י" + M(r, 2, "", false, true),
      blurb: "Hiphil imperfect of קום.",
    };
  }
  if (conj === "wayyiqtol") {
    return {
      slots: [slot("shape", "Form", [{ id: "ms", label: "short", mark: "וַיָּקֶם" }])],
      cells: [seed("3ms", "3rd masc. sing.", "Tsere. The yod of hireq-yod drops.", { shape: "ms" })],
      render: (r) => mark("ו", V.patah) + mark("י", V.qamets, true) + M(r, 0, V.tsere) + M(r, 2, "", false, true),
      blurb: "Hiphil wayyiqtol of קום. Short.",
    };
  }
  if (conj === "imperative") {
    return {
      slots: [slot("shape", "Command", [{ id: "ms", label: "masc. sing.", mark: "הָקֵם" }])],
      cells: [seed("ms", "masc. sing.", "He qamets, tsere.", { shape: "ms" })],
      render: (r) => mark("ה", V.qamets) + M(r, 0, V.tsere) + M(r, 2, "", false, true),
      blurb: "Hiphil imperative of קום.",
    };
  }
  if (conj === "participle") {
    return {
      slots: [slot("shape", "Participle", [{ id: "ms", label: "mem tsere", mark: "מֵקִים" }])],
      cells: [seed("ms", "masc. sing.", "Mem tsere, hireq-yod.", { shape: "ms" })],
      render: (r) => mark("מ", V.tsere) + M(r, 0, V.hireq) + "י" + M(r, 2, "", false, true),
      blurb: "Hiphil participle of קום.",
    };
  }
  return null;
}

function geminate(root: VerbRoot, conj: ConjId): Engine | null {
  if (conj === "perfect") {
    return {
      slots: [slot("end", "Ending", PF_END), slot("v1", "Vowel", vowels(["qamets", "patah"]))],
      cells: [
        seed("3ms", "3rd masc. sing.", "Both bets are written.", { v1: "qamets", end: "none" }),
        seed("3fs", "3rd fem. sing.", "Qamets he.", { v1: "qamets", end: "ah" }),
        seed("3cp", "3rd common plural", "Shureq.", { v1: "qamets", end: "u" }),
        seed("2ms", "2nd masc. sing.", "The second bet is the dagesh, and the vowel is holem-vav.", { v1: "patah", end: "ta" }),
        seed("1cs", "1st common sing.", "Same stem as 2ms.", { v1: "patah", end: "ti" }),
      ],
      render: (r, picks) => {
        if (picks.end === "ta" || picks.end === "ti") {
          const tail = picks.end === "ta" ? "ת" + V.qamets : "ת" + V.hireq + "י";
          return M(r, 0, V.patah) + mark("ב", "", true) + HOLAM_VAV + tail;
        }
        const end = endTail(picks.end);
        return M(r, 0, V.qamets) + M(r, 1, end.c3 === V.qamets ? V.shewa : picks.end === "none" ? V.patah : V.shewa) + (picks.end === "none" ? M(r, 2, "", false, true) : M(r, 2, end.c3 === V.shewa && picks.end !== "ah" ? "" : "") + (picks.end === "ah" ? M(r, 2, V.qamets) + "ה" : picks.end === "u" ? M(r, 2, "") + SHUREQ : ""));
      },
      blurb: "Geminate perfect. 3ms shows both letters. 2ms hides the second letter in a dagesh.",
    };
  }
  if (conj === "imperfect") {
    return {
      slots: [slot("pre", "Prefix", [
        { id: "ya", label: "yod qamets", mark: mark("י", V.qamets) },
        { id: "aa", label: "alef qamets", mark: mark("א", V.qamets) },
        { id: "na", label: "nun qamets", mark: mark("נ", V.qamets) },
      ])],
      cells: [
        seed("3ms", "3rd masc. sing.", "Qamets prefix, holem. One bet, with no extra dagesh required on this form.", { pre: "ya" }),
        seed("1cs", "1st common sing.", "Alef qamets.", { pre: "aa" }),
        seed("1cp", "1st common plural", "Nun qamets.", { pre: "na" }),
      ],
      render: (r, picks) => {
        const pre = picks.pre === "aa" ? mark("א", V.qamets) : picks.pre === "na" ? mark("נ", V.qamets) : mark("י", V.qamets);
        return pre + M(r, 0, "") + mark(r.letters[1], V.holem);
      },
      blurb: "Geminate imperfect. It resembles a hollow verb: qamets on the prefix, holem in the stem.",
    };
  }
  return null;
}

function hiphilGutt(conj: ConjId): Engine | null {
  if (conj === "perfect") return hiphilPerfect(rootById("amad") as VerbRoot, true);
  if (conj === "imperfect") return hiphilImpf(rootById("amad") as VerbRoot, true, false);
  if (conj === "wayyiqtol") return hiphilImpf(rootById("amad") as VerbRoot, true, true);
  if (conj === "participle") {
    return {
      slots: [slot("shape", "Participle", [{ id: "ms", label: "mem patah, hatef", mark: "מַעֲמִיד" }])],
      cells: [seed("ms", "masc. sing.", "Patah on the mem, hatef under the guttural.", { shape: "ms" })],
      render: (r) => mark("מ", V.patah) + M(r, 0, V.hatef) + M(r, 1, V.hireq) + "י" + M(r, 2, ""),
      blurb: "Hiphil participle of an I-guttural.",
    };
  }
  return null;
}

export function openPattern(rootId: string, stem: StemId, conj: ConjId): Pattern | null {
  const root = byId[rootId];
  if (!root) return null;
  const engine = buildEngine(root, stem, conj);
  if (!engine || engine.cells.length === 0) return null;
  return finish(root, engine, stem, conj);
}

export function stemsFor(rootId: string): StemId[] {
  return STEMS.map((stem) => stem.id).filter((stem) => CONJS.some((conj) => openPattern(rootId, stem, conj.id)));
}

export function conjsFor(rootId: string, stem: StemId): ConjId[] {
  return CONJS.map((conj) => conj.id).filter((conj) => openPattern(rootId, stem, conj));
}

export function preview(pattern: Pattern, picks: Record<string, string>): string {
  return pattern.render(picks);
}

export function gradeCell(pattern: Pattern, cell: Cell, picks: Record<string, string>): { ok: boolean; lines: string[] } {
  const lines: string[] = [];
  for (const item of pattern.slots) {
    const want = cell.answer[item.id];
    const got = picks[item.id] ?? "";
    if (want === undefined) continue;
    if (got !== want) {
      const wantLabel = item.options.find((opt) => opt.id === want)?.label ?? want;
      const gotLabel = item.options.find((opt) => opt.id === got)?.label ?? "nothing";
      lines.push(`${item.label}: needed ${wantLabel}. You chose ${gotLabel}.`);
    }
  }
  return { ok: lines.length === 0, lines };
}

export function filled(pattern: Pattern, picks: Record<string, string>): boolean {
  return pattern.slots.every((item) => Boolean(picks[item.id]));
}

export function dealRound<T>(cells: T[], rng: () => number = Math.random): T[] {
  const shuffle = (list: T[]) => {
    const next = list.slice();
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const hold = next[i];
      next[i] = next[j];
      next[j] = hold;
    }
    return next;
  };
  const out: T[] = [];
  let bag: T[] = [];
  while (out.length < ROUND) {
    if (!bag.length) bag = shuffle(cells);
    const item = bag.pop();
    if (!item) break;
    out.push(item);
  }
  return out;
}

export function passDeck<T>(cells: T[], rng: () => number = Math.random): T[] {
  const next = cells.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const hold = next[i];
    next[i] = next[j];
    next[j] = hold;
  }
  return next;
}

export function passedAll(correct: number, total: number): boolean {
  return total > 0 && correct === total;
}

export function cleared(correct: number): boolean {
  return Math.round((correct / ROUND) * 100) >= PASS;
}

export function auditPatterns(): string[] {
  const problems: string[] = [];
  for (const root of ROOTS) {
    let any = false;
    for (const stem of STEMS) {
      for (const conj of CONJS) {
        const pattern = openPattern(root.id, stem.id, conj.id);
        if (!pattern) continue;
        any = true;
        for (const cell of pattern.cells) {
          if (!cell.form) problems.push(`${root.id} ${stem.id} ${conj.id} ${cell.id} empty`);
          for (const [key, value] of Object.entries(cell.answer)) {
            const found = pattern.slots.find((item) => item.id === key);
            if (!found) problems.push(`${root.id} ${stem.id} ${conj.id} ${cell.id} unknown slot ${key}`);
            else if (!found.options.some((opt) => opt.id === value)) problems.push(`${root.id} ${stem.id} ${conj.id} ${cell.id} ${key}=${value} not in options`);
          }
          const again = pattern.render(cell.answer);
          if (again !== cell.form) problems.push(`${root.id} ${stem.id} ${conj.id} ${cell.id} unstable`);
        }
      }
    }
    if (!any) problems.push(`${root.id} has no pattern`);
  }
  return problems;
}

export function stemLabel(id: StemId): string {
  return stemEn[id];
}

export function conjLabel(id: ConjId): string {
  return conjEn[id];
}
