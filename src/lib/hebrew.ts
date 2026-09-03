/** Strip niqqud and cantillation. Final letters are kept as-is. */
export function stripNiqqud(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[\u05F3\u05F4\u05BE\u05C0\u05C3\u05C6]/g, "")
    .replace(/[־–—]/g, "")
    .replace(/\s+/g, "");
}

const FINALS: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

export function foldFinals(s: string): string {
  return [...s].map((ch) => FINALS[ch] ?? ch).join("");
}

export function lettersOnly(s: string): string {
  return stripNiqqud(s).replace(/[^\u05D0-\u05EA]/g, "");
}

/** True for alef-bet lemmas (one consonant, maybe a shin/sin dot). */
export function isSingleLetterLemma(s: string): boolean {
  return lettersOnly(s).length === 1;
}

/** וּ (shureq) writes the same û as qibbuts ֻ — the vav is a vowel letter, not a root consonant. */
export function foldShureq(s: string): string {
  return s.replaceAll("וּ", "ֻ");
}

/**
 * Jerusalem's last syllable is -láyim. Defective ketiv writes it as lamed +
 * patah/qamets, with the hireq of -ayim floating on the mem (or omitted in
 * pausal/display). Plene writes the yod. All of these are the same name.
 * Tsere/segol/etc. on that lamed are not.
 */
function foldJerusalem(s: string): string {
  return s.replace(
    /(\u05D9\u05B0\u05E8\u05BB\u05E9[\u05B0-\u05C2]*\u05DC)[\u05B4\u05B7\u05B8]*(\u05D9\u05B4?)?\u05DD\u05B4?/g,
    "$1\u05B7\u05DD",
  );
}

/** Bare ש is shin. Only a sin-dot makes it sin. */
function foldBareShin(s: string): string {
  const cons = /[\u05D0-\u05EA]/;
  const chars = [...s];
  let out = "";
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch !== "ש") {
      out += ch;
      i += 1;
      continue;
    }
    i += 1;
    const marks: string[] = [];
    while (i < chars.length && !cons.test(chars[i])) {
      marks.push(chars[i]);
      i += 1;
    }
    if (!marks.includes("\u05C1") && !marks.includes("\u05C2")) marks.push("\u05C1");
    out += ch + marks.join("");
  }
  return out;
}

function canonMarks(s: string): string {
  const cons = /[\u05D0-\u05EA]/;
  const chars = [...s];
  let out = "";
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (!cons.test(ch)) {
      out += ch;
      i += 1;
      continue;
    }
    i += 1;
    const marks: string[] = [];
    while (i < chars.length && !cons.test(chars[i])) {
      marks.push(chars[i]);
      i += 1;
    }
    marks.sort();
    out += ch + marks.join("");
  }
  return out;
}

export function normalizeHebrew(s: string): string {
  return lettersOnly(foldShureq(s));
}

/** True when consonants match except a medial was used in place of a final (or the reverse). */
export function isFinalFormMismatch(expected: string, typed: string): boolean {
  const want = lettersOnly(expected);
  const got = lettersOnly(typed);
  if (!want || !got) return false;
  return foldFinals(want) === foldFinals(got) && want !== got;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

export type HandMatch = "exact" | "close" | "wrong" | "empty";

const LOOKALIKE: Record<string, string> = {
  ד: "ר",
  ר: "ד",
  ב: "כ",
  כ: "ב",
  ו: "י",
  י: "ו",
  ה: "ח",
  ח: "ה",
  ת: "ח",
  ס: "ם",
  ם: "ס",
  מ: "ס",
  נ: "ג",
  ג: "נ",
  ך: "ר",
  ן: "ו",
};

function substCost(a: string, b: string): number {
  if (a === b) return 0;
  if (LOOKALIKE[a] === b || LOOKALIKE[b] === a) return 0.35;
  const matres = new Set(["ו", "י", "ה"]);
  if (matres.has(a) && matres.has(b)) return 0.4;
  return 1;
}

export function weightedDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = substCost(a[i - 1], b[j - 1]);
      const insCost = a[i - 1] === "ו" || a[i - 1] === "י" ? 0.45 : 1;
      const delCost = b[j - 1] === "ו" || b[j - 1] === "י" ? 0.45 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + insCost, rows[i][j - 1] + delCost, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[a.length][b.length];
}

