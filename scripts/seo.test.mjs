import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const repo = fileURLToPath(new URL("..", import.meta.url));
const { isIndexablePath, canonicalUrl, shouldRedirectAzure, retiredHostRedirect, robotsNoindex, SEO_TITLE, SEO_DESCRIPTION, shareMeta } = await jiti.import(
  new URL("../src/lib/seo.ts", import.meta.url).pathname,
);
const { STATIC_PAGES, sitemapXml, llmsTxt, LLMS_INTRO } = await jiti.import(
  new URL("../src/lib/site-pages.ts", import.meta.url).pathname,
);
const { FOOTER_NAV } = await jiti.import(new URL("../src/lib/public-nav.ts", import.meta.url).pathname);

test("only the doors, privacy, and credits are indexable", () => {
  assert.equal(isIndexablePath("/"), true);
  assert.equal(isIndexablePath("/legal"), true);
  assert.equal(isIndexablePath("/credits"), true);
  assert.equal(isIndexablePath("/how-to-memorize-biblical-hebrew-vocabulary"), true);
  assert.equal(isIndexablePath("/about"), true);
  assert.equal(isIndexablePath("/blogs"), true);
  assert.equal(isIndexablePath("/blogs/a-post"), true);
  assert.equal(isIndexablePath("/learning-hebrabbai"), true);
  assert.equal(isIndexablePath("/learning-hebrabbai/a-guide"), true);
  assert.equal(isIndexablePath("/learning-hebrabbai/rss.xml"), true);
  assert.equal(isIndexablePath("/teachings"), false);
  assert.equal(isIndexablePath("/teachings/a-post"), false);
  assert.equal(isIndexablePath("/sitemap.xml"), true);
  assert.equal(isIndexablePath("/llms.txt"), true);
  assert.equal(isIndexablePath("/ads.txt"), true);
  for (const page of STATIC_PAGES) assert.equal(isIndexablePath(page.path), true);
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
  const page = readFileSync(new URL("../src/routes/index.tsx", import.meta.url).pathname, "utf8");
  const seo = readFileSync(new URL("../src/lib/seo.ts", import.meta.url).pathname, "utf8");
  assert.match(page, /Learn to Read the Bible in Hebrew/);
  assert.match(page, /Choose your Study Path/);
  assert.match(page, /From the letters to the living Word/);
  assert.match(page, /Reading the Hebrew alphabet and vowel points/);
  assert.match(page, /Vocabulary, with audio for every word/);
  assert.match(page, /Grammar: forms, roots, and how words are built/);
  assert.match(page, /Reading real verses, Levels A to E, then the Reading Lab/);
  assert.match(page, /New to Hebrew vocab\? Read the method/);
  assert.match(page, /Start the Grammar Path/);
  assert.match(page, /Start the Scripture Path/);
  assert.equal(page.includes("Choose wisely"), false);
  assert.equal(page.toLowerCase().includes("first-year"), false);
  assert.equal(seo.toLowerCase().includes("first-year"), false);
  assert.equal(SEO_TITLE, "Learn to Read Biblical Hebrew | HaDay HebRabbAi Mentor");
  assert.equal(
    SEO_DESCRIPTION,
    "Learn to read the Hebrew Bible in its original language. Hear each word, build vocabulary and grammar, and read real verses step by step, so you understand the text more deeply and draw closer to God.",
  );
  const home = shareMeta(SEO_TITLE, SEO_DESCRIPTION, "/");
  const guide = shareMeta("Guide", "How to study", "/how-to-memorize-biblical-hebrew-vocabulary", { type: "article" });
  assert.equal(home.find((tag) => tag.property === "og:image")?.content, "https://hebrewmentor.haday.app/og.jpg");
  assert.equal(guide.find((tag) => tag.property === "og:type")?.content, "article");
  assert.ok(guide.some((tag) => tag.name === "twitter:image"));
  const site = readFileSync(new URL("../src/lib/og/site.json", import.meta.url).pathname, "utf8");
  assert.match(site, /Learn to Read Biblical Hebrew/);
  assert.equal(site.toLowerCase().includes("first-year"), false);
  for (const file of [
    "../src/routes/index.tsx",
    "../src/routes/legal.tsx",
    "../src/routes/credits.tsx",
    "../src/routes/how-to-memorize-biblical-hebrew-vocabulary.tsx",
  ]) {
    assert.match(readFileSync(new URL(file, import.meta.url).pathname, "utf8"), /rel: "canonical"/);
  }
});

