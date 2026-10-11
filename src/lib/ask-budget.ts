/** $140 Claude credit, in cents. Stop a little early so the last answer cannot run past it. */
export const MONTHLY_BUDGET_CENTS = 14_000;
export const STOP_AT_CENTS = 12_600;

export const ASKS_PER_DAY = 40;
export const ASKS_PER_MONTH = 250;

/** Cents per 1M tokens. Unknown models use Sonnet rates so the cap stops early. */
export function modelRates(model: string): { inPerM: number; outPerM: number } {
  const name = model.toLowerCase();
  if (name.includes("haiku")) return { inPerM: 10, outPerM: 50 };
  if (name.includes("sonnet")) return { inPerM: 200, outPerM: 1000 };
  if (name.includes("opus") || name.includes("fable")) return { inPerM: 400, outPerM: 2000 };
  return { inPerM: 200, outPerM: 1000 };
}

export function addedCents(model: string, inputTokens: number, outputTokens: number): number {
  const rates = modelRates(model);
  const input = Math.max(0, inputTokens);
  const output = Math.max(0, outputTokens);
  return Math.ceil((input * rates.inPerM + output * rates.outPerM) / 1_000_000);
}

export function monthKey(now = new Date()): string {
  return `m:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dayKey(userId: string, now = new Date()): string {
  const day = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  return `d:${day}:${userId}`;
}

export function userMonthKey(userId: string, now = new Date()): string {
  return `u:${monthKey(now).slice(2)}:${userId}`;
}

const ASK_FIELD = 800;

export function clipAskHistory(history: { role?: string; text?: string }[] | undefined): { role: "user" | "assistant"; text: string }[] {
  const out: { role: "user" | "assistant"; text: string }[] = [];
  for (const turn of (history ?? []).slice(-8)) {
    if (!turn || (turn.role !== "user" && turn.role !== "assistant")) continue;
    const text = String(turn.text ?? "").trim().slice(0, ASK_FIELD);
    if (text) out.push({ role: turn.role, text });
  }
  return out;
}

export function clipVerse<T extends { ref?: string; he?: string; en?: string; word?: string; tags?: string[]; vocab?: string }>(
  ctx?: T,
): T | undefined {
  if (!ctx?.ref || !ctx.he) return undefined;
  const clip = (value: string | undefined, max = ASK_FIELD) => String(value ?? "").slice(0, max);
  return {
    ...ctx,
    ref: clip(ctx.ref, 80),
    he: clip(ctx.he),
    en: clip(ctx.en),
    word: ctx.word ? clip(ctx.word, 80) : undefined,
    tags: (ctx.tags ?? []).slice(0, 12).map((tag) => clip(tag, 80)).filter(Boolean),
    vocab: ctx.vocab ? clip(ctx.vocab) : undefined,
  };
}
