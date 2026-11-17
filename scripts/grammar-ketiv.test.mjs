import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { parseOshbLemma } = await jiti.import(join(root, "src/lib/oshb-lemma.ts"));
const { ketivQereNumbers } = await jiti.import(join(root, "src/lib/reading-loop/strong-lemma.ts"));

function one(raw) {
  const parts = parseOshbLemma(String(raw ?? "")).parts.map((part) => Number(part.strong.slice(1))).filter((n) => n > 0);
  return parts.length === 1 ? parts[0] : 0;
}

function differCount() {
  let n = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        words.forEach((word, index) => {
          const kn = parseOshbLemma(String(word.lemma ?? "")).parts;
          const qere = ketivQereNumbers(words, index) ?? [];
          const matched = kn.length === 1 && qere.includes(one(word.lemma));
          const bare = kn.length !== 1 && !qere.length;
          if (word.kq_role === "ketiv" && !matched && !bare && kn.length < 2) n += 1;
        });
      }
    }
  }
  return n;
}

test("a differing ketiv is the qere, with the ketiv noted, and the English stays off the Grammar Path page", () => {
  const notes = JSON.parse(readFileSync(join(root, "public/tanakh/ketiv-qere.json"), "utf8"));
  const tokens = Object.values(notes).reduce((sum, row) => sum + Object.keys(row).length, 0);
  assert.equal(tokens, differCount());
  assert.equal(tokens, 234);
  assert.equal(notes["Job.38.1"], undefined);
  assert.equal(notes["Isa.52.5"]?.["1"], undefined);
  assert.equal(notes["Isa.10.32"]["7"].k, "בית");
  assert.match(notes["Isa.10.32"]["7"].q, /בַּת/);
  assert.equal(notes["Isa.44.24"]["15"].k, "מי");
  assert.equal(notes["Isa.44.24"]["15"].q, "");
  assert.match(notes["Song.2.13"]["8"].q, /לָ/);
  const reading = readFileSync(join(root, "src/components/tanakh-reading.tsx"), "utf8");
  const sheet = readFileSync(join(root, "src/components/word-sheet.tsx"), "utf8");
  assert.doesNotMatch(reading, /EnglishVerse/);
  assert.match(reading, /The English translation stays off this page/);
  assert.match(reading, /KetivMark/);
  assert.match(sheet, /No English gloss/);
  assert.doesNotMatch(sheet, /EnglishVerse/);
});