export function liveMatch(expected: string, typed: string): "empty" | "prefix" | "exact" | "off" {
  const want = normalizeHebrew(expected);
  const got = normalizeHebrew(typed);
  if (!got) return "empty";
  if (isFinalFormMismatch(expected, typed)) return "off";
  if (got === want || consonantsMatch(expected, typed)) return "exact";
  if (want.startsWith(got)) return "prefix";
  return "off";
}

/** Keep vowels, dagesh, and shin/sin dots; drop cantillation and whitespace. */
export function normalizeHebrewFull(s: string): string {
  return foldJerusalem(
    canonMarks(
      foldBareShin(
        foldShureq(
          s
            .normalize("NFC")
            .replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C5\u05C6\u05C7]/g, "")
            .replace(/[\u05F3\u05F4\u05BE]/g, "")
            .replace(/[־–—]/g, "")
            .replace(/\s+/g, ""),
        ).replace(/[^\u05D0-\u05EA\u05B0-\u05BC\u05C1\u05C2]/g, ""),
      ),
    ),
  );
}

export function pointingHint(expected: string, typed: string): string | null {
  if (!typed) return null;
  if (liveMatchFull(expected, typed) === "exact") return null;
  if (isFinalFormMismatch(expected, typed)) return "Use the final form";
  if (consonantsMatch(expected, typed) || lettersOnly(expected) === lettersOnly(typed)) {
    return "Consonants are right — check vowels, dagesh, and dots.";
  }
  return null;
}

type Cluster = { cons: string; marks: string[] };

function toClusters(s: string): Cluster[] {
  const cons = /[\u05D0-\u05EA]/;
  const chars = [...s];
  const out: Cluster[] = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (!cons.test(ch)) {
      i += 1;
      continue;
    }
    i += 1;
    const marks: string[] = [];
    while (i < chars.length && !cons.test(chars[i])) {
      marks.push(chars[i]);
      i += 1;
    }
    out.push({ cons: ch, marks });
  }
  return out;
}

function marksSubset(got: string[], want: string[]): boolean {
  const pool = [...want];
  for (const m of got) {
    const i = pool.indexOf(m);
    if (i < 0) return false;
    pool.splice(i, 1);
  }
  return true;
}

export function liveMatchFull(expected: string, typed: string): "empty" | "prefix" | "exact" | "off" {
  const want = normalizeHebrewFull(expected);
  const got = normalizeHebrewFull(typed);
  if (!got) return "empty";
  if (got === want) return "exact";
  const wc = toClusters(want);
  const gc = toClusters(got);
  if (!gc.length) return "empty";
  if (gc.length > wc.length) return "off";
  for (let i = 0; i < gc.length - 1; i++) {
    if (gc[i].cons !== wc[i].cons) return "off";
    if (gc[i].marks.join("") !== wc[i].marks.join("")) return "off";
  }
  const last = gc.length - 1;
  if (gc[last].cons !== wc[last].cons) return "off";
  if (!marksSubset(gc[last].marks, wc[last].marks)) return "off";
  if (gc.length === wc.length && gc[last].marks.join("") === wc[last].marks.join("")) return "exact";
  return "prefix";
}

export function liveMatchAny(
  expected: string,
  typed: string,
  alts: string[] | undefined,
  strict: boolean,
): "empty" | "prefix" | "exact" | "off" {
  if (!typed) return "empty";
  const fn = strict ? liveMatchFull : liveMatch;
  let prefix = false;
  for (const t of [expected, ...(alts ?? [])]) {
    const r = fn(t, typed);
    if (r === "exact") return "exact";
    if (r === "prefix") prefix = true;
  }
  return prefix ? "prefix" : "off";
}

