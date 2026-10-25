import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { strongHebrewChunk } = await jiti.import(new URL("../src/lib/strongs.ts", import.meta.url).pathname);

test("Hebrew Strong's chunks cover the book once, and a card loads one range", () => {
  const book = JSON.parse(readFileSync(new URL("../public/lexicon/strongs-hebrew.json", import.meta.url), "utf8"));
  const dir = new URL("../public/lexicon/strongs-hebrew/", import.meta.url);
  const files = readdirSync(dir).filter((name) => name.endsWith(".json"));
  const seen = new Map();
  for (const name of files) {
    const chunk = JSON.parse(readFileSync(new URL(name, dir), "utf8"));
    for (const [id, row] of Object.entries(chunk)) {
      assert.equal(seen.has(id), false, id);
      assert.deepEqual(row, book[id]);
      assert.equal(`${strongHebrewChunk(id)}.json`, name);
      seen.set(id, name);
    }
  }
  assert.equal(seen.size, Object.keys(book).length);
  assert.equal(strongHebrewChunk("H7225"), "H7001-H7500");
  assert.equal(strongHebrewChunk("H1"), "H0001-H0500");
  assert.equal(strongHebrewChunk("H8674"), "H8501-H8674");
  assert.equal(strongHebrewChunk("G3050"), null);
  assert.equal(strongHebrewChunk("H9000"), null);

  const strongs = readFileSync(new URL("../src/lib/strongs.ts", import.meta.url), "utf8");
  assert.match(strongs, /\/lexicon\/strongs-hebrew\/\$\{name\}\.json/);
  assert.match(strongs, /\/lexicon\/strongs-greek\.json/);
  assert.doesNotMatch(strongs, /\/lexicon\/strongs-hebrew\.json/);
});
