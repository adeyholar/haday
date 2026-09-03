import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertAdmin } from "@/lib/admin";
import {
  cleanBody,
  cleanTitle,
  parseArea,
  parseStatus,
  type IdeaArea,
  type IdeaStatus,
} from "@/lib/idea-text";

export {
  IDEA_AREAS,
  IDEA_AREA_LABEL,
  IDEA_STATUSES,
  IDEA_STATUS_LABEL,
  cleanBody,
  cleanTitle,
  parseArea,
  parseStatus,
} from "@/lib/idea-text";
export type { IdeaArea, IdeaStatus } from "@/lib/idea-text";

export type Idea = {
  id: string;
  title: string;
  body: string;
  area: IdeaArea;
  status: IdeaStatus;
  note: string;
  created: string;
  mine: boolean;
  author: string;
};

const MAX_OPEN = 8;
const MAX_NOTE = 280;

let tableReady: Promise<void> | null = null;

async function ensureIdeasTable() {
  tableReady ??= (async () => {
    const sql = await getSql();
    await sql.query(`
      create table if not exists feature_ideas (
        id text primary key,
        user_id text not null,
        title text not null,
        body text not null,
        area text not null default 'app',
        status text not null default 'new',
        admin_note text not null default '',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
    await sql.query(
      "create index if not exists feature_ideas_status_created on feature_ideas (status, created_at desc)",
    );
    await sql.query(
      "create index if not exists feature_ideas_user on feature_ideas (user_id, created_at desc)",
    );
  })().catch((err) => {
    tableReady = null;
    throw err;
  });
  return tableReady;
}

function toIso(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

type IdeaRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  area: string;
  status: string;
  admin_note: string;
  created_at: string | Date;
  name: string | null;
};

function mapIdea(row: IdeaRow, me: string, showAuthor: boolean): Idea {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    area: parseArea(row.area),
    status: parseStatus(row.status),
    note: showAuthor ? row.admin_note : row.status === "new" ? "" : row.admin_note,
    created: toIso(row.created_at),
    mine: row.user_id === me,
    author: showAuthor ? (row.name || "Classmate").trim() : row.user_id === me ? "You" : "Classmate",
  };
}

export const listMyIdeas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Idea[]> => {
    await ensureIdeasTable();
    const sql = await getSql();
    const rows = await sql<IdeaRow>`
      select i.id, i.user_id, i.title, i.body, i.area, i.status, i.admin_note, i.created_at, u.name
      from feature_ideas i
      left join "user" u on u.id = i.user_id
      where i.user_id = ${context.userId}
      order by i.created_at desc
    `;
    return rows.map((r) => mapIdea(r, context.userId, false));
  });

export const listIdeaBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Idea[]> => {
    await ensureIdeasTable();
    const sql = await getSql();
    const rows = await sql<IdeaRow>`
      select i.id, i.user_id, i.title, i.body, i.area, i.status, i.admin_note, i.created_at, u.name
      from feature_ideas i
      left join "user" u on u.id = i.user_id
      where i.status in ('planned', 'building', 'shipped')
      order by
        case i.status when 'building' then 0 when 'planned' then 1 else 2 end,
        i.updated_at desc
      limit 40
    `;
    return rows.map((r) => mapIdea(r, context.userId, false));
  });

export const listIdeaInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Idea[]> => {
    await assertAdmin(context.userId);
    await ensureIdeasTable();
    const sql = await getSql();
    const rows = await sql<IdeaRow>`
      select i.id, i.user_id, i.title, i.body, i.area, i.status, i.admin_note, i.created_at, u.name
      from feature_ideas i
      left join "user" u on u.id = i.user_id
      order by
        case i.status when 'new' then 0 when 'building' then 1 when 'planned' then 2 when 'hold' then 3 else 4 end,
        i.created_at desc
    `;
    return rows.map((r) => mapIdea(r, context.userId, true));
  });

export const addIdea = createServerFn({ method: "POST" })
  .validator((input: { title: string; body: string; area?: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true; idea: Idea } | { ok: false; error: string }> => {
    const title = cleanTitle(data.title);
    const body = cleanBody(data.body);
    if (title.length < 4) return { ok: false, error: "Give the idea a short name." };
    if (body.length < 8) return { ok: false, error: "Say what it would help you do." };
    const area = parseArea(data.area);
    await ensureIdeasTable();
    const sql = await getSql();
    const open = await sql<{ n: number }>`
      select count(*)::int as n from feature_ideas
      where user_id = ${context.userId} and status in ('new', 'planned', 'building')
    `;
    if ((open[0]?.n ?? 0) >= MAX_OPEN) {
      return { ok: false, error: "You already have several open ideas. Wait for review, then add another." };
    }
    const id = crypto.randomUUID();
    await sql`
      insert into feature_ideas (id, user_id, title, body, area, status)
      values (${id}, ${context.userId}, ${title}, ${body}, ${area}, 'new')
    `;
    const rows = await sql<IdeaRow>`
      select i.id, i.user_id, i.title, i.body, i.area, i.status, i.admin_note, i.created_at, u.name
      from feature_ideas i
      left join "user" u on u.id = i.user_id
      where i.id = ${id}
    `;
    const row = rows[0];
    if (!row) return { ok: false, error: "Could not save the idea." };
    return { ok: true, idea: mapIdea(row, context.userId, false) };
  });

export const reviewIdea = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: string; note?: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true } | { ok: false; error: string }> => {
    await assertAdmin(context.userId);
    const id = (data.id ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Missing idea." };
    const status = parseStatus(data.status);
    const note = (data.note ?? "").trim().slice(0, MAX_NOTE);
    await ensureIdeasTable();
    const sql = await getSql();
    const updated = await sql<{ id: string }>`
      update feature_ideas
      set status = ${status}, admin_note = ${note}, updated_at = now()
      where id = ${id}
      returning id
    `;
    if (!updated[0]) return { ok: false, error: "Idea not found." };
    return { ok: true };
  });
