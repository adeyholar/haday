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
  X_BUTTON_LABEL,
  X_NO_EMAIL_MESSAGE,
  X_LINK_REQUIRED_MESSAGE,
  X_SCOPES,
  xCallbackUrl,
  readXCredentials,
  missingXSignInWarning,
  mapXProfile,
  xCallbackEmailVerified,
  rewriteXCallbackLocation,
  canUnlinkSignIn,
  showXPrivacyNotice,
} = await jiti.import(new URL("../src/lib/auth/x.ts", import.meta.url).pathname);
const { loginSocialOffer, socialSignInErrorMessage, isLegacyBrokerProvider } = await jiti.import(
  new URL("../src/lib/auth/google.ts", import.meta.url).pathname,
);
const { blockedDestination, secondTermBlock, ownerDoorBlock } = await jiti.import(
  new URL("../src/lib/path.ts", import.meta.url).pathname,
);

const CLIENT_ID = "haday-x-client-id";
const CLIENT_SECRET = "haday-x-client-secret";
const ORIGIN = "https://hebrewmentor.haday.app";
const SECRET = "test-secret-test-secret-test-secret-32";

function read(rel) {
  return readFileSync(new URL(rel, root), "utf8");
}

test("X credentials are on only when both vars are set, and the warning names a var not a value", () => {
  assert.equal(readXCredentials({}).configured, false);
  assert.equal(readXCredentials({ X_CLIENT_ID: "only-id" }).configured, false);
  assert.equal(readXCredentials({ X_CLIENT_SECRET: "only-secret" }).configured, false);
  assert.equal(readXCredentials({ X_CLIENT_ID: "  ", X_CLIENT_SECRET: "secret" }).configured, false);
  const ready = readXCredentials({ X_CLIENT_ID: CLIENT_ID, X_CLIENT_SECRET: CLIENT_SECRET });
  assert.equal(ready.configured, true);
  assert.equal(ready.clientId, CLIENT_ID);
  assert.notEqual(ready.clientId, "grok_preview");

  assert.equal(missingXSignInWarning({ NODE_ENV: "development", X_CLIENT_SECRET: CLIENT_SECRET }), null);
  assert.equal(
    missingXSignInWarning({ NODE_ENV: "production", X_CLIENT_ID: CLIENT_ID, X_CLIENT_SECRET: CLIENT_SECRET }),
    null,
  );
  const missingId = missingXSignInWarning({ NODE_ENV: "production", X_CLIENT_SECRET: CLIENT_SECRET });
  assert.match(missingId, /X_CLIENT_ID/);
  assert.doesNotMatch(missingId, /X_CLIENT_SECRET/);
  assert.doesNotMatch(missingId, new RegExp(CLIENT_SECRET));
  const missingSecret = missingXSignInWarning({ NODE_ENV: "production", X_CLIENT_ID: CLIENT_ID });
  assert.match(missingSecret, /X_CLIENT_SECRET/);
  assert.doesNotMatch(missingSecret, new RegExp(CLIENT_ID));
  const missingBoth = missingXSignInWarning({ NODE_ENV: "production" });
  assert.match(missingBoth, /X_CLIENT_ID/);
  assert.match(missingBoth, /X_CLIENT_SECRET/);
  assert.match(missingBoth, /will not fall back/);
  assert.doesNotMatch(missingBoth, /grok_preview/);
});

test("all four login social combinations", () => {
  assert.deepEqual(loginSocialOffer(false, false), { showGoogle: false, showX: false, divider: null });
  assert.deepEqual(loginSocialOffer(true, false), { showGoogle: true, showX: false, divider: "or" });
  assert.deepEqual(loginSocialOffer(false, true), { showGoogle: false, showX: true, divider: "or" });
  assert.deepEqual(loginSocialOffer(true, true), { showGoogle: true, showX: true, divider: "or" });
});

test("the X source has no broker, preview client, or generic OAuth", () => {
  const files = [
    "src/lib/auth/x.ts",
    "src/lib/auth/x.server.ts",
    "src/lib/auth/server.ts",
    "src/lib/auth/client.ts",
    "src/lib/auth/popup.server.ts",
    "src/lib/auth/google.ts",
    "src/routes/login.tsx",
    "src/routes/account.tsx",
    ".env.example",
  ];
  const combined = files.map((file) => read(file)).join("\n");
  assert.equal(combined.includes("grok_preview"), false);
  assert.equal(combined.includes("auth.grok.me"), false);
  assert.equal(combined.includes("genericOAuth"), false);
  assert.equal(combined.includes("X_SIGN_IN_OFFERED"), false);
});

