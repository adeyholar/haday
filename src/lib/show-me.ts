import { CONSONANTS, FINAL_FORMS } from "@/lib/alphabet";

const MARK_NAME: Record<string, string> = {
  "\u05B0": "Shewa",
  "\u05B1": "Hateph seghol",
  "\u05B2": "Hateph pathach",
  "\u05B3": "Hateph qamets",
  "\u05B4": "Hireq",
  "\u05B5": "Tsere",
  "\u05B6": "Seghol",
  "\u05B7": "Pathach",
  "\u05B8": "Qamets",
  "\u05B9": "Holem",
  "\u05BB": "Qibbuts",
  "\u05BC": "Dagesh",
  "\u05C1": "Shin dot",
  "\u05C2": "Sin dot",
};

/** Nearby points, so the lit set is a real choice. */
const MARK_NEAR: Record<string, string[]> = {
  "\u05B0": ["\u05B4", "\u05B7"],
  "\u05B1": ["\u05B6", "\u05B0"],
  "\u05B2": ["\u05B7", "\u05B0"],
  "\u05B3": ["\u05B8", "\u05B0"],
  "\u05B4": ["\u05B0", "\u05B5"],
  "\u05B5": ["\u05B6", "\u05B4"],
  "\u05B6": ["\u05B5", "\u05B7"],
  "\u05B7": ["\u05B8", "\u05B6"],
  "\u05B8": ["\u05B7", "\u05B9"],
  "\u05B9": ["\u05B8", "\u05BB"],
  "\u05BB": ["\u05B9", "\u05B0", "\u05D5\u05BC"],
  "\u05BC": ["\u05C1", "\u05C2"],
  "\u05C1": ["\u05C2", "\u05BC"],
  "\u05C2": ["\u05C1", "\u05BC"],
};

const CONS_NEAR: Record<string, string> = {
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
  פ: "ב",
  ף: "פ",
  צ: "ס",
  ץ: "צ",
  ק: "כ",
  ט: "ת",
  ע: "א",
  א: "ע",
  ז: "ו",
  ל: "מ",
};

export type PieceSay = { name: string; sayId?: string; say: string; kind: "letter" | "point" };

export function pieceSay(insert: string): PieceSay {
  if (insert === "ש\u05C1") return { name: "Shin", sayId: "shin", say: "sheen", kind: "letter" };
  if (insert === "ש\u05C2") return { name: "Sin", sayId: "sin", say: "seen", kind: "letter" };
  const cons = CONSONANTS.find((c) => c.letter === insert);
  if (cons) return { name: cons.name, sayId: cons.id, say: cons.name, kind: "letter" };
  const fin = FINAL_FORMS.find((c) => c.letter === insert);
  if (fin) return { name: fin.name, say: fin.name, kind: "letter" };
  const name = MARK_NAME[insert] ?? "That mark";
  return { name, say: name, kind: "point" };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function seededOrder(arr: string[], seed: number): string[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const PAD_LETTERS = [...CONSONANTS.map((c) => c.letter), ...FINAL_FORMS.map((c) => c.letter)];

/** Three keys: the right one and two lookalikes. Order is shuffled so the answer is not always first. */
export function guideGlow(insert: string): string[] {
  if (insert === "\u05BB") {
    const trio = ["\u05BB", "\u05D5\u05BC", "\u05B9", "\u05B0"];
    return seededOrder(trio, hash(insert));
  }
  const near = MARK_NEAR[insert];
  if (near) {
    const trio = [insert];
    for (const n of near) {
      if (!trio.includes(n)) trio.push(n);
      if (trio.length === 3) break;
    }
    return seededOrder(trio, hash(insert));
  }
  const bare = [...insert][0] ?? insert;
  const extras: string[] = [];
  const like = CONS_NEAR[bare];
  if (like) {
    if (like === "ש") extras.push("ש\u05C1");
    else extras.push(like);
  }
  if (insert === "ש\u05C1") extras.push("ש\u05C2", "ס");
  if (insert === "ש\u05C2") extras.push("ש\u05C1", "ס");
  const idx = PAD_LETTERS.indexOf(insert);
  if (idx >= 0) {
    extras.push(PAD_LETTERS[(idx + 1) % PAD_LETTERS.length]!);
    extras.push(PAD_LETTERS[(idx - 1 + PAD_LETTERS.length) % PAD_LETTERS.length]!);
  }
  const trio = [insert];
  for (const n of extras) {
    if (n && n !== insert && !trio.includes(n)) trio.push(n);
    if (trio.length === 3) break;
  }
  return seededOrder(trio, hash(insert));
}
