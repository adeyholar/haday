import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { normalizeParadigm } from "@/lib/paradigm/normalize";
import { openPattern, ROOTS, type VerbRoot } from "@/lib/verbal-system";

export const CLOCKS = ["yiqtol", "wayyiqtol", "weqatal"] as const;
export type Clock = (typeof CLOCKS)[number];

export const CLOCK_LABEL: Record<Clock, string> = {
  yiqtol: "Yiqtol",
  wayyiqtol: "Wayyiqtol",
  weqatal: "Weqatal",
};

export const CLOCK_NOTE: Record<Clock, string> = {
  yiqtol: "The imperfect. A person prefix, then the stem.",
  wayyiqtol: "Vav with patah, and dagesh in the prefix. Alef takes qamets and no dagesh.",
  weqatal: "The perfect with the conjunction on the front. ב מ פ and a vocal shewa take וּ.",
};

const SHEWA = "\u05B0";
const HATEPH_SEGOL = "\u05B1";
const HATEPH_PATAH = "\u05B2";
const HATEPH_QAMETS = "\u05B3";
const HIREQ = "\u05B4";
const SEGOL = "\u05B6";
const PATAH = "\u05B7";
const QAMETS = "\u05B8";
const DAGESH = "\u05BC";
const OLE = "\u05AB";
const BUMP = new Set(["ב", "מ", "פ"]);
const BEGAD = new Set(["ב", "ג", "ד", "כ", "פ", "ת"]);

export type ClockCard = {
  id: string;
  clock: Clock;
  rootId: string;
  cite: string;
  gloss: string;
  pgn: string;
  label: string;
  form: string;
};

function isLetter(ch: string): boolean {
  return /[\u05D0-\u05EA]/.test(ch);
}

function stripLene(letter: string, marks: string[]): string {
  if (!BEGAD.has(letter)) return marks.join("");
  let dropped = false;
  return marks
    .filter((mark) => {
      if (!dropped && mark === DAGESH) {
        dropped = true;
        return false;
      }
      return true;
    })
    .join("");
}

/** Conjunction vav on a Qal perfect. This is weqatal, not wayyiqtol. */
export function weqatalOf(perfect: string): string {
  const chars = [...perfect];
  const at = chars.findIndex(isLetter);
  if (at < 0) return perfect;
  const letter = chars[at];
  let end = at + 1;
  while (end < chars.length && !isLetter(chars[end])) end += 1;
  const marks = chars.slice(at + 1, end);
  const rest = chars.slice(end).join("");
  const vowel = marks.find((mark) => mark >= "\u05B0" && mark <= "\u05BB");
  if (letter === "י" && vowel === SHEWA) {
    return "ו" + HIREQ + "י" + marks.filter((mark) => mark !== SHEWA).join("") + rest;
  }
  if (vowel === HATEPH_PATAH) return "ו" + PATAH + letter + marks.join("") + rest;
  if (vowel === HATEPH_SEGOL) return "ו" + SEGOL + letter + marks.join("") + rest;
  if (vowel === HATEPH_QAMETS) return "ו" + QAMETS + letter + marks.join("") + rest;
  const body = letter + stripLene(letter, marks) + rest;
  if (BUMP.has(letter) || vowel === SHEWA) return "ו" + DAGESH + body;
  return "ו" + SHEWA + body;
}

function push(out: ClockCard[], root: VerbRoot, clock: Clock, pgn: string, label: string, form: string) {
  out.push({
    id: `${root.id}:${clock}:${pgn}`,
    clock,
    rootId: root.id,
    cite: root.cite,
    gloss: root.gloss,
    pgn,
    label,
    form,
  });
}

/** Every signed Qal yiqtol and wayyiqtol, plus weqatal built from the Qal perfect. */
export function clockCards(): ClockCard[] {
  const out: ClockCard[] = [];
  for (const root of ROOTS) {
    const perfect = openPattern(root.id, "qal", "perfect");
    const yiqtol = openPattern(root.id, "qal", "imperfect");
    const wayyiqtol = openPattern(root.id, "qal", "wayyiqtol");
    if (yiqtol) for (const cell of yiqtol.cells) push(out, root, "yiqtol", cell.id, cell.label, cell.form);
    if (wayyiqtol) for (const cell of wayyiqtol.cells) push(out, root, "wayyiqtol", cell.id, cell.label, cell.form);
    if (perfect) for (const cell of perfect.cells) push(out, root, "weqatal", cell.id, cell.label, weqatalOf(cell.form));
  }
  return out;
}

export function gradeClock(form: string, typed: string, strict = true): { ok: boolean; lenient: boolean; tag: "stress" | "" } {
  const want = normalizeParadigm(form);
  const got = normalizeParadigm(typed);
  if (strict && want === got) return { ok: true, lenient: false, tag: "" };
  if (!strict && foldFinals(lettersOnly(form)) === foldFinals(lettersOnly(typed)) && lettersOnly(typed)) {
    return { ok: true, lenient: true, tag: "" };
  }
  if (strict && want.replaceAll(OLE, "") === got.replaceAll(OLE, "")) return { ok: false, lenient: false, tag: "stress" };
  return { ok: false, lenient: false, tag: "" };
}

/** One root, three passes. A miss stays in the same pass. */
export const PRACTICE_ROUNDS = 3;

export type Sitting = {
  source: ClockCard[];
  round: number;
  queue: ClockCard[];
  cleared: number;
  misses: number;
  finished: boolean;
};

export function sittingFrom(cards: ClockCard[]): Sitting {
  return {
    source: cards,
    round: 1,
    queue: cards.slice(),
    cleared: 0,
    misses: 0,
    finished: false,
  };
}

function reshuffle(cards: ClockCard[]): ClockCard[] {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const hold = out[i];
    out[i] = out[j];
    out[j] = hold;
  }
  return out;
}

/** A hit leaves the pass. A miss goes to the back. The next pass starts when this one is clear. */
export function answerSitting(sitting: Sitting, ok: boolean): Sitting {
  if (sitting.finished || sitting.queue.length === 0) return sitting;
  const head = sitting.queue[0];
  const rest = sitting.queue.slice(1);
  if (!ok) return { ...sitting, queue: [...rest, head], misses: sitting.misses + 1 };
  if (rest.length > 0) return { ...sitting, queue: rest, cleared: sitting.cleared + 1 };
  if (sitting.round >= PRACTICE_ROUNDS) {
    return { ...sitting, queue: [], cleared: sitting.cleared + 1, finished: true };
  }
  return { ...sitting, round: sitting.round + 1, queue: reshuffle(sitting.source), cleared: 0, misses: 0 };
}
