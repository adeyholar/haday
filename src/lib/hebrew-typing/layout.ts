/** Tiro Biblical Hebrew (US) — consonants match the Israeli standard. First-party map. */

export type FingerId = "lp" | "lr" | "lm" | "li" | "th" | "ri" | "rm" | "rr" | "rp";

export const FINGER_LABEL: Record<FingerId, string> = {
  lp: "left pinky",
  lr: "left ring",
  lm: "left middle",
  li: "left index",
  th: "thumb",
  ri: "right index",
  rm: "right middle",
  rr: "right ring",
  rp: "right pinky",
};

export const IL_ROWS: string[][] = [
  ["'", "ק", "ר", "א", "ט", "ו", "ן", "ם", "פ"],
  ["ש", "ד", "ג", "כ", "ע", "י", "ח", "ל", "ך", "ף"],
  ["ז", "ס", "ב", "ה", "נ", "מ", "צ", "ת", "ץ"],
];

/** Combining marks students need for pointed words. */
export const NIKKUD_KEYS = [
  { mark: "\u05B0", name: "shewa" },
  { mark: "\u05B7", name: "pathach" },
  { mark: "\u05B8", name: "qamets" },
  { mark: "\u05B5", name: "tsere" },
  { mark: "\u05B6", name: "seghol" },
  { mark: "\u05B4", name: "hireq" },
  { mark: "\u05B9", name: "holem" },
  { mark: "\u05BB", name: "qibbuts" },
  { mark: "\u05BC", name: "dagesh" },
  { mark: "\u05C1", name: "shin dot" },
  { mark: "\u05C2", name: "sin dot" },
] as const;

/** Tiro Shift: vowels on the home row; dagesh / shin-sin / holem above. */
export const TIRO_SHIFT: Record<string, { mark: string; name: string }> = {
  a: { mark: "\u05B0", name: "shewa" },
  s: { mark: "\u05B1", name: "hataf segol" },
  d: { mark: "\u05B2", name: "hataf pathach" },
  f: { mark: "\u05B3", name: "hataf qamets" },
  g: { mark: "\u05B4", name: "hireq" },
  h: { mark: "\u05B5", name: "tsere" },
  j: { mark: "\u05B6", name: "segol" },
  k: { mark: "\u05B7", name: "pathach" },
  l: { mark: "\u05B8", name: "qamets" },
  ";": { mark: "\u05BB", name: "qibbuts" },
  q: { mark: "\u05BC", name: "dagesh" },
  w: { mark: "\u05C1", name: "shin dot" },
  e: { mark: "\u05C2", name: "sin dot" },
  y: { mark: "\u05B9", name: "holem" },
  "6": { mark: "\u05B9", name: "holem" },
};

export const QWERTY_TO_HE: Record<string, string> = {
  q: "/",
  w: "'",
  e: "ק",
  r: "ר",
  t: "א",
  y: "ט",
  u: "ו",
  i: "ן",
  o: "ם",
  p: "פ",
  a: "ש",
  s: "ד",
  d: "ג",
  f: "כ",
  g: "ע",
  h: "י",
  j: "ח",
  k: "ל",
  l: "ך",
  ";": "ף",
  z: "ז",
  x: "ס",
  c: "ב",
  v: "ה",
  b: "נ",
  n: "מ",
  m: "צ",
  ",": "ת",
  ".": "ץ",
  "/": ".",
  "-": "־",
};

/** Physical US key id for the Tiro board (matches Adeola's chart). */
export type TiroCap = {
  latin: string;
  he: string;
  label?: string;
  finger: FingerId;
};

