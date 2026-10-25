import { createServerFn } from "@tanstack/react-start";
import { googleSignInConfigured, xSignInConfigured } from "./server";

/** Login reads this so a social button exists only when that provider's env vars are set. */
export const getGoogleSignInOffered = createServerFn({ method: "GET" }).handler(async () => {
  return { google: googleSignInConfigured, x: xSignInConfigured };
});
