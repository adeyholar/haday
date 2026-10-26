import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { classHint, siblings, type PracticeCell } from "@/lib/paradigm/book";
import { normalizeParadigm } from "@/lib/paradigm/normalize";

export const MISS_TAGS = [
  "wrong_suffix",
  "wrong_prefix",
  "stem_vowel",
  "guttural_composite_shewa",
  "furtive_patah",
  "quiescent_aleph",
  "III_he_ending",
  "gemination_dagesh",
  "hollow_vowel",
  "nun_assimilation",
  "final_form_letter",
  "missing_dagesh_lene",
  "missing_vowel",
  "extra_mark",
  "stress",
  "pgn_confusion",
  "other",
] as const;

export type MissTag = (typeof MISS_TAGS)[number];

export const TAG_LABEL: Record<MissTag, string> = {
  wrong_suffix: "The ending is wrong.",
  wrong_prefix: "The prefix is wrong.",
  stem_vowel: "A stem vowel is wrong.",
  guttural_composite_shewa: "A guttural needs a hateph, not a plain sheva.",
  furtive_patah: "The guttural needs the helping patah.",
  quiescent_aleph: "Aleph is quiet here. The vowel before it changes.",
  III_he_ending: "A III-he ending: the he drops, and yod comes in before a consonant.",
  gemination_dagesh: "The doubled letter needs its dagesh.",
  hollow_vowel: "A hollow verb does not keep the middle letter in this form.",
  nun_assimilation: "The nun of נתן has assimilated.",
  final_form_letter: "Use the final letter.",
  missing_dagesh_lene: "A begadkephat is missing its dagesh.",
  missing_vowel: "A vowel is missing.",
  extra_mark: "An extra mark is in the word.",
  stress: "Check where the stress falls.",
  pgn_confusion: "That form is real, but it is a different person.",
  other: "Not this form.",
};

const DAG = "\u05BC";
const OLE = "\u05AB";
const HATEPH = new Set(["\u05B1", "\u05B2", "\u05B3"]);
const SHEWA = "\u05B0";
const VOWELS = /[\u05B0-\u05BB\u05C1\u05C2]/;

export type Grade = {
  ok: boolean;
  alt: boolean;
  lenient: boolean;
  tags: MissTag[];
  expected: string;
};

function same(expected: string, typed: string, strict: boolean) {
  if (!typed.trim()) return false;
  if (strict) return normalizeParadigm(expected) === normalizeParadigm(typed);
  return lettersOnly(expected) === lettersOnly(typed);
}

function marksOf(token: string) {
  return [...normalizeParadigm(token)].filter((ch) => !/[\u05D0-\u05EA]/.test(ch) && ch !== OLE);
}

function stressOnly(expected: string, typed: string) {
  const want = normalizeParadigm(expected);
  const got = normalizeParadigm(typed);
  return want !== got && want.replaceAll(OLE, "") === got.replaceAll(OLE, "");
}

export function gradeAnswer(item: PracticeCell, typed: string, strict = true): Grade {
  const expected = item.cell.form;
  const mainHit = same(expected, typed, strict);
  const altHit = item.alternates.some((alt) => same(alt, typed, strict));
  if (mainHit || altHit) {
    return { ok: true, alt: !mainHit, lenient: !strict, tags: [], expected };
  }
  if (strict && [expected, ...item.alternates].some((form) => stressOnly(form, typed))) {
    return { ok: false, alt: false, lenient: false, tags: ["stress"], expected };
  }
  const tags = new Set<MissTag>();
  const wantLetters = lettersOnly(expected);
  const gotLetters = lettersOnly(typed);
  if (gotLetters && foldFinals(wantLetters) === foldFinals(gotLetters) && wantLetters !== gotLetters) tags.add("final_form_letter");
  if (
    siblings(item).some(
      (other) => same(other.cell.form, typed, true) || other.alternates.some((alt) => same(alt, typed, true)),
    )
  ) {
    tags.add("pgn_confusion");
  }
  const wantNorm = normalizeParadigm(expected);
  const gotNorm = normalizeParadigm(typed);
  if (wantLetters === gotLetters) {
    tagVowels(item, wantNorm, gotNorm, tags);
  } else {
    tagConsonants(item, wantLetters, gotLetters, tags);
  }
  if (!tags.size) tags.add("other");
  return { ok: false, alt: false, lenient: false, tags: [...tags], expected };
}

