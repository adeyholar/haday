import { createServerFn } from "@tanstack/react-start";
import { assertAdmin } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { isIibsLevel, isStudyPath, grammarTerm, termForAccount, type GrammarTerm, type IibsLevelId, type StudyPath } from "@/lib/path";
import { PATH_CHOICE } from "@/lib/path-names";

export type MyPath = {
  path: StudyPath | null;
  cleared: IibsLevelId | null;
  admin: boolean;
  term: GrammarTerm;
};

let ready: Promise<void> | null = null;

export async function ensureLearnerPath() {
  ready ??= (async () => {
    const sql = await getSql();
    await sql`
      create table if not exists learner_path (
        user_id text primary key,
        path text not null,
        cleared text,
        updated_at timestamptz not null default now()
      )
    `;
    await sql`
      create table if not exists app_flag (
        key text primary key,
        value text not null
      )
    `;
    await sql`
      insert into app_flag (key, value)
      values ('path_seed_at', now()::text)
      on conflict (key) do nothing
    `;
    await sql`
      alter table learner_path add column if not exists term text not null default '1'
    `;
    await sql`
      insert into learner_path (user_id, path)
      select u.id, 'bbh'
      from "user" u
      where u."createdAt" <= (select value::timestamptz from app_flag where key = 'path_seed_at')
      on conflict (user_id) do nothing
    `;
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

async function readAdmin(userId: string): Promise<boolean> {
  try {
    await assertAdmin(userId);
    return true;
  } catch {
    return false;
  }
}

export const getMyPath = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MyPath> => {
    await ensureLearnerPath();
    const sql = await getSql();
    const rows = await sql<{ path: string; cleared: string | null; term: string | null }>`
      select path, cleared, term from learner_path where user_id = ${context.userId}
    `;
    const path = isStudyPath(rows[0]?.path) ? rows[0].path : null;
    const cleared = isIibsLevel(rows[0]?.cleared) ? rows[0].cleared : null;
    const admin = await readAdmin(context.userId);
    const term = termForAccount({ term: grammarTerm(rows[0]?.term) });
    return { path, cleared, admin, term };
  });

export const choosePath = createServerFn({ method: "POST" })
  .validator((input: { path: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true; path: StudyPath } | { ok: false; error: string }> => {
    if (!isStudyPath(data.path)) return { ok: false, error: PATH_CHOICE };
    await ensureLearnerPath();
    const sql = await getSql();
    const existing = await sql<{ path: string }>`
      select path from learner_path where user_id = ${context.userId}
    `;
    if (isStudyPath(existing[0]?.path)) return { ok: true, path: existing[0].path };
    await sql`
      insert into learner_path (user_id, path)
      values (${context.userId}, ${data.path})
    `;
    return { ok: true, path: data.path };
  });

export const setLearnerPath = createServerFn({ method: "POST" })
  .validator((input: { userId: string; path: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true; path: StudyPath } | { ok: false; error: string }> => {
    await assertAdmin(context.userId);
    if (!isStudyPath(data.path)) return { ok: false, error: PATH_CHOICE };
    const userId = data.userId.trim();
    if (!userId) return { ok: false, error: "Missing account." };
    await ensureLearnerPath();
    const sql = await getSql();
    await sql`
      insert into learner_path (user_id, path)
      values (${userId}, ${data.path})
      on conflict (user_id) do update set
        path = ${data.path},
        updated_at = now()
    `;
    return { ok: true, path: data.path };
  });

export const setMyTerm = createServerFn({ method: "POST" })
  .validator((input: { done: boolean }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true; term: GrammarTerm } | { ok: false; error: string }> => {
    await ensureLearnerPath();
    const sql = await getSql();
    const rows = await sql<{ path: string }>`
      select path from learner_path where user_id = ${context.userId}
    `;
    const path = isStudyPath(rows[0]?.path) ? rows[0].path : null;
    const admin = await readAdmin(context.userId);
    if (!admin && path !== "bbh") return { ok: false, error: "Open the Grammar Path first." };
    const term: GrammarTerm = data.done ? 2 : 1;
    const stored = term === 2 ? "2" : "1";
    await sql`
      insert into learner_path (user_id, path, term)
      values (${context.userId}, 'bbh', ${stored})
      on conflict (user_id) do update set
        term = ${stored},
        updated_at = now()
    `;
    return { ok: true, term };
  });
