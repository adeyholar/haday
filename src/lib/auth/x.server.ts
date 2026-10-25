/**
 * Server-only X provider helpers. Do not import this from client code.
 * The button module is `./x`, which stays free of Better Auth's server graph.
 */
import { createAuthMiddleware } from "better-auth/api";
import { getOAuthState } from "better-auth/api";
import { twitter } from "better-auth/social-providers";
import { X_PROVIDER_ID, mapXProfile, rewriteXCallbackLocation, xCallbackEmailVerified } from "./x";

type XToken = { accessToken?: string | null | undefined };

/** Fetch the X profile the same way the installed provider does, then apply our email rules. */
export async function xGetUserInfo(clientId: string, clientSecret: string, token: XToken) {
  const reader = twitter({
    clientId,
    clientSecret,
    mapProfileToUser: (profile) => mapXProfile(profile),
  });
  const result = await reader.getUserInfo(token as never);
  if (!result?.user) return null;
  let linking = false;
  try {
    const state = await getOAuthState();
    linking = Boolean(state?.link);
  } catch {
    linking = false;
  }
  const rawEmail = typeof result.user.email === "string" ? result.user.email : null;
  const email = rawEmail && rawEmail.includes("@") ? rawEmail : null;
  return {
    data: result.data,
    user: {
      ...result.user,
      email,
      emailVerified: xCallbackEmailVerified({ email, linking }),
    },
  };
}

/** Map Twitter callback failures onto the two login codes. Google's callback is untouched. */
export const xCallbackAfter = createAuthMiddleware(async (ctx) => {
  const id = typeof ctx.params?.id === "string" ? ctx.params.id : "";
  const path = ctx.path ?? "";
  if (id !== X_PROVIDER_ID && !path.endsWith("/callback/twitter")) return;
  const headers = ctx.context.responseHeaders;
  if (!headers) return;
  const location = headers.get("location");
  if (!location) return;
  const next = rewriteXCallbackLocation(location);
  if (!next) return;
  headers.set("location", next);
});
