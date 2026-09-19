import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { itemsForSelection, itemsForWeek } = await jiti.import("/workspace/src/lib/vocab.ts");
const { verseFor } = await jiti.import("/workspace/src/lib/verses.ts");
const { tanakhVerseFor } = await jiti.import("/workspace/src/lib/tanakh-pool.ts");

test("cards mix is the full week/chapter union", () => {
  const week3 = itemsForWeek(3);
  const mix = itemsForSelection([3], [5]);
  assert.ok(week3.length > 12);
  assert.equal(mix.length, new Set(mix.map((v) => v.id)).size);
  assert.ok(mix.every((v) => v.hebrew && v.gloss && v.translit));
});

test("cards sitting has a Tanakh line for week-3 lemmas", () => {
  const week3 = itemsForWeek(3);
  const hits = week3.filter((v) => {
    const verse = verseFor(v.id) ?? tanakhVerseFor(v.id);
    return Boolean(verse?.he && verse?.en);
  });
  assert.ok(hits.length >= Math.min(8, week3.length));
});
