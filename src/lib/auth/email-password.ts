/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Off by default. To enable: set `emailAndPasswordEnabled` to `true` below,
 * then build sign-up / sign-in forms with `authClient.signUp.email` /
 * `authClient.signIn.email` from `@/lib/auth/client` (see the auth skill).
 *
 * Password reset lives here too (`sendResetPassword`). `server.ts` only spreads
 * this object — do not copy reset logic into that frozen file.
 */
import { originFromIncomingRequest, sendPasswordResetMail } from "../mail";

export const emailAndPasswordEnabled = true;

type ResetUser = { email: string; name?: string | null };

/** Better Auth calls this after storing the token. Must not throw (user-exists leak). */
export async function sendResetPassword(
  data: { user: ResetUser; url: string; token: string },
  _request?: Request,
): Promise<void> {
  try {
    const origin = (await originFromIncomingRequest()) || data.url;
    await sendPasswordResetMail({
      email: data.user.email,
      name: data.user.name ?? "",
      url: origin,
      token: data.token,
    });
  } catch (err) {
    console.error("[auth] sendResetPassword failed", err);
  }
}

export const emailAndPassword = {
  enabled: true as const,
  sendResetPassword,
  resetPasswordTokenExpiresIn: 60 * 60,
  revokeSessionsOnPasswordReset: true,
};
