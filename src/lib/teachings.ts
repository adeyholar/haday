import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertAdmin } from "@/lib/admin";
import { getSql } from "@/lib/db";
import { reassignBlogComments } from "@/lib/blog-comments";
import { allPublicPages, type SitePage } from "@/lib/site-pages";
import {
  isPublicTeaching,
  postPath,
  relatedTeachings,
  teachingLastmod,
  teachingSection,
  validateTeaching,
  type Teaching,
  type TeachingSection,
} from "@/lib/teaching-text";

export type { Teaching, TeachingPath, TeachingSection } from "@/lib/teaching-text";

type Row = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  path: string;
  section: string;
  tags: string;
  related: string;
  image: string;
  image_alt: string;
  search_title: string;
  draft: boolean;
  published_at: string | Date;
  updated_at: string | Date;
};

let tableReady: Promise<void> | null = null;
let slimCache: { at: number; rows: Teaching[] } | null = null;
const SLIM_MS = 5 * 60 * 1000;

function clearTeachingCache() {
  slimCache = null;
}

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
    await sql.query("alter table teachings add column if not exists section text");
    await sql.query("update teachings set section = 'teachings' where section is null or section = ''");
    await sql.query("alter table teachings alter column section set default 'teachings'");
    await sql.query("alter table teachings alter column section set not null");
    await sql.query("alter table teachings alter column section drop default");
    await sql.query("alter table teachings drop constraint if exists teachings_section_check");
    await sql.query(
      "alter table teachings add constraint teachings_section_check check (section in ('teachings', 'learning-hebrabbai'))",
    );
    await sql.query("alter table teachings add column if not exists image_alt text not null default ''");
    await sql.query("alter table teachings add column if not exists search_title text not null default ''");
    await sql.query("create index if not exists teachings_public on teachings (draft, published_at desc)");
    await sql.query("create index if not exists teachings_section_public on teachings (section, draft, published_at desc)");
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
  const section = teachingSection(row.section) ?? "teachings";
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    path: row.path === "scripture" ? "scripture" : "grammar",
    section,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    related: row.related ? row.related.split(",").filter(Boolean) : [],
    image: row.image,
    imageAlt: row.image_alt ?? "",
    searchTitle: row.search_title ?? "",
    draft: row.draft,
    published: day(row.published_at),
    updated: day(row.updated_at),
  };
}

const SELECT = `slug, title, summary, body, path, section, tags, related, image, image_alt, search_title, draft, published_at, updated_at`;
const SLIM = `slug, title, summary, '' as body, path, section, tags, related, image, image_alt, search_title, draft, published_at, updated_at`;

export async function listTeachings(): Promise<Teaching[]> {
  await ensureTeachingsTable();
  const sql = await getSql();
  const rows = await sql.query<Row>(`select ${SELECT} from teachings order by published_at desc, slug asc`);
  return rows.map(mapRow);
}

async function publishedSlim(): Promise<Teaching[]> {
  const now = Date.now();
  if (slimCache && now - slimCache.at < SLIM_MS) return slimCache.rows;
  await ensureTeachingsTable();
  const sql = await getSql();
  const rows = await sql.query<Row>(
    `select ${SLIM} from teachings where draft = false and published_at <= now() order by published_at desc limit 200`,
  );
  const mapped = rows.map(mapRow).filter((post) => isPublicTeaching(post));
  slimCache = { at: now, rows: mapped };
  return mapped;
}

export async function listPublishedTeachings(section?: TeachingSection): Promise<Teaching[]> {
  const rows = await publishedSlim();
  return section ? rows.filter((post) => post.section === section) : rows;
}

export async function getTeaching(slug: string): Promise<Teaching | null> {
  await ensureTeachingsTable();
  const sql = await getSql();
  const rows = await sql.query<Row>(`select ${SELECT} from teachings where slug = $1`, [slug]);
  return rows[0] ? mapRow(rows[0]) : null;
}

async function getPublicTeaching(slug: string): Promise<Teaching | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  await ensureTeachingsTable();
  const sql = await getSql();
  const rows = await sql.query<Row>(
    `select ${SELECT} from teachings where slug = $1 and draft = false and published_at <= now()`,
    [slug],
  );
  const post = rows[0] ? mapRow(rows[0]) : null;
  return post && isPublicTeaching(post) ? post : null;
}

export async function sitemapPages(): Promise<SitePage[]> {
  const posts = await listPublishedTeachings().catch(() => []);
  const newestTeachings = posts.find((post) => post.section === "teachings")?.updated || "2026-10-19";
  const newestGuides = posts.find((post) => post.section === "learning-hebrabbai")?.updated || "2026-10-24";
  const pages = allPublicPages().map((page) => {
    if (page.path === "/blogs") return { ...page, lastmod: newestTeachings };
    if (page.path === "/learning-hebrabbai") return { ...page, lastmod: newestGuides };
    return page;
  });
  return [
    ...pages,
    ...posts.map((post) => ({
      path: postPath(post.section, post.slug),
      title: post.title,
      summary: post.summary,
      lastmod: teachingLastmod(post),
    })),
  ];
}

export const loadTeachingsIndex = createServerFn({ method: "GET" })
  .validator((section: string) => section)
  .handler(async ({ data }) => {
    if (data === "all") return listPublishedTeachings();
    const section = teachingSection(data);
    if (!section) return [];
    return listPublishedTeachings(section);
  });

export const loadTeachingPage = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data }) => {
    const post = await getPublicTeaching(data);
    if (!post) return { post: null, related: [] as Teaching[] };
    const cousins = await listPublishedTeachings(post.section);
    return { post, related: relatedTeachings(post, cousins, 2) };
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
      section?: string;
      tags?: string;
      related?: string;
      image?: string;
      imageAlt?: string;
      searchTitle?: string;
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
      `insert into teachings (slug, title, summary, body, path, section, tags, related, image, image_alt, search_title, draft, published_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())
       on conflict (slug) do update set
         title = excluded.title,
         summary = excluded.summary,
         body = excluded.body,
         path = excluded.path,
         section = excluded.section,
         tags = excluded.tags,
         related = excluded.related,
         image = excluded.image,
         image_alt = excluded.image_alt,
         search_title = excluded.search_title,
         draft = excluded.draft,
         published_at = excluded.published_at,
         updated_at = now()`,
      [
        post.slug,
        post.title,
        post.summary,
        post.body,
        post.path,
        post.section,
        post.tags.join(","),
        post.related.join(","),
        post.image,
        post.imageAlt,
        post.searchTitle,
        post.draft,
        stamp,
      ],
    );
    const previous = (data.previousSlug ?? "").trim();
    if (previous && previous !== post.slug) {
      await reassignBlogComments(previous, post.slug);
      await sql.query("delete from teachings where slug = $1", [previous]);
    }
    clearTeachingCache();
    const saved = await getTeaching(post.slug);
    if (!saved) return { ok: false, error: "Could not save the post." };
    return { ok: true, teaching: saved };
  });

export const deleteTeaching = createServerFn({ method: "POST" })
  .validator((input: { slug: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true } | { ok: false; error: string }> => {
    await assertAdmin(context.userId);
    const slug = (data.slug ?? "").trim();
    if (!slug) return { ok: false, error: "Choose a post to remove." };
    await ensureTeachingsTable();
    const sql = await getSql();
    await sql.query("delete from teachings where slug = $1", [slug]);
    clearTeachingCache();
    return { ok: true };
  });
