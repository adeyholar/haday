import { isPublicReadingPath, requestPath } from "@/lib/seo";

const RESEND_WINDOW_MS = 60_000;
const sends = new Map<string, number>();

/** A signed-in student whose email is not confirmed may read these, and nothing else. */
export function isEmailConfirmExempt(pathname: string): boolean {
  const path = requestPath(pathname);
  if (path === "/" || path === "/login" || path === "/confirm-email" || path === "/reset-password") return true;
  if (path === "/blog" || path.startsWith("/blog/")) return true;
  if (path.startsWith("/api/") || path === "/api" || path.startsWith("/_")) return true;
  if (path.includes(".")) return true;
  return isPublicReadingPath(path);
}

/** Where to send a signed-in student who has not confirmed. Null when they may stay. */
export function emailConfirmRedirect(pathname: string, emailVerified: boolean | null | undefined): string | null {
  if (emailVerified !== false) return null;
  if (isEmailConfirmExempt(pathname)) return null;
  const next = requestPath(pathname);
  return `/confirm-email?next=${encodeURIComponent(next)}`;
}

/** Keep the domain, hide the rest of the local part. */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0 || !trimmed.slice(at + 1)) return "your email";
  return `${trimmed.slice(0, 1)}***@${trimmed.slice(at + 1)}`;
}

/** Only a same-site path. The confirm screen itself is not a landing place. */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/";
  const path = requestPath(raw.split("?")[0] ?? "/");
  if (path === "/confirm-email" || path === "/login") return "/";
  return path;
}

export function noteVerificationSend(email: string, now = Date.now()): void {
  const key = email.trim().toLowerCase();
  if (!key) return;
  sends.set(key, now);
}

/** True when this address was mailed inside the last minute. */
export function verificationResendBlocked(email: string, now = Date.now()): boolean {
  const key = email.trim().toLowerCase();
  if (!key) return false;
  const last = sends.get(key);
  if (last == null) return false;
  return now - last < RESEND_WINDOW_MS;
}
