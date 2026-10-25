import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";
import { betterAuth } from "better-auth";
const { handleOAuthUserInfo } = await import(
  new URL("../node_modules/better-auth/dist/oauth2/link-account.mjs", import.meta.url).href,
);

const root = new URL("..", import.meta.url);
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const {
  GOOGLE_BUTTON_LABEL,
  GOOGLE_LINK_REFUSAL,
  X_SIGN_IN_OFFERED,
  googleCallbackUrl,
  readGoogleCredentials,
  missingGoogleSignInWarning,
  googleMayLinkExistingAccount,
  googlePathToRemember,
  socialSignInErrorMessage,
  loginSocialOffer,
  isLegacyBrokerProvider,
} = await jiti.import(new URL("../src/lib/auth/google.ts", import.meta.url).pathname);

const CLIENT_ID = "1234567890-haday.apps.googleusercontent.com";
const CLIENT_SECRET = "google-client-secret-not-a-preview";
const ORIGIN = "https://hebrewmentor.haday.app";

function read(rel) {
  return readFileSync(new URL(rel, root), "utf8");
}

test("the login page offers Google only when it is configured, and never X", () => {
  assert.equal(X_SIGN_IN_OFFERED, false);
  assert.deepEqual(loginSocialOffer(false), { showGoogle: false, showX: false, divider: null });
  assert.deepEqual(loginSocialOffer(true), { showGoogle: true, showX: false, divider: "or" });
  assert.equal(readGoogleCredentials({}).configured, false);
  assert.equal(readGoogleCredentials({ GOOGLE_CLIENT_ID: "only-id" }).configured, false);
  assert.equal(readGoogleCredentials({ GOOGLE_CLIENT_SECRET: "only-secret" }).configured, false);
  assert.equal(readGoogleCredentials({ GOOGLE_CLIENT_ID: "  ", GOOGLE_CLIENT_SECRET: "secret" }).configured, false);
  const ready = readGoogleCredentials({ GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: CLIENT_SECRET });
  assert.equal(ready.configured, true);
  assert.equal(ready.clientId, CLIENT_ID);
  assert.notEqual(ready.clientId, "grok_preview");

  const button = read("src/components/google-sign-in-button.tsx");
  assert.match(button, new RegExp(GOOGLE_BUTTON_LABEL));
  assert.match(button, /#4285F4/);
  assert.match(button, /#34A853/);
  assert.match(button, /#FBBC05/);
  assert.match(button, /#EA4335/);
  assert.match(button, /#747775/);
  assert.match(button, /min-h-11/);
  assert.doesNotMatch(button, /min-h-10/);
  assert.doesNotMatch(button, /Continue with X|Sign in with X|grok-x|twitter/);

  const login = read("src/routes/login.tsx");
  assert.match(login, /googleOffered/);
  assert.match(login, /signInLanding/);
  assert.match(login, /GoogleSignInButton/);
  assert.match(login, /getGoogleSignInOffered/);
  assert.doesNotMatch(login, /Continue with X|grok-x|GROK_PROVIDERS|genericOAuth/);
  assert.match(login, /\n\s*or\n/);
});

test("production without Google env warns once and does not name a preview client", () => {
  assert.equal(missingGoogleSignInWarning({ NODE_ENV: "development" }), null);
  assert.equal(
    missingGoogleSignInWarning({
      NODE_ENV: "production",
      GOOGLE_CLIENT_ID: CLIENT_ID,
      GOOGLE_CLIENT_SECRET: CLIENT_SECRET,
    }),
    null,
  );
  const warning = missingGoogleSignInWarning({ NODE_ENV: "production", GOOGLE_CLIENT_ID: CLIENT_ID });
  assert.match(warning, /GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET/);
  assert.match(warning, /will not fall back/);
  assert.doesNotMatch(warning, /grok_preview/);
});

test("Google links an existing account only when Google verified the email", () => {
  assert.equal(googleMayLinkExistingAccount({ googleEmailVerified: false, localEmailVerified: true }), false);
  assert.equal(googleMayLinkExistingAccount({ googleEmailVerified: true, localEmailVerified: false }), false);
  assert.equal(googleMayLinkExistingAccount({ googleEmailVerified: false, localEmailVerified: false }), false);
  assert.equal(googleMayLinkExistingAccount({ googleEmailVerified: true, localEmailVerified: true }), true);
  assert.equal(socialSignInErrorMessage("account_not_linked"), GOOGLE_LINK_REFUSAL);
  assert.equal(socialSignInErrorMessage("unable_to_link_account"), GOOGLE_LINK_REFUSAL);
  assert.equal(
    GOOGLE_LINK_REFUSAL,
    "This email already has a HaDay account. Sign in with your email and password, or confirm the email we sent you, then Continue with Google will work.",
  );
  assert.equal(socialSignInErrorMessage("token_expired"), null);
});

test("sign-in/social redirects to Google with the real client id and class callback", async () => {
  const creds = readGoogleCredentials({ GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: CLIENT_SECRET });
  const auth = betterAuth({
    baseURL: ORIGIN,
    secret: "test-secret-test-secret-test-secret-32",
    trustedOrigins: [ORIGIN],
    socialProviders: {
      google: {
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        prompt: "select_account",
      },
    },
    account: { accountLinking: { enabled: true } },
  });
  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
      },
      body: JSON.stringify({
        provider: "google",
        callbackURL: "/login",
        errorCallbackURL: "/login",
        disableRedirect: true,
      }),
    }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  const url = new URL(body.url);
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("client_id"), CLIENT_ID);
  assert.equal(url.searchParams.get("redirect_uri"), googleCallbackUrl(ORIGIN));
  assert.equal(url.searchParams.get("redirect_uri"), `${ORIGIN}/api/auth/callback/google`);
  assert.doesNotMatch(body.url, /grok_preview|auth\.grok\.me|grok-google|grok-x/);
  assert.equal(JSON.stringify(body).includes("grok_preview"), false);
});

test("Create account with nothing answered still starts Google", async () => {
  assert.equal(googlePathToRemember("up", null), null);
  assert.equal(googlePathToRemember("up", "bbh"), "bbh");
  assert.equal(googlePathToRemember("up", "iibs"), "iibs");
  assert.equal(googlePathToRemember("in", "bbh"), null);
  assert.equal(googlePathToRemember("in", null), null);

  const login = read("src/routes/login.tsx");
  const onGoogle = login.slice(login.indexOf("async function onGoogle"), login.indexOf("async function onForgot"));
  const emailStart = login.indexOf("async function onEmail");
  const onEmail = login.slice(emailStart, login.indexOf("return (", emailStart));
  assert.match(onGoogle, /googlePathToRemember\(mode, placed\)/);
  assert.match(onGoogle, /stashPathIntent\(remember\)/);
  assert.match(onGoogle, /signIn\(GOOGLE_PROVIDER_ID/);
  assert.doesNotMatch(onGoogle, /if \(!placed\)/);
  assert.match(onEmail, /if \(!placed\)/);
  assert.doesNotMatch(login, /Answer the question above to use Google/);

  const { signInLanding } = await jiti.import(new URL("../src/lib/path.ts", import.meta.url).pathname);
  assert.equal(signInLanding({ path: null, admin: false }), "/");
  assert.equal(signInLanding({ path: "bbh", admin: false }), "/bbh");
  assert.equal(signInLanding({ path: "iibs", admin: false }), "/iibs");

  const creds = readGoogleCredentials({ GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: CLIENT_SECRET });
  const auth = betterAuth({
    baseURL: ORIGIN,
    secret: "test-secret-test-secret-test-secret-32",
    trustedOrigins: [ORIGIN],
    socialProviders: {
      google: {
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        prompt: "select_account",
      },
    },
  });
  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({
        provider: "google",
        callbackURL: "/login",
        errorCallbackURL: "/login",
        disableRedirect: true,
      }),
    }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  const url = new URL(body.url);
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("client_id"), CLIENT_ID);
  assert.doesNotMatch(body.url, /grok_preview/);
});

test("an unverified Google email does not link to an existing account", async () => {
  const auth = betterAuth({
    baseURL: ORIGIN,
    secret: "test-secret-test-secret-test-secret-32",
    trustedOrigins: [ORIGIN],
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    socialProviders: {
      google: { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
    },
    account: { accountLinking: { enabled: true } },
  });
  const headers = new Headers({ origin: ORIGIN });
  const created = await auth.api.signUpEmail({
    body: { name: "Student", email: "student@example.com", password: "password123" },
    headers,
  });
  const ctx = await auth.$context;
  await ctx.internalAdapter.updateUser(created.user.id, { emailVerified: true });
  const endpoint = { context: ctx };
  const refused = await handleOAuthUserInfo(endpoint, {
    userInfo: {
      id: "google-sub-unverified",
      email: "student@example.com",
      name: "Student",
      emailVerified: false,
    },
    account: { providerId: "google", accountId: "google-sub-unverified" },
    callbackURL: "/login",
  });
  assert.equal(refused.error, "account not linked");
  const afterRefusal = await ctx.internalAdapter.findOAuthUser(
    "student@example.com",
    "google-sub-unverified",
    "google",
  );
  assert.equal(
    afterRefusal.accounts.some((account) => account.providerId === "google"),
    false,
  );

  const linked = await handleOAuthUserInfo(endpoint, {
    userInfo: {
      id: "google-sub-verified",
      email: "student@example.com",
      name: "Student",
      emailVerified: true,
    },
    account: { providerId: "google", accountId: "google-sub-verified" },
    callbackURL: "/login",
  });
  assert.equal(linked.error, null);
  const afterLink = await ctx.internalAdapter.findOAuthUser(
    "student@example.com",
    "google-sub-verified",
    "google",
  );
  assert.equal(
    afterLink.accounts.some((account) => account.providerId === "google" && account.accountId === "google-sub-verified"),
    true,
  );
});

test("email sign-up, verification mail, and password reset still run", async () => {
  let verifyCalls = 0;
  let resetCalls = 0;
  const auth = betterAuth({
    baseURL: ORIGIN,
    secret: "test-secret-test-secret-test-secret-32",
    trustedOrigins: [ORIGIN],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async () => {
        resetCalls += 1;
      },
    },
    emailVerification: {
      sendVerificationEmail: async () => {
        verifyCalls += 1;
      },
      sendOnSignUp: true,
    },
    account: { accountLinking: { enabled: true } },
  });
  const headers = new Headers({ origin: ORIGIN });
  const created = await auth.api.signUpEmail({
    body: {
      name: "Student",
      email: "new-student@example.com",
      password: "password123",
      callbackURL: "/login",
    },
    headers,
  });
  assert.equal(created.user.email, "new-student@example.com");
  assert.equal(verifyCalls, 1);
  const reset = await auth.api.requestPasswordReset({
    body: { email: "new-student@example.com", redirectTo: "/reset-password" },
    headers,
  });
  assert.equal(reset.status, true);
  assert.equal(resetCalls, 1);

  const emailPassword = read("src/lib/auth/email-password.ts");
  assert.match(emailPassword, /emailAndPasswordEnabled = true/);
  assert.match(emailPassword, /sendResetPassword/);
  assert.match(emailPassword, /sendVerificationEmail/);
  assert.match(emailPassword, /\/sign-up\/email/);
});

test("the auth source does not call the Grok broker or a preview client", () => {
  const files = [
    "src/lib/auth/server.ts",
    "src/lib/auth/client.ts",
    "src/lib/auth/providers.ts",
    "src/lib/auth/preview.ts",
    "src/lib/auth/popup.server.ts",
    "src/lib/auth/google.ts",
    "src/routes/login.tsx",
    ".env.example",
  ];
  const combined = files.map((file) => read(file)).join("\n");
  assert.equal(combined.includes("grok_preview"), false);
  assert.equal(combined.includes("auth.grok.me"), false);
  assert.equal(combined.includes("genericOAuth"), false);
  assert.equal(combined.includes("GROK_AUTH_"), false);
  assert.equal(combined.includes("signInWithOAuth2"), false);
  assert.equal(combined.includes("requireLocalEmailVerified"), false);
  assert.equal(combined.includes("trustedProviders"), false);
  const server = read("src/lib/auth/server.ts");
  assert.match(server, /socialProviders/);
  assert.match(server, /clientId: googleClientId/);
  assert.match(server, /accountLinking:\s*\{\s*enabled: true,/);
  const owner = read("src/lib/admin-access.ts");
  assert.match(owner, /export function grantsOwner/);
  assert.equal(owner.includes("google"), false);
});

test("legacy broker rows are the old provider ids only", () => {
  assert.equal(isLegacyBrokerProvider("grok-google"), true);
  assert.equal(isLegacyBrokerProvider("grok-x"), true);
  assert.equal(isLegacyBrokerProvider("google"), false);
  assert.equal(isLegacyBrokerProvider("credential"), false);
  const admin = read("src/lib/admin.ts");
  assert.match(admin, /listLegacyBrokerAccounts/);
  assert.match(admin, /assertAdmin\(context\.userId\)/);
  assert.match(admin, /grok-google/);
  assert.match(admin, /grok-x/);
});
