/**
 * Direct Google sign-in (Better Auth's built-in provider).
 *
 * The class site does not use the Grok auth broker and does not fall back to
 * a preview or sandbox client id. Both GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET must be set or the Google button stays off.
 *
 * TODO: X sign-in is hidden. Do not add an X button or an X provider until a
 * direct provider is wired here. Do not send classmates through the old broker.
 */
export const GOOGLE_PROVIDER_ID = "google" as const;

/** X stays off. See the TODO above. */
export const X_SIGN_IN_OFFERED = false;

export const GOOGLE_BUTTON_LABEL = "Continue with Google";

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
  "Google did not confirm this email, so it was not added to your existing HaDay account. Sign in with email, or use a Google account that has verified the address.";

/** Friendly copy for Better Auth's link refusal. Other codes return null. */
export function socialSignInErrorMessage(code: string): string | null {
  const normalized = code.toLowerCase().replace(/_/g, " ");
  if (normalized.includes("account not linked") || normalized.includes("unable to link")) {
    return GOOGLE_LINK_REFUSAL;
  }
  return null;
}

/** The login page shows the Google button only when the server says it is configured. Never X. */
export function loginSocialOffer(googleConfigured: boolean): {
  showGoogle: boolean;
  showX: boolean;
  divider: "or" | null;
} {
  const showGoogle = googleConfigured === true && X_SIGN_IN_OFFERED === false;
  return {
    showGoogle,
    showX: false,
    divider: showGoogle ? "or" : null,
  };
}

/** Old broker rows. Counted for the owner. Not used to sign in. */
export const LEGACY_BROKER_PROVIDER_IDS = ["grok-google", "grok-x"] as const;

export function isLegacyBrokerProvider(providerId: string): boolean {
  return (LEGACY_BROKER_PROVIDER_IDS as readonly string[]).includes(providerId);
}
