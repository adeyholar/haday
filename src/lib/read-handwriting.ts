import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { normalizeHebrew } from "@/lib/hebrew";

const MAX_IMAGE_CHARS = 1_800_000;

type Ok = { ok: true; hebrew: string; verdict: "exact" | "close" | "different" };
type Err = { ok: false; error: string };
export type ReadHandwritingResult = Ok | Err;

export const readHandwriting = createServerFn({ method: "POST" })
  .validator((input: { image: string; expected: string; mode?: "word" | "letter" | "vowel" }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }): Promise<ReadHandwritingResult> => {
    const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error:
          "The ink reader is not connected on this site (no cloud key). Letter exams now check the shape on the pad. For full words, type the Hebrew instead.",
      };
    }
    if (!data.image || data.image.length < 32) return { ok: false, error: "Empty drawing." };
    if (data.image.length > MAX_IMAGE_CHARS) return { ok: false, error: "Drawing is too large. Clear and try a simpler stroke." };

    const mode = data.mode === "letter" || data.mode === "vowel" ? data.mode : "word";
    const target = mode === "word" ? normalizeHebrew(data.expected) : data.expected.trim();
    const prompt =
      mode === "letter"
        ? `You are checking a student's single Biblical Hebrew letter on a white pad (black ink).

The assigned letter is: ${target || "(unknown)"}

1. Transcribe the one letter you actually see (א-ת including finals ךםןףץ). For shin/sin include the dot: שׁ or שׂ. Ignore English and decoration.
2. Judge whether the ink is that letter.

Lookalikes: ד/ר, ב/כ, ו/י/ן, ה/ח/ת, ס/ם, ג/נ. Final vs regular (כ/ך, מ/ם, נ/ן, פ/ף, צ/ץ) must not be treated as the same. Shin שׁ vs sin שׂ must not be treated as the same.

Reply JSON only, no markdown:
{"hebrew":"...one letter...","verdict":"exact"|"close"|"different"}

exact = clearly the assigned letter.
close = messy but recognizable as that letter (or missing only the shin/sin dot).
different = another letter, unreadable, or the wrong final/regular form.
If nothing readable: {"hebrew":"","verdict":"different"}.
Do not translate.`
        : mode === "vowel"
          ? `You are checking a student's Biblical Hebrew vowel on a white pad (black ink).

The assigned vowel is written: ${target || "(unknown)"}

Students write the vowel on the consonant bet (ב) unless the vowel uses a vowel letter (he, vav, or yod).

1. Transcribe exactly what you see, including ב or ו/י/ה and the niqqud (and dagesh if present). Example shapes: בָ qamets, בַ patah, בֵ tsere, בֶ segol, בִ hireq, בֹ holem, בֻ qibbuts, בְ shewa, בוּ shureq, בוֹ holem-vav.
2. These pairs are different vowels: qamets בָ vs patah בַ; tsere בֵ vs segol בֶ; shureq בוּ vs qibbuts בֻ; holem בֹ vs holem-vav בוֹ.

Reply JSON only:
{"hebrew":"...glyph...","verdict":"exact"|"close"|"different"}

exact = the assigned vowel (carrier letter may be bet).
close = messy but the same vowel.
different = another vowel or unreadable.
If nothing readable: {"hebrew":"","verdict":"different"}.
Do not translate.`
          : `You are checking a student's Biblical Hebrew handwriting on a white pad (black ink, right-to-left).

The assigned lemma (consonants only) is: ${target || "(unknown)"}

1. Transcribe the consonants you actually see (א-ת). Ignore English, ruling, and decoration. Niqqud is optional and should be omitted from "hebrew".
2. Judge whether the ink is that lemma.

Lookalike student shapes: ד/ר, ב/כ, ו/י/ן, ה/ח/ת, ס/ם, ג/נ. A missing or extra mater (ו/י) can still be close.

Reply JSON only, no markdown:
{"hebrew":"...consonants in word order...","verdict":"exact"|"close"|"different"}

exact = clearly the assigned lemma (vowels may be missing).
close = same word with one lookalike, missing mater, or messy but recognizable.
different = another word, extra letters, or unreadable.
If nothing readable: {"hebrew":"","verdict":"different"}.
Do not mark exact unless the strokes support it. Do not translate.`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0,
        max_tokens: 120,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Could not read the writing (${res.status}). Try again in a moment.` };
    }

    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    const parsed = parseReply(text);
    return { ok: true, hebrew: parsed.hebrew, verdict: parsed.verdict };
  });

function parseReply(text: string): { hebrew: string; verdict: "exact" | "close" | "different" } {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { hebrew?: unknown; verdict?: unknown };
      const hebrew = typeof parsed.hebrew === "string" ? parsed.hebrew.trim() : "";
      const v = parsed.verdict;
      const verdict = v === "exact" || v === "close" || v === "different" ? v : "different";
      return { hebrew, verdict };
    } catch {
      /* fall through */
    }
  }
  const letters = trimmed.replace(/[`*"']/g, "").match(/[\u05D0-\u05EA\u0591-\u05C7]+/g);
  return { hebrew: letters ? letters.join("") : "", verdict: "different" };
}