export function consonantsMatch(expected: string, typed: string): boolean {
  const want = normalizeHebrew(expected);
  const got = normalizeHebrew(typed);
  if (!want || !got) return false;
  if (isFinalFormMismatch(expected, typed)) return false;
  return got === want;
}

export function foldLetterGlyph(s: string): string {
  return s.normalize("NFC").replace(/[^\u05D0-\u05EA\u05C1\u05C2]/g, "");
}

/** Single-letter check: finals stay distinct; shin vs sin must match. */
export function matchLetter(expected: string, read: string): { match: HandMatch; readN: string } {
  const want = foldLetterGlyph(expected);
  const got = foldLetterGlyph(read);
  if (!got) return { match: "empty", readN: "" };
  if (got === want) return { match: "exact", readN: got };
  const wantBase = want.replace(/[\u05C1\u05C2]/g, "");
  const gotBase = got.replace(/[\u05C1\u05C2]/g, "");
  if (wantBase === "ש" && gotBase === "ש") {
    const wantSin = want.includes("\u05C2");
    const gotSin = got.includes("\u05C2");
    const gotShin = got.includes("\u05C1");
    if (!gotShin && !gotSin) return { match: "close", readN: got };
    if (wantSin !== gotSin) return { match: "wrong", readN: got };
    return { match: "exact", readN: got };
  }
  if (LOOKALIKE[gotBase] === wantBase || LOOKALIKE[wantBase] === gotBase) {
    return { match: "close", readN: got };
  }
  return { match: "wrong", readN: got };
}

export function foldVowelGlyph(s: string): string {
  return s.normalize("NFC").replace(/[^\u05D0-\u05EA\u05B0-\u05BC\u05C1\u05C2]/g, "");
}

function vowelBits(s: string): { marks: string; matres: string } {
  const marks = [...s].filter((ch) => /[\u05B0-\u05BC]/.test(ch)).join("");
  const matres = [...s].filter((ch) => ch === "ו" || ch === "י" || ch === "ה").join("");
  return { marks, matres };
}

/** Vowel-on-bet (or vowel letter). Patah ≠ qamets; shureq ≠ qibbuts; shin-dot not involved. */
export function matchVowel(expected: string, read: string): { match: HandMatch; readN: string } {
  const want = foldVowelGlyph(expected);
  const got = foldVowelGlyph(read);
  if (!got) return { match: "empty", readN: "" };
  if (got === want) return { match: "exact", readN: got };
  const a = vowelBits(want);
  const b = vowelBits(got);
  if (a.marks === b.marks && a.matres === b.matres && (a.marks || a.matres)) return { match: "exact", readN: got };
  if (a.marks === b.marks && a.marks && !a.matres && b.matres === "ו") return { match: "close", readN: got };
  return { match: "wrong", readN: got };
}

export function matchHandwriting(expected: string, read: string): { match: HandMatch; distance: number; expectedN: string; readN: string } {
  const expectedN = normalizeHebrew(expected);
  const readN = normalizeHebrew(read);
  if (!readN) return { match: "empty", distance: expectedN.length, expectedN, readN };
  if (isFinalFormMismatch(expected, read)) {
    return { match: "wrong", distance: 1, expectedN, readN };
  }
  const distance = weightedDistance(expectedN, readN);
  if (distance === 0) return { match: "exact", distance, expectedN, readN };
  const close = distance <= 0.9 || (expectedN.length >= 4 && distance / expectedN.length <= 0.28);
  return { match: close ? "close" : "wrong", distance, expectedN, readN };
}

export function findHitRange(hebrew: string, hit: string): { start: number; end: number } | null {
  if (!hit) return null;
  const direct = hebrew.indexOf(hit);
  if (direct >= 0) return { start: direct, end: direct + hit.length };

  const want = normalizeHebrew(hit);
  if (!want) return null;
  let acc = "";
  const map: number[] = [];
  for (let i = 0; i < hebrew.length; i++) {
    const folded = normalizeHebrew(hebrew[i]);
    if (!folded) continue;
    map.push(i);
    acc += folded;
  }
  const at = acc.indexOf(want);
  if (at < 0) return null;
  const start = map[at];
  const last = map[at + want.length - 1];
  if (start == null || last == null) return null;
  return { start, end: last + 1 };
}

