const KEY = "haday-bkt-v1";
const EVENT = "haday-bkt";

/** Classic BKT priors: unlearned, learn-on-trial, slip, guess. */
const P_L0 = 0.12;
const P_T = 0.28;
const P_S = 0.1;
const P_G = 0.2;

export type BktSkill = { pL: number };

type Bank = Record<string, BktSkill>;

function load(): Bank {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Bank = {};
    for (const [k, v] of Object.entries(parsed as Record<string, { pL?: number }>)) {
      const pL = Number(v?.pL);
      if (Number.isFinite(pL)) out[k] = { pL: Math.max(0.02, Math.min(0.99, pL)) };
    }
    return out;
  } catch {
    return {};
  }
}

function save(bank: Bank) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bank));
  } catch {
    /* quota */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function pKnow(id: string): number {
  return load()[id]?.pL ?? P_L0;
}

/** Update P(knows this skill) after a trial. */
export function observeBkt(id: string, correct: boolean): number {
  const bank = load();
  let pL = bank[id]?.pL ?? P_L0;
  const pCorrect = pL * (1 - P_S) + (1 - pL) * P_G;
  if (correct) pL = (pL * (1 - P_S)) / Math.max(1e-6, pCorrect);
  else pL = (pL * P_S) / Math.max(1e-6, 1 - pCorrect);
  pL = pL + (1 - pL) * P_T;
  pL = Math.max(0.02, Math.min(0.99, pL));
  bank[id] = { pL };
  save(bank);
  return pL;
}

export function pickByBkt<T extends { key?: string; id: string }>(pool: T[], limit: number): T[] {
  if (pool.length <= limit) return [...pool];
  const scored = pool.map((item, i) => ({
    item,
    p: pKnow(item.key ?? item.id),
    i,
  }));
  scored.sort((a, b) => a.p - b.p || a.i - b.i);
  const take = scored.slice(0, Math.min(pool.length, Math.max(limit, Math.ceil(limit * 1.4))));
  for (let i = take.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [take[i], take[j]] = [take[j], take[i]];
  }
  return take.slice(0, limit).map((x) => x.item);
}
