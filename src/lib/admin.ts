import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

/** Sign-in emails that can open /admin. Add yours if the page says you are locked out. */
export const ADMIN_EMAILS: string[] = [
  // e.g. "you@gmail.com",
];

export type RosterPerson = {
  id: string;
  name: string;
  email: string;
  signedUp: string | null;
  lastLogin: string | null;
  lastStudy: string | null;
  sessions: number;
  streak: number;
};

function envAdminEmails(): string[] {
  const raw = typeof process !== "undefined" ? process.env.HADAY_ADMIN_EMAILS ?? "" : "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function allowList(): string[] {
  return [...new Set([...ADMIN_EMAILS.map((e) => e.toLowerCase()), ...envAdminEmails()])];
}

export async function assertAdmin(userId: string): Promise<void> {
  const sql = await getSql();
  const me = await sql<{ email: string }>`
    select email from "user" where id = ${userId}
  `;
  const email = (me[0]?.email ?? "").toLowerCase();
  const allowed = allowList();
  if (email && allowed.includes(email)) return;
  if (allowed.length === 0) {
    const first = await sql<{ id: string }>`
      select id from "user" order by "createdAt" asc limit 1
    `;
    if (first[0]?.id === userId) return;
  }
  throw new Error("Forbidden");
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ admin: boolean }> => {
    try {
      await assertAdmin(context.userId);
      return { admin: true };
    } catch {
      return { admin: false };
    }
  });

export const listRoster = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<RosterPerson[]> => {
    await assertAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      email: string;
      signed_up: string | Date | null;
      last_login: string | Date | null;
      last_study: string | Date | null;
      sessions: number | null;
      streak: number | null;
    }>`
      select
        u.id,
        u.name,
        u.email,
        u."createdAt" as signed_up,
        (
          select max(s."createdAt")
          from session s
          where s."userId" = u.id
        ) as last_login,
        p.updated_at as last_study,
        coalesce(p.sessions, 0) as sessions,
        coalesce(p.streak, 0) as streak
      from "user" u
      left join study_progress p on p.user_id = u.id
      order by u."createdAt" desc
    `;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      signedUp: toIso(r.signed_up),
      lastLogin: toIso(r.last_login),
      lastStudy: toIso(r.last_study),
      sessions: Number(r.sessions ?? 0),
      streak: Number(r.streak ?? 0),
    }));
  });

function toIso(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
