import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const {
  isPublicTeaching,
  postsForBlog,
  BLOG_TABS,
  BLOG_HOME,
  blogDate,
  relatedTeachings,
  renderTeaching,
  slugify,
  teachingCta,
  teachingsRss,
  insertPostPiece,
  validateTeaching,
} = await jiti.import(new URL("../src/lib/teaching-text.ts", import.meta.url).pathname);
const { refuseBlogImage } = await jiti.import(new URL("../src/lib/blog-images.ts", import.meta.url).pathname);

const live = {
  slug: "aleph",
  title: "The letter aleph",
  summary: "A short reading about the first letter and why it matters.",
  body: "Aleph is silent, and the verse still begins with it.\n\nHear the word before the gloss.",
  path: "grammar",
  tags: ["letters"],
  related: ["bet"],
  image: "",
  imageAlt: "",
  section: "teachings",
  draft: false,
  published: "2026-10-19",
  updated: "2026-10-19",
};

test("a teaching without a title is rejected", () => {
  const result = validateTeaching({ ...live, title: "No", body: live.body });
  assert.equal(result.ok, false);
});

test("the blog home lists both sections and the tabs point at the filters", () => {
  const guide = { ...live, slug: "two-paths", title: "Two paths", section: "learning-hebrabbai", published: "2026-10-24" };
  const older = { ...live, published: "2026-10-01" };
  const posts = postsForBlog([older, guide], "all");
  assert.deepEqual(posts.map((post) => post.slug), ["two-paths", "aleph"]);
  assert.equal(postsForBlog([older, guide], "teachings").every((post) => post.section === "teachings"), true);
  assert.equal(postsForBlog([older, guide], "learning-hebrabbai").length, 1);
  assert.equal(blogDate("2026-10-24"), "October 24, 2026");
  assert.deepEqual(BLOG_TABS.map((tab) => tab.href), ["/blogs", "/blogs?section=teachings", "/learning-hebrabbai"]);
  const header = readFileSync(new URL("../src/components/public-header.tsx", import.meta.url).pathname, "utf8");
  const footer = readFileSync(new URL("../src/components/public-footer.tsx", import.meta.url).pathname, "utf8");
  const menu = readFileSync(new URL("../src/components/signed-in-shell.tsx", import.meta.url).pathname, "utf8");
  const home = readFileSync(new URL("../src/routes/blogs/index.tsx", import.meta.url).pathname, "utf8");
  assert.match(header, />\s*Blog\s*</);
  assert.equal(header.includes(">Teachings<"), false);
  assert.match(footer, />\s*Blog\s*</);
  assert.equal(footer.includes(">Teachings<"), false);
  assert.match(menu, /label: "Blog"/);
  assert.equal(menu.includes('label: "Teachings"'), false);
  assert.match(home, /data: filter === "all" \? "all" : filter/);
  assert.equal(BLOG_HOME.title, "Blog | HaDay HebRabbAi Mentor");
});

test("slugs stay unique and related links resolve", () => {
  const bet = { ...live, slug: "bet", title: "The letter bet", related: [], tags: ["letters"] };
  const other = { ...live, slug: "verse", title: "A verse", related: [], tags: ["reading"], published: "2026-10-18" };
  assert.equal(slugify("The Letter Aleph"), "the-letter-aleph");
  const related = relatedTeachings(live, [live, bet, other], 2);
  assert.deepEqual(related.map((post) => post.slug), ["bet", "verse"]);
});

test("drafts and future dates stay off the public list", () => {
  assert.equal(isPublicTeaching(live, new Date("2026-10-19T18:00:00.000Z")), true);
  assert.equal(isPublicTeaching({ ...live, draft: true }), false);
  assert.equal(isPublicTeaching({ ...live, published: "2026-10-20" }, new Date("2026-10-19T18:00:00.000Z")), false);
});

test("the call to action follows the path", () => {
  assert.equal(teachingCta("grammar", false), "/login?path=bbh");
  assert.equal(teachingCta("grammar", true), "/bbh");
  assert.equal(teachingCta("scripture", false), "/login?path=iibs");
  assert.equal(teachingCta("scripture", true), "/iibs");
});

test("a table inserted in the middle stays its own block", () => {
  const body = "The first paragraph stays.\n\nThe second paragraph stays.";
  const at = body.indexOf("The second");
  const table = "| Column 1 | Column 2 |\n| --- | --- |\n| a | b |";
  const next = insertPostPiece(body, at, at, table);
  assert.match(next, /stays\.\n\n\| Column 1/);
  assert.match(next, /\n\nThe second paragraph stays\.$/);
  const html = renderTeaching(next);
  assert.match(html, /<table>/);
  assert.match(html, /The first paragraph stays\./);
  assert.match(html, /The second paragraph stays\./);
});

test("a table keeps alignment, escapes a cell, and marks Hebrew", () => {
  const html = renderTeaching(`| Left | Center | Right |
| :--- | :---: | ---: |
| a \\| b | <script>alert(1)</script> | בְּרֵאשִׁית |`);
  assert.match(html, /<div class="table-wrap"/);
  assert.match(html, /<th scope="col" style="text-align:left">Left<\/th>/);
  assert.match(html, /<th scope="col" style="text-align:center">Center<\/th>/);
  assert.match(html, /<th scope="col" style="text-align:right">Right<\/th>/);
  assert.match(html, /a \| b/);
  assert.equal(html.includes("<script>"), false);
  assert.equal(html.includes("alert(1)"), true);
  assert.match(html, /<td style="text-align:right"><span dir="rtl" lang="he">/);
});

