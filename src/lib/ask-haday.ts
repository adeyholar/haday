import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertAdmin } from "@/lib/admin";
import { getSql } from "@/lib/db";
import {
  ASKS_PER_DAY,
  ASKS_PER_MONTH,
  MONTHLY_BUDGET_CENTS,
  STOP_AT_CENTS,
  addedCents,
  dayKey,
  monthKey,
  userMonthKey,
} from "@/lib/ask-budget";
import { ARTICLE_UNITS } from "@/lib/article";
import { CHAPTER_META } from "@/lib/game";
import { GRAMMAR_TRACKS } from "@/lib/grammar-tracks";
import { NOUN_UNITS } from "@/lib/nouns";
import { SYLLABLE_UNITS } from "@/lib/syllables";
import { GAME_CHAPTER_TITLES } from "@/lib/vocab";

export type AskTurn = { role: "user" | "assistant"; text: string };
export type AskResult = { ok: true; text: string } | { ok: false; error: string };
export type AskVerseContext = {
  ref: string;
  he: string;
  en: string;
  word?: string;
  tags?: string[];
  vocab?: string;
};

function verseBrief(ctx?: AskVerseContext): string {
  if (!ctx?.ref || !ctx.he) return "";
  const tags = (ctx.tags ?? []).join(", ");
  return `
The classmate has this verse open (do not swap the Hebrew):
${ctx.ref}
Hebrew: ${ctx.he}
English: ${ctx.en}
${ctx.word ? `Tapped word: ${ctx.word}` : ""}
${tags ? `Index tags for that form: ${tags}` : ""}
${ctx.vocab ? `Class vocab: ${ctx.vocab}` : ""}
Answer about this open verse and form. If you are not sure of a root or a rare parsing, say so. Do not invent a different word.`;
}

function lessonBrief(): string {
  const vocab = Object.entries(CHAPTER_META)
    .map(([n, m]) => `Ch ${n} ${m.title}: ${m.blurb}`)
    .join("; ");
  const syl = SYLLABLE_UNITS.map((u) => `${u.id}. ${u.title}`).join("; ");
  const nouns = NOUN_UNITS.map((u) => `${u.id}. ${u.title}`).join("; ");
  const article = ARTICLE_UNITS.map((u) => `${u.id}. ${u.title}`).join("; ");
  const grammar = GRAMMAR_TRACKS.map(
    (t) => `${t.title}: ${t.units.map((u) => `${u.id}. ${u.title}`).join("; ")}`,
  ).join(" | ");
  return `BBH chapter titles: ${vocab}.
Syllable units: ${syl}.
Noun units: ${nouns}.
Article and vav units: ${article}.
Grammar topics (original notes, Tanakh examples — not textbook chapters): ${grammar}.
Vocab chapter names: ${Object.entries(GAME_CHAPTER_TITLES)
    .map(([n, t]) => `${n}=${t}`)
    .join(", ")}.
Reading assignment: Genesis 1–5, Westminster Leningrad Codex (public domain) with World English Bible.`;
}

export const askHaday = createServerFn({ method: "POST" })
  .validator((input: { question: string; history?: AskTurn[]; context?: AskVerseContext }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<AskResult> => {
    const claudeKey = process.env.ANTHROPIC_API_KEY?.trim();
    const grokKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    if (!claudeKey && !grokKey) {
      return { ok: false, error: "HaDay Hebraic AI is not connected on this site yet. Ask in class, or try again later." };
    }
    const question = (data.question || "").trim().slice(0, 800);
    if (question.length < 2) return { ok: false, error: "Type a question from the lesson." };
    const history = (data.history ?? []).slice(-8);
    const system = `You are HaDay Hebraic AI, a tutor for a first-year Biblical Hebrew class using Basics of Biblical Hebrew (Pratico / Van Pelt). Be clear, brief, and kind. Answer from the lesson: letters, syllables, nouns, the article הַ, the conjunction וְ, prepositions, adjectives, pronouns, existence particles, construct chains, numbers, and the BBH vocabulary. Hebrew you cite must match the actual word (do not mix fire אֵשׁ with אשית “I will put”). Dual needs the ay diphthong. Game and Quiz use citation lemmas (יָם, not בַּיָּם). The ordinary article is הַ plus dagesh; gutturals and resh refuse dagesh (compensatory הָ on א ע ר, virtual הַ on ה ח, seghol הֶ before unaccented הָ חָ עָ). Vav is always prefixed: default וְ, bump וּ before ב מ פ, hateph match, יְ → וִי, אֱלֹהִים → וֵאלֹהִים. Inseparable prepositions are בְּ כְּ לְ; מִן may assimilate. Adjectives agree and follow attributively, or predicate without matching article. Independent pronouns add emphasis. Construct is X of Y. Numbers 3–10 often flip gender. Week 3 reads chapters 4 and 5 together; games stay chapter by chapter. Genesis 1–5 is the first reading, public-domain Masoretic text. If you are not sure, say so. Do not reprint copyrighted textbook pages.
${lessonBrief()}
${verseBrief(data.context)}`;

    if (claudeKey) {
      const gate = await askGate(context.userId);
      if (gate) return { ok: false, error: gate };
      const model = (process.env.ANTHROPIC_MODEL || "claude-haiku-5-5").trim();
      const answered = await callClaude(claudeKey, model, system, history, question);
      if (answered.ok) {
        await rememberAsk(context.userId, model, answered.input, answered.output);
        return { ok: true, text: answered.text };
      }
      if (!grokKey) return answered;
    }

    const grok = await callGrok(grokKey!, system, history, question);
    return grok;
  });

export type AskMeter = { cents: number; capCents: number; calls: number };

export const getAskMeter = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AskMeter | null> => {
    try {
      await assertAdmin(context.userId);
    } catch {
      return null;
    }
    try {
      await ensureAskMeter();
      const sql = await getSql();
      const rows = await sql<{ calls: number; cents: number }>`
        select calls, cents from ask_meter where bucket = ${monthKey()}
      `;
      return {
        cents: Number(rows[0]?.cents) || 0,
        capCents: MONTHLY_BUDGET_CENTS,
        calls: Number(rows[0]?.calls) || 0,
      };
    } catch (err) {
      console.error("[ask] meter", err);
      return { cents: 0, capCents: MONTHLY_BUDGET_CENTS, calls: 0 };
    }
  });

