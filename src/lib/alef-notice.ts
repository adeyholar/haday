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
  bet: "Letter 1 of 6 — start on the right. בּ has a dot inside (dagesh) and a shewa under it. This is where the word begins.",
  resh: "Letter 2. ר with two dots under it (tsere). The long sound in the middle of the word rides on this letter.",
  alef: "Letter 3. א is quiet here. It has a shape but no sound of its own in this word. See it; do not name a rule yet.",
  shin: "Letter 4. שׁ — the dot sits on the right of ש. A single dot (hireq) sits under it.",
  yod: "Letter 5. י is the smallest letter. It sits inside the word, not at either end.",
  tav: "Letter 6 — the left side. ת closes the word. You have now walked the first word of the Book, right to left.",
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
