import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertAdmin } from "@/lib/admin";

export type VisitPing = {
  visitorId: string;
  path: string;
  signedIn: boolean;
  device: string;
};

export type VisitorRow = {
  id: string;
  firstSeen: string;
  lastSeen: string;
  hits: number;
  lastPath: string;
  signedIn: boolean;
  device: string;
  country: string;
};

export type CountryCount = { code: string; n: number };

export type VisitStats = {
  unique: number;
  anonymous: number;
  signedIn: number;
  hits: number;
  recentAnon: VisitorRow[];
  recentAll: VisitorRow[];
  countries: CountryCount[];
};

let tableReady: Promise<void> | null = null;

async function ensureVisitsTable() {
  tableReady ??= (async () => {
    const sql = await getSql();
    await sql.query(`
      create table if not exists site_visitors (
        id text primary key,
        first_seen timestamptz not null default now(),
        last_seen timestamptz not null default now(),
        hits integer not null default 0,
        last_path text not null default '/',
        signed_in boolean not null default false,
        device text not null default ''
      )
    `);
    await sql.query("alter table site_visitors add column if not exists country text not null default ''");
    await sql.query(
      "create index if not exists site_visitors_last_seen on site_visitors (last_seen desc)",
    );
  })().catch((err) => {
    tableReady = null;
    throw err;
  });
  return tableReady;
}

function cleanId(raw: string): string | null {
  const id = (raw ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return null;
  return id;
}

function cleanPath(raw: string): string {
  const path = (raw ?? "/").trim() || "/";
  if (!path.startsWith("/")) return "/";
  return path.slice(0, 120);
}

function cleanDevice(raw: string): string {
  const d = (raw ?? "").trim().toLowerCase();
  if (d === "mobile" || d === "tablet" || d === "desktop") return d;
  return "";
}

function cleanCountry(raw: string | null | undefined): string {
  const c = (raw ?? "").trim().toUpperCase();
  if (c === "XX" || c === "T1" || c === "A1" || c === "A2") return "";
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return c;
}

export function countryLabel(code: string): string {
  const c = cleanCountry(code);
  if (!c) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(c) ?? c;
  } catch {
    return c;
  }
}

async function countryFromRequest(): Promise<string> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    if (!request) return "";
    const h = request.headers;
    return cleanCountry(
      h.get("x-vercel-ip-country") ||
        h.get("cf-ipcountry") ||
        h.get("cloudfront-viewer-country") ||
        h.get("x-country-code") ||
        h.get("x-geo-country"),
    );
  } catch {
    return "";
  }
}

export const pingVisit = createServerFn({ method: "POST" })
  .validator((input: VisitPing) => input)
  .handler(async ({ data }) => {
    const id = cleanId(data.visitorId);
    if (!id) return { ok: false as const };
    try {
      await ensureVisitsTable();
      const sql = await getSql();
      const path = cleanPath(data.path);
      const device = cleanDevice(data.device);
      const signed = Boolean(data.signedIn);
      const country = await countryFromRequest();
      await sql`
        insert into site_visitors (id, first_seen, last_seen, hits, last_path, signed_in, device, country)
        values (${id}, now(), now(), 1, ${path}, ${signed}, ${device}, ${country})
        on conflict (id) do update set
          last_seen = now(),
          hits = site_visitors.hits + 1,
          last_path = excluded.last_path,
          signed_in = site_visitors.signed_in or excluded.signed_in,
          device = case when excluded.device = '' then site_visitors.device else excluded.device end,
          country = case when site_visitors.country = '' then excluded.country else site_visitors.country end
      `;
      return { ok: true as const };
    } catch (err) {
      console.error("[visits] ping", err);
      return { ok: false as const };
    }
  });

function toIso(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export const listVisits = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<VisitStats> => {
    await assertAdmin(context.userId);
    const empty: VisitStats = {
      unique: 0,
      anonymous: 0,
      signedIn: 0,
      hits: 0,
      recentAnon: [],
      recentAll: [],
      countries: [],
    };
    try {
      await ensureVisitsTable();
      const sql = await getSql();
      const totals = await sql<{
        unique: number;
        anonymous: number;
        signed_in: number;
        hits: number;
      }>`
        select
          count(*)::int as unique,
          count(*) filter (where not signed_in)::int as anonymous,
          count(*) filter (where signed_in)::int as signed_in,
          coalesce(sum(hits), 0)::int as hits
        from site_visitors
      `;
      const t = totals[0];
      const rows = await sql<{
        id: string;
        first_seen: string | Date;
        last_seen: string | Date;
        hits: number;
        last_path: string;
        signed_in: boolean;
        device: string;
        country: string;
      }>`
        select id, first_seen, last_seen, hits, last_path, signed_in, device, country
        from site_visitors
        order by last_seen desc
        limit 80
      `;
      const mapped: VisitorRow[] = rows.map((r) => ({
        id: r.id,
        firstSeen: toIso(r.first_seen),
        lastSeen: toIso(r.last_seen),
        hits: Number(r.hits) || 0,
        lastPath: r.last_path || "/",
        signedIn: Boolean(r.signed_in),
        device: r.device || "",
        country: (r.country || "").toUpperCase(),
      }));
      const byCountry = await sql<{ code: string; n: number }>`
        select country as code, count(*)::int as n
        from site_visitors
        where country <> ''
        group by country
        order by n desc, country asc
        limit 30
      `;
      return {
        unique: Number(t?.unique) || 0,
        anonymous: Number(t?.anonymous) || 0,
        signedIn: Number(t?.signed_in) || 0,
        hits: Number(t?.hits) || 0,
        recentAnon: mapped.filter((r) => !r.signedIn),
        recentAll: mapped,
        countries: byCountry.map((r) => ({ code: (r.code || "").toUpperCase(), n: Number(r.n) || 0 })),
      };
    } catch (err) {
      console.error("[visits] list", err);
      return empty;
    }
  });