test("scope includes users.email, the profile stays unverified, and twitter is not trusted", () => {
  const server = read("src/lib/auth/server.ts");
  const x = read("src/lib/auth/x.ts");
  const hook = read("src/lib/auth/x.server.ts");
  assert.ok(X_SCOPES.includes("users.email"));
  assert.match(server, /users\.email/);
  assert.match(x, /emailVerified:\s*false/);
  assert.equal(server.includes("trustedProviders"), false);
  assert.equal(x.includes("trustedProviders"), false);
  assert.equal(hook.includes("trustedProviders"), false);
  assert.equal(server.includes("requireLocalEmailVerified"), false);
  assert.match(hook, /getOAuthState\(\)/);
  assert.match(hook, /xCallbackEmailVerified/);
  assert.match(hook, /state\?\.link/);

  const confirmed = mapXProfile({ data: { confirmed_email: "reader@example.com", username: "reader" } });
  assert.equal(confirmed.email, "reader@example.com");
  assert.equal(confirmed.emailVerified, false);
  assert.equal(mapXProfile({ data: { email: "copied@example.com" } }).email, "copied@example.com");
  assert.equal(mapXProfile({ data: { username: "reader" } }).email, null);
  assert.equal(mapXProfile({ data: { email: "not-an-email" } }).email, null);
  assert.equal(mapXProfile({ data: { email: "not-an-email" } }).emailVerified, false);
  assert.equal(xCallbackEmailVerified({ email: "reader@example.com", linking: false }), false);
  assert.equal(xCallbackEmailVerified({ email: null, linking: true }), false);
  assert.equal(xCallbackEmailVerified({ email: "reader@example.com", linking: true }), true);
});

test("the two X error codes map to their messages and carry no address", () => {
  assert.equal(socialSignInErrorMessage("x_no_email"), X_NO_EMAIL_MESSAGE);
  assert.equal(socialSignInErrorMessage("x_link_required"), X_LINK_REQUIRED_MESSAGE);
  assert.equal(socialSignInErrorMessage("account_not_linked").includes("Continue with Google"), true);
  const relative = rewriteXCallbackLocation("/login?error=email_not_found&error_description=reader%40example.com");
  assert.equal(relative, "/login?error=x_no_email");
  const absolute = rewriteXCallbackLocation(`${ORIGIN}/login?error=account_not_linked`);
  assert.equal(absolute, `${ORIGIN}/login?error=x_link_required`);
  assert.equal(rewriteXCallbackLocation("/login?error=access_denied"), null);
  assert.doesNotMatch(relative, /example\.com|token/);
});

test("with no env vars there is no X button and twitter is not a provider", async () => {
  const login = read("src/routes/login.tsx");
  const showAt = login.indexOf("offer.showX");
  const buttonAt = login.indexOf("<XSignInButton");
  assert.ok(showAt > 0 && buttonAt > showAt);
  const server = read("src/lib/auth/server.ts");
  assert.match(server, /xSignInConfigured/);
  const twitterAt = server.indexOf("twitter:");
  const flagAt = server.lastIndexOf("xSignInConfigured", twitterAt);
  assert.ok(flagAt > 0 && flagAt < twitterAt);

  const auth = betterAuth({
    baseURL: ORIGIN,
    secret: SECRET,
    trustedOrigins: [ORIGIN],
    emailAndPassword: { enabled: true, requireEmailVerification: false },
  });
  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({
        provider: "twitter",
        callbackURL: "/login",
        errorCallbackURL: "/login",
        disableRedirect: true,
      }),
    }),
  );
  const body = await response.json();
  assert.equal(body.code, "PROVIDER_NOT_FOUND");
});

test("sign-in/social redirects to x.com with S256 PKCE and the class callback", async () => {
  const creds = readXCredentials({ X_CLIENT_ID: CLIENT_ID, X_CLIENT_SECRET: CLIENT_SECRET });
  const auth = betterAuth({
    baseURL: ORIGIN,
    secret: SECRET,
    trustedOrigins: [ORIGIN],
    socialProviders: {
      twitter: {
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        disableDefaultScope: true,
        scope: [...X_SCOPES],
        mapProfileToUser: (profile) => mapXProfile(profile),
      },
    },
  });
  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({
        provider: "twitter",
        callbackURL: "/login",
        errorCallbackURL: "/login",
        disableRedirect: true,
      }),
    }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  const url = new URL(body.url);
  assert.equal(url.hostname, "x.com");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("code_challenge"));
  assert.equal(url.searchParams.get("redirect_uri"), xCallbackUrl(ORIGIN));
  assert.equal(url.searchParams.get("redirect_uri"), `${ORIGIN}/api/auth/callback/twitter`);
  assert.equal(url.searchParams.get("scope"), X_SCOPES.join(" "));
  assert.doesNotMatch(body.url, /grok_preview|auth\.grok\.me|genericOAuth/);
});

