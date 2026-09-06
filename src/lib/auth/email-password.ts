/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Off by default. To enable: set `emailAndPasswordEnabled` to `true` below,
 * then build sign-up / sign-in forms with `authClient.signUp.email` /
 * `authClient.signIn.email` from `@/lib/auth/client` (see the auth skill).
 *
 * Password reset, email verification, and the sign-up mailbox check live here.
 * `server.ts` only spreads these objects — do not copy that logic into that frozen file.
 */
import { APIError, createAuthMiddleware } from "better-auth/api";
import { originFromIncomingRequest, sendPasswordResetMail, sendVerificationMail } from "../mail";
import { inspectMailbox } from "../mailbox";
import { pruneOlderResetTokens, resetClientIp, resetSendBlocked } from "../reset-guard";

export const emailAndPasswordEnabled = true;

type ResetUser = { id?: string; email: string; name?: string | null };

/** Better Auth calls this after storing the token. Must not throw (user-exists leak). */
export async function sendResetPassword(
  data: { user: ResetUser; url: string; token: string },
  request?: Request,
): Promise<void> {
  try {
    const email = data.user.email;
    if (data.user.id) await pruneOlderResetTokens(data.user.id, data.token);
    if (await resetSendBlocked(email, resetClientIp(request))) {
      console.info(`[auth] password reset mail skipped (rate limit) for ${email}`);
      return;
    }
    const origin = (await originFromIncomingRequest()) || data.url;
    await sendPasswordResetMail({
      email,
      name: data.user.name ?? "",
      url: origin,
      token: data.token,
    });
    if (data.user.id) await pruneOlderResetTokens(data.user.id, data.token);
  } catch (err) {
    console.error("[auth] sendResetPassword failed", err);
  }
}

/** Must not throw — Better Auth still creates the unverified user. */
export async function sendVerificationEmail(
  data: { user: ResetUser; url: string; token: string },
): Promise<void> {
  try {
    await sendVerificationMail({
      email: data.user.email,
      name: data.user.name ?? "",
      url: data.url,
    });
  } catch (err) {
    console.error("[auth] sendVerificationEmail failed", err);
  }
}

export const emailAndPassword = {
  enabled: true as const,
  requireEmailVerification: true,
  sendResetPassword,
  resetPasswordTokenExpiresIn: 60 * 60,
  revokeSessionsOnPasswordReset: true,
};

export const emailVerification = {
  sendVerificationEmail,
  sendOnSignUp: true,
  sendOnSignIn: true,
  autoSignInAfterVerification: true,
  expiresIn: 60 * 60 * 24,
};

function signupEmailFromBody(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const email = (body as { email?: unknown }).email;
  return typeof email === "string" ? email : "";
}

/**
 * Mailbox check on email/password sign-up only. OAuth (Google / X, including
 * X's synthetic emails) must not run this — those identities are proven upstream.
 */
export const authHooks = {
  before: createAuthMiddleware(async (ctx) => {
    const path = ctx.path ?? "";
    if (path !== "/sign-up/email" && !path.endsWith("/sign-up/email")) return;
    const email = signupEmailFromBody(ctx.body);
    if (!email) return;
    const check = await inspectMailbox(email);
    if (check.ok) return;
    throw new APIError("BAD_REQUEST", { message: check.reason });
  }),
};
