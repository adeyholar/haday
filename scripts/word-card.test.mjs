import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { describeTags, grammarAskFromTags, matchFormForWord, classLemmaForWord, englishKeysForWord, markGlossInEnglish } =
  await jiti.import("/workspace/src/lib/word-card.ts");

test("qal perfect tags open qal perfect cards, not a shoresh guess", () => {
  const tags = ["verb", "qal", "qatal", "v3ms"];
  const labels = describeTags(tags);
  assert.ok(labels.includes("Qal"));
  assert.ok(labels.includes("Perfect (qatal)"));
  const ask = grammarAskFromTags(tags);
  assert.equal(ask?.q, "give me 10 qal perfect");
});

test("hatuf beats other tags for the deck link", () => {
  const ask = grammarAskFromTags(["hatuf", "cst", "ms", "noun", "chain"]);
  assert.equal(ask?.q, "give me 10 qamets hatuf");
});

test("matchFormForWord prefers the ref, not a random homograph", () => {
  const forms = [
    { w: "אֶת", n: 6671, t: ["fs"], r: ["1Chr.1.10"] },
    { w: "בָּרָא", n: 48, t: ["qal", "qatal", "v3ms", "verb"], r: ["Gen.1.1"] },
    { w: "בָּרָא", n: 2, t: ["qal", "qatal", "v3ms", "verb"], r: ["Isa.40.26"] },
  ];
  const hit = matchFormForWord(forms, "בָּרָא", "Gen.1.1");
  assert.equal(hit?.r[0], "Gen.1.1");
});

test("class lemma for a prefixed form stays the citation word", () => {
  const v = classLemmaForWord("הָאָרֶץ");
  assert.equal(v?.id, "erets");
});

test("English verse marks the gloss of the focused Hebrew word", () => {
  const keys = englishKeysForWord("הָאָרֶץ");
  assert.ok(keys.some((k) => /earth|land/i.test(k)));
  const segs = markGlossInEnglish("In the beginning God created the heavens and the earth.", keys);
  assert.ok(segs.some((s) => s.hit && /earth/i.test(s.text)));
  assert.ok(segs.some((s) => !s.hit && /heavens/i.test(s.text)));
});

test("YHWH marks LORD in the English line", () => {
  const keys = englishKeysForWord("יהוה");
  const segs = markGlossInEnglish("and YHWH God took the man, and put him into the garden of Eden.", keys);
  assert.ok(segs.some((s) => s.hit && /yhwh|lord/i.test(s.text)));
});
