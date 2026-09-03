import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { hydrateGame } from "@/lib/game";
import { ensureProgressExtras } from "@/lib/progress";
import { honorForCleared, scoreboard } from "@/lib/rewards";

export type BoardRow = {
  rank: number;
  name: string;
  points: number;
  level: number;
  streak: number;
  honor: string;
  honorShort: string;
  crown: boolean;
  you: boolean;
};

function publicName(raw: string | null | undefined): string {
  const name = (raw ?? "").trim();
  if (!name) return "Classmate";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  const last = parts[1] ?? "";
  return last ? `${parts[0]} ${last.charAt(0).toUpperCase()}.` : parts[0];
}

function parseGame(raw: unknown): unknown {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return {};
  }
}

export const listLeaderboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<BoardRow[]> => {
    const sql = await getSql();
    try {
      await ensureProgressExtras();
    } catch (err) {
      console.error("[leaderboard] schema", err);
    }

    let rows: {
      id: string;
      name: string | null;
      streak: number | null;
      game: string | null;
    }[] = [];
    try {
      rows = await sql`
        select
          u.id,
          u.name,
          p.streak,
          p.game
        from "user" u
        left join study_progress p on p.user_id = u.id
        order by u."createdAt" asc
      `;
    } catch (err) {
      console.error("[leaderboard] query", err);
      return [];
    }

    const fallback = honorForCleared(0);
    const scored = rows.map((r) => {
      const streak = Number(r.streak) || 0;
      let points = 0;
      let level = 1;
      let honor = fallback.title;
      let honorShort = fallback.short;
      let crown = false;
      try {
        const board = scoreboard(hydrateGame(parseGame(r.game)), streak);
        points = board.points;
        level = board.level;
        honor = board.honor?.title ?? honor;
        honorShort = board.honor?.short ?? honorShort;
        crown = Boolean(board.crown);
      } catch (err) {
        console.error("[leaderboard] score", r.id, err);
      }
      return {
        id: r.id,
        name: publicName(r.name),
        points,
        level,
        streak,
        honor,
        honorShort,
        crown,
      };
    });

    scored.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.level !== a.level) return b.level - a.level;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return a.name.localeCompare(b.name);
    });

    let lastPoints = -1;
    let lastRank = 0;
    return scored.map((row, i) => {
      const rank = row.points === lastPoints ? lastRank : i + 1;
      lastPoints = row.points;
      lastRank = rank;
      return {
        rank,
        name: row.name,
        points: row.points,
        level: row.level,
        streak: row.streak,
        honor: row.honor,
        honorShort: row.honorShort,
        crown: row.crown,
        you: row.id === context.userId,
      };
    });
  });
