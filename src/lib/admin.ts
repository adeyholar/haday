import { randomBytes, randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { sendPasswordResetMail } from "@/lib/mail";

/** Sign-in emails that can open /admin. Also set HADAY_ADMIN_EMAILS on Azure. */
export const ADMIN_EMAILS: string[] = [
  "talk2pastoradeolaade@yahoo.com",
  "adeolaa@jcdisn.com",
];

const OWNER_NAME = /crown|ha['’]?day|adegbolagun|\badeola\b/i;

export type RosterPerson = {
  id: string;
  name: string;
  email: string;
  signedUp: string | null;
  lastLogin: string | null;
  lastStudy: string | null;
  sessions: number;
  streak: number;
  hasPassword: boolean;
  providers: string;
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
  const me = await sql<{ email: string; name: string }>`
    select email, name from "user" where id = ${userId}
  `;
  const email = (me[0]?.email ?? "").toLowerCase();
  const name = me[0]?.name ?? "";
  const allowed = allowList();
  if (email && allowed.includes(email)) return;
  if (name && OWNER_NAME.test(name)) return;
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
      has_password: boolean | null;
      providers: string | null;
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
        coalesce(p.streak, 0) as streak,
        exists (
          select 1 from account a
          where a."userId" = u.id and a."providerId" = 'credential'
        ) as has_password,
        (
          select string_agg(distinct a."providerId", ', ')
          from account a
          where a."userId" = u.id
        ) as providers
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
      hasPassword: Boolean(r.has_password),
      providers: r.providers ?? "",
    }));
  });

function toIso(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type PendingReset = {
  email: string;
  name: string;
  expiresAt: string;
  token: string;
};

export const listPendingResets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<PendingReset[]> => {
    await assertAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      identifier: string;
      name: string;
      email: string;
      expires_at: string | Date;
    }>`
      select
        v.identifier,
        u.name,
        u.email,
        v."expiresAt" as expires_at
      from verification v
      join "user" u on u.id = v.value
      where v.identifier like ${"reset-password:%"}
        and v."expiresAt" > now()
      order by v."expiresAt" desc
    `;
    return rows.map((r) => ({
      email: r.email,
      name: r.name,
      expiresAt: toIso(r.expires_at) ?? "",
      token: r.identifier.replace(/^reset-password:/, ""),
    }));
  });

export type IssueResetResult =
  | { ok: true; token: string; expiresAt: string; emailed: boolean }
  | { ok: false; reason: string };

export const issuePasswordReset = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<IssueResetResult> => {
    await assertAdmin(context.userId);
    const email = (data.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return { ok: false, reason: "Need a classmate email." };
    }
    const sql = await getSql();
    const users = await sql<{ id: string; email: string; name: string }>`
      select id, email, name from "user" where lower(email) = ${email} limit 1
    `;
    const user = users[0];
    if (!user) return { ok: false, reason: "No account with that email." };

    const creds = await sql<{ id: string }>`
      select id from account
      where "userId" = ${user.id} and "providerId" = 'credential'
      limit 1
    `;
    if (!creds[0]) {
      return {
        ok: false,
        reason:
          "This classmate signs in with Google or X, not a password. Ask them to use that button — there is no password to reset.",
      };
    }

    const token = randomBytes(32).toString("hex");
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await sql`
      delete from verification
      where "value" = ${user.id} and identifier like ${"reset-password:%"}
    `;
    await sql`
      insert into verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
      values (
        ${id},
        ${"reset-password:" + token},
        ${user.id},
        ${expiresAt.toISOString()},
        now(),
        now()
      )
    `;

    let emailed = false;
    try {
      const mail = await sendPasswordResetMail({
        email: user.email,
        name: user.name,
        url: "",
        token,
      });
      emailed = mail.sent;
    } catch {
      emailed = false;
    }

    return { ok: true, token, expiresAt: expiresAt.toISOString(), emailed };
  });