export type EnglishHitHints = {
  hitEn?: string;
  gloss?: string;
  alts?: string[];
};

const STOP_MATCH = new Set([
  "the",
  "a",
  "an",
  "of",
  "to",
  "in",
  "on",
  "and",
  "or",
  "for",
  "is",
  "as",
  "but",
  "by",
  "at",
  "be",
  "it",
  "not",
  "so",
]);

const IRREGULAR: Record<string, string[]> = {
  be: ["is", "am", "are", "was", "were", "been", "being"],
  become: ["becomes", "became", "becoming"],
  begin: ["begins", "began", "begun", "beginning"],
  bear: ["bears", "bore", "borne", "bearing"],
  break: ["breaks", "broke", "broken", "breaking"],
  bring: ["brings", "brought", "bringing"],
  build: ["builds", "built", "building"],
  buy: ["buys", "bought", "buying"],
  catch: ["catches", "caught", "catching"],
  child: ["children"],
  choose: ["chooses", "chose", "chosen", "choosing"],
  come: ["comes", "came", "coming"],
  cut: ["cuts", "cutting"],
  die: ["dies", "died", "dying", "dead"],
  do: ["does", "did", "done", "doing"],
  draw: ["draws", "drew", "drawn", "drawing"],
  drink: ["drinks", "drank", "drunk", "drinking"],
  drive: ["drives", "drove", "driven", "driving"],
  dwell: ["dwells", "dwelt", "dwelling"],
  eat: ["eats", "ate", "eaten", "eating"],
  fall: ["falls", "fell", "fallen", "falling"],
  fight: ["fights", "fought", "fighting"],
  find: ["finds", "found", "finding"],
  flee: ["flees", "fled", "fleeing"],
  foot: ["feet"],
  forget: ["forgets", "forgot", "forgotten", "forgetting"],
  forgive: ["forgives", "forgave", "forgiven", "forgiving"],
  give: ["gives", "gave", "given", "giving"],
  go: ["goes", "went", "gone", "going"],
  have: ["has", "had", "having"],
  hear: ["hears", "heard", "hearing"],
  hide: ["hides", "hid", "hidden", "hiding"],
  hold: ["holds", "held", "holding"],
  keep: ["keeps", "kept", "keeping"],
  know: ["knows", "knew", "known", "knowing"],
  lay: ["lays", "laid", "laying"],
  lead: ["leads", "led", "leading"],
  leave: ["leaves", "left", "leaving"],
  lie: ["lies", "lay", "lain", "lying"],
  life: ["lives", "living"],
  lose: ["loses", "lost", "losing"],
  make: ["makes", "made", "making"],
  man: ["men"],
  meet: ["meets", "met", "meeting"],
  person: ["people", "persons"],
  put: ["puts", "putting"],
  rise: ["rises", "rose", "risen", "rising"],
  run: ["runs", "ran", "running"],
  say: ["says", "said", "saying"],
  see: ["sees", "saw", "seen", "seeing"],
  seek: ["seeks", "sought", "seeking"],
  sell: ["sells", "sold", "selling"],
  send: ["sends", "sent", "sending"],
  set: ["sets", "setting"],
  shine: ["shines", "shone", "shining"],
  shut: ["shuts", "shutting"],
  sing: ["sings", "sang", "sung", "singing"],
  sit: ["sits", "sat", "sitting"],
  slay: ["slays", "slew", "slain", "slaying"],
  sleep: ["sleeps", "slept", "sleeping"],
  speak: ["speaks", "spoke", "spoken", "speaking"],
  stand: ["stands", "stood", "standing"],
  strike: ["strikes", "struck", "striking"],
  swear: ["swears", "swore", "sworn", "swearing"],
  take: ["takes", "took", "taken", "taking"],
  teach: ["teaches", "taught", "teaching"],
  tear: ["tears", "tore", "torn", "tearing"],
  tell: ["tells", "told", "telling"],
  that: ["those"],
  think: ["thinks", "thought", "thinking"],
  this: ["these"],
  throw: ["throws", "threw", "thrown", "throwing"],
  understand: ["understands", "understood", "understanding"],
  weep: ["weeps", "wept", "weeping"],
  win: ["wins", "won", "winning"],
  woman: ["women"],
  write: ["writes", "wrote", "written", "writing"],
};

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inflectionForms(word: string): string[] {
  const w = word.trim();
  if (!w) return [];
  const lower = w.toLowerCase();
  const forms = new Set<string>([w]);
  for (const x of IRREGULAR[lower] ?? []) forms.add(x);
  if (/\s/.test(w)) return [...forms];
  if (lower.endsWith("y") && lower.length > 2 && !/[aeiou]y$/i.test(lower)) {
    forms.add(w.slice(0, -1) + "ies");
    forms.add(w.slice(0, -1) + "ied");
  } else if (/(?:s|x|z|ch|sh)$/i.test(lower)) {
    forms.add(w + "es");
  } else if (!lower.endsWith("s")) {
    forms.add(w + "s");
  }
  if (lower.endsWith("e")) {
    forms.add(w + "d");
    forms.add(w.slice(0, -1) + "ing");
    forms.add(w + "r");
    forms.add(w + "st");
  } else {
    forms.add(w + "ed");
    forms.add(w + "ing");
    if (!/(?:er|est)$/i.test(lower) && lower.length > 2) {
      forms.add(w + "er");
      forms.add(w + "est");
    }
  }
  return [...forms];
}

