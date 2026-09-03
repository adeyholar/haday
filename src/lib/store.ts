import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALL_GAME_WEEK, shuffle, type VocabItem } from "./vocab";
import {
  applyRating,
  hydrateCard,
  isMastered,
  isWeak,
  nudgeDue,
  startOfDay,
  weaknessScore,
  type CardState,
  type Rating,
} from "./srs";
import {
  applyAlefBetResult,
  applyNounResult,
  applyStageResult,
  applySyllableResult,
  applyUltimateResult,
  defaultGame,
  hydrateGame,
  patchUltimateRun,
  startUltimateRun,
  type GameSnapshot,
  type GameStageId,
  type UltimateRun,
} from "./game";
import { stampRewards } from "./rewards";
import type { ProgressPayload } from "./progress";
import { twinsOf } from "./confusion";
import { observeBkt } from "./bkt";
import { updateElo } from "./elo";
import { findStudyItem } from "./tanakh-pool";

type ProgressMap = Record<string, CardState>;
export type FocusMode = "due" | "weak";

export type StudySnapshot = {
  cards: ProgressMap;
  week: number;
  direction: "he-en" | "en-he";
  focus: FocusMode;
  streak: number;
  lastStudyDay: number;
  sessions: number;
  keepStreak: number;
  lastKeepDay: number;
  game: GameSnapshot;
};

type StudyState = StudySnapshot & {
  ownerId: string | null;
  alefQueue: string[];
  rate: (id: string, rating: Rating) => void;
  setWeek: (week: number) => void;
  setDirection: (d: "he-en" | "en-he") => void;
  setFocus: (focus: FocusMode) => void;
  setAlefQueue: (keys: string[]) => void;
  completeGameStage: (
    chapter: number,
    stage: GameStageId,
    result: { stars: number; score: number; firstTryRate: number },
  ) => void;
  completeAlefBetLevel: (
    level: number,
    result: { stars: number; score: number; firstTryRate: number },
  ) => void;
  completeSyllableUnit: (
    unit: number,
    result: { stars: number; score: number; firstTryRate: number },
  ) => void;
  completeNounUnit: (
    unit: number,
    result: { stars: number; score: number; firstTryRate: number },
  ) => void;
  startUltimate: (ids: string[]) => void;
  saveUltimateRun: (run: UltimateRun) => void;
  finishUltimate: (pct: number) => void;
  finishKeep: () => void;
  hydrateRemote: (snap: ProgressPayload, ownerId: string) => void;
  reset: () => void;
};

function bumpStreak(lastStudyDay: number, streak: number, now: number) {
  const today = startOfDay(now);
  const yesterday = today - 86_400_000;
  if (lastStudyDay === today) return { streak, lastStudyDay };
  if (lastStudyDay === yesterday) return { streak: streak + 1, lastStudyDay: today };
  return { streak: 1, lastStudyDay: today };
}

