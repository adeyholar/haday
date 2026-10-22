import { VOCAB, type VocabItem } from "@/lib/vocab";

/** Stress mark (ole). Required on 2ms, 1cs, and 1cp. */
export const OLE = "\u05AB";
/** Meteg. Required on 3fs and 3cp, under the first root letter. */
export const METEG = "\u05BD";
const DAGESH = "\u05BC";
const SHEWA = "\u05B0";
const HATEPH_PATAH = "\u05B2";
const HIREQ = "\u05B4";
const SEGOL = "\u05B6";
const PATAH = "\u05B7";
const QAMETS = "\u05B8";
const SHIN = "\u05C1";
const SIN = "\u05C2";

export const PGN_ORDER = ["3ms", "3fs", "2ms", "2fs", "1cs", "3cp", "2mp", "2fp", "1cp"] as const;
export type Pgn = (typeof PGN_ORDER)[number];

const BGDKPT = new Set(["ב", "ג", "ד", "כ", "פ", "ת"]);
const GUTTURAL = new Set(["א", "ה", "ח", "ע"]);
const DROP_LAST = new Set(["נ", "ן", "ת"]);
const FINAL: Record<string, string> = { כ: "ך", מ: "ם", נ: "ן", פ: "ף", צ: "ץ" };
const MEDIAL: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

const PAST: Record<string, string> = {
  akol: "ate",
  amar: "said",
  halak: "walked",
  yashab: "sat",
  "zakar-v": "remembered",
  katab: "wrote",
  malak: "reigned",
  paqad: "numbered",
  shakab: "lay down",
  shamar: "guarded",
  abar: "crossed",
  amad: "stood",
};

export type VerbRoot = {
  id: string;
  letters: [string, string, string];
  past: string;
};

export type VerbForm = {
  pgn: Pgn;
  /** Full pointed form. Every mark is part of the answer. */
  form: string;
  /** Level 1 stem, with the accent and the meteg still to add. */
  stem: string;
  gloss: string;
  hook: string;
};

export type VerbGrade = {
  correct: boolean;
  /** Only ole / meteg is wrong. The word is still not correct. */
  nudge: null | "accent" | "meteg";
  lines: string[];
};

export type VerbQuestProgress = {
  unlocked: number;
  best: number[];
  cleared: boolean[];
  sealed: string[];
};

const HOOK: Record<Pgn, string> = {
  "3ms": "No ending. This is the dictionary form.",
  "3fs": "הָ is she. The vowel before it reduces, and the meteg keeps the first qamets long.",
  "2ms": "תָּ comes from אַתָּה. The accent sits on the syllable before the ending.",
  "2fs": "תְּ comes from אַתְּ.",
  "1cs": "תִּי comes from אֲנִי. The accent sits on the syllable before the ending.",
  "3cp": "וּ is they. The vowel before it reduces, and the meteg keeps the first qamets long.",
  "2mp": "תֶּם comes from אַתֶּם. The first vowel reduces.",
  "2fp": "תֶּן is the feminine plural ending. The first vowel reduces.",
  "1cp": "נוּ comes from אֲנַחְנוּ. The accent sits on the syllable before the ending.",
};

function chars(s: string): string[] {
  return [...s];
}

function isMark(cp: number): boolean {
  return (cp >= 0x0591 && cp <= 0x05c7) || cp === 0x05c7;
}

function isLetter(cp: number): boolean {
  return cp >= 0x05d0 && cp <= 0x05ea;
}

/** Keep every Hebrew mark. Drop only bidi marks and spaces. Order on a letter does not matter. */
export function canonicalize(s: string): string {
  const nfd = s.normalize("NFD").replace(/\u05BA/g, "\u05B9").replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\s]/g, "");
  const groups: string[] = [];
  for (const ch of chars(nfd)) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isMark(cp) && groups.length) groups[groups.length - 1] += ch;
    else groups.push(ch);
  }
  return groups
    .map((group) => {
      const pieces = chars(group);
      const base = pieces[0] ?? "";
      const marks = pieces.slice(1).sort((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0));
      return base + marks.join("");
    })
    .join("");
}