test("a pipe line without a separator stays a paragraph", () => {
  const html = renderTeaching("| not | a | table |\n\nThis line is still a paragraph of the post.");
  assert.equal(html.includes("<table>"), false);
  assert.match(html, /<p>/);
});

test("a table may have 100 body rows", () => {
  const row = "| a | b |";
  const hundred = ["| A | B |", "| --- | --- |", ...Array.from({ length: 100 }, () => row)].join("\n");
  const fields = {
    title: "The letter aleph",
    summary: "A short reading about the first letter.",
    path: "grammar",
    section: "teachings",
    published: "2026-10-19",
  };
  const ok = validateTeaching({
    ...fields,
    body: `Aleph is silent, and the verse still begins with it.\n\n${hundred}`,
  });
  assert.equal(ok.ok, true);
  const over = validateTeaching({
    ...fields,
    body: `Aleph is silent, and the verse still begins with it.\n\n${hundred}\n${row}`,
  });
  assert.equal(over.ok, false);
});

test("a table with nine columns is rejected", () => {
  const cells = Array.from({ length: 9 }, (_, index) => `c${index}`).join(" | ");
  const rule = Array.from({ length: 9 }, () => "---").join(" | ");
  const result = validateTeaching({
    title: "The letter aleph",
    summary: "A short reading about the first letter.",
    body: `Aleph is silent, and the verse still begins with it.\n\n| ${cells} |\n| ${rule} |\n| ${cells} |`,
    path: "grammar",
    section: "teachings",
    published: "2026-10-19",
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /8 columns/);
});

test("the teaching body escapes html and marks Hebrew", () => {
  const html = renderTeaching("A word <script>alert(1)</script> and **שלום** in the line.");
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /dir="rtl" lang="he"/);
  assert.match(html, /<strong>/);
});

test("a post without a section is rejected", () => {
  const result = validateTeaching({
    title: "The letter aleph",
    summary: "A short reading about the first letter.",
    body: "Aleph is silent, and the verse still begins with it.",
    path: "grammar",
    published: "2026-10-19",
    section: "blog",
  });
  assert.equal(result.ok, false);
});

test("a picture without alt text is rejected", () => {
  const result = validateTeaching({
    title: "The letter aleph",
    summary: "A short reading about the first letter.",
    body: "Aleph is silent, and the verse still begins with it.",
    path: "grammar",
    published: "2026-10-19",
    section: "teachings",
    image: "https://images.haday.app/aleph/mark.webp",
  });
  assert.equal(result.ok, false);
});

test("related posts stay in the same section", () => {
  const guide = { ...live, slug: "two-paths", section: "learning-hebrabbai", tags: ["letters"], related: [] };
  const related = relatedTeachings(live, [live, { ...live, slug: "bet", title: "The letter bet", related: [], tags: ["letters"] }, guide], 2);
  assert.equal(related.some((post) => post.section === "learning-hebrabbai"), false);
});

test("a verse box stays right to left and html stays escaped", () => {
  const html = renderTeaching('[verse ref="Gen 1:1"]בְּרֵאשִׁית <script>[/verse]');
  assert.match(html, /dir="rtl" lang="he"/);
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /Gen 1:1/);
});

test("a guide feed uses the guide address", () => {
  const xml = teachingsRss([{ ...live, section: "learning-hebrabbai" }], "https://hebrewmentor.haday.app", "learning-hebrabbai");
  assert.match(xml, /\/learning-hebrabbai\/aleph/);
  assert.equal(xml.includes("/blogs/aleph"), false);
});

test("the feed is xml and leaves drafts out", () => {
  const xml = teachingsRss([live, { ...live, slug: "hidden", draft: true }], "https://hebrewmentor.haday.app");
  assert.match(xml, /<rss /);
  assert.match(xml, /<item>/);
  assert.equal(xml.includes("hidden"), false);
  assert.match(xml, /https:\/\/hebrewmentor\.haday\.app\/blogs\/aleph/);
  assert.equal(xml.includes("/teachings/"), false);
});

test("an uploaded picture tag is a valid post", () => {
  const tag =
    '[image url="https://images.haday.app/aleph/20261024-ab12cd34.webp" alt="The letter aleph" width="800" height="400"]';
  const result = validateTeaching({
    title: "The letter aleph",
    summary: "A short reading about the first letter.",
    body: `Aleph is silent, and the verse still begins with it.\n\n${tag}`,
    path: "grammar",
    section: "teachings",
    published: "2026-10-19",
  });
  assert.equal(result.ok, true);
});

test("a picture upload is refused when the file is wrong", () => {
  assert.equal(typeof refuseBlogImage({ slug: "", type: "image/webp", bytes: 100 }), "string");
  assert.equal(typeof refuseBlogImage({ slug: "aleph", type: "image/gif", bytes: 100 }), "string");
  assert.equal(typeof refuseBlogImage({ slug: "aleph", type: "image/png", bytes: 2 * 1024 * 1024 + 1 }), "string");
  assert.equal(refuseBlogImage({ slug: "aleph", type: "image/webp", bytes: 100 }), null);
});