function formsOf(phrase: string): string[] {
  const t = phrase.trim();
  if (!t) return [];
  if (!/\s/.test(t)) return inflectionForms(t);
  const parts = t.split(/\s+/);
  const first = parts[0]!;
  const rest = parts.slice(1).join(" ");
  const out = new Set<string>([t]);
  if (!STOP_MATCH.has(first.toLowerCase())) {
    for (const f of inflectionForms(first)) out.add(`${f} ${rest}`);
  }
  return [...out];
}

function splitGloss(gloss: string): string[] {
  const out: string[] = [];
  for (const part of gloss.split(/[,;]/)) {
    const t = part.trim();
    if (!t) continue;
    out.push(t);
    const to = t.match(/^to\s+(.+)/i);
    if (to?.[1]) out.push(to[1].trim());
    const be = t.match(/^(?:to\s+)?be\s+(.+)/i);
    if (be?.[1]) out.push(be[1].trim());
  }
  return out;
}

function findPhrase(hay: string, needle: string): { start: number; end: number } | null {
  const n = needle.trim();
  if (n.length < 1) return null;
  const pattern = escapeRe(n).replace(/['’]/g, "['’]");
  const re = new RegExp(`(?<![A-Za-z])${pattern}(?![A-Za-z])`, "i");
  const m = re.exec(hay);
  if (!m) return null;
  return { start: m.index, end: m.index + m[0].length };
}

function collectNeedles(hints: EnglishHitHints): { prefer: string[]; rest: string[] } {
  const prefer: string[] = [];
  if (hints.hitEn) prefer.push(...formsOf(hints.hitEn));
  const raw: string[] = [];
  if (hints.gloss) raw.push(...splitGloss(hints.gloss));
  for (const a of hints.alts ?? []) {
    const t = a.trim();
    if (t) raw.push(t);
  }
  const rest: string[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    for (const f of formsOf(r)) {
      const key = f.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rest.push(f);
    }
  }
  return { prefer, rest };
}

function bestRange(en: string, needles: string[]): { start: number; end: number } | null {
  const hits: { start: number; end: number; len: number; stop: boolean }[] = [];
  const seen = new Set<string>();
  for (const n of needles) {
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const hit = findPhrase(en, n);
    if (!hit) continue;
    const slice = en.slice(hit.start, hit.end).trim().toLowerCase();
    hits.push({
      start: hit.start,
      end: hit.end,
      len: hit.end - hit.start,
      stop: STOP_MATCH.has(slice),
    });
  }
  if (!hits.length) return null;
  const usable = hits.some((h) => !h.stop) ? hits.filter((h) => !h.stop) : hits;
  usable.sort((a, b) => b.len - a.len || a.start - b.start);
  const top = usable[0];
  return top ? { start: top.start, end: top.end } : null;
}

const LEFT_DET = /((?:your|his|her|my|our|their|thy|the|a|an|this|these|those)\s+)$/i;

function expandLeft(en: string, range: { start: number; end: number }): { start: number; end: number } {
  const matched = en.slice(range.start, range.end);
  if (/^(?:your|his|her|my|our|their|thy|the|a|an|this|these|those)\b/i.test(matched)) return range;
  const before = en.slice(0, range.start);
  const m = before.match(LEFT_DET);
  if (!m?.[1]) return range;
  return { start: range.start - m[1].length, end: range.end };
}

/** First English span that corresponds to a Hebrew hit (gloss, alts, or hitEn). */
export function findEnglishHitRange(en: string, hints: EnglishHitHints): { start: number; end: number } | null {
  if (!en) return null;
  const { prefer, rest } = collectNeedles(hints);
  const range = bestRange(en, prefer) ?? bestRange(en, rest);
  if (!range) return null;
  return expandLeft(en, range);
}

const CONS = /[\u05D0-\u05EA]/;
const DAGESH = "\u05BC";
const FULL_VOWEL = /[\u05B1-\u05BB]/;
const BEGAD = new Set(["ב", "ג", "ד", "כ", "פ", "ת", "ך", "ף"]);

export type DageshMark = { letter: string; kind: "lene" | "forte" | "shureq" | "mappiq" };

export function classifyDagesh(hebrew: string): DageshMark[] {
  const clusters: { letter: string; marks: string }[] = [];
  for (let i = 0; i < hebrew.length; i++) {
    if (!CONS.test(hebrew[i])) continue;
    let marks = "";
    let j = i + 1;
    while (j < hebrew.length && !CONS.test(hebrew[j])) {
      marks += hebrew[j];
      j++;
    }
    clusters.push({ letter: hebrew[i], marks });
    i = j - 1;
  }

  const out: DageshMark[] = [];
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    if (!c.marks.includes(DAGESH)) continue;
    if (c.letter === "ו") {
      out.push({ letter: "ו", kind: "shureq" });
      continue;
    }
    if (c.letter === "ה") {
      out.push({ letter: "ה", kind: "mappiq" });
      continue;
    }
    if (!BEGAD.has(c.letter)) {
      out.push({ letter: c.letter, kind: "forte" });
      continue;
    }
    const prev = clusters[i - 1];
    const vowelBefore = Boolean(prev && FULL_VOWEL.test(prev.marks));
    out.push({ letter: c.letter, kind: vowelBefore ? "forte" : "lene" });
  }
  return out;
}

export function dageshCoach(hebrew: string): string | null {
  const hits = classifyDagesh(hebrew);
  if (!hits.length) return null;
  return hits
    .map((h) => {
      if (h.kind === "shureq") {
        return `וּ is shureq (û) — the dot in the vav is the vowel, not dagesh forte.`;
      }
      if (h.kind === "mappiq") {
        return `הּ is mappiq — a sounded h at the end of the word, not doubling.`;
      }
      if (h.kind === "lene") {
        return `${h.letter} has dagesh lene — no vowel before it. Hard sound, not doubled.`;
      }
      if (BEGAD.has(h.letter)) {
        return `${h.letter} has dagesh forte — a vowel sits before it, so the letter is doubled.`;
      }
      return `${h.letter} has dagesh forte — this letter is doubled.`;
    })
    .join(" ");
}
