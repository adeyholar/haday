export type Rating = "again" | "good" | "easy" | "reveal";

export type CardState = {
  ease: number;
  interval: number;
  due: number;
  reps: number;
  lapses: number;
  last: number;
  hits: number;
  misses: number;
  /** Times the answer was shown (Tell me / gave up) — high weak. */
  reveals: number;
  recent: Array<"h" | "m">;
};

const MINUTE = 60_000;
const DAY = 86_400_000;
const RECENT_CAP = 8;

export function newCard(now = Date.now()): CardState {
  return {
    ease: 2.5,
    interval: 0,
    due: now,
    reps: 0,
    lapses: 0,
    last: 0,
    hits: 0,
    misses: 0,
    reveals: 0,
    recent: [],
  };
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
    reveals: Number(card.reveals) || 0,
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
  if (rating === "reveal") {
    return {
      ...prev,
      ease: Math.max(1.3, prev.ease - 0.35),
      interval: 0,
      due: now + 2 * MINUTE,
      reps: 0,
      lapses: prev.lapses + 2,
      last: now,
      misses: prev.misses + 1,
      reveals: prev.reveals + 1,
      recent: pushRecent(prev.recent, "m"),
    };
  }
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
  const told = Math.max(0, c.reveals);
  const missOnly = Math.max(0, c.misses - told);
  const revealShare = told / attempts;
  const missShare = missOnly / attempts;
  const recentMiss = c.recent.length ? c.recent.filter((x) => x === "m").length / c.recent.length : 0;
  const lapse = Math.min(1, c.lapses / 6);
  const easeGap = Math.max(0, (2.5 - c.ease) / 1.2);
  const freshTold = told > 0 && Date.now() - c.last < 2 * DAY ? 0.16 : 0;
  const freshMiss = missOnly > 0 && told === 0 && Date.now() - c.last < 2 * DAY ? 0.08 : 0;
  return Math.min(
    1,
    revealShare * 0.42 +
      missShare * 0.22 +
      recentMiss * 0.14 +
      lapse * 0.1 +
      easeGap * 0.08 +
      freshTold +
      freshMiss,
  );
}

export function isWeak(card: CardState | undefined): boolean {
  if (!card) return false;
  const c = hydrateCard(card);
  return c.misses > 0 || c.lapses > 0 || c.reveals > 0 || weaknessScore(c) >= 0.28;
}

/** Told the answer — highest slot in the weak book. */
export function isHighWeak(card: CardState | undefined): boolean {
  if (!card) return false;
  const c = hydrateCard(card);
  return c.reveals > 0 && weaknessScore(c) >= 0.4;
}

/** Queue a look-alike without counting a miss on it. */
export function nudgeDue(card: CardState | undefined, now = Date.now()): CardState {
  const prev = hydrateCard(card, now);
  return { ...prev, due: Math.min(prev.due || now, now) };
}