test("a new X user stays unverified, and an existing email is not auto-linked", async () => {
  let verifyCalls = 0;
  const auth = betterAuth({
    baseURL: ORIGIN,
    secret: SECRET,
    trustedOrigins: [ORIGIN],
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async () => {
        verifyCalls += 1;
      },
    },
    socialProviders: {
      twitter: {
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        mapProfileToUser: (profile) => mapXProfile(profile),
      },
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
  const endpoint = {
    context: ctx,
    setCookie() {},
    getCookie() {
      return null;
    },
    request: new Request(ORIGIN),
  };
  const refused = await handleOAuthUserInfo(endpoint, {
    userInfo: {
      id: "x-user-existing",
      email: "student@example.com",
      name: "Student",
      emailVerified: false,
    },
    account: { providerId: "twitter", accountId: "x-user-existing" },
    callbackURL: "/login",
  });
  assert.equal(refused.error, "account not linked");
  const afterRefusal = await ctx.internalAdapter.findOAuthUser("student@example.com", "x-user-existing", "twitter");
  assert.equal(
    afterRefusal.accounts.some((account) => account.providerId === "twitter"),
    false,
  );

  verifyCalls = 0;
  const fresh = await handleOAuthUserInfo(endpoint, {
    userInfo: {
      id: "x-user-new",
      email: "new-x@example.com",
      name: "New",
      emailVerified: mapXProfile({ data: { confirmed_email: "new-x@example.com" } }).emailVerified,
    },
    account: { providerId: "twitter", accountId: "x-user-new" },
    callbackURL: "/login",
  });
  assert.equal(fresh.error, null);
  assert.equal(fresh.data.user.emailVerified, false);
  assert.equal(verifyCalls, 1);
});

test("the X button, account row, popup flag, privacy line, and path intent are wired", () => {
  assert.equal(X_BUTTON_LABEL, "Continue with X");
  assert.equal(showXPrivacyNotice("up"), true);
  assert.equal(showXPrivacyNotice("in"), false);
  const button = read("src/components/x-sign-in-button.tsx");
  assert.match(button, /aria-label=\{X_BUTTON_LABEL\}/);
  assert.match(button, /min-h-11/);
  assert.match(button, /bg-black/);
  assert.doesNotMatch(button, /min-h-10/);

  const account = read("src/routes/account.tsx");
  assert.match(account, /authClient\.linkSocial\(\{/);
  assert.match(account, /provider:\s*"twitter"/);
  assert.match(account, /canUnlinkSignIn/);
  assert.match(account, /status\.x === true/);
  assert.match(account, /Unlink X/);
  assert.equal(canUnlinkSignIn([{ providerId: "twitter" }], "twitter"), false);
  assert.equal(
    canUnlinkSignIn(
      [{ providerId: "twitter" }, { providerId: "credential" }],
      "twitter",
    ),
    true,
  );

  const popup = read("src/lib/auth/popup.server.ts");
  assert.match(popup, /xSignInConfigured/);
  assert.match(popup, /X_PROVIDER_ID/);

  const legal = read("src/routes/legal.tsx");
  assert.match(legal, /name, username, and profile picture, and your email if you shared it/);
  assert.match(legal, /X never gives us your password/);

  const home = read("src/routes/index.tsx");
  assert.match(home, /claimPathIntent\(\)/);
  assert.match(home, /clearPathIntent\(\)/);
  const login = read("src/routes/login.tsx");
  const onX = login.slice(login.indexOf("async function onX"), login.indexOf("async function onForgot"));
  assert.match(onX, /stashPathIntent\(remember\)/);
  assert.match(onX, /googlePathToRemember\(mode, placed\)/);

  const status = read("src/lib/auth/google-status.ts");
  assert.match(status, /google:\s*googleSignInConfigured/);
  assert.match(status, /x:\s*xSignInConfigured/);

  assert.equal(isLegacyBrokerProvider("grok-x"), true);
  assert.equal(isLegacyBrokerProvider("twitter"), false);
  assert.match(read("src/routes/admin.tsx"), /return "X"/);
  assert.match(read("src/lib/admin.ts"), /grok-x/);

  const asbuilt = read("docs/ASBUILT.md");
  assert.match(asbuilt, /X_CLIENT_ID/);
  assert.match(asbuilt, /X_CLIENT_SECRET/);
  assert.match(asbuilt, /\/api\/auth\/callback\/twitter/);
  assert.match(asbuilt, /No Grok broker/);

  assert.equal(blockedDestination("/account", { path: "iibs", admin: false }), null);
  assert.equal(blockedDestination("/account", { path: "bbh", admin: false }), null);
  assert.equal(secondTermBlock("/account", 2), null);
  assert.equal(ownerDoorBlock("/account", "bbh"), null);
});

test("optional live X redirect uses an x.com host, S256, and the exact callback", async (t) => {
  const base = process.env.X_E2E_BASE;
  if (!base) {
    t.skip();
    return;
  }
  const origin = base.replace(/\/+$/, "");
  const response = await fetch(`${origin}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({
      provider: "twitter",
      callbackURL: "/login",
      errorCallbackURL: "/login",
      disableRedirect: true,
    }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  const url = new URL(body.url);
  assert.equal(url.hostname, "x.com");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("redirect_uri"), `${origin}/api/auth/callback/twitter`);
});
