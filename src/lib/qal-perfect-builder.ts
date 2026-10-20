/** Assemble a strong or assimilating Qal perfect. Accent and meteg are required on the forms that take them. */

import { withTone } from "@/lib/verbal-marks";

const DAG = "\u05BC";
const SHIN = "\u05C1";

export const VOWELS = {
  q: "\u05B8",
  p: "\u05B7",
  sh: "\u05B0",
  hi: "\u05B4",
  ts: "\u05B5",
  se: "\u05B6",
  ho: "\u05B9",
  qu: "\u05BB",
} as const;

export type VowelId = keyof typeof VOWELS;

export const VOWEL_OPTS: { id: VowelId; name: string }[] = [
  { id: "q", name: "qamets" },
  { id: "p", name: "patah" },
  { id: "sh", name: "sheva" },
  { id: "hi", name: "hireq" },
  { id: "ts", name: "tsere" },
  { id: "se", name: "segol" },
  { id: "ho", name: "holem" },
  { id: "qu", name: "qibbuts" },
];

const VNAME: Record<VowelId, string> = {
  q: "qamets",
  p: "patah",
  sh: "sheva",
  hi: "hireq",
  ts: "tsere",
  se: "segol",
  ho: "holem",
  qu: "qibbuts",
};

const BGDKPT = new Set(["ב", "ג", "ד", "כ", "פ", "ת"]);
const FINAL: Record<string, string> = { נ: "ן", כ: "ך", מ: "ם", פ: "ף", צ: "ץ" };

export type EndId = "none" | "qh" | "u" | "ta" | "tf" | "ti" | "tem" | "ten" | "nu";

type Ending = {
  name: string;
  c3v: string;
  tail: string;
  m?: string;
  mt?: string;
  nm?: boolean;
};

export const ENDINGS: Record<EndId, Ending> = {
  none: { name: "no ending", c3v: "", tail: "" },
  qh: { name: "he", c3v: VOWELS.q, tail: "ה" },
  u: { name: "shureq", c3v: "", tail: `ו${DAG}` },
  ta: { name: "tav + qamets", c3v: VOWELS.sh, tail: `ת${DAG}${VOWELS.q}`, m: VOWELS.q, mt: "" },
  tf: { name: "tav + sheva", c3v: VOWELS.sh, tail: `ת${DAG}${VOWELS.sh}`, m: VOWELS.sh, mt: "" },
  ti: { name: "tav + hireq + yod", c3v: VOWELS.sh, tail: `ת${DAG}${VOWELS.hi}י`, m: VOWELS.hi, mt: "י" },
  tem: { name: "tav + segol + final mem", c3v: VOWELS.sh, tail: `ת${DAG}${VOWELS.se}ם`, m: VOWELS.se, mt: "ם" },
  ten: { name: "tav + segol + final nun", c3v: VOWELS.sh, tail: `ת${DAG}${VOWELS.se}ן`, m: VOWELS.se, mt: "ן" },
  nu: { name: "nun + shureq", c3v: VOWELS.sh, tail: `נו${DAG}`, nm: true },
};

export const END_ORDER: EndId[] = ["none", "qh", "u", "ta", "tf", "ti", "tem", "ten", "nu"];

export type PgnKey = "3ms" | "3fs" | "2ms" | "2fs" | "1cs" | "3cp" | "2mp" | "2fp" | "1cp";

export type FormSpec = {
  k: PgnKey;
  long: string;
  v1: VowelId;
  v2: VowelId;
  end: EndId;
  note: string;
};

