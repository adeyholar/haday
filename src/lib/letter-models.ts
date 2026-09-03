import { foldLetterGlyph } from "@/lib/hebrew";

/** IIBS Biblical Hebrew A writing chart: block letters on a two-line stave. */
export type LetterBand = "body" | "ascender" | "descender" | "hang" | "small";

export type LetterModel = {
  glyph: string;
  band: LetterBand;
  hint: string;
};

const MODELS: Record<string, LetterModel> = {
  א: { glyph: "א", band: "body", hint: "Follow the X: a diagonal and two arms. Size can vary." },
  ב: { glyph: "ב", band: "body", hint: "Roof, right wall, and a floor. Open on the left." },
  ג: { glyph: "ג", band: "body", hint: "Stem with a foot kicking left, as on the chart." },
  ד: { glyph: "ד", band: "body", hint: "Roof first, then the right stem down. No extra left wall." },
  ה: { glyph: "ה", band: "body", hint: "Roof and right stem; left stem does not join the roof." },
  ו: { glyph: "ו", band: "body", hint: "Short inverted L. Between the lines — not a long final nun." },
  ז: { glyph: "ז", band: "body", hint: "Short roof bar, then a stem from the middle. Stays on the line." },
  ח: { glyph: "ח", band: "body", hint: "Roof joining two full stems." },
  ט: { glyph: "ט", band: "body", hint: "A rounded U with a small inner hook. Not a closed samekh." },
  י: { glyph: "י", band: "small", hint: "Tiny inverted L in the upper body." },
  כ: { glyph: "כ", band: "body", hint: "Open backwards C. No long floor like bet." },
  ך: { glyph: "ך", band: "descender", hint: "Final chaf: long stem below the bottom line." },
  ל: { glyph: "ל", band: "ascender", hint: "Rises above the top line, then hooks right and down." },
  מ: { glyph: "מ", band: "body", hint: "Two peaks, open at the bottom-left — not a closed box." },
  ם: { glyph: "ם", band: "body", hint: "Final mem: closed square on the line. It does not drop." },
  נ: { glyph: "נ", band: "body", hint: "Short open nun on the line. Not a descender." },
  ן: { glyph: "ן", band: "descender", hint: "Final nun: one long stem below the line. No zayin roof." },
  ס: { glyph: "ס", band: "body", hint: "Closed body with a small cap that overhangs left. Not a round O, and not tet’s inner hook." },
  ע: { glyph: "ע", band: "body", hint: "Two arms meeting like a Y, as on the chart. Open at the top — a rounded U is fine." },
  פ: { glyph: "פ", band: "body", hint: "Open pe with a nose inside." },
  ף: { glyph: "ף", band: "descender", hint: "Final fay: pe that drops below the line." },
  צ: { glyph: "צ", band: "body", hint: "Two arms and a base. On the line, not a long tail." },
  ץ: { glyph: "ץ", band: "descender", hint: "Final tsadee: a Y whose stem drops below the line." },
  ק: { glyph: "ק", band: "hang", hint: "Like resh: open on the left, right leg hanging a little below the line. Not a Latin P." },
  ר: { glyph: "ר", band: "body", hint: "Rounded roof and right stem. No extra left wall." },
  ש: { glyph: "ש", band: "body", hint: "Three arms, like a W. Arms can be uneven. Shin-dot right, sin-dot left." },
  ת: { glyph: "ת", band: "body", hint: "Like chet, with a small left foot on the floor." },
};

export function modelGlyph(expected: string): string {
  const g = foldLetterGlyph(expected);
  if (g.startsWith("ש")) return "ש";
  return g.replace(/[^\u05D0-\u05EA]/g, "").slice(0, 1);
}

export function letterModel(expected: string): LetterModel | null {
  const id = modelGlyph(expected);
  return MODELS[id] ?? null;
}

export function writingHint(expected: string): string {
  return letterModel(expected)?.hint ?? "Copy the chart stroke. Big or small is fine if the shape matches.";
}

export function staveRegion(expected: string): { top: number; bottom: number } {
  const band = letterModel(expected)?.band ?? "body";
  if (band === "ascender") return { top: 0.04, bottom: 0.66 };
  if (band === "descender") return { top: 0.22, bottom: 0.96 };
  if (band === "hang") return { top: 0.22, bottom: 0.86 };
  if (band === "small") return { top: 0.22, bottom: 0.48 };
  return { top: 0.24, bottom: 0.66 };
}
