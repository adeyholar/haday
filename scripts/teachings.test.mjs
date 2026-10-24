import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const {
  isPublicTeaching,
  postsForBlog,
  BLOG_TABS,
  BLOG_HOME,
  blogDate,
  blogPageTitle,
  relatedTeachings,
  renderTeaching,
  slugify,
  teachingCta,
  teachingsRss,
  insertPostPiece,
  pathsCtaHtml,
  postHeadline,
  postHead,
  postPath,
  retiredTeachingTarget,
  teachingLastmod,
  validateTeaching,
} = await jiti.import(new URL("../src/lib/teaching-text.ts", import.meta.url).pathname);
const { refuseBlogImage } = await jiti.import(new URL("../src/lib/blog-images.ts", import.meta.url).pathname);
const { blogCrumbs, blogIndexJsonLd, postJsonLd } = await jiti.import(new URL("../src/lib/blog-jsonld.ts", import.meta.url).pathname);
const { PUBLIC_NAV, FOOTER_NAV, STUDY_MENU_BLOG } = await jiti.import(new URL("../src/lib/public-nav.ts", import.meta.url).pathname);

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
  searchTitle: "",
  section: "teachings",
  draft: false,
  published: "2026-10-19",
  updated: "2026-10-19",
};

test("path buttons, row headings, and phone cards", () => {
  const buttons = pathsCtaHtml();
  assert.match(buttons, /href="\/login\?path=bbh"/);
  assert.match(buttons, /href="\/login\?path=iibs"/);
  assert.match(buttons, /Start the Grammar Path/);
  assert.match(buttons, /Start the Scripture Path/);
  assert.equal(renderTeaching("[paths-cta]").includes("signed"), false);
  assert.equal(renderTeaching("[paths-cta]"), buttons);
  const three = renderTeaching("| Topic | Grammar | Scripture |\n| --- | --- | --- |\n| Letters | Aleph | Verse |");
  assert.match(three, /<th scope="row">Letters<\/th>/);
  assert.match(three, /class="table-cards"/);
  assert.match(three, /class="table-card"/);
  assert.match(three, /Grammar/);
  assert.match(three, /table-card-label">Letters/);
  assert.match(three, /table-card-value">Verse/);
  const four = renderTeaching("| A | B | C | D |\n| --- | --- | --- | --- |\n| 1 | 2 | 3 | 4 |");
  assert.match(four, /style="overflow-x:auto"/);
  assert.equal(four.includes("table-cards"), false);
  const css = readFileSync(fileURLToPath(new URL("../src/styles.css", import.meta.url)), "utf8");
  assert.match(css, /\.blog-body blockquote,\s*\.blog-body \.table-wrap \{ margin-top: 0\.75rem; \}/);
  assert.match(css, /\.he-inline \{\s*unicode-bidi: isolate;\s*\}/);
  assert.match(renderTeaching("> A quoted line in the post."), /<blockquote>/);
  assert.match(renderTeaching("The word בראשית sits here in the sentence."), /class="he-inline"/);
});

test("a post keeps its section address, its draft, and its search title", () => {
  assert.equal(postPath("teachings", "aleph"), "/blogs/aleph");
  assert.equal(postPath("learning-hebrabbai", "aleph"), "/learning-hebrabbai/aleph");
  assert.equal(retiredTeachingTarget("/teachings"), "/blogs");
  assert.equal(retiredTeachingTarget("/teachings/aleph"), "/blogs/aleph");
  assert.equal(retiredTeachingTarget("/teachings/rss.xml"), "/blogs/rss.xml");
  const fields = { ...live, tags: "letters", related: "bet", draft: undefined };
  const draft = validateTeaching(fields);
  assert.equal(draft.ok, true);
  if (draft.ok) assert.equal(draft.value.draft, true);
  const published = validateTeaching({ ...fields, draft: false });
  assert.equal(published.ok && published.value.draft, false);
  const longSummary = validateTeaching({ ...fields, summary: "x".repeat(156) });
  assert.equal(longSummary.ok, false);
  const longSearch = validateTeaching({ ...fields, searchTitle: "x".repeat(61) });
  assert.equal(longSearch.ok, false);
  assert.equal(postHeadline(live), live.title);
  assert.equal(postHeadline({ ...live, searchTitle: "Short title" }), "Short title");
  const head = postHead({ ...live, searchTitle: "Short title", summary: "A short reading about the first letter and why it matters." });
  assert.equal(head.meta.some((item) => "title" in item && item.title === "Short title"), true);
  assert.equal(head.meta.some((item) => item.property === "og:title" && item.content === "Short title"), true);
  assert.equal(head.meta.some((item) => item.name === "description" && item.content === live.summary), true);
  assert.equal(head.links[0].href.endsWith("/blogs/aleph"), true);
  assert.equal(teachingLastmod(live), "2026-10-19");
  const html = renderTeaching("# A heading\n\n## A smaller heading\n\nThe letter aleph still begins the verse.");
  assert.match(html, /<h2>/);
  assert.match(html, /<h3>/);
  assert.equal(html.includes("<h1>"), false);
  const table = renderTeaching("| A | B |\n| --- | --- |\n| a | b |");
  assert.match(table, /<div class="table-wrap" style="overflow-x:auto">/);
  const ld = postJsonLd({ ...live, searchTitle: "Short title" });
  assert.equal(ld["@graph"][0].headline, live.title);
  assert.equal(ld["@graph"][0].author["@type"], "Person");
  assert.equal(ld["@graph"][0].author.name, "Adeola Adegbolagun");
  assert.equal(ld["@graph"][0].author.alternateName, "Brother Ade");
  assert.equal(ld["@graph"][0].author.url, ld["@graph"][0].author["@id"].replace(/#adeola$/, ""));
  assert.equal(ld["@graph"][0].description, live.summary);
});

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
  assert.equal(BLOG_HOME.title, "Blog | HaDay HebRabbAi Mentor");
  assert.equal(blogPageTitle("all"), "Blog | HaDay HebRabbAi Mentor");
  assert.equal(blogPageTitle("teachings"), "Teachings | HaDay HebRabbAi Mentor");
  assert.equal(blogPageTitle("learning-hebrabbai"), "Learning HebRabbAi | HaDay HebRabbAi Mentor");
  const teachingCrumb = blogCrumbs("teachings").map((item) => item.item).join(" ");
  assert.equal(teachingCrumb.includes("section=teachings"), false);
  assert.equal(teachingCrumb.includes("https://hebrewmentor.haday.app/blogs"), true);
  const tabLd = JSON.stringify(blogIndexJsonLd("teachings", [live]));
  assert.equal(tabLd.includes("section=teachings"), false);
  assert.equal(tabLd.includes("https://hebrewmentor.haday.app/blogs"), true);
  const postLd = JSON.stringify(postJsonLd(live));
  assert.equal(postLd.includes("section=teachings"), false);
  assert.equal(PUBLIC_NAV.find((item) => item.to === "/blogs").label, "Blog");
  assert.equal(PUBLIC_NAV.some((item) => item.label === "Teachings"), false);
  assert.equal(FOOTER_NAV.find((item) => item.to === "/blogs").label, "Blog");
  assert.equal(FOOTER_NAV.some((item) => item.label === "Teachings"), false);
  assert.equal(STUDY_MENU_BLOG.to, "/blogs");
  assert.equal(STUDY_MENU_BLOG.label, "Blog");
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
  assert.match(html, /class="table-wrap/);
  assert.match(html, /<th scope="col" style="text-align:left">Left<\/th>/);
  assert.match(html, /<th scope="col" style="text-align:center">Center<\/th>/);
  assert.match(html, /<th scope="col" style="text-align:right">Right<\/th>/);
  assert.match(html, /a \| b/);
  assert.equal(html.includes("<script>"), false);
  assert.equal(html.includes("alert(1)"), true);
  assert.match(html, /<td style="text-align:right"><span dir="rtl" lang="he"/);
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
