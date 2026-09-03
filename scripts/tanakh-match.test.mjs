import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { lettersOnly } = await jiti.import("/workspace/src/lib/hebrew.ts");
const { lemmaForSurface, isInflected, tanakhForms, lemmaIdOf, tanakhVerseFor, verseTokenFor } = await jiti.import(
  "/workspace/src/lib/tanakh-pool.ts",
);

function storedAs(he, lemmaId) {
  return tanakhForms().some((v) => lemmaIdOf(v.id) === lemmaId && lettersOnly(v.hebrew) === lettersOnly(he));
}

test("Gen 3:15 אשית is I will put, not fire", () => {
  assert.equal(lemmaForSurface("אָשִׁית"), undefined);
  assert.equal(lemmaForSurface("אשית"), undefined);
  assert.notEqual(lemmaForSurface("אָשִׁית")?.id, "ishah");
  assert.equal(isInflected("אָשִׁית", "אֵשׁ"), false);
  assert.equal(storedAs("אָשִׁית", "esh"), false);
});

test("woman is not fire; fire with article is fire", () => {
  assert.equal(lemmaForSurface("הָאִשָּׁה")?.id, "ishah");
  assert.equal(lemmaForSurface("אִשָּׁה")?.id, "ishah");
  assert.equal(lemmaForSurface("הָאֵשׁ")?.id, "esh");
  assert.equal(lemmaForSurface("בָּאֵשׁ")?.id, "esh");
  assert.notEqual(lemmaForSurface("אֲשֶׁר")?.id, "esh");
});

test("false friends: surface is not a shorter unrelated lemma", () => {
  const cases = [
    ["אֱלֹהֵינוּ", "elleh", "elohim"],
    ["בָּאוּ", "o", "bo"],
    ["שֵׁמוֹת", "mut", "shem"],
    ["מַהֵר", "har"],
    ["מַלְאַךְ", "male"],
    ["רֹעִי", "ra"],
    ["פְּרוּ", "par"],
    ["אִמּוֹ", "im-if", "em"],
    ["הֶבֶל", "bal"],
    ["לִפְנֵי", "pen"],
    ["הַשֻּׁלְחָן", "shalach"],
    ["לְאֹתֹת", "attah"],
  ];
  const bad = [];
  for (const [he, wrong, right] of cases) {
    const guessed = lemmaForSurface(he)?.id;
    if (guessed === wrong) bad.push(`${he} guessed ${wrong}`);
    if (storedAs(he, wrong)) bad.push(`${he} stored as ${wrong}`);
    if (right && guessed && guessed !== right && guessed === wrong) bad.push(`${he} wanted ${right}`);
  }
  assert.equal(bad.length, 0, bad.join("\n"));
  assert.equal(lemmaForSurface("אֱלֹהֵינוּ")?.id, "elohim");
  assert.notEqual(lemmaForSurface("אִמּוֹ")?.id, "im-if");
});

test("longer lemma wins over a 2-letter substring", () => {
  assert.equal(lemmaForSurface("אֱלֹהִים")?.id, "elohim");
  assert.notEqual(lemmaForSurface("אֱלֹהִים")?.id, "el-god");
  assert.equal(lemmaForSurface("יִשְׂרָאֵל")?.id, "israel");
  assert.equal(lemmaForSurface("הַמֶּלֶךְ")?.id, "melek");
  assert.equal(lemmaForSurface("בְּנֵי")?.id, "ben");
  assert.equal(lemmaForSurface("בְּרֵאשִׁית")?.id, "rosh");
});

test("a 2-letter lemma is never glued onto a longer unrelated word", () => {
  const bad = [];
  for (const item of tanakhForms()) {
    const stored = lemmaIdOf(item.id);
    const surf = lettersOnly(item.hebrew);
    const guessed = lemmaForSurface(item.hebrew);
    if (!guessed) continue;
    const g = lettersOnly(guessed.hebrew);
    if (g.length > 2) continue;
    if (guessed.id === stored) continue;
    if (surf.startsWith(g) && surf.length - g.length >= 2) {
      bad.push(`${item.hebrew} stored=${stored} guessed=${guessed.id} (${guessed.gloss})`);
    }
  }
  assert.equal(bad.length, 0, bad.slice(0, 20).join("\n"));
});

test("attached verse actually contains the Hebrew surface", () => {
  const bad = [];
  for (const item of tanakhForms()) {
    const verse = tanakhVerseFor(item.id);
    if (!verse?.he) continue;
    if (!verseTokenFor(verse.he, item.hebrew)) {
      bad.push(`${item.hebrew} [${lemmaIdOf(item.id)}] ${verse.ref} ${verse.he}`);
    }
  }
  assert.equal(bad.length, 0, bad.slice(0, 15).join("\n"));
});

test("האש the-fire is not Exod 3:2, which has no article", () => {
  assert.equal(verseTokenFor("וַיֵּרָא מַלְאַךְ יְהוָה אֵלָיו בְּלַבַּת־אֵשׁ", "הָאֵשׁ"), undefined);
  assert.ok(verseTokenFor("וְאֶת־קֹלוֹ שָׁמַעְנוּ מִתּוֹךְ הָאֵשׁ", "הָאֵשׁ"));
  const fires = tanakhForms().filter((v) => lemmaIdOf(v.id) === "esh");
  for (const f of fires) {
    const verse = tanakhVerseFor(f.id);
    if (!verse) continue;
    assert.notEqual(verse.ref, "Exod 3:2", `${f.hebrew} must not use a verse without the article`);
    assert.ok(verseTokenFor(verse.he, f.hebrew), `${f.hebrew} in ${verse.ref}`);
  }
});
