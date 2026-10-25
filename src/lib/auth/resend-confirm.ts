import { createServerFn } from "@tanstack/react-start";
import { signedInMiddleware } from "./middleware";
import { safeNextPath, verificationResendBlocked } from "./confirm-hold";

/** Another confirmation mail. One a minute. Does not open lessons. */
export const resendConfirmEmail = createServerFn({ method: "POST" })
  .validator((input: { next?: string } | undefined) => ({ next: typeof input?.next === "string" ? input.next : "" }))
  .middleware([signedInMiddleware])
  .handler(async ({ data }): Promise<{ ok: true; sent: boolean } | { ok: false; error: string }> => {
    const { getSessionUser } = await import("./verify.server");
    const { auth } = await import("./server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const user = await getSessionUser();
    if (!user?.email) return { ok: false, error: "Sign in again." };
    if (user.emailVerified) return { ok: true, sent: false };
    if (verificationResendBlocked(user.email)) return { ok: false, error: "Wait a minute, then send it again." };
    await auth.api.sendVerificationEmail({
      body: { email: user.email, callbackURL: safeNextPath(data.next) },
      headers: getRequest().headers,
    });
    return { ok: true, sent: true };
  });
