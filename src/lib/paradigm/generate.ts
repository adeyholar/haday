import { normalizeHebrewFull } from "@/lib/hebrew";
import { book, type ParadigmRoot, type Pgn } from "@/lib/paradigm/book";

const Q = "\u05B8";
const A = "\u05B7";
const SH = "\u05B0";
const I = "\u05B4";
const SE = "\u05B6";
const HP = "\u05B2";
const D = "\u05BC";
const SHIN = "\u05C1";
const SIN = "\u05C2";
const BGDKPT = new Set(["ב", "ג", "ד", "כ", "פ", "ת"]);

const OLE = "\u05AB";

/** Penultimate stress. Null means final stress: no mark. 2fs, 2mp, and 2fp stay unmarked. */
export function stressAt(classId: string, pgn: string): number | null {
  if (classId === "hollow" || classId === "hollow-aleph") {
    return ["3fs", "3cp", "2ms", "1cs", "1cp"].includes(pgn) ? 0 : null;
  }
  if (["2ms", "1cs", "1cp"].includes(pgn)) return 1;
  return null;
}

/** Put ole on consonant `at` (0 = first letter). A letter that already has it is left alone. */
export function placeOle(word: string, at: number): string {
  const parts: string[] = [];
  for (const ch of word) {
    const cp = ch.codePointAt(0) ?? 0;
    if ((cp >= 0x05d0 && cp <= 0x05ea) || parts.length === 0) parts.push(ch);
    else parts[parts.length - 1] += ch;
  }
  if (!parts[at] || [...parts[at]].includes(OLE)) return parts.join("");
  parts[at] += OLE;
  return parts.join("");
}

function withStress(classId: string, pgn: string, word: string): string {
  const at = stressAt(classId, pgn);
  return at == null ? word : placeOle(word, at);
}
function letter(consonant: string, vowel: string, dagesh: boolean, shin: ParadigmRoot["shin"]) {
  const dot = consonant === "ש" ? (shin === "sin" ? SIN : SHIN) : "";
  const dag = dagesh && BGDKPT.has(consonant) ? D : "";
  return consonant + dot + vowel + dag;
}

function tav(vowel: string, dagesh: boolean) {
  return "ת" + (dagesh ? D : "") + vowel;
}

/** A draft from the class rule. The signed table wins when they differ. */
export function draftPerfect(root: ParadigmRoot, pgn: Pgn): string {
  return withStress(root.classId, pgn, draftPerfectBare(root, pgn));
}

function draftPerfectBare(root: ParadigmRoot, pgn: Pgn): string {
  const [r1, r2, r3] = root.letters;
  const shin = root.shin;
  if (root.classId === "III-he" || root.classId === "I-gutt-III-he" || root.classId === "III-he-aleph") {
    return draftHe(root, pgn, r1, r2, shin);
  }
  if (root.classId === "hollow" || root.classId === "hollow-aleph") {
    return draftHollow(root, pgn, r1, r3, shin);
  }
  const gut1 = root.classId === "I-gutt";
  const gut2 = root.classId === "II-gutt";
  const v1shewa = gut1 ? HP : SH;
  const v2shewa = gut2 ? HP : SH;
  const head = (v1: string) => letter(r1, v1, v1 !== HP, shin);
  const mid = (v2: string) => letter(r2, v2, false, null);
  if (root.classId === "III-gutt" && pgn === "2fs") {
    return head(Q) + mid(A) + letter(r3, A, false, null) + tav(SH, true);
  }
  if (root.classId === "III-aleph") return draftAleph(pgn, r1, r2, r3);
  switch (pgn) {
    case "3ms":
      return head(Q) + mid(A) + r3;
    case "3fs":
      return head(Q) + mid(v2shewa) + letter(r3, Q, false, null) + "ה";
    case "2ms":
      return head(Q) + mid(A) + letter(r3, SH, false, null) + tav(Q, true);
    case "2fs":
      return head(Q) + mid(A) + letter(r3, SH, false, null) + tav(SH, true);
    case "1cs":
      return head(Q) + mid(A) + letter(r3, SH, false, null) + tav(I, true) + "י";
    case "3cp":
      return head(Q) + mid(v2shewa) + r3 + "ו" + D;
    case "2mp":
      return head(v1shewa) + mid(A) + letter(r3, SH, false, null) + tav(SE, true) + "ם";
    case "2fp":
      return head(v1shewa) + mid(A) + letter(r3, SH, false, null) + tav(SE, true) + "ן";
    case "1cp":
      return head(Q) + mid(A) + letter(r3, SH, false, null) + "נו" + D;
    default:
      return "";
  }
}

