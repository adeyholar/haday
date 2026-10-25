import { createServerFn } from "@tanstack/react-start";
import { signedInMiddleware } from "./middleware";
import { safeNextPath, verificationSendResult } from "./confirm-hold";

/** Another confirmation mail. One a minute. Does not open lessons. */
export const resendConfirmEmail = createServerFn({ method: "POST" })
  .validator((input: { next?: string } | undefined) => ({ next: typeof input?.next === "string" ? input.next : "" }))
  .middleware([signedInMiddleware])
  .handler(async ({ data }): Promise<
    { ok: true; result: "sent" | "rate_limited" | "confirmed" } | { ok: false; error: string }
  > => {
    const { getSessionUser } = await import("./verify.server");
    const { auth } = await import("./server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const user = await getSessionUser();
    if (!user?.email) return { ok: false, error: "Sign in again." };
    if (user.emailVerified) return { ok: true, result: "confirmed" };
    try {
      const payload = await auth.api.sendVerificationEmail({
        body: { email: user.email, callbackURL: safeNextPath(data.next) },
        headers: getRequest().headers,
      });
      const result = verificationSendResult(payload);
      if (result === "accepted") return { ok: false, error: "Could not send the confirmation email." };
      return { ok: true, result };
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/already verified/i.test(message)) return { ok: true, result: "confirmed" };
      return { ok: false, error: "Could not send the confirmation email." };
    }
  });
