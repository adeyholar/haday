import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware, optionalAuthMiddleware } from "@/lib/auth/middleware";
import { ADMIN_EMAILS, isOwnerEmail, ownerAllowList } from "@/lib/admin-access";
import { blogCommentName, cleanBlogComment } from "@/lib/blog-comment-text";
import { getSql } from "@/lib/db";
import { CLASS_SITE } from "@/lib/class-site";
import { sendBlogCommentMail } from "@/lib/mail";
import { isPublicTeaching, postPath, teachingSection } from "@/lib/teaching-text";

export type BlogComment = {
  id: string;
  author: string;
  body: string;
  created: string;
  mine: boolean;
  canRemove: boolean;
};

type Row = {
  id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string | Date;
};

let tableReady: Promise<void> | null = null;

async function ensureBlogComments() {
  tableReady ??= (async () => {
    const sql = await getSql();
    await sql.query(`
      create table if not exists blog_comments (
        id text primary key,
        slug text not null references teachings (slug) on delete cascade,
        user_id text not null,
        author_name text not null,
        body text not null,
        created_at timestamptz not null default now()
      )
    `);
    await sql.query("create index if not exists blog_comments_slug on blog_comments (slug, created_at asc)");
  })().catch((err) => {
    tableReady = null;
    throw err;
  });
  return tableReady;
}

function day(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function allow(): string[] {
  const raw = typeof process !== "undefined" ? process.env.HADAY_ADMIN_EMAILS ?? "" : "";
  return ownerAllowList(ADMIN_EMAILS, raw);
}

function mapRow(row: Row, userId: string | null, owner: boolean): BlogComment {
  const mine = Boolean(userId) && row.user_id === userId;
  return {
    id: row.id,
    author: row.author_name,
    body: row.body,
    created: day(row.created_at),
    mine,
    canRemove: owner || mine,
  };
}

async function publicPost(slug: string): Promise<{ title: string; section: "teachings" | "learning-hebrabbai" } | null> {
  const sql = await getSql();
  const rows = await sql.query<{ draft: boolean; published_at: string | Date; title: string; section: string }>(
    "select draft, published_at, title, section from teachings where slug = $1",
    [slug],
  );
  const row = rows[0];
  if (!row) return null;
  const section = teachingSection(row.section) ?? "teachings";
  const open = isPublicTeaching({ draft: row.draft, published: day(row.published_at) });
  return open ? { title: row.title, section } : null;
}

export async function listBlogComments(slug: string, userId: string | null, email: string | null): Promise<BlogComment[]> {
  const clean = slug.trim();
  if (!/^[a-z0-9-]{1,80}$/.test(clean)) return [];
  await ensureBlogComments();
  if (!(await publicPost(clean))) return [];
  const sql = await getSql();
  const rows = await sql.query<Row>(
    `select id, user_id, author_name, body, created_at
     from blog_comments where slug = $1 order by created_at asc limit 200`,
    [clean],
  );
  const owner = email ? isOwnerEmail(email, allow()) : false;
  return rows.map((row) => mapRow(row, userId, owner));
}

export async function reassignBlogComments(from: string, to: string): Promise<void> {
  if (!from || from === to) return;
  await ensureBlogComments();
  const sql = await getSql();
  await sql.query("update blog_comments set slug = $1 where slug = $2", [to, from]);
}

export const loadBlogComments = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .middleware([optionalAuthMiddleware])
  .handler(async ({ data, context }) => listBlogComments(data, context.userId, context.email));

export const addBlogComment = createServerFn({ method: "POST" })
  .validator((input: { slug: string; body: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true; comments: BlogComment[] } | { ok: false; error: string }> => {
    const slug = (data.slug ?? "").trim();
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) return { ok: false, error: "That post is not open for comments." };
    const checked = cleanBlogComment(data.body ?? "");
    if (!checked.ok) return checked;
    await ensureBlogComments();
    const post = await publicPost(slug);
    if (!post) return { ok: false, error: "That post is not open for comments." };
    const sql = await getSql();
    const recent = await sql.query<{ id: string }>(
      `select id from blog_comments
       where slug = $1 and user_id = $2 and created_at > now() - interval '15 seconds'
       limit 1`,
      [slug, context.userId],
    );
    if (recent[0]) return { ok: false, error: "Wait a moment, then send it." };
    const named = await sql.query<{ name: string; email: string }>(
      `select name, email from "user" where id = $1`,
      [context.userId],
    );
    const author = blogCommentName(named[0]?.name);
    await sql.query(
      `insert into blog_comments (id, slug, user_id, author_name, body) values ($1, $2, $3, $4, $5)`,
      [randomUUID(), slug, context.userId, author, checked.body],
    );
    const email = named[0]?.email ?? null;
    void sendBlogCommentMail({
      postTitle: post.title,
      postUrl: `${CLASS_SITE}${postPath(post.section, slug)}`,
      author,
      accountEmail: email,
      body: checked.body,
    }).catch((err) => {
      console.error("[mail] blog comment was saved, but the assistant inbox was not mailed", err);
    });
    return { ok: true, comments: await listBlogComments(slug, context.userId, email) };
  });

export const removeBlogComment = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const id = (data.id ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "That comment is already gone." };
    await ensureBlogComments();
    const sql = await getSql();
    const rows = await sql.query<{ user_id: string }>("select user_id from blog_comments where id = $1", [id]);
    const row = rows[0];
    if (!row) return { ok: false, error: "That comment is already gone." };
    const me = await sql.query<{ email: string }>(`select email from "user" where id = $1`, [context.userId]);
    const owner = me[0]?.email ? isOwnerEmail(me[0].email, allow()) : false;
    if (!owner && row.user_id !== context.userId) return { ok: false, error: "You can remove only your own comment." };
    await sql.query("delete from blog_comments where id = $1", [id]);
    return { ok: true };
  });
