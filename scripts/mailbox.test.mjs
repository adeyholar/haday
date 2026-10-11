import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { parseEmail, isDisposableDomain, inspectMailbox } = await jiti.import(join(root, "src/lib/mailbox.ts"));
const { toPublicAppUrl, passwordResetPageUrl } = await jiti.import(join(root, "src/lib/mail.ts"));

test("parseEmail accepts ordinary addresses", () => {
  assert.deepEqual(parseEmail("  Adeola@JCDisn.com  "), { local: "adeola", domain: "jcdisn.com" });
  assert.equal(parseEmail("not-an-email"), null);
  assert.equal(parseEmail("a@b"), null);
  assert.equal(parseEmail("a@.com"), null);
  assert.equal(parseEmail("a@mail..com"), null);
});

test("disposable and example domains are blocked", () => {
  assert.equal(isDisposableDomain("mailinator.com"), true);
  assert.equal(isDisposableDomain("box.yopmail.com"), true);
  assert.equal(isDisposableDomain("example.com"), true);
  assert.equal(isDisposableDomain("gmail.com"), false);
  assert.equal(isDisposableDomain("jcdisn.com"), false);
});

test("inspectMailbox rejects junk before DNS", async () => {
  const bad = await inspectMailbox("nope");
  assert.equal(bad.ok, false);
  const throwaway = await inspectMailbox("class@mailinator.com");
  assert.equal(throwaway.ok, false);
  if (throwaway.ok === false) {
    assert.match(throwaway.reason, /lasting email/i);
  }
});

test("verification links on localhost rewrite to the public class host", () => {
  const rewritten = toPublicAppUrl(
    "http://localhost:8080/api/auth/verify-email?token=abc&callbackURL=%2Flogin",
  );
  assert.match(rewritten, /^https:\/\/hadayhebbraimentor\.jcdisn\.com/);
  assert.match(rewritten, /\/api\/auth\/verify-email\?token=abc/);
});

test("a foreign host cannot own a reset or confirmation link", () => {
  const reset = passwordResetPageUrl("secret-token");
  assert.match(reset, /^https:\/\/hadayhebbraimentor\.jcdisn\.com\/reset-password\?token=secret-token$/);
  const confirm = toPublicAppUrl("https://example.com/api/auth/verify-email?token=abc");
  assert.match(confirm, /^https:\/\/hadayhebbraimentor\.jcdisn\.com\/api\/auth\/verify-email\?token=abc$/);
  assert.equal(confirm.includes("example.com"), false);
});
