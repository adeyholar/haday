import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertAdmin } from "@/lib/admin";
import { ensureAreaTables } from "@/lib/visits";
import { areaLabel, tallySavedPractice, type StudentUse, type UseBucket } from "@/lib/use-report";

export type ClassUse = {
  areas: UseBucket[];
  practice: UseBucket[];
  students: StudentUse[];
};

export const getClassUse = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ClassUse> => {
    await assertAdmin(context.userId);
    const empty: ClassUse = { areas: [], practice: [], students: [] };
    try {
      await ensureAreaTables();
      const sql = await getSql();
      const areaRows = await sql<{ area: string; hits: number; people: number }>`
        select
          h.area,
          h.hits,
          (select count(*)::int from site_area_people s where s.area = h.area) as people
        from site_area_hits h
        order by h.hits desc, h.area asc
      `;
      const saved = await sql<{
        name: string | null;
        cards: string | null;
        game: string | null;
        sessions: number | null;
        streak: number | null;
      }>`
        select u.name, p.cards, p.game, p.sessions, p.streak
        from study_progress p
        join "user" u on u.id = p.user_id
      `;
      const tallied = tallySavedPractice(
        saved.map((row) => ({
          name: row.name ?? "",
          cards: parseJson(row.cards),
          game: parseJson(row.game),
          sessions: Number(row.sessions) || 0,
          streak: Number(row.streak) || 0,
        })),
      );
      return {
        areas: areaRows.map((row) => ({
          id: row.area,
          label: areaLabel(row.area),
          n: Number(row.hits) || 0,
          people: Number(row.people) || 0,
        })),
        practice: tallied.practice,
        students: tallied.students,
      };
    } catch (err) {
      console.error("[use] report", err);
      return empty;
    }
  });

function parseJson(raw: string | null): unknown {
  try {
    return JSON.parse(raw || "{}") as unknown;
  } catch {
    return {};
  }
}