function tagVowels(item: PracticeCell, want: string, got: string, tags: Set<MissTag>) {
  const wantMarks = marksOf(want);
  const gotMarks = marksOf(got);
  const wantD = wantMarks.filter((mark) => mark === DAG).length;
  const gotD = gotMarks.filter((mark) => mark === DAG).length;
  if (wantD > gotD) {
    if (item.root.classId === "geminate" || item.root.classId === "geminate-2") tags.add("gemination_dagesh");
    else tags.add("missing_dagesh_lene");
  }
  if (gotMarks.length > wantMarks.length) tags.add("extra_mark");
  const wantVowels = wantMarks.filter((mark) => mark !== DAG && mark !== "\u05C1" && mark !== "\u05C2");
  const gotVowels = gotMarks.filter((mark) => mark !== DAG && mark !== "\u05C1" && mark !== "\u05C2");
  if (wantVowels.length > gotVowels.length) tags.add("missing_vowel");
  const classId = item.root.classId;
  if (
    (classId === "I-gutt" || classId === "II-gutt" || classId.includes("gutt")) &&
    ((want.includes(SHEWA) && [...got].some((ch) => HATEPH.has(ch))) ||
      ([...want].some((ch) => HATEPH.has(ch)) && got.includes(SHEWA)) ||
      ([...want].some((ch) => HATEPH.has(ch)) && ![...got].some((ch) => HATEPH.has(ch))))
  ) {
    tags.add("guttural_composite_shewa");
  }
  if (classId === "III-gutt") {
    const guttural = item.root.letters[2] ?? "";
    const wantOn = marksOn(want, guttural);
    const gotOn = marksOn(got, guttural);
    if (wantOn.includes("\u05B7") && !gotOn.includes("\u05B7")) tags.add("furtive_patah");
  }
  if (classId === "III-aleph" || classId === "hollow-aleph" || classId === "III-he-aleph") tags.add("quiescent_aleph");
  if (!tags.size) tags.add("stem_vowel");
}

function marksOn(word: string, letter: string): string[] {
  if (!letter) return [];
  const chars = [...word];
  const at = chars.lastIndexOf(letter);
  if (at < 0) return [];
  const marks: string[] = [];
  for (let i = at + 1; i < chars.length && !/[\u05D0-\u05EA]/.test(chars[i]); i++) marks.push(chars[i]);
  return marks;
}

function tagConsonants(item: PracticeCell, want: string, got: string, tags: Set<MissTag>) {
  const classId = item.root.classId;
  if (item.conjugation === "qal_imperfect" || item.conjugation === "qal_imperative") {
    const prefixes = ["י", "ת", "א", "נ"];
    const wantPre = prefixes.includes(want[0] ?? "") ? want[0] : "";
    const gotPre = prefixes.includes(got[0] ?? "") ? got[0] : "";
    if (wantPre !== gotPre) tags.add("wrong_prefix");
  }
  if (classId === "III-he" || classId === "I-gutt-III-he" || classId === "III-he-aleph") tags.add("III_he_ending");
  if (classId === "hollow" || classId === "hollow-aleph") tags.add("hollow_vowel");
  if (classId === "I-nun" || item.root.id === "natan") tags.add("nun_assimilation");
  if (classId === "III-aleph") tags.add("quiescent_aleph");
  const wantEnd = want.slice(item.root.letters.length);
  const gotEnd = got.slice(Math.min(got.length, item.root.letters.length));
  if (wantEnd !== gotEnd) tags.add("wrong_suffix");
  if (!tags.size) tags.add("other");
}

export function hintFor(item: PracticeCell, tags: MissTag[]): string {
  if (tags.includes("pgn_confusion")) return TAG_LABEL.pgn_confusion;
  const classLine = classHint(item.root.classId);
  const tagLine = tags.map((tag) => TAG_LABEL[tag]).join(" ");
  return [tagLine, classLine].filter(Boolean).join(" ");
}

export function acceptsVowels(sample: string): boolean {
  return VOWELS.test(normalizeParadigm(sample));
}
