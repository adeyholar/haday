/** Qal imperfect of the strong roots the class memorizes, then the same pattern in the Tanakh. */

import { DAG, OLE, SHIN } from "@/lib/verbal-marks";
import { IMPERFECT_PASSAGES } from "@/lib/qal-imperfect-roots";
import { letterKey } from "@/lib/tanakh-word";

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
const MEDIAL: Record<string, string> = { ן: "נ", ך: "כ", ם: "מ", ף: "פ", ץ: "צ" };

function medial(c: string): string {
  return MEDIAL[c] || c;
}

export type PrefixId = "yi" | "ya" | "ti" | "ta" | "ee" | "ei" | "ni" | "na";

export const PREFIX: Record<PrefixId, string> = {
  yi: `י${VOWELS.hi}`,
  ya: `י${VOWELS.p}`,
  ti: `ת${DAG}${VOWELS.hi}`,
  ta: `ת${DAG}${VOWELS.p}`,
  ee: `א${VOWELS.se}`,
  ei: `א${VOWELS.hi}`,
  ni: `נ${VOWELS.hi}`,
  na: `נ${VOWELS.p}`,
};

const PNAME: Record<PrefixId, string> = {
  yi: "yod + hireq",
  ya: "yod + patah",
  ti: "tav + hireq",
  ta: "tav + patah",
  ee: "alef + segol",
  ei: "alef + hireq",
  ni: "nun + hireq",
  na: "nun + patah",
};

export const PREFIX_ORDER: PrefixId[] = ["yi", "ya", "ti", "ta", "ee", "ei", "ni", "na"];

export type EndId = "none" | "iy" | "u" | "nah";

type Ending = { name: string; tail: string };

export const ENDINGS: Record<EndId, Ending> = {
  none: { name: "no ending", tail: "" },
  iy: { name: "yod", tail: "י" },
  u: { name: "shureq", tail: `ו${DAG}` },
  nah: { name: "nun + qamets he", tail: `נ${VOWELS.q}ה` },
};

export const END_ORDER: EndId[] = ["none", "iy", "u", "nah"];

export type PgnKey = "3ms" | "3fs" | "2ms" | "2fs" | "1cs" | "3mp" | "3fp" | "2mp" | "2fp" | "1cp";

export type FormSpec = {
  k: PgnKey;
  long: string;
  pre: PrefixId;
  v1: VowelId;
  v2: VowelId;
  v3: VowelId | "none";
  end: EndId;
  tone: "accent" | "none";
  note: string;
};

const FULL = "Sheva under the first letter, holem under the second, nothing under the third.";
const REDUCED = "A vowel ending. The holem drops to sheva.";

export const FORMS: FormSpec[] = [
  { k: "3ms", long: "3rd masc. sing.", pre: "yi", v1: "sh", v2: "ho", v3: "none", end: "none", tone: "none", note: `Prefix yod + hireq. ${FULL}` },
  { k: "3fs", long: "3rd fem. sing.", pre: "ti", v1: "sh", v2: "ho", v3: "none", end: "none", tone: "none", note: `Prefix tav + hireq. ${FULL} Same spelling as 2ms.` },
  { k: "2ms", long: "2nd masc. sing.", pre: "ti", v1: "sh", v2: "ho", v3: "none", end: "none", tone: "none", note: `Prefix tav + hireq. ${FULL} Same spelling as 3fs.` },
  { k: "2fs", long: "2nd fem. sing.", pre: "ti", v1: "sh", v2: "sh", v3: "hi", end: "iy", tone: "none", note: `${REDUCED} Hireq yod is written on the third letter.` },
  { k: "1cs", long: "1st common sing.", pre: "ee", v1: "sh", v2: "ho", v3: "none", end: "none", tone: "none", note: `The only alef prefix, and it takes segol, not hireq. ${FULL}` },
  { k: "3mp", long: "3rd masc. plural", pre: "yi", v1: "sh", v2: "sh", v3: "none", end: "u", tone: "none", note: `${REDUCED} The ending is shureq.` },
  { k: "3fp", long: "3rd fem. plural", pre: "ti", v1: "sh", v2: "ho", v3: "sh", end: "nah", tone: "accent", note: "The holem stays, and it takes the accent. Sheva under the third letter, then nun + qamets he." },
  { k: "2mp", long: "2nd masc. plural", pre: "ti", v1: "sh", v2: "sh", v3: "none", end: "u", tone: "none", note: `${REDUCED} Prefix tav. The ending is shureq.` },
  { k: "2fp", long: "2nd fem. plural", pre: "ti", v1: "sh", v2: "ho", v3: "sh", end: "nah", tone: "accent", note: "Same spelling as 3fp, accent on the holem." },
  { k: "1cp", long: "1st common plural", pre: "ni", v1: "sh", v2: "ho", v3: "none", end: "none", tone: "none", note: `Prefix nun + hireq. ${FULL}` },
];

