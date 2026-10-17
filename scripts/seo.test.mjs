import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { isIndexablePath, canonicalUrl, shouldRedirectAzure, retiredHostRedirect, robotsNoindex, SEO_TITLE } = await jiti.import(
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
});

test("the previous class host redirects, except the health check", () => {
  assert.equal(retiredHostRedirect("hadayhebbraimentor.jcdisn.com", "/", "GET"), 301);
  assert.equal(retiredHostRedirect("hadayhebbraimentor.jcdisn.com", "/reset-password", "HEAD"), 301);
  assert.equal(retiredHostRedirect("HadayHebbraimentor.jcdisn.com", "/login", "POST"), 308);
  assert.equal(retiredHostRedirect("hadayhebbraimentor.jcdisn.com", "/api/health", "GET"), null);
  assert.equal(retiredHostRedirect("hebrewmentor.haday.app", "/", "GET"), null);
});

test("sign-in pages and the old Vercel host are noindex", () => {
  assert.equal(robotsNoindex("hebrewmentor.haday.app", "/login"), true);
  assert.equal(robotsNoindex("haday.vercel.app", "/"), true);
  assert.equal(robotsNoindex("hebrewmentor.haday.app", "/"), false);
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

test("the retired Vercel page points at the class site", () => {
  const page = readFileSync("/workspace/vercel-gone/index.html", "utf8");
  assert.match(page, /https:\/\/hebrewmentor\.haday\.app/);
  assert.equal(page.includes("hadayhebbraimentor.jcdisn.com"), false);
});

test("the old host remains only on the redirect constant", () => {
  const allow = new Set(["src/lib/class-site.ts"]);
  const hits = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = `${dir}/${name}`;
      if (statSync(path).isDirectory()) walk(path);
      else if (readFileSync(path, "utf8").toLowerCase().includes("hadayhebbraimentor.jcdisn.com")) {
        hits.push(path.replace("/workspace/", ""));
      }
    }
  };
  for (const root of ["src", "server", "public"]) walk(`/workspace/${root}`);
  assert.deepEqual(hits.filter((path) => !allow.has(path)), []);
});
