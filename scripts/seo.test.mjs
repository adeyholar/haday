import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { isIndexablePath, canonicalUrl, shouldRedirectAzure, robotsNoindex, SEO_TITLE } = await jiti.import(
  "/workspace/src/lib/seo.ts",
);

test("only the doors, privacy, and credits are indexable", () => {
  assert.equal(isIndexablePath("/"), true);
  assert.equal(isIndexablePath("/legal"), true);
  assert.equal(isIndexablePath("/credits"), true);
  assert.equal(isIndexablePath("/login"), false);
  assert.equal(isIndexablePath("/reset-password"), false);
  assert.equal(isIndexablePath("/admin"), false);
  assert.equal(isIndexablePath("/bbh"), false);
  assert.equal(isIndexablePath("/listen/read"), false);
});

test("the Azure host redirects except the health check", () => {
  const host = "haday-bud9cwczfeakh8ce.westus3-01.azurewebsites.net";
  assert.equal(shouldRedirectAzure(host, "/bbh", "GET"), true);
  assert.equal(shouldRedirectAzure(host, "/api/health", "GET"), false);
  assert.equal(shouldRedirectAzure(host, "/", "POST"), false);
  assert.equal(shouldRedirectAzure("hadayhebbraimentor.jcdisn.com", "/", "GET"), false);
  assert.equal(canonicalUrl("/legal"), "https://hebrewmentor.haday.app/legal");
  assert.equal(shouldRedirectAzure("hebrewmentor.haday.app", "/", "GET"), false);
  assert.equal(robotsNoindex("hebrewmentor.haday.app", "/"), false);
});

test("sign-in pages and the old Vercel host are noindex", () => {
  assert.equal(robotsNoindex("hadayhebbraimentor.jcdisn.com", "/login"), true);
  assert.equal(robotsNoindex("haday.vercel.app", "/"), true);
  assert.equal(robotsNoindex("hadayhebbraimentor.jcdisn.com", "/"), false);
});

test("the doors page states the product in the first render", () => {
  const page = readFileSync("/workspace/src/routes/index.tsx", "utf8");
  assert.match(page, /Choose your Study Path/);
  assert.match(page, /Choose wisely/);
  assert.match(page, /vocabulary trainer for first-year students/);
  assert.equal(page.includes("Opening the two studies"), false);
  assert.match(SEO_TITLE, /HaDay HebRabbAi Mentor/);
  const site = readFileSync("/workspace/src/lib/og/site.json", "utf8");
  assert.match(site, /HaDay HebRabbAi Mentor/);
  assert.equal(site.includes('"title": "HaDay"'), false);
});
