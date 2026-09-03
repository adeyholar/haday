import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { CHAPTER_META } from "@/lib/game";
import { NOUN_UNITS } from "@/lib/nouns";
import { SYLLABLE_UNITS } from "@/lib/syllables";
import { GAME_CHAPTER_TITLES } from "@/lib/vocab";

export type AskTurn = { role: "user" | "assistant"; text: string };
export type AskResult = { ok: true; text: string } | { ok: false; error: string };

function lessonBrief(): string {
  const vocab = Object.entries(CHAPTER_META)
    .map(([n, m]) => `Ch ${n} ${m.title}: ${m.blurb}`)
    .join("; ");
  const syl = SYLLABLE_UNITS.map((u) => `${u.id}. ${u.title}`).join("; ");
  const nouns = NOUN_UNITS.map((u) => `${u.id}. ${u.title}`).join("; ");
  return `BBH chapter titles: ${vocab}.
Syllable units: ${syl}.
Noun units: ${nouns}.
Vocab chapter names: ${Object.entries(GAME_CHAPTER_TITLES)
    .map(([n, t]) => `${n}=${t}`)
    .join(", ")}.
Reading assignment: Genesis 1–5, Westminster Leningrad Codex (public domain) with World English Bible.`;
}

export const askHaday = createServerFn({ method: "POST" })
  .validator((input: { question: string; history?: AskTurn[] }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }): Promise<AskResult> => {
    const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "HaDay Hebraic AI is not connected on this site yet. Ask in class, or try again later." };
    }
    const question = (data.question || "").trim().slice(0, 800);
    if (question.length < 2) return { ok: false, error: "Type a question from the lesson." };
    const history = (data.history ?? []).slice(-8);

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content: `You are HaDay Hebraic AI, a tutor for a first-year Biblical Hebrew class using Basics of Biblical Hebrew (Pratico / Van Pelt). Be clear, brief, and kind. Answer from the lesson: letters, syllables, nouns, and the BBH vocabulary. Hebrew you cite must match the actual word (do not mix fire אֵשׁ with אשית “I will put”). Dual needs the ay diphthong. Game and Quiz use citation lemmas (יָם, not בַּיָּם). Genesis 1–5 is the first reading, public-domain Masoretic text. If you are not sure, say so. Do not reprint copyrighted textbook pages.

${lessonBrief()}`,
          },
          ...history.map((t) => ({ role: t.role, content: t.text })),
          { role: "user", content: question },
        ],
      }),
    });
    if (!res.ok) return { ok: false, error: `Could not reach HaDay Hebraic AI (${res.status}). Try again in a moment.` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = (body.choices?.[0]?.message?.content ?? "").trim();
    if (!text) return { ok: false, error: "No answer came back. Try a shorter question." };
    return { ok: true, text };
  });
