import { CONSONANTS, type HebrewLetter } from "@/lib/alphabet";
import genesis from "@/lib/genesis-1-5.json";

const CONS = /[\u05D0-\u05EA]/;
const SIN_DOT = "\u05C2";

export type BereshitStep = {
  glyph: string;
  cons: string;
  letterId: string;
  name: string;
  note: string;
};

const dump = genesis as { chapters: Record<string, Array<{ words: string[] }>> };
export const BERESHIT_WORD = dump.chapters["1"]?.[0]?.words[0] ?? "בְּרֵאשִׁית";

const NOTES: Record<string, string> = {
  bet: "Start on the right. This is ב with a shewa under it.",
  resh: "ר comes next. A long mark sits under it.",
  alef: "א is quiet here. See the shape; do not name a rule yet.",
  shin: "שׁ — the dot is on the right of ש.",
  yod: "י is the small letter in the middle of the word.",
  tav: "ת closes the word on the left.",
};

export function splitConsonantGlyphs(word: string): { glyph: string; cons: string }[] {
  const chars = [...word];
  const out: { glyph: string; cons: string }[] = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i]!;
    if (!CONS.test(ch)) {
      i += 1;
      continue;
    }
    i += 1;
    const marks: string[] = [];
    while (i < chars.length && !CONS.test(chars[i]!)) {
      marks.push(chars[i]!);
      i += 1;
    }
    out.push({ glyph: ch + marks.join(""), cons: ch });
  }
  return out;
}

export function letterIdForGlyph(cons: string, glyph: string): string | undefined {
  if (cons === "ש") return glyph.includes(SIN_DOT) ? "sin" : "shin";
  return CONSONANTS.find((l) => l.letter === cons)?.id;
}

export function bereshitSteps(word = BERESHIT_WORD): BereshitStep[] {
  return splitConsonantGlyphs(word).flatMap((part) => {
    const letterId = letterIdForGlyph(part.cons, part.glyph);
    const letter = CONSONANTS.find((l) => l.id === letterId);
    if (!letterId || !letter) return [];
    return [
      {
        glyph: part.glyph,
        cons: part.cons,
        letterId,
        name: letter.name,
        note: NOTES[letterId] ?? `This is ${letter.letter}. Hear its name.`,
      },
    ];
  });
}

export function alefBetWalk(): HebrewLetter[] {
  return CONSONANTS;
}
