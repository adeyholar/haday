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