function cite(a: string, b: string, c: string): string {
  const initial = a === "כ" || a === "ב" || a === "פ" || a === "ת";
  return letter(a, VOWELS.q, initial) + letter(b, VOWELS.p, false) + letter(c, "", false, true);
}

export type BuilderRoot = {
  c: string;
  gloss: string;
  cite: string;
  /** 1 = the class four, three clears. 2 = a Tanakh root, one clear. */
  tier: 1 | 2;
  ref: string;
  where: string;
  he: string;
  en: string;
};

export const ROOTS: BuilderRoot[] = IMPERFECT_PASSAGES.map((row) => {
  const [a, b, c] = [...row.c].map(medial);
  return { ...row, cite: cite(a, b, c) };
});

export type RowChoice = {
  pre: PrefixId | "";
  v1: VowelId | "";
  v2: VowelId | "";
  v3: VowelId | "none" | "";
  end: EndId | "";
  tone: "" | "none" | "accent" | "meteg";
};

export function blankChoices(): Record<PgnKey, RowChoice> {
  const out = {} as Record<PgnKey, RowChoice>;
  for (const form of FORMS) out[form.k] = { pre: "", v1: "", v2: "", v3: "", end: "", tone: "" };
  return out;
}

function letter(c: string, vowel: string, dag: boolean, asFinal = false) {
  const base = asFinal ? FINAL[c] || c : c;
  return base + (base === "ש" ? SHIN : "") + (dag ? DAG : "") + (vowel || "");
}

function clusters(word: string): string[] {
  const parts: string[] = [];
  for (const ch of word) {
    const cp = ch.codePointAt(0) ?? 0;
    if ((cp >= 0x05d0 && cp <= 0x05ea) || parts.length === 0) parts.push(ch);
    else parts[parts.length - 1] += ch;
  }
  return parts;
}

/** The classroom accent sits on the theme vowel, before that vowel and after a dagesh. */
export function accentTheme(word: string): string {
  const parts = clusters(word);
  const theme = parts[2];
  if (!theme || [...theme].includes(OLE)) return word;
  const chars = [...theme];
  let i = 1;
  while (i < chars.length) {
    const cp = chars[i].codePointAt(0) ?? 0;
    if (cp === 0x05bc || cp === 0x05c1 || cp === 0x05c2) i += 1;
    else break;
  }
  chars.splice(i, 0, OLE);
  parts[2] = chars.join("");
  return parts.join("");
}

function metegPrefix(word: string): string {
  const parts = clusters(word);
  if (!parts[0] || [...parts[0]].includes("\u05BD")) return word;
  parts[0] += "\u05BD";
  return parts.join("");
}

export function buildForm(root: BuilderRoot, choice: RowChoice): string {
  const [a, b, c] = [...root.c].map(medial);
  const pre = choice.pre ? PREFIX[choice.pre] : "";
  const v1 = choice.v1 ? VOWELS[choice.v1] : "";
  const v2 = choice.v2 ? VOWELS[choice.v2] : "";
  const v3 = choice.v3 && choice.v3 !== "none" ? VOWELS[choice.v3] : "";
  const secondDag = Boolean(choice.v1 === "sh" && BGDKPT.has(b));
  const ending = choice.end ? ENDINGS[choice.end] : undefined;
  const final = !ending || ending.tail === "";
  let word =
    pre +
    letter(a, v1, false) +
    letter(b, v2, secondDag) +
    letter(c, v3, false, final) +
    (ending?.tail ?? "");
  if (choice.tone === "accent") word = accentTheme(word);
  if (choice.tone === "meteg") word = metegPrefix(word);
  return word;
}

export function rootKey(root: BuilderRoot): string {
  return root.c;
}

export function expectedChoice(form: FormSpec): RowChoice {
  return { pre: form.pre, v1: form.v1, v2: form.v2, v3: form.v3, end: form.end, tone: form.tone };
}

const FIELD_LABEL = {
  pre: "prefix",
  v1: "1st vowel",
  v2: "2nd vowel",
  v3: "3rd vowel",
  end: "ending",
  tone: "accent or meteg",
} as const;

export function openFields(choice: RowChoice): string[] {
  const keys = ["pre", "v1", "v2", "v3", "end", "tone"] as const;
  return keys.filter((key) => !choice[key]).map((key) => FIELD_LABEL[key]);
}

export function filled(choice: RowChoice): boolean {
  return openFields(choice).length === 0;
}

export type ChoiceField = "pre" | "v1" | "v2" | "v3" | "end" | "tone";

export type RowGrade = {
  ok: boolean;
  answer: string;
  diffs: string[];
  note: string;
  misses: ChoiceField[];
};