export function splitClusters(s: string): string[] {
  const out: string[] = [];
  for (const ch of chars(canonicalize(s))) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isMark(cp) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

function baseOf(cluster: string): string {
  return chars(cluster)[0] ?? "";
}

function marksOf(cluster: string): string[] {
  return chars(cluster).slice(1);
}

function withoutAccent(cluster: string): string {
  return baseOf(cluster) + marksOf(cluster).filter((m) => m !== OLE && m !== METEG).join("");
}

function letterOf(token: string): { base: string; dots: string } {
  const pieces = chars(token);
  return { base: pieces[0] ?? "", dots: pieces.slice(1).join("") };
}

function reducedFirst(token: string): string {
  const { base } = letterOf(token);
  return withMarks(token, "lene", GUTTURAL.has(base) ? HATEPH_PATAH : SHEWA);
}

function withMarks(token: string, ...marks: string[]): string {
  const { base, dots } = letterOf(token);
  const dagesh = BGDKPT.has(base) && marks.includes("lene") ? DAGESH : "";
  const rest = marks.filter((m) => m !== "lene");
  return base + dots + dagesh + rest.join("");
}

function finalLetter(token: string): string {
  const { base, dots } = letterOf(token);
  const next = FINAL[base] ?? base;
  return next + dots + (next === "ך" ? SHEWA : "");
}

export function pgnGloss(pgn: Pgn, past: string): string {
  if (pgn === "3ms") return `he ${past}`;
  if (pgn === "3fs") return `she ${past}`;
  if (pgn === "2ms") return `you (m. sg.) ${past}`;
  if (pgn === "2fs") return `you (f. sg.) ${past}`;
  if (pgn === "1cs") return `I ${past}`;
  if (pgn === "3cp") return `they ${past}`;
  if (pgn === "2mp") return `you (m. pl.) ${past}`;
  if (pgn === "2fp") return `you (f. pl.) ${past}`;
  return `we ${past}`;
}

function formOf(pgn: Pgn, letters: [string, string, string]): string {
  const [c1, c2, c3] = letters;
  const q1 = withMarks(c1, "lene", QAMETS);
  const light1 = reducedFirst(c1);
  const a2 = withMarks(c2, PATAH);
  const a2accent = withMarks(c2, PATAH, OLE);
  const shewa2 = withMarks(c2, SHEWA);
  const shewa3 = withMarks(c3, SHEWA);
  const open3 = withMarks(c3);
  const tav = (vowel: string) => "ת" + DAGESH + vowel;
  if (pgn === "3ms") return q1 + a2 + finalLetter(c3);
  if (pgn === "3fs") return withMarks(c1, "lene", QAMETS, METEG) + shewa2 + withMarks(c3, QAMETS) + "ה";
  if (pgn === "2ms") return q1 + a2accent + shewa3 + tav(QAMETS);
  if (pgn === "2fs") return q1 + a2 + shewa3 + tav(SHEWA);
  if (pgn === "1cs") return q1 + a2accent + shewa3 + tav(HIREQ) + "י";
  if (pgn === "3cp") return withMarks(c1, "lene", QAMETS, METEG) + shewa2 + open3 + "ו" + DAGESH;
  if (pgn === "2mp") return light1 + a2 + shewa3 + tav(SEGOL) + "ם";
  if (pgn === "2fp") return light1 + a2 + shewa3 + tav(SEGOL) + "ן";
  return q1 + a2accent + shewa3 + "נ" + "ו" + DAGESH;
}

function stemOf(pgn: Pgn, letters: [string, string, string]): string {
  const [c1, c2, c3] = letters;
  const q1 = withMarks(c1, "lene", QAMETS);
  const light1 = reducedFirst(c1);
  const a2 = withMarks(c2, PATAH);
  const shewa2 = withMarks(c2, SHEWA);
  const shewa3 = withMarks(c3, SHEWA);
  if (pgn === "3ms") return formOf(pgn, letters);
  if (pgn === "3fs" || pgn === "3cp") return q1 + shewa2 + withMarks(c3);
  if (pgn === "2mp" || pgn === "2fp") return light1 + a2 + shewa3;
  return q1 + a2 + shewa3;
}

export function qalPerfect(root: VerbRoot): VerbForm[] {
  return PGN_ORDER.map((pgn) => ({
    pgn,
    form: canonicalize(formOf(pgn, root.letters)),
    stem: canonicalize(stemOf(pgn, root.letters)),
    gloss: pgnGloss(pgn, root.past),
    hook: HOOK[pgn],
  }));
}

export const QATAL: VerbRoot = { id: "qatal", letters: ["ק", "ט", "ל"], past: "killed" };

export function rootLetters(citation: string): string[] {
  const groups: string[] = [];
  for (const ch of chars(canonicalize(citation))) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isLetter(cp)) groups.push((MEDIAL[ch] ?? ch));
    else if ((cp === SHIN.codePointAt(0) || cp === SIN.codePointAt(0)) && groups.length) groups[groups.length - 1] += ch;
  }
  return groups;
}

