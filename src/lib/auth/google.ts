import type { StudyPath } from "@/lib/path";
import { X_LINK_REQUIRED_MESSAGE, X_NO_EMAIL_MESSAGE } from "./x";

/**
 * Direct Google sign-in (Better Auth's built-in provider).
 *
 * The class site does not use the Grok auth broker and does not fall back to
 * a preview or sandbox client id. Both GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET must be set or the Google button stays off.
 *
 * X is a separate direct provider in `./x`. It is offered only when its own
 * env vars are set. Do not send classmates through the old broker.
 */
export const GOOGLE_PROVIDER_ID = "google" as const;

export const GOOGLE_BUTTON_LABEL = "Continue with Google";

/** Shown under the button on Create account only. No checkbox. */
export const GOOGLE_PRIVACY_BEFORE = "By continuing with Google, you agree to the";
export const GOOGLE_PRIVACY_LINK = "Privacy policy and disclaimer";
export const GOOGLE_PRIVACY_NOTICE = `${GOOGLE_PRIVACY_BEFORE} ${GOOGLE_PRIVACY_LINK}.`;

export function showGooglePrivacyNotice(mode: "up" | "in" | "reset"): boolean {
  return mode === "up";
}

/** Better Auth callback for the built-in Google provider. */
export function googleCallbackUrl(origin = "https://hebrewmentor.haday.app"): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/api/auth/callback/google`;
}

export type GoogleCredentials = {
  clientId: string | null;
  clientSecret: string | null;
  configured: boolean;
};

/** Empty or whitespace counts as unset. One var without the other is not configured. */
export function readGoogleCredentials(env: {
  GOOGLE_CLIENT_ID?: string | undefined;
  GOOGLE_CLIENT_SECRET?: string | undefined;
}): GoogleCredentials {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const configured = Boolean(clientId && clientSecret);
  return {
    clientId: configured ? clientId : null,
    clientSecret: configured ? clientSecret : null,
    configured,
  };
}

export const MISSING_GOOGLE_WARNING =
  "[auth] Google sign-in is off. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. This host will not fall back to a preview or sandbox client id.";

/** One startup warning in production when Google is not configured. Null otherwise. */
export function missingGoogleSignInWarning(env: {
  NODE_ENV?: string | undefined;
  GOOGLE_CLIENT_ID?: string | undefined;
  GOOGLE_CLIENT_SECRET?: string | undefined;
}): string | null {
  if (env.NODE_ENV !== "production") return null;
  if (readGoogleCredentials(env).configured) return null;
  return MISSING_GOOGLE_WARNING;
}

/**
 * Link Google onto an existing account only when Google says the email is
 * verified. The local account must already have a verified email too
 * (Better Auth's default). Google is not treated as a trusted provider, so an
 * unverified Google email cannot link.
 */
export function googleMayLinkExistingAccount(input: {
  googleEmailVerified: boolean;
  localEmailVerified: boolean;
}): boolean {
  return input.googleEmailVerified === true && input.localEmailVerified === true;
}

export const GOOGLE_LINK_REFUSAL =
  "This email already has a HaDay account. Sign in with your email and password, or confirm the email we sent you, then Continue with Google will work.";

/** Friendly copy for Better Auth's link refusal, and the two X codes. Other codes return null. */
export function socialSignInErrorMessage(code: string): string | null {
  const raw = code.trim().toLowerCase();
  if (raw === "x_no_email" || raw === "x no email") return X_NO_EMAIL_MESSAGE;
  if (raw === "x_link_required" || raw === "x link required") return X_LINK_REQUIRED_MESSAGE;
  const normalized = raw.replace(/_/g, " ");
  if (normalized.includes("account not linked") || normalized.includes("unable to link")) {
    return GOOGLE_LINK_REFUSAL;
  }
  return null;
}

/** Continue with Google never waits for the heard-about answers. A path already picked is remembered. */
export function googlePathToRemember(
  mode: "up" | "in" | "reset",
  placed: StudyPath | null,
): StudyPath | null {
  if (mode === "up" && (placed === "bbh" || placed === "iibs")) return placed;
  return null;
}

/** The login page shows each button only when that provider is configured. */
export function loginSocialOffer(googleOn: boolean, xOn: boolean): {
  showGoogle: boolean;
  showX: boolean;
  divider: "or" | null;
} {
  const showGoogle = googleOn === true;
  const showX = xOn === true;
  return {
    showGoogle,
    showX,
    divider: showGoogle || showX ? "or" : null,
  };
}

/** Old broker rows. Counted for the owner. Not used to sign in. */
export const LEGACY_BROKER_PROVIDER_IDS = ["grok-google", "grok-x"] as const;

export function isLegacyBrokerProvider(providerId: string): boolean {
  return (LEGACY_BROKER_PROVIDER_IDS as readonly string[]).includes(providerId);
}