function draftHe(root: ParadigmRoot, pgn: Pgn, r1: string, r2: string, shin: ParadigmRoot["shin"]) {
  const hateph = root.classId === "I-gutt-III-he" && root.letters[0] === "ע";
  const open = letter(r1, Q, true, shin);
  const closed = letter(r1, hateph ? HP : SH, !hateph, shin);
  const yod = letter(r2, I, false, null) + "י";
  switch (pgn) {
    case "3ms":
      return open + letter(r2, Q, false, null) + "ה";
    case "3fs":
      return open + letter(r2, SH, false, null) + "ת" + Q + "ה";
    case "2ms":
      return open + yod + "ת" + Q;
    case "2fs":
      return open + yod + "ת";
    case "1cs":
      return open + yod + "ת" + I + "י";
    case "3cp":
      return open + r2 + "ו" + D;
    case "2mp":
      return closed + yod + "ת" + SE + "ם";
    case "2fp":
      return closed + yod + "ת" + SE + "ן";
    case "1cp":
      return open + yod + "נו" + D;
    default:
      return "";
  }
}

function draftHollow(root: ParadigmRoot, pgn: Pgn, r1: string, r3: string, shin: ParadigmRoot["shin"]) {
  const open = letter(r1, Q, true, shin);
  const short = letter(r1, A, false, shin);
  if (root.classId === "hollow-aleph" && (pgn === "3ms" || pgn === "3fs")) {
    return pgn === "3ms" ? open + "א" : open + "א" + Q + "ה";
  }
  switch (pgn) {
    case "3ms":
      return open + r3;
    case "3fs":
      return open + letter(r3, Q, false, null) + "ה";
    case "2ms":
      return short + letter(r3, SH, false, null) + tav(Q, true);
    case "2fs":
      return short + letter(r3, SH, false, null) + tav(SH, true);
    case "1cs":
      return short + letter(r3, SH, false, null) + tav(I, true) + "י";
    case "3cp":
      return open + r3 + "ו" + D;
    case "2mp":
      return short + letter(r3, SH, false, null) + tav(SE, true) + "ם";
    case "2fp":
      return short + letter(r3, SH, false, null) + tav(SE, true) + "ן";
    case "1cp":
      return short + letter(r3, SH, false, null) + "נו" + D;
    default:
      return "";
  }
}

function draftAleph(pgn: Pgn, r1: string, r2: string, r3: string) {
  const open = letter(r1, Q, true, null);
  switch (pgn) {
    case "3ms":
      return open + letter(r2, Q, false, null) + r3;
    case "3fs":
      return open + letter(r2, SH, false, null) + r3 + Q + "ה";
    case "2ms":
      return open + letter(r2, Q, false, null) + r3 + "ת" + Q;
    case "2fs":
      return open + letter(r2, Q, false, null) + r3 + "ת";
    case "1cs":
      return open + letter(r2, Q, false, null) + r3 + "ת" + I + "י";
    case "3cp":
      return open + letter(r2, SH, false, null) + r3 + "ו" + D;
    case "2mp":
      return letter(r1, SH, true, null) + letter(r2, Q, false, null) + r3 + "ת" + SE + "ם";
    case "2fp":
      return letter(r1, SH, true, null) + letter(r2, Q, false, null) + r3 + "ת" + SE + "ן";
    case "1cp":
      return open + letter(r2, Q, false, null) + r3 + "נו" + D;
    default:
      return "";
  }
}

export type DraftGap = { rootId: string; pgn: string; stored: string; drafted: string };

/** Generated vs the signed table. Nothing here is written back onto the table. */
export function generationGaps(): DraftGap[] {
  const gaps: DraftGap[] = [];
  for (const root of book.roots) {
    const table = root.conjugations.qal_perfect;
    for (const [pgn, cell] of Object.entries(table.cells)) {
      const drafted = draftPerfect(root, pgn);
      if (normalizeHebrewFull(drafted) === normalizeHebrewFull(cell.form)) continue;
      gaps.push({ rootId: root.id, pgn, stored: cell.form, drafted });
    }
  }
  return gaps;
}

/** The form a student is shown. An override always wins over the draft. */
export function shownForm(root: ParadigmRoot, pgn: Pgn): string {
  const cell = root.conjugations.qal_perfect?.cells[pgn];
  if (!cell) return draftPerfect(root, pgn);
  if (cell.origin === "override") return cell.form;
  const drafted = draftPerfect(root, pgn);
  return normalizeHebrewFull(drafted) === normalizeHebrewFull(cell.form) ? cell.form : cell.form;
}
