import { getSql } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const PER_EMAIL = 3;
const PER_IP = 8;
const GLOBAL = 30;

const hits = new Map<string, number[]>();

function prune(key: string, now: number): number[] {
  const next = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.set(key, next);
  return next;
}

function memoryBlocked(key: string, max: number): boolean {
  const now = Date.now();
  const list = prune(key, now);
  if (list.length >= max) return true;
  list.push(now);
  hits.set(key, list);
  return false;
}

export function resetClientIp(request?: Request): string {
  if (!request) return "";
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "";
}

/** True = do not send another reset mail. Tokens may still exist; admin can revoke them. */
export async function resetSendBlocked(email: string, ip: string): Promise<boolean> {
  const addr = email.trim().toLowerCase();
  if (addr && memoryBlocked(`email:${addr}`, PER_EMAIL)) return true;
  if (ip && memoryBlocked(`ip:${ip}`, PER_IP)) return true;
  if (memoryBlocked("global", GLOBAL)) return true;

  try {
    const sql = await getSql();
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const byEmail = addr
      ? await sql<{ n: number }>`
          select count(*)::int as n
          from verification v
          join "user" u on u.id = v.value
          where v.identifier like ${"reset-password:%"}
            and lower(u.email) = ${addr}
            and v."createdAt" > ${since}
        `
      : [{ n: 0 }];
    if ((byEmail[0]?.n ?? 0) > PER_EMAIL) return true;
    const all = await sql<{ n: number }>`
      select count(*)::int as n
      from verification
      where identifier like ${"reset-password:%"}
        and "createdAt" > ${since}
    `;
    if ((all[0]?.n ?? 0) > GLOBAL) return true;
  } catch {
    /* memory window still applies */
  }
  return false;
}

export async function pruneOlderResetTokens(userId: string, keepToken: string): Promise<void> {
  try {
    const sql = await getSql();
    const keep = `reset-password:${keepToken}`;
    await sql`
      delete from verification
      where "value" = ${userId}
        and identifier like ${"reset-password:%"}
        and identifier <> ${keep}
    `;
  } catch {
    /* ignore */
  }
}
