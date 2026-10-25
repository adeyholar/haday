import { isPublicReadingPath, requestPath } from "@/lib/seo";

const RESEND_WINDOW_MS = 60_000;
const ROOT_SESSION_MS = 60_000;

/**
 * Addresses mailed in the last minute.
 * In memory only, one map per server instance.
 */
const sends = new Map<string, number>();
const marks = new Map<string, "sent" | "rate_limited">();

/** Per browser tab. The server copy is never read. */
let clientRoot: { at: number; value: unknown } | null = null;

export const VERIFY_ON_THE_WAY = "Another confirmation email is on the way.";
export const VERIFY_WAIT = "Please wait about a minute before asking for another email.";
export const VERIFY_UNKNOWN = "If that address has a HaDay account, check the inbox and spam.";
export const CONFIRM_STILL_UNSEEN = "We still don't see a confirmation. Check your inbox or resend.";

export type VerificationSendResult = "sent" | "rate_limited" | "accepted";

/** A signed-in student whose email is not confirmed may read these, and nothing else. */
export function isEmailConfirmExempt(pathname: string): boolean {
  const path = requestPath(pathname);
  if (path === "/" || path === "/login" || path === "/confirm-email" || path === "/reset-password") return true;
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

function pruneVerificationSends(now: number): void {
  for (const [key, at] of sends) {
    if (now - at >= RESEND_WINDOW_MS) sends.delete(key);
  }
}

function rememberMark(key: string, result: "sent" | "rate_limited"): void {
  marks.set(key, result);
}

/**
 * Record a confirmation mail, or refuse a repeat inside the minute.
 * An add drops entries older than that minute.
 */
export function claimVerificationSend(email: string, now = Date.now()): "sent" | "rate_limited" {
  const key = email.trim().toLowerCase();
  if (!key) return "rate_limited";
  const last = sends.get(key);
  if (last != null && now - last < RESEND_WINDOW_MS) {
    rememberMark(key, "rate_limited");
    return "rate_limited";
  }
  pruneVerificationSends(now);
  sends.set(key, now);
  rememberMark(key, "sent");
  return "sent";
}

/** True while this instance still remembers a send for the address. */
export function verificationSendRemembered(email: string): boolean {
  return sends.has(email.trim().toLowerCase());
}

/** Take the mark for this request. A sign-up call clears it so a later miss is not "sent". */
export function takeVerificationSendMark(email: string): "sent" | "rate_limited" | null {
  const key = email.trim().toLowerCase();
  if (!key) return null;
  const mark = marks.get(key) ?? null;
  marks.delete(key);
  return mark;
}

export function isVerificationSendPath(path: string): boolean {
  return path === "/send-verification-email" || path.endsWith("/send-verification-email");
}

/** Body for the resend endpoint. Undefined leaves the original response alone. */
export function verificationSendResponse(
  path: string,
  email: string,
): { status: true; verification: "sent" | "rate_limited" } | undefined {
  const mark = takeVerificationSendMark(email);
  if (!isVerificationSendPath(path) || (mark !== "sent" && mark !== "rate_limited")) return undefined;
  return { status: true, verification: mark };
}

export function verificationSendResult(payload: unknown): VerificationSendResult {
  if (!payload || typeof payload !== "object") return "accepted";
  const record = payload as { verification?: unknown; response?: unknown };
  const nested =
    record.response && typeof record.response === "object"
      ? (record.response as { verification?: unknown }).verification
      : undefined;
  const value = record.verification ?? nested;
  if (value === "sent" || value === "rate_limited") return value;
  return "accepted";
}

/** Login resend. Unknown addresses stay on the generic line and do not say a mail is on the way. */
export function loginVerificationNote(result: VerificationSendResult): string {
  if (result === "sent") return VERIFY_ON_THE_WAY;
  if (result === "rate_limited") return VERIFY_WAIT;
  return VERIFY_UNKNOWN;
}

export function confirmPageNote(result: "sent" | "rate_limited" | "confirmed"): string {
  if (result === "sent") return VERIFY_ON_THE_WAY;
  if (result === "rate_limited") return VERIFY_WAIT;
  return "This email is already confirmed.";
}

/** Confirmed leaves for the saved path. Still unconfirmed stays, with no redirect. */
export function confirmContinuePlan(
  emailVerified: boolean | null | undefined,
  next: string | null | undefined,
): { go: string } | { stay: string } {
  if (emailVerified === true) return { go: safeNextPath(next) };
  return { stay: CONFIRM_STILL_UNSEEN };
}

export function rootEmailVerified(
  matches: ReadonlyArray<{ routeId: string; context?: unknown }>,
): boolean | null | undefined {
  const root = matches.find((match) => match.routeId === "__root__");
  const context = root?.context;
  if (!context || typeof context !== "object") return undefined;
  const sessionUser = (context as { sessionUser?: { emailVerified?: boolean | null } | null }).sessionUser;
  if (!sessionUser) return undefined;
  if (sessionUser.emailVerified === true || sessionUser.emailVerified === false) return sessionUser.emailVerified;
  return undefined;
}

export function freshRootSession<T>(now = Date.now()): T | null {
  if (typeof window === "undefined" || !clientRoot) return null;
  if (now - clientRoot.at >= ROOT_SESSION_MS) {
    clientRoot = null;
    return null;
  }
  return clientRoot.value as T;
}

export function storeRootSession(value: unknown, now = Date.now()): void {
  if (typeof window === "undefined") return;
  clientRoot = { at: now, value };
}

/** Drop the 60s root cache so the next load reads the server. */
export function clearRootSession(): void {
  clientRoot = null;
}
