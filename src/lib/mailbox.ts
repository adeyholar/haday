/**
 * Reject disposable / undeliverable addresses before an account is created.
 * A live mailbox is proven later by the verification email.
 */
import { promises as dns } from "node:dns";

export type MailboxCheck = { ok: true } | { ok: false; reason: string };

const DISPOSABLE = new Set(
  [
    "0-mail.com",
    "10minutemail.com",
    "10minutemail.net",
    "discard.email",
    "dispostable.com",
    "fakeinbox.com",
    "getnada.com",
    "guerrillamail.com",
    "guerrillamailblock.com",
    "inboxbear.com",
    "mailcatch.com",
    "maildrop.cc",
    "mailinator.com",
    "mailinator.net",
    "mailnesia.com",
    "mailnull.com",
    "mintemail.com",
    "mohmal.com",
    "mytemp.email",
    "sharklasers.com",
    "temp-mail.org",
    "tempail.com",
    "tempmail.com",
    "throwaway.email",
    "tmpmail.net",
    "tmpmail.org",
    "trash-mail.com",
    "trashmail.com",
    "yopmail.com",
    "yopmail.net",
    "example.com",
    "example.org",
    "example.net",
    "test.com",
    "invalid",
    "localhost",
  ].map((d) => d.toLowerCase()),
);

export function parseEmail(raw: string): { local: string; domain: string } | null {
  const email = raw.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || !domain || domain.includes("..") || domain.startsWith(".") || domain.endsWith(".")) {
    return null;
  }
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(domain)) return null;
  if (!domain.includes(".")) return null;
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return null;
  return { local, domain };
}

export function isDisposableDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  if (DISPOSABLE.has(d)) return true;
  for (const item of DISPOSABLE) {
    if (d.endsWith(`.${item}`)) return true;
  }
  return false;
}

async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("dns-timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function hasMailHost(domain: string): Promise<boolean> {
  try {
    const mx = await withTimeout(dns.resolveMx(domain), 2500);
    if (mx.some((row) => row.exchange)) return true;
  } catch {
    /* try A / AAAA */
  }
  try {
    const a = await withTimeout(dns.resolve4(domain), 2000);
    if (a.length > 0) return true;
  } catch {
    /* try AAAA */
  }
  try {
    const aaaa = await withTimeout(dns.resolve6(domain), 2000);
    return aaaa.length > 0;
  } catch {
    return false;
  }
}

export async function inspectMailbox(raw: string): Promise<MailboxCheck> {
  const parsed = parseEmail(raw);
  if (!parsed) {
    return { ok: false, reason: "That does not look like an email address." };
  }
  if (isDisposableDomain(parsed.domain)) {
    return { ok: false, reason: "Use a lasting email (school or personal), not a temporary inbox." };
  }
  const delivers = await hasMailHost(parsed.domain);
  if (!delivers) {
    return { ok: false, reason: "That email domain does not accept mail. Check the spelling." };
  }
  return { ok: true };
}
