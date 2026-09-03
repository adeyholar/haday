export type Rating = "again" | "good" | "easy";

export type CardState = {
  ease: number;
  interval: number;
  due: number;
  reps: number;
  lapses: number;
  last: number;
  hits: number;
  misses: number;
  recent: Array<"h" | "m">;
};

const MINUTE = 60_000;
const DAY = 86_400_000;
const RECENT_CAP = 8;

export function newCard(now = Date.now()): CardState {
  return { ease: 2.5, interval: 0, due: now, reps: 0, lapses: 0, last: 0, hits: 0, misses: 0, recent: [] };
}

/** Fill fields added after v1 persist snapshots. */
export function hydrateCard(card: Partial<CardState> | undefined, now = Date.now()): CardState {
  const base = newCard(now);
  if (!card || typeof card !== "object") return base;
  const recent = Array.isArray(card.recent) ? card.recent.filter((x) => x === "h" || x === "m") : [];
  return {
    ...base,
    ease: Number(card.ease) || base.ease,
    interval: Number(card.interval) || 0,
    due: Number(card.due) || base.due,
    reps: Number(card.reps) || 0,
    lapses: Number(card.lapses) || 0,
    last: Number(card.last) || 0,
    hits: Number(card.hits) || 0,
    misses: Number(card.misses) || 0,
    recent,
  };
}

export function isMastered(card: CardState | undefined): boolean {
  return !!card && card.reps >= 3 && card.interval >= 7;
}

function pushRecent(recent: Array<"h" | "m">, mark: "h" | "m"): Array<"h" | "m"> {
  const next = [...recent, mark];
  return next.length > RECENT_CAP ? next.slice(-RECENT_CAP) : next;
}

export function applyRating(card: CardState, rating: Rating, now = Date.now()): CardState {
  const prev = hydrateCard(card, now);
  if (rating === "again") {
    return {
      ...prev,
      ease: Math.max(1.3, prev.ease - 0.2),
      interval: 0,
      due: now + 10 * MINUTE,
      reps: 0,
      lapses: prev.lapses + 1,
      last: now,
      misses: prev.misses + 1,
      recent: pushRecent(prev.recent, "m"),
    };
  }

  const ease = rating === "easy" ? Math.min(3.2, prev.ease + 0.15) : prev.ease;
  let intervalDays: number;
  if (prev.reps === 0) intervalDays = rating === "easy" ? 3 : 1;
  else if (prev.reps === 1) intervalDays = rating === "easy" ? 7 : 3;
  else intervalDays = Math.max(1, Math.round(prev.interval * ease * (rating === "easy" ? 1.3 : 1)));

  return {
    ...prev,
    ease,
    interval: intervalDays,
    due: now + intervalDays * DAY,
    reps: prev.reps + 1,
    last: now,
    hits: prev.hits + 1,
    recent: pushRecent(prev.recent, "h"),
  };
}

export function startOfDay(ts = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 0–1, higher = needs more work. Unseen cards score low so misses outrank new. */
export function weaknessScore(card: CardState | undefined): number {
  if (!card) return 0.12;
  const c = hydrateCard(card);
  const attempts = c.hits + c.misses;
  if (attempts === 0) return 0.12;
  const missRate = c.misses / attempts;
  const recentMiss = c.recent.length ? c.recent.filter((x) => x === "m").length / c.recent.length : 0;
  const lapse = Math.min(1, c.lapses / 5);
  const easeGap = Math.max(0, (2.5 - c.ease) / 1.2);
  const freshMiss = c.misses > 0 && Date.now() - c.last < 2 * 86_400_000 ? 0.12 : 0;
  return Math.min(1, lapse * 0.28 + missRate * 0.32 + recentMiss * 0.22 + easeGap * 0.12 + freshMiss);
}

export function isWeak(card: CardState | undefined): boolean {
  if (!card) return false;
  const c = hydrateCard(card);
  return c.misses > 0 || c.lapses > 0 || weaknessScore(c) >= 0.28;
}

/** Queue a look-alike without counting a miss on it. */
export function nudgeDue(card: CardState | undefined, now = Date.now()): CardState {
  const prev = hydrateCard(card, now);
  return { ...prev, due: Math.min(prev.due || now, now) };
}
