import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { findEnglishHitRange } = await jiti.import("/workspace/src/lib/hebrew.ts");
const { VERSES } = await jiti.import("/workspace/src/lib/verses.ts");
const { VOCAB } = await jiti.import("/workspace/src/lib/vocab.ts");
const { SYLLABLE_UNITS } = await jiti.import("/workspace/src/lib/syllables.ts");
const { lemmaForSurface } = await jiti.import("/workspace/src/lib/tanakh-pool.ts");

function slice(en, range) {
  return range ? en.slice(range.start, range.end) : null;
}

test("gloss son lights son, and pulls in your", () => {
  const en = "Take your son, your only one, whom you love.";
  const range = findEnglishHitRange(en, { gloss: "son", alts: ["child"] });
  assert.equal(slice(en, range), "your son");
});

test("YHWH lights YHWH, not a stray the", () => {
  const en = "Hear, Israel: YHWH our God, YHWH is one.";
  const range = findEnglishHitRange(en, {
    gloss: "Yahweh, the LORD",
    alts: ["the lord", "yahweh", "lord", "hashem", "yhwh"],
  });
  assert.equal(slice(en, range), "YHWH");
});

test("elohim lights God", () => {
  const en = "In the beginning God created the heavens and the earth.";
  const range = findEnglishHitRange(en, { gloss: "God, gods", alts: ["god", "gods"] });
  assert.equal(slice(en, range), "God");
});

test("hitEn wins over a shorter gloss", () => {
  const en = "Take your son, your only one, whom you love.";
  const range = findEnglishHitRange(en, { hitEn: "your son", gloss: "son" });
  assert.equal(slice(en, range), "your son");
});

test("said matches to say", () => {
  const en = "God said, “Let us make humankind in our image.”";
  const range = findEnglishHitRange(en, { gloss: "to say", alts: ["say", "speak"] });
  assert.equal(slice(en, range), "said");
});

test("humankind matches adam alts", () => {
  const en = "God said, “Let us make humankind in our image.”";
  const range = findEnglishHitRange(en, {
    gloss: "man, mankind, Adam",
    alts: ["man", "mankind", "adam", "human", "humankind"],
  });
  assert.equal(slice(en, range), "humankind");
});

test("the LORD is preferred over lord", () => {
  const en = "Blessed be the LORD, the God of Israel.";
  const range = findEnglishHitRange(en, {
    gloss: "Yahweh, the LORD",
    alts: ["the lord", "yahweh", "lord", "yhwh"],
  });
  assert.equal(slice(en, range).toLowerCase(), "the lord");
});

test("unrelated the is not marked when a real gloss hits", () => {
  const en = "In the beginning God created the heavens and the earth.";
  const range = findEnglishHitRange(en, { gloss: "God, gods", alts: ["god", "the"] });
  assert.equal(slice(en, range), "God");
});

test("ha lights the heavens, not the first the", () => {
  const en = "In the beginning God created the heavens and the earth.";
  const range = findEnglishHitRange(en, {
    hitEn: "the heavens",
    gloss: "the",
    alts: ["the", "definite article"],
  });
  assert.equal(slice(en, range), "the heavens");
});

test("untranslated object marker stays unmarked", () => {
  const en = "In the beginning God created the heavens and the earth.";
  const range = findEnglishHitRange(en, {
    gloss: "direct object marker",
    alts: ["object marker", "direct object", "not translated"],
  });
  assert.equal(range, null);
});

test("word inflects to words", () => {
  const en = "After these things, the word of YHWH came to Abram.";
  const range = findEnglishHitRange(en, { gloss: "word, matter, thing", alts: ["word", "matter", "thing"] });
  assert.ok(["the word", "these things"].includes(slice(en, range)));
});

const SKIP_IDS = new Set([
  "et", // object marker, untranslated
]);

test("almost every Tanakh verse lights an English span", () => {
  const misses = [];
  for (const [id, verse] of Object.entries(VERSES)) {
    if (SKIP_IDS.has(id)) continue;
    const item = VOCAB.find((v) => v.id === id);
    if (!item || !verse.en) continue;
    const range = findEnglishHitRange(verse.en, {
      hitEn: verse.hitEn,
      gloss: item.gloss,
      alts: item.alts,
    });
    if (!range) misses.push(`${id} · ${verse.ref} · ${item.gloss} · ${verse.en}`);
  }
  assert.equal(misses.length, 0, `unmarked English:\n${misses.join("\n")}`);
});

test("syllable verses light English when a lemma is known", () => {
  const misses = [];
  for (const unit of SYLLABLE_UNITS) {
    for (const verse of unit.verses) {
      const lemma = lemmaForSurface(verse.hit);
      const range = findEnglishHitRange(verse.en, {
        hitEn: verse.hitEn,
        gloss: lemma?.gloss,
        alts: lemma?.alts,
      });
      if (!range) misses.push(`${unit.id} ${verse.ref} ${verse.hit} · ${verse.en}`);
    }
  }
  assert.equal(misses.length, 0, `syllable unmarked:\n${misses.join("\n")}`);
});
