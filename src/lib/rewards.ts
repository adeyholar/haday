import { GAME_CHAPTER_MAX, GAME_STAGES, chapterRecord, type GameSnapshot } from "@/lib/game";

export const BADGES = [
  { id: "first-win", title: "First win", hint: "Clear your first game stage" },
  { id: "win-3", title: "Win streak", hint: "Clear 3 stages in a row" },
  { id: "win-7", title: "Hot streak", hint: "Clear 7 stages in a row" },
  { id: "first-chapter", title: "Level 1", hint: "Clear chapter 1" },
  { id: "rung-5", title: "Rung 5", hint: "Clear through chapter 5" },
  { id: "rung-11", title: "Halfway", hint: "Clear through chapter 11" },
  { id: "summit", title: "Summit", hint: "Clear all 19 chapters" },
  { id: "streak-3", title: "3-day flame", hint: "Show up 3 days in a row" },
  { id: "streak-7", title: "Week flame", hint: "Show up 7 days in a row" },
  { id: "streak-14", title: "Fortnight", hint: "Show up 14 days in a row" },
  { id: "perfect", title: "Three stars", hint: "Score three stars on a stage" },
  { id: "ultimate-90", title: "The Full Scroll", hint: "Score 90% on the Ultimate Challenge" },
  { id: "ultimate-100", title: "Crown of the Text", hint: "Perfect score on the Ultimate Challenge" },
  { id: "zakhor", title: "Zakhor", hint: "Finish one Daily keep" },
  { id: "zakhor-7", title: "Seven days of memory", hint: "Seven Daily keep days in a row" },
  { id: "alefbet-line", title: "Alef to Tav", hint: "Clear Aleph-bet The line" },
  { id: "alefbet-master", title: "Keeper of the letters", hint: "Clear all three Aleph-bet mastery levels" },
  { id: "syllables-open", title: "Open and closed", hint: "Clear the first syllables unit" },
  { id: "syllables-master", title: "Cutter of words", hint: "Clear all eight syllable units" },
  { id: "nouns-open", title: "What a noun wears", hint: "Clear the first nouns unit" },
  { id: "nouns-master", title: "Reader of endings", hint: "Clear all six noun units" },
] as const;

export type BadgeId = (typeof BADGES)[number]["id"];

export function badgeMeta(id: string) {
  return BADGES.find((b) => b.id === id);
}

/** Earned by chapters cleared. 0 = just begun; 19 = summit (Masorete). */
export const HONOR_RANKS = [
  { title: "Hearer of the Word", short: "Hearer" },
  { title: "Catechumen", short: "Catechumen" },
  { title: "Proselyte", short: "Proselyte" },
  { title: "Disciple", short: "Disciple" },
  { title: "Follower of the Way", short: "The Way" },
  { title: "Lector", short: "Lector" },
  { title: "Cantor", short: "Cantor" },
  { title: "Scribe", short: "Scribe" },
  { title: "Steward of the Word", short: "Steward" },
  { title: "Watchman", short: "Watchman" },
  { title: "Interpreter", short: "Interpreter" },
  { title: "Exegete", short: "Exegete" },
  { title: "Homilist", short: "Homilist" },
  { title: "Teacher", short: "Teacher" },
  { title: "Elder", short: "Elder" },
  { title: "Shepherd", short: "Shepherd" },
  { title: "Sage", short: "Sage" },
  { title: "Doctor of Scripture", short: "Doctor" },
  { title: "Theologian of the Text", short: "Theologian" },
  { title: "Masorete", short: "Masorete" },
] as const;

export type HonorRank = (typeof HONOR_RANKS)[number];

export function honorForCleared(cleared: number): HonorRank & { step: number } {
  const n = Number.isFinite(cleared) ? Math.floor(cleared) : 0;
  const step = Math.min(HONOR_RANKS.length - 1, Math.max(0, n));
  const rank = HONOR_RANKS[step] ?? HONOR_RANKS[0];
  return { ...rank, step };
}

export function chaptersCleared(game: GameSnapshot): number {
  let n = 0;
  for (let c = 1; c <= GAME_CHAPTER_MAX; c++) {
    if (chapterRecord(game, c).cleared) n += 1;
  }
  return n;
}

export function stagesCleared(game: GameSnapshot): number {
  let n = 0;
  for (let c = 1; c <= GAME_CHAPTER_MAX; c++) {
    const rec = chapterRecord(game, c);
    for (const s of GAME_STAGES) if (rec.stages[s.id].cleared) n += 1;
  }
  return n;
}

export function hasThreeStar(game: GameSnapshot): boolean {
  for (let c = 1; c <= GAME_CHAPTER_MAX; c++) {
    const rec = chapterRecord(game, c);
    for (const s of GAME_STAGES) if (rec.stages[s.id].stars >= 3) return true;
  }
  return false;
}

export function totalStars(game: GameSnapshot): number {
  let n = 0;
  for (let c = 1; c <= GAME_CHAPTER_MAX; c++) {
    n += chapterRecord(game, c).stars;
  }
  return n;
}