test("the memorization guide is public, cited, and in the sitemap", () => {
  const page = readFileSync(new URL("../src/routes/how-to-memorize-biblical-hebrew-vocabulary.tsx", import.meta.url).pathname, "utf8");
  const method = readFileSync(new URL("../src/lib/vocab-method.ts", import.meta.url).pathname, "utf8");
  const sitemap = sitemapXml();
  assert.match(page, /how to memorize Biblical Hebrew vocabulary/i);
  assert.match(method, /How to Memorize Biblical Hebrew Vocabulary: A Method That Sticks/);
  assert.match(page, /twenty-eight/);
  assert.match(page, /686/);
  assert.match(page, /47 or more times/);
  assert.match(method, /HowTo/);
  assert.match(method, /FAQPage/);
  assert.match(method, /BreadcrumbList/);
  assert.match(sitemap, /how-to-memorize-biblical-hebrew-vocabulary/);
  assert.match(sitemap, /<lastmod>2026-10-19<\/lastmod>/);
  assert.match(method, /PERSON_JSON_LD/);
  const author = readFileSync(new URL("../src/lib/author.ts", import.meta.url).pathname, "utf8");
  assert.match(author, /Adeola Adegbolagun/);
  assert.match(page, /to="\/about"/);
  const about = readFileSync(new URL("../src/routes/about.tsx", import.meta.url).pathname, "utf8");
  assert.match(about, /About HaDay HebRabbAi Mentor/);
  assert.match(about, /Why HaDay exists/);
  assert.match(author, /Fathers' Faith International Ministries/);
  assert.equal(page.toLowerCase().includes("first-year"), false);
  assert.match(sitemapXml(), /\/about</);
  const title = "How to Memorize Biblical Hebrew Vocabulary | HaDay";
  assert.ok(title.length <= 60);
  const meta =
    "Learn the most frequent words first, hear each word before its meaning, and read real verses early. A simple method for Hebrew students.";
  assert.ok(meta.length <= 155);
});

test("the sitemap and llms.txt come from the public page list", () => {
  const xml = sitemapXml();
  assert.match(xml, /<loc>https:\/\/hebrewmentor\.haday\.app\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/hebrewmentor\.haday\.app\/legal<\/loc>/);
  assert.match(xml, /<loc>https:\/\/hebrewmentor\.haday\.app\/credits<\/loc>/);
  assert.match(xml, /<loc>https:\/\/hebrewmentor\.haday\.app\/how-to-memorize-biblical-hebrew-vocabulary<\/loc>/);
  assert.equal(xml.match(/<lastmod>/g)?.length, STATIC_PAGES.length);
  const lines = llmsTxt().split("\n");
  assert.equal(lines[2], LLMS_INTRO);
  assert.equal(llmsTxt().split("\n").includes("Blogs:"), false);
  assert.equal(
    llmsTxt([
      { path: "/blogs/aleph", title: "Aleph", summary: "A reading.", lastmod: "2026-10-19" },
    ])
      .split("\n")
      .includes("Teachings:"),
    true,
  );
  const robots = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/hebrewmentor\.haday\.app\/sitemap\.xml/);
  assert.equal(readFileSync(new URL("../src/routes/legal.tsx", import.meta.url).pathname, "utf8").includes("adengongo@gmail.com"), false);
  const footer = readFileSync(new URL("../src/components/public-footer.tsx", import.meta.url).pathname, "utf8");
  const footerBlock = footer.slice(footer.indexOf("export function PublicFooter"), footer.indexOf("export function ContactLink"));
  assert.equal(footerBlock.includes("mail.grokbot.com"), false);
  assert.equal(footerBlock.includes("CONTACT_EMAIL"), false);
  assert.equal(FOOTER_NAV.some((item) => item.label === "Contact" && item.hash === "contact"), true);
  const about = readFileSync(new URL("../src/routes/about.tsx", import.meta.url).pathname, "utf8");
  assert.match(about, /id="contact"/);
  assert.match(about, /Questions or enquiries\? Email us\./);
  assert.match(readFileSync(new URL("../src/lib/class-site.ts", import.meta.url).pathname, "utf8"), /haday\.assistant@mail\.grokbot\.com/);
  assert.equal(robots.includes("Mediapartners-Google"), false);
});

test("the retired Vercel page points at the class site", () => {
  const page = readFileSync(new URL("../vercel-gone/index.html", import.meta.url), "utf8");
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
        hits.push(relative(repo, path));
      }
    }
  };
  for (const root of ["src", "server", "public"]) walk(new URL(`../${root}`, import.meta.url).pathname);
  assert.deepEqual(hits.filter((path) => !allow.has(path)), []);
});
