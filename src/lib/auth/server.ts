/**
 * Self-hosted Better Auth for THIS app (server-only).
 *
 * The app runs its own Better Auth at `/api/auth/*`, so the session cookie stays
 * on this app's own origin.
 *
 * Google is the built-in social provider (`socialProviders.google`) when both
 * GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set. The callback is
 * `/api/auth/callback/google`. If either var is missing, there is no Google
 * provider and no Google button. This app does not call the Grok auth broker
 * and does not fall back to a preview or sandbox client id.
 *
 * X is not offered. TODO: add a direct X provider later. Do not route that
 * through the old Grok auth broker.
 *
 * Tri-mode:
 *   - Deployed: the host sets `BETTER_AUTH_URL` + `DATABASE_URL` and, for
 *     Google, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. Sessions persist
 *     in Postgres. Email and password work even when Google is unset.
 *   - Sandbox live preview: no fixed URL. Better Auth derives the origin from
 *     the request, checked against the preview host allowlist. There is still
 *     no preview OAuth client. Google appears only when its env vars are set.
 *   - Off (`VITE_AUTH_ENABLED=false`): `requireUserId` resolves a dev user with
 *     no database configured, and throws fail-closed once `DATABASE_URL` is set
 *     (see `verify.server.ts`).
 *
 * NEVER import this from client code — it pulls in `pg` + server-only Better
 * Auth internals. The client uses `@/lib/auth/client`.
 */
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { PREVIOUS_CLASS_HOST } from "../class-site";
import { resolveDatabaseUrl, pgPoolOptions } from "../database-url";
import { ensureDbReady, getPglite } from "../db";
import { emailAndPasswordEnabled, emailAndPassword, emailVerification, authHooks } from "./email-password";
import { missingGoogleSignInWarning, readGoogleCredentials } from "./google";
import { pgliteDialect } from "./pglite-dialect";
import { PREVIEW_ALLOWED_HOSTS } from "./preview";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

/**
 * Preview secret must outlive module reloads: PGLite (and its session rows) is
 * stored on `globalThis`, so an HMR re-eval of this file must NOT mint a new
 * signing secret or every existing session becomes invalid mid-dev. Process
 * restart clears both the secret and PGLite together.
 */
const globalAuthRef = globalThis as typeof globalThis & {
  __grokAuthPreviewSecret__?: string;
};
function previewAuthSecret(): string {
  globalAuthRef.__grokAuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__grokAuthPreviewSecret__;
}

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

// Explicit off-switch. The deployer sets `VITE_AUTH_ENABLED=true` when it
// provisions auth; set it to "false" to force auth off everywhere (dev user).
const authDisabled = env("VITE_AUTH_ENABLED") === "false";

const googleCredentials = readGoogleCredentials(process.env);
const googleClientId = googleCredentials.clientId;
const googleClientSecret = googleCredentials.clientSecret;

/**
 * True when sign-in is enforced (email/password, and Google when configured).
 * Google's absence does not turn auth off.
 */
export const authConfigured = !authDisabled;

/** True when the Google button and the Google provider are both on. */
export const googleSignInConfigured = authConfigured && googleCredentials.configured;

if (!authDisabled) {
  const googleWarning = missingGoogleSignInWarning(process.env);
  if (googleWarning) console.warn(googleWarning);
}

// This app's own Better Auth origin. When deployed the host sets the public
// URL. In the sandbox live preview there's no fixed URL (each preview gets a
// dynamic `*.grok-sandbox.com` host), so we hand Better Auth a dynamic baseURL:
// it derives the origin per-request from the (proxied) host, validated against
// the preview allowlist.
const explicitBaseURL = env("BETTER_AUTH_URL");
// Explicit `string[]` (not a readonly tuple) — Better Auth's DynamicBaseURLConfig
// requires a mutable `allowedHosts: string[]`.
const previewAllowedHosts: string[] = [...PREVIEW_ALLOWED_HOSTS];
// Local `npm run dev` (port 8080 contract). Browsers may send Origin as any of
// these for the same server — trusting only `localhost` rejects `127.0.0.1` and
// breaks email/password with "Invalid origin".
const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];
// The two class hosts. While both are live, Google must return to the host
// the student started on. A single BETTER_AUTH_URL would send the new
// host's sign-in back to the old one.
const CLASS_SIGN_IN_HOSTS = [PREVIOUS_CLASS_HOST, "hebrewmentor.haday.app"];
function hostnameOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
const envHost = hostnameOf(explicitBaseURL);
const baseURL = explicitBaseURL
  ? {
      allowedHosts: [...new Set([...CLASS_SIGN_IN_HOSTS, ...(envHost ? [envHost] : [])])],
      protocol: "https" as const,
      fallback: explicitBaseURL,
    }
  : {
      // Include loopback hosts so dynamic baseURL resolves for local email/password
      // (not only the preview wildcard).
      allowedHosts: [...previewAllowedHosts, "localhost", "127.0.0.1", "[::1]"],
      // `auto` → trust both http:// and https:// expansions of allowedHosts
      // (preview is https; local dev is http).
      protocol: "auto" as const,
      fallback: "http://localhost:8080",
    };