export function gradeRow(root: BuilderRoot, form: FormSpec, choice: RowChoice): RowGrade {
  const diffs: string[] = [];
  const misses: ChoiceField[] = [];
  if (choice.pre !== form.pre) {
    misses.push("pre");
    diffs.push(`Prefix: needed ${PNAME[form.pre]}, you chose ${choice.pre ? PNAME[choice.pre] : "nothing"}.`);
  }
  if (choice.v1 !== form.v1) {
    misses.push("v1");
    diffs.push(`1st vowel: needed ${VNAME[form.v1]}, you chose ${choice.v1 ? VNAME[choice.v1] : "nothing"}.`);
  }
  if (choice.v2 !== form.v2) {
    misses.push("v2");
    diffs.push(`2nd vowel: needed ${VNAME[form.v2]}, you chose ${choice.v2 ? VNAME[choice.v2] : "nothing"}.`);
  }
  if (choice.v3 !== form.v3) {
    misses.push("v3");
    const named = (id: VowelId | "none" | "") => (id === "none" ? "no vowel" : id ? VNAME[id] : "nothing");
    diffs.push(`3rd vowel: needed ${named(form.v3)}, you chose ${named(choice.v3)}.`);
  }
  if (choice.end !== form.end) {
    misses.push("end");
    diffs.push(`Ending: needed ${ENDINGS[form.end].name}, you chose ${choice.end ? ENDINGS[choice.end].name : "nothing"}.`);
  }
  if (choice.tone !== form.tone) {
    misses.push("tone");
    const named = (id: RowChoice["tone"]) =>
      id === "accent" ? "accent on the theme vowel" : id === "meteg" ? "meteg under the prefix" : id === "none" ? "no accent and no meteg" : "nothing";
    diffs.push(`Accent or meteg: needed ${named(form.tone)}, you chose ${named(choice.tone)}.`);
  }
  return { ok: diffs.length === 0, answer: buildForm(root, expectedChoice(form)), diffs, note: form.note, misses };
}

/** Nine of the ten forms. One miss still clears the round. */
export const PASS_AT = 9;
/** A root is known only after this many cleared rounds. */
export const KNOWN_PASSES = 3;

export const STATS_KEY = "qal-imperfect-builder-v1";

export type ImperfectStats = { rounds: number; passes: Record<string, number> };

export function emptyStats(): ImperfectStats {
  return { rounds: 0, passes: {} };
}

export function passCount(stats: ImperfectStats, root: BuilderRoot): number {
  return stats.passes[root.c] ?? 0;
}

export function passesNeeded(root: BuilderRoot): number {
  return root.tier === 1 ? KNOWN_PASSES : 1;
}

export function rootKnown(stats: ImperfectStats, root: BuilderRoot): boolean {
  return passCount(stats, root) >= passesNeeded(root);
}

export function setKnown(stats: ImperfectStats): boolean {
  return ROOTS.every((root) => rootKnown(stats, root));
}

export function knownCount(stats: ImperfectStats): number {
  return ROOTS.filter((root) => rootKnown(stats, root)).length;
}

/** After a miss, the same root returns. After a clear, the next root that is not yet known. */
export function nextRoot(stats: ImperfectStats, just: BuilderRoot | null, failed: boolean): BuilderRoot {
  if (failed && just) return just;
  const unknown = ROOTS.filter((root) => !rootKnown(stats, root));
  if (!unknown.length) {
    const i = just ? ROOTS.findIndex((root) => root.c === just.c) : -1;
    return ROOTS[(i + 1) % ROOTS.length];
  }
  if (!just) return unknown[0];
  const i = unknown.findIndex((root) => root.c === just.c);
  if (i === -1) return unknown[0];
  return unknown[(i + 1) % unknown.length];
}

const PRE = new Set(["", "י", "ת", "א", "נ", "ה", "הי", "הת", "הא", "הנ"]);
const SUF = new Set(["", "י", "נה", "ן"]);

/** A pointed word shows this root once a vowel-letter vav is set aside. Maqaf is split by the caller. */
export function formHasRoot(part: string, root: string): boolean {
  const q = [...root].map(medial).join("");
  const letters = letterKey(part).replaceAll("ו", "");
  const at = letters.indexOf(q);
  if (at < 0) return false;
  return PRE.has(letters.slice(0, at)) && SUF.has(letters.slice(at + q.length));
}

export function verseParts(he: string, root: string): { word: string; hit: boolean }[] {
  return he
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({
      word,
      hit: word.split("\u05BE").some((part) => formHasRoot(part, root)),
    }));
}

export function recordRound(stats: ImperfectStats, root: BuilderRoot, score: number): ImperfectStats {
  const passes = { ...stats.passes };
  if (score >= PASS_AT) passes[root.c] = (passes[root.c] ?? 0) + 1;
  return { rounds: stats.rounds + 1, passes };
}