export const TIRO_ROWS: TiroCap[][] = [
  [
    { latin: "e", he: "ק", finger: "lm" },
    { latin: "r", he: "ר", finger: "li" },
    { latin: "t", he: "א", finger: "li" },
    { latin: "y", he: "ט", finger: "ri" },
    { latin: "u", he: "ו", finger: "ri" },
    { latin: "i", he: "ן", finger: "rm" },
    { latin: "o", he: "ם", finger: "rr" },
    { latin: "p", he: "פ", finger: "rp" },
  ],
  [
    { latin: "a", he: "ש", finger: "lp" },
    { latin: "s", he: "ד", finger: "lr" },
    { latin: "d", he: "ג", finger: "lm" },
    { latin: "f", he: "כ", finger: "li" },
    { latin: "g", he: "ע", finger: "li" },
    { latin: "h", he: "י", finger: "ri" },
    { latin: "j", he: "ח", finger: "ri" },
    { latin: "k", he: "ל", finger: "rm" },
    { latin: "l", he: "ך", finger: "rr" },
    { latin: ";", he: "ף", finger: "rp" },
  ],
  [
    { latin: "z", he: "ז", finger: "lp" },
    { latin: "x", he: "ס", finger: "lr" },
    { latin: "c", he: "ב", finger: "lm" },
    { latin: "v", he: "ה", finger: "li" },
    { latin: "b", he: "נ", finger: "li" },
    { latin: "n", he: "מ", finger: "ri" },
    { latin: "m", he: "צ", finger: "ri" },
    { latin: ",", he: "ת", finger: "rm" },
    { latin: ".", he: "ץ", finger: "rr" },
  ],
];

const FINGER_BY_KEY: Record<string, FingerId> = {
  ק: "lm",
  ר: "li",
  א: "li",
  ט: "ri",
  ו: "ri",
  ן: "rm",
  ם: "rr",
  פ: "rp",
  ש: "lp",
  ד: "lr",
  ג: "lm",
  כ: "li",
  ע: "li",
  י: "ri",
  ח: "ri",
  ל: "rm",
  ך: "rr",
  ף: "rp",
  ז: "lp",
  ס: "lr",
  ב: "lm",
  ה: "li",
  נ: "li",
  מ: "ri",
  צ: "ri",
  ת: "rm",
  ץ: "rr",
};

const FINGER_BY_LATIN: Record<string, FingerId> = Object.fromEntries(
  TIRO_ROWS.flat().map((k) => [k.latin, k.finger]),
);

export function fingerFor(ch: string): FingerId | null {
  return FINGER_BY_KEY[ch] ?? FINGER_BY_LATIN[ch] ?? null;
}

export const HOME_FINGER_LATIN: Record<Exclude<FingerId, "th">, string> = {
  lp: "a",
  lr: "s",
  lm: "d",
  li: "f",
  ri: "j",
  rm: "k",
  rr: "l",
  rp: ";",
};

export const HE_TO_LATIN: Record<string, string> = Object.fromEntries(
  Object.entries(QWERTY_TO_HE)
    .filter(([, he]) => /[\u05D0-\u05EA']/.test(he))
    .map(([lat, he]) => [he, lat]),
);

export function mapPhysicalKey(key: string, shift = false): string | null {
  if (!key) return null;
  if (key === "Backspace") return "Backspace";
  if (/^[\u05D0-\u05EA]$/.test(key)) return key;
  if (NIKKUD_KEYS.some((n) => n.mark === key)) return key;
  if (/[\u05B0-\u05C7]/.test(key)) return key;
  const lower = key.length === 1 ? key.toLowerCase() : key;
  if (shift && TIRO_SHIFT[lower]) return TIRO_SHIFT[lower]!.mark;
  return QWERTY_TO_HE[lower] ?? null;
}

export function isLatinLetterKey(key: string): boolean {
  return key.length === 1 && /[a-zA-Z;,./']/.test(key);
}

export function latinForMark(mark: string): string | undefined {
  return Object.entries(TIRO_SHIFT).find(([, v]) => v.mark === mark)?.[0];
}

export function latinForGlyph(ch: string): string | null {
  if (!ch) return null;
  if (HE_TO_LATIN[ch]) return HE_TO_LATIN[ch];
  const fromNikkud = latinForMark(ch);
  if (fromNikkud) return fromNikkud;
  for (const row of TIRO_ROWS) {
    for (const cap of row) {
      if (cap.he === ch || cap.latin === ch) return cap.latin;
    }
  }
  return FINGER_BY_LATIN[ch] ? ch : null;
}

export function fingerForLatin(latin: string): FingerId | null {
  return FINGER_BY_LATIN[latin] ?? null;
}