let meterReady: Promise<void> | null = null;

async function ensureAskMeter() {
  meterReady ??= (async () => {
    const sql = await getSql();
    await sql.query(`
      create table if not exists ask_meter (
        bucket text primary key,
        calls integer not null default 0,
        cents integer not null default 0
      )
    `);
  })().catch((err) => {
    meterReady = null;
    throw err;
  });
  return meterReady;
}

async function askGate(userId: string): Promise<string | null> {
  try {
    await ensureAskMeter();
    const sql = await getSql();
    let owner = false;
    try {
      await assertAdmin(userId);
      owner = true;
    } catch {
      owner = false;
    }
    const now = new Date();
    const rows = await sql<{ bucket: string; calls: number; cents: number }>`
      select bucket, calls, cents from ask_meter
      where bucket in (${monthKey(now)}, ${userMonthKey(userId, now)}, ${dayKey(userId, now)})
    `;
    const by = new Map(rows.map((row) => [row.bucket, row]));
    const month = by.get(monthKey(now));
    if ((Number(month?.cents) || 0) >= STOP_AT_CENTS) {
      return "HaDay Hebraic AI has used this month’s help. Ask in class until next month.";
    }
    if (owner) return null;
    const day = by.get(dayKey(userId, now));
    if ((Number(day?.calls) || 0) >= ASKS_PER_DAY) {
      return "You have used today’s lesson help. Come back tomorrow, or ask in class.";
    }
    const mine = by.get(userMonthKey(userId, now));
    if ((Number(mine?.calls) || 0) >= ASKS_PER_MONTH) {
      return "You have used this month’s lesson help. Ask in class until next month.";
    }
    return null;
  } catch (err) {
    console.error("[ask] gate", err);
    return null;
  }
}

async function rememberAsk(userId: string, model: string, input: number, output: number) {
  try {
    await ensureAskMeter();
    const sql = await getSql();
    const now = new Date();
    const cents = addedCents(model, input, output);
    const buckets = [monthKey(now), userMonthKey(userId, now), dayKey(userId, now)];
    for (const bucket of buckets) {
      const add = bucket.startsWith("m:") ? cents : 0;
      await sql`
        insert into ask_meter (bucket, calls, cents)
        values (${bucket}, 1, ${add})
        on conflict (bucket) do update set
          calls = ask_meter.calls + 1,
          cents = ask_meter.cents + ${add}
      `;
    }
  } catch (err) {
    console.error("[ask] remember", err);
  }
}

async function callClaude(
  apiKey: string,
  model: string,
  system: string,
  history: AskTurn[],
  question: string,
): Promise<{ ok: true; text: string; input: number; output: number } | { ok: false; error: string }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      temperature: 0.2,
      system,
      messages: [
        ...history.map((turn) => ({ role: turn.role, content: turn.text })),
        { role: "user", content: question },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `Could not reach HaDay Hebraic AI (${res.status}). Try again in a moment.` };
  const body = (await res.json()) as {
    content?: { type?: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = (body.content ?? [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n")
    .trim();
  if (!text) return { ok: false, error: "No answer came back. Try a shorter question." };
  return {
    ok: true,
    text,
    input: Number(body.usage?.input_tokens) || 0,
    output: Number(body.usage?.output_tokens) || 0,
  };
}

async function callGrok(
  apiKey: string,
  system: string,
  history: AskTurn[],
  question: string,
): Promise<AskResult> {
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
        { role: "system", content: system },
        ...history.map((turn) => ({ role: turn.role, content: turn.text })),
        { role: "user", content: question },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `Could not reach HaDay Hebraic AI (${res.status}). Try again in a moment.` };
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = (body.choices?.[0]?.message?.content ?? "").trim();
  if (!text) return { ok: false, error: "No answer came back. Try a shorter question." };
  return { ok: true, text };
}
