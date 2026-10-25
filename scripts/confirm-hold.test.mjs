import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";

const root = new URL("..", import.meta.url);
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const {
  CONFIRM_STILL_UNSEEN,
  VERIFY_ON_THE_WAY,
  VERIFY_UNKNOWN,
  VERIFY_WAIT,
  claimVerificationSend,
  confirmContinuePlan,
  confirmPageNote,
  isEmailConfirmExempt,
  loginVerificationNote,
  rootEmailVerified,
  verificationSendRemembered,
  verificationSendResponse,
  verificationSendResult,
} = await jiti.import(new URL("../src/lib/auth/confirm-hold.ts", import.meta.url).pathname);

const ORIGIN = "https://hebrewmentor.haday.app";
const SECRET = "test-secret-test-secret-test-secret-32";

function read(rel) {
  return readFileSync(new URL(rel, root), "utf8");
}

async function post(auth, path, body) {
  const response = await auth.handler(
    new Request(`${ORIGIN}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify(body),
    }),
  );
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, json, text };
}

test("an unconfirmed continue stays, and a confirmed continue goes to next", () => {
  assert.deepEqual(confirmContinuePlan(false, "/bbh"), { stay: CONFIRM_STILL_UNSEEN });
  assert.deepEqual(confirmContinuePlan(null, "/bbh"), { stay: CONFIRM_STILL_UNSEEN });
  assert.deepEqual(confirmContinuePlan(undefined, ""), { stay: CONFIRM_STILL_UNSEEN });
  assert.equal(CONFIRM_STILL_UNSEEN, "We still don't see a confirmation. Check your inbox or resend.");
  assert.deepEqual(confirmContinuePlan(true, "/bbh"), { go: "/bbh" });
  assert.deepEqual(confirmContinuePlan(true, ""), { go: "/" });
  assert.deepEqual(confirmContinuePlan(true, "https://evil.example"), { go: "/" });
  assert.deepEqual(confirmContinuePlan(true, "/confirm-email"), { go: "/" });
  assert.equal(
    rootEmailVerified([{ routeId: "__root__", context: { sessionUser: { emailVerified: false } } }]),
    false,
  );
  assert.equal(
    rootEmailVerified([{ routeId: "__root__", context: { sessionUser: { emailVerified: true } } }]),
    true,
  );
  assert.equal(rootEmailVerified([{ routeId: "__root__", context: { sessionUser: null } }]), undefined);
  const page = read("src/routes/confirm-email.tsx");
  assert.match(page, /I've confirmed — continue/);
  assert.match(page, /clearRootSession\(\)/);
  assert.match(page, /router\.invalidate\(\)/);
  assert.match(page, /disableCookieCache:\s*true/);
  assert.match(page, /confirmContinuePlan\(/);
  assert.match(page, /"stay" in plan/);
});

test("two sends within a minute say wait, and a send after the minute is sent", () => {
  const email = "minute@example.com";
  assert.equal(claimVerificationSend(email, 1_000), "sent");
  assert.equal(claimVerificationSend(email, 30_000), "rate_limited");
  assert.equal(loginVerificationNote("rate_limited"), VERIFY_WAIT);
  assert.equal(confirmPageNote("rate_limited"), VERIFY_WAIT);
  assert.equal(VERIFY_WAIT, "Please wait about a minute before asking for another email.");
  assert.doesNotMatch(VERIFY_WAIT, /on the way/);
  assert.equal(claimVerificationSend(email, 60_999), "rate_limited");
  assert.equal(claimVerificationSend(email, 61_000), "sent");
  assert.equal(loginVerificationNote("sent"), VERIFY_ON_THE_WAY);
  assert.equal(confirmPageNote("sent"), VERIFY_ON_THE_WAY);
  assert.equal(VERIFY_ON_THE_WAY, "Another confirmation email is on the way.");
  assert.equal(loginVerificationNote("accepted"), VERIFY_UNKNOWN);
  assert.match(VERIFY_UNKNOWN, /If that address has a HaDay account/);
  assert.doesNotMatch(VERIFY_UNKNOWN, /on the way/);
  assert.equal(verificationSendResult({ status: true }), "accepted");
  assert.equal(verificationSendResult({ status: true, verification: "sent" }), "sent");
  assert.equal(verificationSendResult({ response: { verification: "rate_limited" } }), "rate_limited");
});

test("an expired resend entry is removed", () => {
  claimVerificationSend("old@example.com", 0);
  claimVerificationSend("keep@example.com", 1_000);
  assert.equal(verificationSendRemembered("old@example.com"), true);
  claimVerificationSend("new@example.com", 60_000);
  assert.equal(verificationSendRemembered("old@example.com"), false);
  assert.equal(verificationSendRemembered("keep@example.com"), true);
  assert.equal(verificationSendRemembered("new@example.com"), true);
  const source = read("src/lib/auth/confirm-hold.ts");
  assert.match(source, /one map per server instance/);
});

test("blog and reading pages stay public, and the dead /blog check is gone", () => {
  for (const path of [
    "/blogs",
    "/blogs/a-post",
    "/learning-hebrabbai",
    "/learning-hebrabbai/two-paths",
    "/teachings/aleph",
    "/about",
    "/legal",
    "/credits",
    "/how-to-memorize-biblical-hebrew-vocabulary",
  ]) {
    assert.equal(isEmailConfirmExempt(path), true, path);
  }
  assert.equal(isEmailConfirmExempt("/blog"), false);
  assert.equal(isEmailConfirmExempt("/blog/a-post"), false);
  assert.equal(isEmailConfirmExempt("/bbh"), false);
  assert.equal(isEmailConfirmExempt("/iibs/wlc"), false);
  assert.doesNotMatch(read("src/lib/auth/confirm-hold.ts"), /=== "\/blog"/);
});

test("a repeat resend is the wait message, and an unknown address stays generic", async () => {
  const mailed = [];
  const auth = betterAuth({
    baseURL: ORIGIN,
    secret: SECRET,
    trustedOrigins: [ORIGIN],
    emailAndPassword: { enabled: true, requireEmailVerification: true },
    emailVerification: {
      sendOnSignUp: true,
      async sendVerificationEmail(data) {
        mailed.push(claimVerificationSend(data.user.email));
      },
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
        return verificationSendResponse(ctx.path ?? "", email);
      }),
    },
  });

  const email = "resend-hold@example.com";
  const signed = await post(auth, "/api/auth/sign-up/email", {
    name: "Student",
    email,
    password: "password123",
    callbackURL: "/login",
  });
  assert.equal(signed.response.status, 200, signed.text);
  assert.equal(signed.json.verification, undefined);
  assert.deepEqual(mailed, ["sent"]);

  const again = await post(auth, "/api/auth/send-verification-email", {
    email,
    callbackURL: "/login",
  });
  assert.equal(again.response.status, 200, again.text);
  assert.equal(again.json.verification, "rate_limited");
  assert.equal(loginVerificationNote(verificationSendResult(again.json)), VERIFY_WAIT);
  assert.deepEqual(mailed, ["sent", "rate_limited"]);

  const missing = await post(auth, "/api/auth/send-verification-email", {
    email: "nobody-hold@example.com",
    callbackURL: "/login",
  });
  assert.equal(missing.response.status, 200, missing.text);
  assert.equal(Object.hasOwn(missing.json, "verification"), false);
  assert.equal(verificationSendResult(missing.json), "accepted");
  assert.equal(loginVerificationNote("accepted"), VERIFY_UNKNOWN);

  const login = read("src/routes/login.tsx");
  assert.match(login, /loginVerificationNote\(verificationSendResult/);
  assert.doesNotMatch(login, /setResent\(true\)/);
  assert.match(read("src/lib/auth/email-password.ts"), /claim === "rate_limited"/);
  assert.match(read("src/lib/auth/x.server.ts"), /verificationSendResponse/);
  assert.match(read("src/routes/confirm-email.tsx"), /confirmPageNote/);
});