export function evaluateBadges(game: GameSnapshot, dailyStreak: number, keepStreak = 0): BadgeId[] {
  const ch = chaptersCleared(game);
  const stages = stagesCleared(game);
  const out: BadgeId[] = [];
  if (stages >= 1) out.push("first-win");
  if (game.bestWinStreak >= 3 || game.winStreak >= 3) out.push("win-3");
  if (game.bestWinStreak >= 7 || game.winStreak >= 7) out.push("win-7");
  if (ch >= 1) out.push("first-chapter");
  if (ch >= 5) out.push("rung-5");
  if (ch >= 11) out.push("rung-11");
  if (ch >= GAME_CHAPTER_MAX) out.push("summit");
  if (dailyStreak >= 3) out.push("streak-3");
  if (dailyStreak >= 7) out.push("streak-7");
  if (dailyStreak >= 14) out.push("streak-14");
  if (hasThreeStar(game)) out.push("perfect");
  if ((Number(game.ultimateBest) || 0) >= 90) out.push("ultimate-90");
  if ((Number(game.ultimateBest) || 0) >= 100 || game.ultimatePerfect) out.push("ultimate-100");
  if (keepStreak >= 1) out.push("zakhor");
  if (keepStreak >= 7) out.push("zakhor-7");
  const ab = game.alefBet?.levels ?? {};
  if (ab["1"]?.cleared) out.push("alefbet-line");
  if (ab["1"]?.cleared && ab["2"]?.cleared && ab["3"]?.cleared) out.push("alefbet-master");
  const sy = game.syllables?.units ?? {};
  if (sy["1"]?.cleared) out.push("syllables-open");
  const sylAll = [1, 2, 3, 4, 5, 6, 7, 8].every((n) => sy[String(n)]?.cleared);
  if (sylAll) out.push("syllables-master");
  const nn = game.nouns?.units ?? {};
  if (nn["1"]?.cleared) out.push("nouns-open");
  const nounAll = [1, 2, 3, 4, 5, 6].every((n) => nn[String(n)]?.cleared);
  if (nounAll) out.push("nouns-master");
  return out;
}

export function ladderRung(game: GameSnapshot): { current: number; cleared: number; total: number } {
  const cleared = chaptersCleared(game);
  let current = 1;
  for (let c = 1; c <= GAME_CHAPTER_MAX; c++) {
    if (!chapterRecord(game, c).cleared) {
      current = c;
      break;
    }
    current = Math.min(GAME_CHAPTER_MAX, c + 1);
  }
  return { current, cleared, total: GAME_CHAPTER_MAX };
}

export function stampRewards(game: GameSnapshot, dailyStreak: number, keepStreak = 0): GameSnapshot {
  const next = evaluateBadges(game, dailyStreak, keepStreak);
  const prev = new Set(Array.isArray(game.badges) ? game.badges : []);
  const justEarned = next.filter((id) => !prev.has(id));
  return { ...game, badges: next, justEarned };
}

export function scoreboard(game: GameSnapshot, dailyStreak: number, keepStreak = 0) {
  const rung = ladderRung(game);
  const rec = chapterRecord(game, rung.current);
  const chapterStagesDone = GAME_STAGES.filter((s) => rec.stages[s.id].cleared).length;
  const stages = stagesCleared(game);
  const stars = totalStars(game);
  const points =
    stars * 10 +
    stages * 20 +
    rung.cleared * 50 +
    (Array.isArray(game.badges) ? game.badges.length : 0) * 30 +
    dailyStreak * 5 +
    keepStreak * 8 +
    game.winStreak * 8 +
    ((Number(game.ultimateBest) || 0) >= 90 ? 250 : 0) +
    ((Number(game.ultimateBest) || 0) >= 100 || game.ultimatePerfect ? 1000 : 0);
  const chapterPct = Math.round((chapterStagesDone / GAME_STAGES.length) * 100);
  const overallPct = Math.round((rung.cleared / GAME_CHAPTER_MAX) * 100);
  const crown = (Number(game.ultimateBest) || 0) >= 100 || Boolean(game.ultimatePerfect);
  const honor = honorForCleared(rung.cleared);
  const title = rung.cleared >= GAME_CHAPTER_MAX ? honor.title : `Chapter ${rung.current}`;
  return {
    level: rung.current,
    title,
    honor,
    crown,
    points,
    stars,
    stages,
    chapterStagesDone,
    chapterStagesTotal: GAME_STAGES.length,
    chapterPct,
    overallPct,
    cleared: rung.cleared,
    total: GAME_CHAPTER_MAX,
    next:
      rung.cleared >= GAME_CHAPTER_MAX
        ? "Path complete"
        : rec.cleared
          ? `Unlock chapter ${Math.min(GAME_CHAPTER_MAX, rung.current + 1)}`
          : `${GAME_STAGES.length - chapterStagesDone} stage${GAME_STAGES.length - chapterStagesDone === 1 ? "" : "s"} to clear this level`,
  };
}