export const FORMS: FormSpec[] = [
  { k: "3ms", long: "3rd masc. sing.", v1: "q", v2: "p", end: "none", note: "The base form. No ending, so nothing changes." },
  { k: "3fs", long: "3rd fem. sing.", v1: "q", v2: "sh", end: "qh", note: "A vowel ending draws the stress. The second vowel drops to sheva and the first qamets stays." },
  { k: "2ms", long: "2nd masc. sing.", v1: "q", v2: "p", end: "ta", note: "A consonant ending keeps both vowels. The last root letter closes with a sheva." },
  { k: "2fs", long: "2nd fem. sing.", v1: "q", v2: "p", end: "tf", note: "Same as 2ms, but the ending is a bare tav with a sheva." },
  { k: "1cs", long: "1st common sing.", v1: "q", v2: "p", end: "ti", note: "A consonant ending keeps both vowels. The ending is tav + hireq + yod." },
  { k: "3cp", long: "3rd common plural", v1: "q", v2: "sh", end: "u", note: "Same as 3fs: the vowel ending shureq pushes the second vowel to sheva." },
  { k: "2mp", long: "2nd masc. plural", v1: "sh", v2: "p", end: "tem", note: "A heavy ending takes the stress. The first vowel drops to sheva and the patah stays." },
  { k: "2fp", long: "2nd fem. plural", v1: "sh", v2: "p", end: "ten", note: "Same as 2mp, with a final nun instead of mem." },
  { k: "1cp", long: "1st common plural", v1: "q", v2: "p", end: "nu", note: "A consonant ending keeps both vowels. The ending is nun + shureq." },
];

export type RootLevel = 1 | 2;

export type BuilderRoot = {
  c: string;
  gloss: string;
  lvl: RootLevel;
  assim?: "tt" | "nn";
};

export const ROOTS: BuilderRoot[] = [
  { c: "קטל", gloss: "kill", lvl: 1 },
  { c: "כתב", gloss: "write", lvl: 1 },
  { c: "שמר", gloss: "keep, guard", lvl: 1 },
  { c: "זכר", gloss: "remember", lvl: 1 },
  { c: "פקד", gloss: "visit, attend to", lvl: 1 },
  { c: "שפט", gloss: "judge", lvl: 1 },
  { c: "גנב", gloss: "steal", lvl: 1 },
  { c: "שכב", gloss: "lie down", lvl: 1 },
  { c: "כרת", gloss: "cut", lvl: 2, assim: "tt" },
  { c: "שכנ", gloss: "dwell, settle", lvl: 2, assim: "nn" },
];

export type LevelFilter = "1" | "2" | "all";

export type RowChoice = {
  v1: VowelId | "";
  v2: VowelId | "";
  /** Vowel under the third root letter. "none" means that letter has no vowel. */
  v3: VowelId | "none" | "";
  end: EndId | "";
  merge: boolean;
  /** The student names the mark. Every row offers accent, meteg, and neither. */
  tone: "" | "none" | "accent" | "meteg";
};

export function needsTone(k: PgnKey): "accent" | "meteg" | "none" {
  if (k === "2ms" || k === "1cs" || k === "1cp") return "accent";
  if (k === "3fs" || k === "3cp") return "meteg";
  return "none";
}

export function blankChoices(): Record<PgnKey, RowChoice> {
  const out = {} as Record<PgnKey, RowChoice>;
  for (const form of FORMS) out[form.k] = { v1: "", v2: "", v3: "", end: "", merge: false, tone: "" };
  return out;
}

function letter(c: string, vowel: string, dag: boolean) {
  return c + (c === "ש" ? SHIN : "") + (dag ? DAG : "") + (vowel || "");
}

function vowelId(mark: string): VowelId | "none" {
  if (!mark) return "none";
  const found = (Object.keys(VOWELS) as VowelId[]).find((id) => VOWELS[id] === mark);
  return found ?? "none";
}

/** The vowel written under the third root letter. A merged letter keeps the vowel of the ending. */
export function expectedThird(root: BuilderRoot, form: FormSpec): VowelId | "none" {
  if (expectsMerge(root, form.k)) {
    const ending = ENDINGS[form.end];
    if (ending.nm) return "none";
    return vowelId(ending.m ?? "");
  }
  return vowelId(ENDINGS[form.end].c3v);
}

function thirdMark(choice: RowChoice): string {
  if (!choice.v3 || choice.v3 === "none") return "";
  return VOWELS[choice.v3];
}

export function expectsMerge(root: BuilderRoot, k: PgnKey): boolean {
  if (root.assim === "tt") return ["2ms", "2fs", "1cs", "2mp", "2fp"].includes(k);
  if (root.assim === "nn") return k === "1cp";
  return false;
}

