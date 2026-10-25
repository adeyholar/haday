/**
 * Direct X sign-in (Better Auth's built-in Twitter provider, OAuth 2.0).
 *
 * This app does not use the Grok auth broker and does not fall back to a
 * preview or sandbox client. Both X_CLIENT_ID and X_CLIENT_SECRET must be set
 * or the X button stays off.
 */
export const X_PROVIDER_ID = "twitter" as const;

export const X_BUTTON_LABEL = "Continue with X";

/** Shown under the button on Create account only. No checkbox. */
export const X_PRIVACY_BEFORE = "By continuing with X, you agree to the";
export const X_PRIVACY_LINK = "Privacy policy and disclaimer";
export const X_PRIVACY_NOTICE = `${X_PRIVACY_BEFORE} ${X_PRIVACY_LINK}.`;

export function showXPrivacyNotice(mode: "up" | "in" | "reset"): boolean {
  return mode === "up";
}

export const X_NO_EMAIL = "x_no_email";
export const X_LINK_REQUIRED = "x_link_required";

export const X_NO_EMAIL_MESSAGE =
  "Your X account didn't share an email. Create an account with email or Google, then link X from Account.";

export const X_LINK_REQUIRED_MESSAGE =
  "That email already has a HaDay account. Sign in with it, then link X from Account.";

/** Better Auth callback for the built-in Twitter provider. */
export function xCallbackUrl(origin = "https://hebrewmentor.haday.app"): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/api/auth/callback/twitter`;
}

export const X_SCOPES = ["users.read", "tweet.read", "users.email"] as const;

export type XCredentials = {
  clientId: string | null;
  clientSecret: string | null;
  configured: boolean;
};

/** Empty or whitespace counts as unset. One var without the other is not configured. */
export function readXCredentials(env: {
  X_CLIENT_ID?: string | undefined;
  X_CLIENT_SECRET?: string | undefined;
}): XCredentials {
  const clientId = env.X_CLIENT_ID?.trim() || "";
  const clientSecret = env.X_CLIENT_SECRET?.trim() || "";
  const configured = Boolean(clientId && clientSecret);
  return {
    clientId: configured ? clientId : null,
    clientSecret: configured ? clientSecret : null,
    configured,
  };
}

/** One startup warning in production. Names the missing var. Never a value. */
export function missingXSignInWarning(env: {
  NODE_ENV?: string | undefined;
  X_CLIENT_ID?: string | undefined;
  X_CLIENT_SECRET?: string | undefined;
}): string | null {
  if (env.NODE_ENV !== "production") return null;
  if (readXCredentials(env).configured) return null;
  const missing: string[] = [];
  if (!env.X_CLIENT_ID?.trim()) missing.push("X_CLIENT_ID");
  if (!env.X_CLIENT_SECRET?.trim()) missing.push("X_CLIENT_SECRET");
  const names = missing.length > 0 ? missing.join(" and ") : "X_CLIENT_ID and X_CLIENT_SECRET";
  return `[auth] X sign-in is off. Set ${names}. This host will not fall back to a preview or sandbox client id.`;
}

type XProfile = {
  data?: {
    email?: string | null;
    confirmed_email?: string | null;
    username?: string | null;
  } | null;
} | null;

function profileText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Email is the confirmed address, or null. A username is never an email.
 * emailVerified is always false: a new X account still confirms by mail,
 * and X is not treated as proof that an existing HaDay account is theirs.
 */
export function mapXProfile(profile: XProfile): { email: string | null; emailVerified: false } {
  const data = profile?.data;
  const confirmed = profileText(data?.confirmed_email) || profileText(data?.email);
  const email = confirmed.includes("@") ? confirmed : null;
  return { email, emailVerified: false };
}

/**
 * Better Auth 1.6.30 allows linkSocial only when this claim is set or the
 * provider is on its trusted list. X is not on that list (that would attach
 * X during sign-in). The claim is set for an explicit link, including when
 * X shared no email or a different one. That path does not store the claim
 * on the HaDay user. mapXProfile stays false.
 */
export function xCallbackEmailVerified(input: { email: string | null; linking: boolean }): boolean {
  return input.linking === true;
}

/** Rewrite a Twitter callback error redirect. Other errors are left alone. No address is added. */
export function rewriteXCallbackLocation(location: string): string | null {
  let url: URL;
  try {
    url = new URL(location, "https://hebrewmentor.haday.app");
  } catch {
    return null;
  }
  const error = url.searchParams.get("error");
  let changed = false;
  if (error === "email_not_found") {
    url.searchParams.set("error", X_NO_EMAIL);
    changed = true;
  } else if (error === "account_not_linked") {
    url.searchParams.set("error", X_LINK_REQUIRED);
    changed = true;
  }
  if (url.searchParams.has("error_description")) {
    url.searchParams.delete("error_description");
    changed = true;
  }
  if (!changed) return null;
  if (location.startsWith("http://") || location.startsWith("https://")) return url.toString();
  return `${url.pathname}${url.search}`;
}

/** Unlink is refused when it would remove the last way in. */
export function canUnlinkSignIn(accounts: { providerId: string }[], providerId: string): boolean {
  return accounts.some((account) => account.providerId !== providerId);
}

/** Plain sentences for link errors on Account. Never the raw code. */
export function accountLinkErrorMessage(code: string): string | null {
  const normalized = code.trim().toLowerCase().replace(/_/g, " ").replace(/'/g, "");
  if (normalized.includes("already linked")) {
    return "That X account is already linked to another HaDay account.";
  }
  if (normalized === "unable to link account") return "We couldn't link X. Please try again.";
  if (normalized.includes("doesnt match")) return "Your X email is different from your HaDay email.";
  return null;
}
