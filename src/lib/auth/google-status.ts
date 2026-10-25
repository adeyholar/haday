import { createServerFn } from "@tanstack/react-start";
import { googleSignInConfigured } from "./server";

/** Login reads this so the Google button exists only when both Google env vars are set. */
export const getGoogleSignInOffered = createServerFn({ method: "GET" }).handler(async () => {
  return { offered: googleSignInConfigured };
});