/** The pointed word for this choice. Null when Merge is checked on a form that cannot merge. */
export function buildForm(root: BuilderRoot, choice: RowChoice, _person: PgnKey = "3ms"): string | null {
  const [a, b, c] = [...root.c];
  const head = letter(a, choice.v1 ? VOWELS[choice.v1] : "", BGDKPT.has(a)) + letter(b, choice.v2 ? VOWELS[choice.v2] : "", false);
  const third = thirdMark(choice);
  const ending = choice.end ? ENDINGS[choice.end] : undefined;
  let word: string | null;
  if (!ending) word = head + letter(c, third, false);
  else if (choice.merge) {
    if (ending.mt !== undefined && c === "ת") word = head + letter(c, third, true) + ending.mt;
    else if (ending.nm && c === "נ") word = head + letter(c, third, true) + "ו" + DAG;
    else word = null;
  } else if (choice.end === "none") word = head + letter(FINAL[c] || c, third, false);
  else word = head + letter(c, third, false) + ending.tail;
  if (word == null) return null;
  if (choice.tone === "accent" || choice.tone === "meteg") return withTone(word, choice.tone);
  return word;
}

export function rootDisplay(root: BuilderRoot): string {
  return [...root.c].map((c, i) => letter(i === 2 ? FINAL[c] || c : c, "", false)).join(" · ");
}

export function filled(choice: RowChoice): boolean {
  if (!choice.v1 || !choice.v2 || !choice.v3 || !choice.end || !choice.tone) return false;
  return true;
}

export type RowGrade = {
  ok: boolean;
  answer: string;
  diffs: string[];
  note: string;
};

export function gradeRow(root: BuilderRoot, form: FormSpec, choice: RowChoice): RowGrade {
  const merge = expectsMerge(root, form.k);
  const diffs: string[] = [];
  if (choice.v1 !== form.v1) diffs.push(`1st vowel: needed ${VNAME[form.v1]}, you chose ${choice.v1 ? VNAME[choice.v1] : "nothing"}.`);
  if (choice.v2 !== form.v2) diffs.push(`2nd vowel: needed ${VNAME[form.v2]}, you chose ${choice.v2 ? VNAME[choice.v2] : "nothing"}.`);
  const need3 = expectedThird(root, form);
  if (choice.v3 !== need3) {
    const named = (id: VowelId | "none" | "") => (id === "none" ? "no vowel" : id ? VNAME[id] : "nothing");
    diffs.push(`3rd vowel: needed ${named(need3)}, you chose ${named(choice.v3)}.`);
  }
  if (choice.end !== form.end) {
    diffs.push(`Ending: needed ${ENDINGS[form.end].name}, you chose ${choice.end ? ENDINGS[choice.end].name : "nothing"}.`);
  }
  if (root.assim) {
    if (merge && !choice.merge) diffs.push("The last root letter and the ending’s letter are the same here. Write it once with a dagesh.");
    if (!merge && choice.merge) diffs.push("Nothing merges in this form. Write the root letter and the ending separately.");
  }
  const tone = needsTone(form.k);
  if (choice.tone !== tone) {
    const named = (id: RowChoice["tone"]) =>
      id === "accent" ? "accent on the second letter" : id === "meteg" ? "meteg under the first letter" : id === "none" ? "no accent and no meteg" : "nothing";
    diffs.push(`Accent or meteg: needed ${named(tone)}, you chose ${named(choice.tone)}.`);
  }
  const answer = buildForm(root, { v1: form.v1, v2: form.v2, v3: expectedThird(root, form), end: form.end, merge, tone }, form.k) ?? "";
  return { ok: diffs.length === 0, answer, diffs, note: form.note };
}

export function rootsFor(level: LevelFilter): BuilderRoot[] {
  if (level === "all") return ROOTS;
  const n = Number(level) as RootLevel;
  return ROOTS.filter((root) => root.lvl === n);
}

export const STATS_KEY = "qal-perfect-builder-stats-v1";

export type BuilderStats = { n: number; sum: number; perfect: number };

export function emptyStats(): BuilderStats {
  return { n: 0, sum: 0, perfect: 0 };
}
