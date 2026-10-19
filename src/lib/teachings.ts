import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertAdmin } from "@/lib/admin";
import { getSql } from "@/lib/db";
import { allPublicPages, type SitePage } from "@/lib/site-pages";
import {
  isPublicTeaching,
  relatedTeachings,
  validateTeaching,
  type Teaching,
} from "@/lib/teaching-text";

export type { Teaching, TeachingPath } from "@/lib/teaching-text";

type Row = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  path: string;
  tags: string;
  related: string;
  image: string;
  draft: boolean;
  published_at: string | Date;
  updated_at: string | Date;
};

let tableReady: Promise<void> | null = null;

async function ensureTeachingsTable() {
  tableReady ??= (async () => {
    const sql = await getSql();
    await sql.query(`
      create table if not exists teachings (
        slug text primary key,
        title text not null,
        summary text not null,
        body text not null,
        path text not null,
        tags text not null default '',
        related text not null default '',
        image text not null default '',
        draft boolean not null default true,
        published_at timestamptz not null,
        updated_at timestamptz not null default now(),
        created_at timestamptz not null default now()
      )
    `);
    await sql.query("create index if not exists teachings_public on teachings (draft, published_at desc)");
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

function mapRow(row: Row): Teaching {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    path: row.path === "scripture" ? "scripture" : "grammar",
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    related: row.related ? row.related.split(",").filter(Boolean) : [],
    image: row.image,
    draft: row.draft,
    published: day(row.published_at),
    updated: day(row.updated_at),
  };
}

const SELECT = `slug, title, summary, body, path, tags, related, image, draft, published_at, updated_at`;

export async function listTeachings(): Promise<Teaching[]> {
  await ensureTeachingsTable();
  const sql = await getSql();
  const rows = await sql.query<Row>(`select ${SELECT} from teachings order by published_at desc, slug asc`);
  return rows.map(mapRow);
}

export async function listPublishedTeachings(now = new Date()): Promise<Teaching[]> {
  const rows = await listTeachings();
  return rows.filter((post) => isPublicTeaching(post, now));
}

export async function getTeaching(slug: string): Promise<Teaching | null> {
  await ensureTeachingsTable();
  const sql = await getSql();
  const rows = await sql.query<Row>(`select ${SELECT} from teachings where slug = $1`, [slug]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function sitemapPages(): Promise<SitePage[]> {
  const posts = await listPublishedTeachings().catch(() => []);
  const newest = posts[0]?.updated || "2026-10-19";
  const pages = allPublicPages().map((page) => (page.path === "/teachings" ? { ...page, lastmod: newest } : page));
  return [
    ...pages,
    ...posts.map((post) => ({
      path: `/teachings/${post.slug}`,
      title: post.title,
      summary: post.summary,
      lastmod: post.updated || post.published,
    })),
  ];
}

export const loadTeachingsIndex = createServerFn({ method: "GET" }).handler(async () => listPublishedTeachings());

export const loadTeachingPage = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data }) => {
    const posts = await listPublishedTeachings();
    const post = posts.find((item) => item.slug === data) ?? null;
    return { post, related: post ? relatedTeachings(post, posts, 2) : [] };
  });

export const listTeachingDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Teaching[]> => {
    await assertAdmin(context.userId);
    return listTeachings();
  });

export const saveTeaching = createServerFn({ method: "POST" })
  .validator(
    (input: {
      previousSlug?: string;
      slug?: string;
      title?: string;
      summary?: string;
      body?: string;
      path?: string;
      tags?: string;
      related?: string;
      image?: string;
      draft?: boolean;
      published?: string;
    }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true; teaching: Teaching } | { ok: false; error: string }> => {
    await assertAdmin(context.userId);
    const checked = validateTeaching(data);
    if (!checked.ok) return checked;
    const post = checked.value;
    await ensureTeachingsTable();
    const sql = await getSql();
    const stamp = `${post.published}T12:00:00.000Z`;
    await sql.query(
      `insert into teachings (slug, title, summary, body, path, tags, related, image, draft, published_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
       on conflict (slug) do update set
         title = excluded.title,
         summary = excluded.summary,
         body = excluded.body,
         path = excluded.path,
         tags = excluded.tags,
         related = excluded.related,
         image = excluded.image,
         draft = excluded.draft,
         published_at = excluded.published_at,
         updated_at = now()`,
      [
        post.slug,
        post.title,
        post.summary,
        post.body,
        post.path,
        post.tags.join(","),
        post.related.join(","),
        post.image,
        post.draft,
        stamp,
      ],
    );
    const previous = (data.previousSlug ?? "").trim();
    if (previous && previous !== post.slug) {
      await sql.query("delete from teachings where slug = $1", [previous]);
    }
    const saved = await getTeaching(post.slug);
    if (!saved) return { ok: false, error: "Could not save the teaching." };
    return { ok: true, teaching: saved };
  });

export const deleteTeaching = createServerFn({ method: "POST" })
  .validator((input: { slug: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true } | { ok: false; error: string }> => {
    await assertAdmin(context.userId);
    const slug = (data.slug ?? "").trim();
    if (!slug) return { ok: false, error: "Choose a teaching to remove." };
    await ensureTeachingsTable();
    const sql = await getSql();
    await sql.query("delete from teachings where slug = $1", [slug]);
    return { ok: true };
  });
