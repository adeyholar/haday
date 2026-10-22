import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const {
  isPublicTeaching,
  relatedTeachings,
  renderTeaching,
  slugify,
  teachingCta,
  teachingsRss,
  validateTeaching,
} = await jiti.import(new URL("../src/lib/teaching-text.ts", import.meta.url).pathname);

const live = {
  slug: "aleph",
  title: "The letter aleph",
  summary: "A short reading about the first letter and why it matters.",
  body: "Aleph is silent, and the verse still begins with it.\n\nHear the word before the gloss.",
  path: "grammar",
  tags: ["letters"],
  related: ["bet"],
  image: "",
  draft: false,
  published: "2026-10-19",
  updated: "2026-10-19",
};

test("a teaching without a title is rejected", () => {
  const result = validateTeaching({ ...live, title: "No", body: live.body });
  assert.equal(result.ok, false);
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

test("the teaching body escapes html and marks Hebrew", () => {
  const html = renderTeaching("A word <script>alert(1)</script> and **שלום** in the line.");
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /dir="rtl" lang="he"/);
  assert.match(html, /<strong>/);
});

test("the feed is xml and leaves drafts out", () => {
  const xml = teachingsRss([live, { ...live, slug: "hidden", draft: true }], "https://hebrewmentor.haday.app");
  assert.match(xml, /<rss /);
  assert.match(xml, /<item>/);
  assert.equal(xml.includes("hidden"), false);
  assert.match(xml, /https:\/\/hebrewmentor\.haday\.app\/blogs\/aleph/);
  assert.equal(xml.includes("/teachings/"), false);
});
