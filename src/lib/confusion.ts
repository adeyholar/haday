import { lettersOnly } from "@/lib/hebrew";
import { VOCAB, alphabetVocab, type VocabItem } from "@/lib/vocab";

/** Look-alike consonants students mix when reading or writing. */
const LETTER_TWINS: [string, string][] = [
  ["ה", "ח"],
  ["ד", "ר"],
  ["ב", "כ"],
  ["כ", "פ"],
  ["ו", "ז"],
  ["ס", "ם"],
  ["ס", "ט"],
  ["מ", "ט"],
  ["ע", "א"],
  ["ך", "ן"],
  ["ן", "ו"],
];

const LETTER_IDS: [string, string][] = [
  ["he", "het"],
  ["dalet", "resh"],
  ["bet", "kaf"],
  ["kaf", "pe"],
  ["vav", "zayin"],
  ["samekh", "mem-final"],
  ["samekh", "tet"],
  ["mem", "tet"],
  ["ayin", "alef"],
  ["shin", "sin"],
];

function letterTwinSet(): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  function add(a: string, b: string) {
    if (!m.has(a)) m.set(a, new Set());
    m.get(a)!.add(b);
  }
  for (const [a, b] of LETTER_TWINS) {
    add(a, b);
    add(b, a);
  }
  return m;
}

const LETTER_MAP = letterTwinSet();

function pointingFold(s: string): string {
  return s
    .replace(/\u05B8/g, "\u05B7") // qamets → patah
    .replace(/\u05B5/g, "\u05B6") // tsere → seghol
    .replace(/\u05C1/g, "")
    .replace(/\u05C2/g, "");
}

function oneLetterTwin(a: string, b: string): boolean {
  if (a.length !== b.length || a === b) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (LETTER_MAP.get(a[i])?.has(b[i])) diffs += 1;
    else return false;
  }
  return diffs === 1;
}

const POOL: VocabItem[] = [...alphabetVocab(), ...VOCAB];

/** Other lemmas / alef keys that should come back when this one is missed. */
export function twinsOf(id: string): string[] {
  const out = new Set<string>();

  if (id.startsWith("tv:")) {
    const lemmaId = id.split(":")[1];
    if (lemmaId) return twinsOf(lemmaId);
  }

  if (id.startsWith("alef:letter:")) {
    const letterId = id.slice("alef:letter:".length);
    for (const [a, b] of LETTER_IDS) {
      if (a === letterId) out.add(`alef:letter:${b}`);
      if (b === letterId) out.add(`alef:letter:${a}`);
    }
  }
  if (id.startsWith("alef:vowel:")) {
    const vid = id.slice("alef:vowel:".length);
    if (vid === "qamets") out.add("alef:vowel:pathach");
    if (vid === "pathach") out.add("alef:vowel:qamets");
    if (vid === "tsere") out.add("alef:vowel:seghol");
    if (vid === "seghol") out.add("alef:vowel:tsere");
    if (vid === "qamets-hatuf") out.add("alef:vowel:qamets");
  }

  const item = POOL.find((v) => v.id === id);
  if (!item) return [...out];

  const letters = lettersOnly(item.hebrew);
  const pointed = pointingFold(item.hebrew);
  for (const other of POOL) {
    if (other.id === id) continue;
    const oLet = lettersOnly(other.hebrew);
    if (!oLet.length) continue;
    if (oLet === letters && pointingFold(other.hebrew) !== pointed) {
      out.add(other.id);
      continue;
    }
    if (oneLetterTwin(letters, oLet)) out.add(other.id);
  }
  return [...out];
}