export const useStudy = create<StudyState>()(
  persist(
    (set, get) => ({
      cards: {},
      week: ALL_GAME_WEEK,
      direction: "he-en",
      focus: "due",
      streak: 0,
      lastStudyDay: 0,
      sessions: 0,
      keepStreak: 0,
      lastKeepDay: 0,
      game: defaultGame(),
      ownerId: null,
      alefQueue: [],
      rate: (id, rating) => {
        const now = Date.now();
        const prev = hydrateCard(get().cards[id], now);
        const next = applyRating(prev, rating, now);
        const streakInfo = bumpStreak(get().lastStudyDay, get().streak, now);
        const game = stampRewards(get().game, streakInfo.streak, get().keepStreak);
        const cards = { ...get().cards, [id]: next };
        if (rating === "again") {
          for (const twin of twinsOf(id)) {
            if (twin === id) continue;
            cards[twin] = nudgeDue(cards[twin], now);
          }
        }
        if (id.startsWith("alef:") || id.startsWith("ch1-")) {
          observeBkt(id, rating !== "again");
        }
        const item = findStudyItem(id);
        if (item && item.chapter >= 2) {
          updateElo(item, rating !== "again");
        }
        set({
          cards,
          ...streakInfo,
          game,
          sessions: get().lastStudyDay === startOfDay(now) ? get().sessions : get().sessions + 1,
        });
      },
      setWeek: (week) => set({ week }),
      setDirection: (direction) => set({ direction }),
      setFocus: (focus) => set({ focus }),
      setAlefQueue: (alefQueue) => set({ alefQueue }),
      completeGameStage: (chapter, stage, result) => {
        const now = Date.now();
        const streakInfo = bumpStreak(get().lastStudyDay, get().streak, now);
        const game = stampRewards(applyStageResult(get().game, chapter, stage, result), streakInfo.streak, get().keepStreak);
        set({
          game,
          ...streakInfo,
          sessions: get().lastStudyDay === startOfDay(now) ? get().sessions : get().sessions + 1,
        });
      },
      completeAlefBetLevel: (level, result) => {
        const now = Date.now();
        const streakInfo = bumpStreak(get().lastStudyDay, get().streak, now);
        const game = stampRewards(applyAlefBetResult(get().game, level, result), streakInfo.streak, get().keepStreak);
        set({
          game,
          ...streakInfo,
          sessions: get().lastStudyDay === startOfDay(now) ? get().sessions : get().sessions + 1,
        });
      },
      completeSyllableUnit: (unit, result) => {
        const now = Date.now();
        const streakInfo = bumpStreak(get().lastStudyDay, get().streak, now);
        const game = stampRewards(applySyllableResult(get().game, unit, result), streakInfo.streak, get().keepStreak);
        set({
          game,
          ...streakInfo,
          sessions: get().lastStudyDay === startOfDay(now) ? get().sessions : get().sessions + 1,
        });
      },
      completeNounUnit: (unit, result) => {
        const now = Date.now();
        const streakInfo = bumpStreak(get().lastStudyDay, get().streak, now);
        const game = stampRewards(applyNounResult(get().game, unit, result), streakInfo.streak, get().keepStreak);
        set({
          game,
          ...streakInfo,
          sessions: get().lastStudyDay === startOfDay(now) ? get().sessions : get().sessions + 1,
        });
      },
      startUltimate: (ids) => {
        set({ game: startUltimateRun(get().game, ids) });
      },
      saveUltimateRun: (run) => {
        set({ game: patchUltimateRun(get().game, run) });
      },
      finishUltimate: (pct) => {
        const now = Date.now();
        const streakInfo = bumpStreak(get().lastStudyDay, get().streak, now);
        const game = stampRewards(applyUltimateResult(get().game, pct), streakInfo.streak, get().keepStreak);
        set({
          game,
          ...streakInfo,
          sessions: get().lastStudyDay === startOfDay(now) ? get().sessions : get().sessions + 1,
        });
      },
      finishKeep: () => {
        const now = Date.now();
        const today = startOfDay(now);
        const yesterday = today - 86_400_000;
        const last = get().lastKeepDay;
        if (last === today) return;
        const keepStreak = last === yesterday ? get().keepStreak + 1 : 1;
        const streakInfo = bumpStreak(get().lastStudyDay, get().streak, now);
        const game = stampRewards(get().game, streakInfo.streak, keepStreak);
        set({
          keepStreak,
          lastKeepDay: today,
          game,
          ...streakInfo,
          sessions: get().lastStudyDay === today ? get().sessions : get().sessions + 1,
        });
      },
      hydrateRemote: (snap, ownerId) =>
        set({
          cards: snap.cards,
          week: snap.week,
          direction: snap.direction,
          focus: snap.focus,
          streak: snap.streak,
          lastStudyDay: snap.lastStudyDay,
          sessions: snap.sessions,
          keepStreak: Number(snap.keepStreak) || Number(snap.game?.keepStreak) || 0,
          lastKeepDay: Number(snap.lastKeepDay) || Number(snap.game?.lastKeepDay) || 0,
          game: stampRewards(hydrateGame(snap.game), snap.streak, Number(snap.keepStreak) || Number(snap.game?.keepStreak) || 0),
          ownerId,
        }),
      reset: () =>
        set({
          cards: {},
          streak: 0,
          lastStudyDay: 0,
          sessions: 0,
          keepStreak: 0,
          lastKeepDay: 0,
          focus: "due",
          game: defaultGame(),
          alefQueue: [],
        }),
    }),
    {
      name: "davar-study-v1",
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StudyState>;
        const cards: ProgressMap = {};
        if (p.cards && typeof p.cards === "object") {
          for (const [id, card] of Object.entries(p.cards)) {
            cards[id] = hydrateCard(card);
          }
        }
        return {
          ...current,
          ...p,
          cards: Object.keys(cards).length ? cards : current.cards,
          game: stampRewards(hydrateGame(p.game), Number(p.streak) || 0, Number(p.keepStreak) || 0),
        };
      },
    },
  ),
);