/** Strong Qal perfect only. The 3ms we generate must be the class citation. */
export function acceptsStrongRoot(item: VocabItem): [string, string, string] | null {
  if (item.pos !== "verb") return null;
  const letters = rootLetters(item.hebrew);
  if (letters.length !== 3) return null;
  const triple = letters as [string, string, string];
  const c2 = baseOf(triple[1]);
  const c3 = baseOf(triple[2]);
  if (GUTTURAL.has(c2) || GUTTURAL.has(c3)) return null;
  if (DROP_LAST.has(c3)) return null;
  const made = canonicalize(formOf("3ms", triple));
  if (made !== canonicalize(item.hebrew)) return null;
  return triple;
}

/** The first Check is the grade. null means this card has not been checked yet. */
export function firstAnswer(locked: boolean | null, correct: boolean, helped: boolean): boolean {
  if (locked !== null) return locked;
  return correct && !helped;
}

/** A sitting is the nine forms. Each miss is dealt once more and graded on its own first Check. */
export function questPercent(results: readonly boolean[]): number {
  if (!results.length) return 0;
  const clean = results.filter(Boolean).length;
  return Math.round((clean / results.length) * 100);
}

export function questVoiceRows(): { id: string; glyph: string; speakEn: string }[] {
  const roots = [QATAL, ...transferRoots()];
  const rows: { id: string; glyph: string; speakEn: string }[] = [];
  for (const root of roots) {
    for (const form of qalPerfect(root)) {
      rows.push({
        id: `vpq-qal-pf-${root.id}-${form.pgn}`,
        glyph: form.form,
        speakEn: `${form.pgn}. ${form.gloss}`,
      });
    }
  }
  return rows;
}

export function transferRoots(): VerbRoot[] {
  const out: VerbRoot[] = [];
  for (const item of VOCAB) {
    const past = PAST[item.id];
    if (!past) continue;
    const letters = acceptsStrongRoot(item);
    if (!letters) continue;
    out.push({ id: item.id, letters, past });
  }
  return out;
}

function clusterLine(expected: string[], got: string[]): string | null {
  if (expected.length !== got.length) return "That is not the full form yet.";
  for (let i = 0; i < expected.length; i++) {
    if (baseOf(expected[i]) !== baseOf(got[i])) {
      const want = baseOf(expected[i]);
      const have = baseOf(got[i]);
      if (FINAL[have] === want || FINAL[want] === have) {
        return `At the end of a word use the final form. Inside a word use the regular letter.`;
      }
      return `Letter ${i + 1} should be ${want}.`;
    }
  }
  return null;
}

function accentLines(pgn: Pgn, expected: string[], got: string[], r2: string): { nudge: "accent" | "meteg"; lines: string[] } | null {
  if (expected.length !== got.length) return null;
  if (expected.some((cluster, i) => withoutAccent(cluster) !== withoutAccent(got[i] ?? ""))) return null;
  const lines: string[] = [];
  const wantsOle = pgn === "2ms" || pgn === "1cs" || pgn === "1cp";
  const wantsMeteg = pgn === "3fs" || pgn === "3cp";
  const oleAt = got.findIndex((cluster) => marksOf(cluster).includes(OLE));
  const metegAt = got.findIndex((cluster) => marksOf(cluster).includes(METEG));
  if (wantsOle && oleAt !== 1) {
    lines.push(
      oleAt === -1
        ? `Almost! You forgot the accent. These forms stress the syllable before the ending, so add the accent over ${baseOf(r2)}.`
        : `Almost! The accent goes over ${baseOf(r2)}, the syllable before the ending.`,
    );
  }
  if (!wantsOle && oleAt !== -1) lines.push("Almost! This form keeps the stress at the end, so it takes no accent mark.");
  if (wantsMeteg && metegAt !== 0) {
    lines.push(
      metegAt === -1
        ? "Almost! Qamets is not the meteg. The meteg is the second short stroke beside it, under the first letter. Tap the Meteg key."
        : "Almost! The meteg goes under the first letter, next to its qamets.",
    );
  }
  if (!wantsMeteg && metegAt !== -1) lines.push("Almost! Only 3fs and 3cp take the meteg here. Remove it.");
  if (!lines.length) return null;
  return { nudge: wantsMeteg ? "meteg" : "accent", lines };
}

