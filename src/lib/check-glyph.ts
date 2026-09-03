import { matchLetter, matchVowel, type HandMatch } from "@/lib/hebrew";
import { verifyLetterInk, type InkStroke } from "@/lib/letter-shape";
import { rememberPassingHand, samplesFor, handBar } from "@/lib/hand-style";
import { readHandwriting } from "@/lib/read-handwriting";
import { takeWriteCheck } from "@/lib/write-cap";

export type GlyphCheck = { match: HandMatch; read: string; note?: string; counted?: boolean };

export async function checkGlyphInk(
  image: string,
  expected: string,
  mode: "letter" | "vowel",
  strokes?: InkStroke[],
  opts?: { trace?: boolean; height?: number },
): Promise<GlyphCheck> {
  if (mode === "letter") {
    const local = verifyLetterInk(strokes ?? [], expected, {
      trace: opts?.trace,
      height: opts?.height,
      samples: samplesFor(expected),
      bar: handBar(expected),
    });
    if (local.match === "exact" || local.match === "close" || local.match === "wrong") {
      if ((local.match === "exact" || local.match === "close") && strokes?.length) {
        rememberPassingHand(expected, strokes, opts?.height);
      }
      return { match: local.match, read: local.read, note: local.note, counted: true };
    }
  }

  try {
    const res = await readHandwriting({ data: { image, expected, mode } });
    if (res.ok) {
      takeWriteCheck();
      const compared = mode === "vowel" ? matchVowel(expected, res.hebrew) : matchLetter(expected, res.hebrew);
      let match = compared.match;
      if (match !== "exact" && res.verdict === "exact" && compared.readN) match = "exact";
      else if (match === "wrong" && res.verdict === "close") match = "close";
      return { match, read: res.hebrew || compared.readN || "", counted: true };
    }
  } catch {
    /* reader offline */
  }

  return {
    match: "empty",
    read: "",
    note: "Could not judge that ink. Count it only if the letter looks right.",
    counted: false,
  };
}