export function snapshotOf(state: StudySnapshot): StudySnapshot {
  return {
    cards: state.cards,
    week: state.week,
    direction: state.direction,
    focus: state.focus,
    streak: state.streak,
    lastStudyDay: state.lastStudyDay,
    sessions: state.sessions,
    keepStreak: state.keepStreak,
    lastKeepDay: state.lastKeepDay,
    game: stampRewards(
      { ...hydrateGame(state.game), keepStreak: state.keepStreak, lastKeepDay: state.lastKeepDay },
      state.streak,
      state.keepStreak,
    ),
  };
}

export function statsFor(items: VocabItem[], cards: ProgressMap, now = Date.now()) {
  let due = 0;
  let mastered = 0;
  let seen = 0;
  let weak = 0;
  for (const item of items) {
    const c = cards[item.id];
    if (!c) {
      due += 1;
      continue;
    }
    seen += 1;
    if (c.due <= now) due += 1;
    if (isMastered(c)) mastered += 1;
    if (isWeak(c)) weak += 1;
  }
  return { due, mastered, seen, weak, total: items.length };
}

function byWeakness(cards: ProgressMap) {
  return (a: VocabItem, b: VocabItem) => weaknessScore(cards[b.id]) - weaknessScore(cards[a.id]);
}

export function dueQueue(items: VocabItem[], cards: ProgressMap, limit = 15, now = Date.now()) {
  const unseen: VocabItem[] = [];
  const due: VocabItem[] = [];
  for (const item of items) {
    const c = cards[item.id];
    if (!c) unseen.push(item);
    else if (c.due <= now) due.push(item);
  }
  due.sort((a, b) => {
    const weak = byWeakness(cards)(a, b);
    if (weak !== 0) return weak;
    return (cards[a.id].due ?? 0) - (cards[b.id].due ?? 0);
  });
  return [...due, ...shuffle(unseen)].slice(0, limit);
}

/** Missed / lapsing cards first, even if not due yet. */
export function weakQueue(items: VocabItem[], cards: ProgressMap, limit = 18) {
  return items
    .filter((item) => isWeak(cards[item.id]))
    .sort(byWeakness(cards))
    .slice(0, limit);
}

/** Random round: shuffle within weak / due / the rest, then deal `limit` cards. */
export function pickStudyRound(
  pool: VocabItem[],
  cards: ProgressMap,
  focus: FocusMode,
  limit = 18,
  now = Date.now(),
): VocabItem[] {
  if (!pool.length) return [];
  const n = Math.min(limit, pool.length);
  const weak = shuffle(pool.filter((item) => isWeak(cards[item.id])));
  if (focus === "weak" && weak.length) {
    if (weak.length >= n) return weak.slice(0, n);
    const rest = shuffle(pool.filter((item) => !weak.some((w) => w.id === item.id)));
    return shuffle([...weak, ...rest].slice(0, n));
  }
  const weakIds = new Set(weak.map((item) => item.id));
  const due = shuffle(
    pool.filter((item) => {
      if (weakIds.has(item.id)) return false;
      const c = cards[item.id];
      return !c || c.due <= now;
    }),
  );
  const dueIds = new Set(due.map((item) => item.id));
  const rest = shuffle(pool.filter((item) => !weakIds.has(item.id) && !dueIds.has(item.id)));
  return shuffle([...weak, ...due, ...rest].slice(0, n));
}

/** Adaptive: weak cards float to the front of whatever is due. */
export function studyQueue(items: VocabItem[], cards: ProgressMap, limit = 18, now = Date.now()) {
  const weak = weakQueue(items, cards, limit);
  const due = dueQueue(items, cards, limit, now);
  const seen = new Set<string>();
  const out: VocabItem[] = [];
  for (const item of [...weak, ...due]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export function queueForFocus(
  items: VocabItem[],
  cards: ProgressMap,
  focus: FocusMode,
  limit = 18,
  now = Date.now(),
) {
  return pickStudyRound(items, cards, focus, limit, now);
}

export function weakestOf(items: VocabItem[], cards: ProgressMap, n = 5) {
  return weakQueue(items, cards, n);
}

export function weightedQuizDeck(items: VocabItem[], cards: ProgressMap, n = 12): VocabItem[] {
  const bag = items.map((item) => ({ item, w: 0.35 + weaknessScore(cards[item.id]) }));
  const out: VocabItem[] = [];
  while (out.length < Math.min(n, bag.length)) {
    const total = bag.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < bag.length; idx++) {
      r -= bag[idx].w;
      if (r <= 0) break;
    }
    idx = Math.min(idx, bag.length - 1);
    out.push(bag[idx].item);
    bag.splice(idx, 1);
  }
  return out;
}
