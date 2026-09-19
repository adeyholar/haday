/** Israeli Hebrew keyboard (physical) — first-party map, not a third-party asset. */

export type FingerId = "lp" | "lr" | "lm" | "li" | "ri" | "rm" | "rr" | "rp";

export const FINGER_LABEL: Record<FingerId, string> = {
  lp: "left pinky",
  lr: "left ring",
  lm: "left middle",
  li: "left index",
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
};

const FINGER_BY_KEY: Record<string, FingerId> = {
  "'": "lp",
  ק: "lr",
  ר: "lm",
  א: "li",
  ט: "li",
  ו: "ri",
  ן: "ri",
  ם: "rm",
  פ: "rr",
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

export function fingerFor(ch: string): FingerId | null {
  return FINGER_BY_KEY[ch] ?? null;
}

export const HE_TO_LATIN: Record<string, string> = Object.fromEntries(
  Object.entries(QWERTY_TO_HE)
    .filter(([, he]) => /[\u05D0-\u05EA']/.test(he))
    .map(([lat, he]) => [he, lat]),
);

export function mapPhysicalKey(key: string): string | null {
  if (!key) return null;
  if (/^[\u05D0-\u05EA]$/.test(key)) return key;
  if (NIKKUD_KEYS.some((n) => n.mark === key)) return key;
  const lower = key.length === 1 ? key.toLowerCase() : key;
  return QWERTY_TO_HE[lower] ?? null;
}

export function isLatinLetterKey(key: string): boolean {
  return key.length === 1 && /[a-zA-Z;,./']/.test(key);
}