export function gradeVerb(answer: string, expected: string, pgn: Pgn, r2 = "ט"): VerbGrade {
  const want = canonicalize(expected);
  const have = canonicalize(answer);
  if (want === have) return { correct: true, nudge: null, lines: [] };
  const exp = splitClusters(want);
  const got = splitClusters(have);
  const accent = accentLines(pgn, exp, got, r2);
  if (accent) return { correct: false, nudge: accent.nudge, lines: accent.lines.slice(0, 3) };
  const lines: string[] = [];
  const shape = clusterLine(exp, got);
  if (shape) lines.push(shape);
  const vowel = vowelLine(exp, got);
  if (vowel) lines.push(vowel);
  const tav = exp.find((cluster) => baseOf(cluster) === "ת");
  const tavGot = got.find((cluster) => baseOf(cluster) === "ת");
  if (tav && marksOf(tav).includes(DAGESH) && tavGot && !marksOf(tavGot).includes(DAGESH)) {
    lines.push("The ת of the ending takes a dagesh. It follows a silent shewa.");
  }
  if (pgn === "2ms" && tavGot && marksOf(tavGot).includes(SHEWA) && !marksOf(tavGot).includes(QAMETS)) {
    lines.push("2ms ends in תָּ (qamets). 2fs ends in תְּ (shewa).");
  }
  if (pgn === "2fs" && tavGot && marksOf(tavGot).includes(QAMETS) && !marksOf(tavGot).includes(SHEWA)) {
    lines.push("2fs ends in תְּ (shewa). 2ms ends in תָּ (qamets).");
  }
  const shin = exp.some((cluster) => marksOf(cluster).includes(SHIN));
  const bareShin = got.some((cluster) => baseOf(cluster) === "ש" && !marksOf(cluster).includes(SHIN) && !marksOf(cluster).includes(SIN));
  if (shin && bareShin) lines.push("Dot the ש. This root uses shin, so the dot goes on the right.");
  if ((pgn === "3fs" || pgn === "3cp") && got[1] && marksOf(got[1]).includes(PATAH)) {
    lines.push("Before a vowel ending the second vowel reduces to shewa.");
  }
  if ((pgn === "2mp" || pgn === "2fp") && got[0] && marksOf(got[0]).includes(QAMETS)) {
    lines.push("Before the heavy endings תֶּם and תֶּן the first vowel reduces to shewa.");
  }
  const wantsOle = pgn === "2ms" || pgn === "1cs" || pgn === "1cp";
  const wantsMeteg = pgn === "3fs" || pgn === "3cp";
  const sameLetters = exp.length === got.length && exp.every((cluster, i) => baseOf(cluster) === baseOf(got[i] ?? ""));
  if (sameLetters && wantsOle && !have.includes(OLE)) {
    lines.push(`Almost! You forgot the accent over ${baseOf(r2)}.`);
  }
  if (sameLetters && wantsMeteg && !have.includes(METEG)) {
    lines.push("Almost! The meteg is its own key, not part of the qamets. Tap Meteg under the first letter.");
  }
  if (!lines.length) lines.push("Every mark has to match. One missing dot makes it a different word.");
  return { correct: false, nudge: null, lines: lines.slice(0, 3) };
}