// Origins Better Auth accepts on credentialed POSTs (sign-up/sign-in, etc.).
// Missing entries here surface as FORBIDDEN "Invalid origin".
const trustedOrigins: string[] = [
  ...(explicitBaseURL ? [explicitBaseURL] : []),
  ...(!explicitBaseURL
    ? [
        ...previewAllowedHosts,
        ...previewAllowedHosts.flatMap((host) => [`https://${host}`, `http://${host}`]),
      ]
    : []),
  ...LOCAL_DEV_ORIGINS,
  "https://haday-bud9cwczfeakh8ce.westus3-01.azurewebsites.net",
  "https://haday.azurewebsites.net",
  "https://haday.vercel.app",
  `https://${PREVIOUS_CLASS_HOST}`,
  "https://hebrewmentor.haday.app",
  "https://hebrew.haday.app",
  "https://haday.class.app",
  "https://www.haday.class.app",
];

const databaseUrl = resolveDatabaseUrl() ?? env("DATABASE_URL");

// Real Postgres when `DATABASE_URL` is set (deployed apps), else the app's
// embedded PGLite (preview) via a Kysely dialect — so Better Auth persists to the
// SAME DB as app data, including email/password users. Both use the Better Auth
// schema from `migrations/auth/0001_auth.sql`, copied into `migrations/` when
// the app turns sign-in on.
const database = databaseUrl
  ? new Pool(pgPoolOptions(databaseUrl))
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

/** Session token cookie name — also read by the live-preview popup completion page. */
export const SESSION_TOKEN_COOKIE = "__Host-grok-auth.session_token";

export const auth = betterAuth({
  baseURL,
  // Deployed apps inject BETTER_AUTH_SECRET. Preview: process-stable secret on
  // globalThis so HMR doesn't invalidate PGLite-backed sessions (see above).
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
  database,

  // CSRF / origin check for credentialed auth POSTs (email sign-up/sign-in, …).
  // See `trustedOrigins` construction above — must cover live preview hosts AND
  // local loopback variants, or clients get "Invalid origin".
  trustedOrigins,

  // Encrypt Google tokens at rest. Do not treat any provider as trusted.
  // Linking an existing account requires Google's email_verified claim and a
  // local email that is already verified (Better Auth's default). An unverified
  // Google address is refused instead of being attached.
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
    },
  },

  ...(googleSignInConfigured
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
            // Always show Google's account chooser. Shared class computers
            // should not silently reuse the last Google session.
            prompt: "select_account",
          },
        },
      }
    : {}),

  // Cache the session in the short-lived signed `session_data` cookie so reads
  // (incl. the client's `/get-session`) skip the DB — this shrinks the "loading"
  // window and reduces auth flicker. See the `auth` skill for the full
  // flicker-prevention guidance (gate on `isPending`; SSR the session).
  session: { cookieCache: { enabled: true, maxAge: 300 } },

  // Local email/password — toggled only via `./email-password` (not a plugin).
  ...(emailAndPasswordEnabled ? { emailAndPassword, emailVerification, hooks: authHooks } : {}),

  // `__Host-` prefixed cookies: the browser REFUSES any same-named cookie that
  // carries a `Domain` attribute, so a sibling `*.grok.me` app cannot "toss" a
  // `Domain=.grok.me` session cookie onto this app. `__Host-` requires Secure +
  // Path=/ + no Domain; Better Auth otherwise uses `__Secure-` (which permits
  // Domain), so we drop its auto prefix (`useSecureCookies: false`) and set
  // Secure + the names ourselves. (Browsers allow Secure cookies on
  // `http://localhost`, so local dev still works.)
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-grok-auth.session_data" },
      account_data: { name: "__Host-grok-auth.account_data" },
      dont_remember: { name: "__Host-grok-auth.dont_remember" },
    },
  },

  plugins: [
    // Accept `Authorization: Bearer <session-token>` as an alternative to the
    // cookie. Needed for the LIVE PREVIEW: the app runs in an embedded iframe
    // where cookies are partitioned, so after popup sign-in it authenticates with
    // a bearer token instead (see `client.ts`). The hook only
    // fires when an Authorization header is present, so the cookie path
    // (deployed apps) is unaffected.
    bearer(),

    // Bridges Better Auth's Set-Cookie into TanStack Start responses. MUST be
    // last so it runs after every other plugin's hooks.
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}
