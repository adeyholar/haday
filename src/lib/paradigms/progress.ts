import { createServerFn } from "@tanstack/react-start";
import { assertAdmin } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { mergeStudentSave, sanitizeProgress } from "@/lib/paradigms/progress-shape";
import { isLevelId, type LevelId, type ParadigmProgress, type PlacementSource } from "@/lib/paradigms/types";

type ProgressRow = {
  level: string;
  placed: boolean;
  source: string;
  boxes: string;
  skips: string;
  updated_at: string | Date;
};

let ready: Promise<void> | null = null;

export async function ensureParadigmTable(): Promise<void> {
  ready ??= (async () => {
    const sql = await getSql();
    await sql.query(
      `create table if not exists paradigm_progress (
        user_id text primary key,
        level text not null default 'L1',
        placed boolean not null default false,
        source text not null default 'unset',
        boxes text not null default '{}',
        skips text not null default '[]',
        updated_at timestamptz not null default now()
      )`,
    );
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

function fromRow(row: ProgressRow): ParadigmProgress {
  let boxes: unknown = {};
  let skips: unknown = [];
  try {
    boxes = JSON.parse(row.boxes);
  } catch {
    boxes = {};
  }
  try {
    skips = JSON.parse(row.skips);
  } catch {
    skips = [];
  }
  const updatedAt = row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at ?? "");
  return sanitizeProgress({
    level: row.level,
    placed: row.placed,
    source: row.source,
    boxes,
    skips,
    updatedAt,
  });
}

async function readRow(userId: string): Promise<ParadigmProgress | null> {
  const sql = await getSql();
  const rows = await sql<ProgressRow>`
    select level, placed, source, boxes, skips, updated_at
    from paradigm_progress
    where user_id = ${userId}
  `;
  const row = rows[0];
  return row ? fromRow(row) : null;
}

async function writeRow(userId: string, progress: ParadigmProgress): Promise<void> {
  const sql = await getSql();
  const boxes = JSON.stringify(progress.boxes);
  const skips = JSON.stringify(progress.skips);
  await sql`
    insert into paradigm_progress (user_id, level, placed, source, boxes, skips, updated_at)
    values (${userId}, ${progress.level}, ${progress.placed}, ${progress.source}, ${boxes}, ${skips}, now())
    on conflict (user_id) do update set
      level = excluded.level,
      placed = excluded.placed,
      source = excluded.source,
      boxes = excluded.boxes,
      skips = excluded.skips,
      updated_at = now()
  `;
}

export const loadParadigmProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ParadigmProgress | null> => {
    await ensureParadigmTable();
    return readRow(context.userId);
  });

export const saveParadigmProgress = createServerFn({ method: "POST" })
  .validator((input: ParadigmProgress) => sanitizeProgress(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<ParadigmProgress> => {
    await ensureParadigmTable();
    const existing = await readRow(context.userId);
    const next = mergeStudentSave(existing, { ...data, updatedAt: new Date().toISOString() });
    await writeRow(context.userId, next);
    return (await readRow(context.userId)) ?? next;
  });

export type RosterLevel = {
  userId: string;
  level: LevelId;
  source: PlacementSource;
  placed: boolean;
};

export const listParadigmLevels = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<RosterLevel[]> => {
    await assertAdmin(context.userId);
    await ensureParadigmTable();
    const sql = await getSql();
    const rows = await sql<{ user_id: string; level: string; source: string; placed: boolean }>`
      select user_id, level, source, placed from paradigm_progress
    `;
    return rows
      .filter((row) => isLevelId(row.level))
      .map((row) => ({
        userId: row.user_id,
        level: row.level as LevelId,
        source: sanitizeProgress({ source: row.source, placed: row.placed, level: row.level }).source,
        placed: row.placed,
      }));
  });

export const setParadigmLevel = createServerFn({ method: "POST" })
  .validator((input: { userId: string; level: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ ok: true; level: LevelId } | { ok: false; error: string }> => {
    await assertAdmin(context.userId);
    if (!data.userId || !isLevelId(data.level)) return { ok: false, error: "Choose a level from L1 to L7." };
    await ensureParadigmTable();
    const existing = await readRow(data.userId);
    const next = sanitizeProgress({
      level: data.level,
      placed: true,
      source: "chairman",
      boxes: existing?.boxes ?? {},
      skips: existing?.skips ?? [],
      updatedAt: new Date().toISOString(),
    });
    await writeRow(data.userId, next);
    return { ok: true, level: data.level };
  });
