import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import test from "node:test";
import { createJiti } from "jiti";

const root = new URL("..", import.meta.url).pathname;
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { grammarPathReadingLine, versesFromDump } = await jiti.import(new URL("../src/lib/reading.ts", import.meta.url).pathname);
const { ketivDisplay } = await jiti.import(new URL("../src/lib/ketiv-qere.ts", import.meta.url).pathname);

const SCRIPTURE_GEN_1_1 = "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃";

function scriptureLine(book, chapter, ref) {
  const data = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, `${chapter}.json.gz`))).toString("utf8"));
  const verse = data.verses.find((row) => row.ref === ref);
  const words = verse.words.filter((word) => word.kq_role !== "qere");
  return words
    .map((word, index) => {
      const note = ketivDisplay(words, index);
      const face = note?.q || word.surface;
      const trailer = !note && word.trailer ? word.trailer : "";
      return face + trailer;
    })
    .join("");
}

test("Grammar Path reading shows Hebrew and not the WEB verse", () => {
  const reading = readFileSync(join(root, "src/components/tanakh-reading.tsx"), "utf8");
  assert.doesNotMatch(reading, /<EnglishVerse/);
  assert.doesNotMatch(reading, /English stays on the page/);
  const sample = {
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים",
    en: "In the beginning God created the heavens and the earth.",
  };
  const line = grammarPathReadingLine(sample);
  assert.equal(line.hebrew, sample.he);
  assert.equal(line.english, null);
  assert.equal(JSON.stringify(line).includes("In the beginning"), false);
  const dump = {
    id: "Gen",
    en: "Genesis",
    section: "torah",
    chapters: { 1: [{ v: 1, he: sample.he, en: sample.en, words: ["בְּרֵאשִׁית"] }] },
  };
  const [verse] = versesFromDump(dump, 1);
  assert.equal(verse.en, sample.en);
  assert.equal(grammarPathReadingLine(verse).english, null);
});

test("Scripture Path verse line is unchanged", () => {
  const desk = readFileSync(join(root, "src/components/wlc-desk.tsx"), "utf8");
  const page = readFileSync(join(root, "src/routes/iibs/wlc/$book/$ch.tsx"), "utf8");
  assert.doesNotMatch(desk, /EnglishVerse/);
  assert.doesNotMatch(page, /EnglishVerse/);
  assert.match(desk, /const face = note\?\.q \|\| word\.surface/);
  assert.equal(scriptureLine("Gen", 1, "Gen.1.1"), SCRIPTURE_GEN_1_1);
  const isa = scriptureLine("Isa", 44, "Isa.44.24");
  assert.match(isa, /מֵאִתִּֽי/);
});