function vowelLine(expected: string[], got: string[]): string | null {
  const count = Math.min(expected.length, got.length);
  for (let i = 0; i < count; i++) {
    if (baseOf(expected[i]) !== baseOf(got[i])) continue;
    const want = marksOf(expected[i]).filter((mark) => mark !== OLE && mark !== METEG).join("");
    const have = marksOf(got[i]).filter((mark) => mark !== OLE && mark !== METEG).join("");
    if (want !== have) return `Check the vowel under ${baseOf(expected[i])}.`;
  }
  return null;
}

export function placeRequiredMark(current: string, target: string): string {
  const want = splitClusters(target);
  const have = splitClusters(current);
  const out = have.map((cluster, i) => {
    const goal = want[i];
    const marks = marksOf(cluster).filter((mark) => mark !== OLE && mark !== METEG);
    if (goal && marksOf(goal).includes(OLE)) marks.push(OLE);
    if (goal && marksOf(goal).includes(METEG)) marks.push(METEG);
    return baseOf(cluster) + marks.join("");
  });
  return canonicalize(out.join(""));
}

/** Where a tapped accent or meteg goes.
 * placed: it is on the letter this form requires.
 * wait: that letter is not typed yet.
 * skip: this form does not take that mark, so the key may still append it.
 */
export function placeChosenMark(current: string, target: string, mark: string): { status: "placed"; text: string } | { status: "wait" } | { status: "skip" } {
  if (mark !== OLE && mark !== METEG) return { status: "skip" };
  const want = splitClusters(canonicalize(target));
  const have = splitClusters(canonicalize(current));
  const index = want.findIndex((cluster) => marksOf(cluster).includes(mark));
  if (index < 0) return { status: "skip" };
  if (!have[index]) return { status: "wait" };
  if (marksOf(have[index]).includes(mark)) return { status: "placed", text: canonicalize(current) };
  const out = have.map((cluster, i) => (i === index ? cluster + mark : cluster));
  return { status: "placed", text: canonicalize(out.join("")) };
}

/** One step closer. A helped build is not a clean answer. */
export function stepToward(current: string, target: string): string {
  const want = splitClusters(target);
  const have = splitClusters(current);
  const out: string[] = [];
  for (let i = 0; i < want.length; i++) {
    out.push(want[i]);
    if (have[i] !== want[i]) break;
  }
  return out.join("");
}

export function redFrom(pgn: Pgn, count: number): number {
  if (pgn === "3ms") return count;
  if (pgn === "3fs" || pgn === "3cp") return Math.max(0, count - 1);
  if (pgn === "1cp") return Math.max(0, count - 2);
  return 3;
}

export function emptyVerbQuest(): VerbQuestProgress {
  return { unlocked: 1, best: [0, 0, 0, 0, 0], cleared: [false, false, false, false, false], sealed: [] };
}

export function hydrateVerbQuest(raw: unknown): VerbQuestProgress {
  const base = emptyVerbQuest();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<VerbQuestProgress>;
  const unlocked = Math.max(1, Math.min(4, Math.round(Number(r.unlocked) || 1)));
  const best = base.best.slice();
  const cleared = base.cleared.slice();
  if (Array.isArray(r.best)) {
    for (let i = 1; i <= 4; i++) best[i] = Math.max(0, Math.min(100, Math.round(Number(r.best[i]) || 0)));
  }
  if (Array.isArray(r.cleared)) {
    for (let i = 1; i <= 4; i++) cleared[i] = Boolean(r.cleared[i]);
  }
  const sealed = Array.isArray(r.sealed)
    ? r.sealed.filter((id) => typeof id === "string" && id.length > 0 && id.length < 40).slice(0, 40)
    : [];
  return { unlocked, best, cleared, sealed };
}

export function recordVerbQuest(prev: VerbQuestProgress, level: number, pct: number, rootId: string | null): VerbQuestProgress {
  const next = hydrateVerbQuest(prev);
  const score = Math.max(0, Math.min(100, Math.round(pct)));
  if (level >= 1 && level <= 4) {
    next.best[level] = Math.max(next.best[level] ?? 0, score);
    if (score >= 90) {
      next.cleared[level] = true;
      if (level === next.unlocked && next.unlocked < 4) next.unlocked += 1;
      if (rootId && (level === 2 || level === 4) && !next.sealed.includes(rootId)) next.sealed = [...next.sealed, rootId].slice(0, 40);
    }
  }
  return next;
}
