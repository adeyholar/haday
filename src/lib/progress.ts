import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { hydrateCard, type CardState } from "@/lib/srs";
import { hydrateGame, type GameSnapshot } from "@/lib/game";
import { scoreboard } from "@/lib/rewards";

export type ProgressPayload = {
  cards: Record<string, CardState>;
  week: number;
  direction: "he-en" | "en-he";
  focus: "due" | "weak";
  streak: number;
  lastStudyDay: number;
  sessions: number;
  game: GameSnapshot;
  keepStreak?: number;
  lastKeepDay?: number;
};

type ProgressRow = {
  cards: string;
  week: number;
  direction: string;
  focus: string;
  streak: number;
  last_study_day: number;
  sessions: number;
  game: string | null;
};

let extrasReady: Promise<void> | null = null;

/** Additive columns from later migrations — apply at runtime if deploy skipped migrate. */
export async function ensureProgressExtras() {
  extrasReady ??= (async () => {
    const sql = await getSql();
    await sql.query(
      "alter table study_progress add column if not exists game text not null default '{}'",
    );
    await sql.query(
      "alter table study_progress add column if not exists points integer not null default 0",
    );
    await sql.query(
      "alter table study_progress add column if not exists level integer not null default 1",
    );
  })().catch((err) => {
    extrasReady = null;
    throw err;
  });
  return extrasReady;
}

export const loadProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ProgressPayload | null> => {
    const sql = await getSql();
    await ensureProgressExtras();
    const rows = await sql<ProgressRow>`
      select cards, week, direction, focus, streak, last_study_day, sessions, game
      from study_progress
      where user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) return null;
    return parseRow(row);
  });

export const saveProgress = createServerFn({ method: "POST" })
  .validator((input: ProgressPayload) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProgressExtras();
    const cards = JSON.stringify(data.cards ?? {});
    const week = Number.isFinite(data.week) ? data.week : 1;
    const direction = data.direction === "en-he" ? "en-he" : "he-en";
    const focus = data.focus === "weak" ? "weak" : "due";
    const streak = Number.isFinite(data.streak) ? data.streak : 0;
    const lastStudyDay = Number.isFinite(data.lastStudyDay) ? data.lastStudyDay : 0;
    const sessions = Number.isFinite(data.sessions) ? data.sessions : 0;
    const gameSnap = hydrateGame({
      ...hydrateGame(data.game),
      keepStreak: Number(data.keepStreak) || Number((data.game as GameSnapshot | undefined)?.keepStreak) || 0,
      lastKeepDay: Number(data.lastKeepDay) || Number((data.game as GameSnapshot | undefined)?.lastKeepDay) || 0,
    });
    const game = JSON.stringify(gameSnap);
    const board = scoreboard(gameSnap, streak);
    await sql`
      insert into study_progress (
        user_id, cards, week, direction, focus, streak, last_study_day, sessions, game, points, level, updated_at
      ) values (
        ${context.userId}, ${cards}, ${week}, ${direction}, ${focus},
        ${streak}, ${lastStudyDay}, ${sessions}, ${game}, ${board.points}, ${board.level}, now()
      )
      on conflict (user_id) do update set
        cards = excluded.cards,
        week = excluded.week,
        direction = excluded.direction,
        focus = excluded.focus,
        streak = excluded.streak,
        last_study_day = excluded.last_study_day,
        sessions = excluded.sessions,
        game = excluded.game,
        points = excluded.points,
        level = excluded.level,
        updated_at = now()
    `;
    return { ok: true as const };
  });

function parseRow(row: ProgressRow): ProgressPayload {
  let parsed: Record<string, Partial<CardState>> = {};
  try {
    const raw = JSON.parse(row.cards || "{}") as unknown;
    if (raw && typeof raw === "object") parsed = raw as Record<string, Partial<CardState>>;
  } catch {
    parsed = {};
  }
  const cards: Record<string, CardState> = {};
  for (const [id, card] of Object.entries(parsed)) {
    cards[id] = hydrateCard(card);
  }
  let gameRaw: unknown = {};
  try {
    gameRaw = JSON.parse(row.game || "{}") as unknown;
  } catch {
    gameRaw = {};
  }
  return {
    cards,
    week: Number(row.week) || 1,
    direction: row.direction === "en-he" ? "en-he" : "he-en",
    focus: row.focus === "weak" ? "weak" : "due",
    streak: Number(row.streak) || 0,
    lastStudyDay: Number(row.last_study_day) || 0,
    sessions: Number(row.sessions) || 0,
    game: hydrateGame(gameRaw),
    keepStreak: hydrateGame(gameRaw).keepStreak,
    lastKeepDay: hydrateGame(gameRaw).lastKeepDay,
  };
}
