import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { itemsForWeek, bbhVocab } = await jiti.import("/workspace/src/lib/vocab.ts");
const { VOCAB_S2, itemsForTerm2Week, isTerm2Week } = await jiti.import("/workspace/src/lib/vocab-s2.ts");
const { TERM2_LESSONS } = await jiti.import("/workspace/src/lib/term2-lessons.ts");
const { secondTermBlock } = await jiti.import("/workspace/src/lib/path.ts");

test("semester 2 words stay off the first-term list", () => {
  assert.equal(VOCAB_S2.length, 206);
  assert.ok(VOCAB_S2.every((item) => item.id.startsWith("s2-")));
  assert.equal(bbhVocab().some((item) => item.id.startsWith("s2-")), false);
  assert.equal(itemsForWeek(1).some((item) => item.id.startsWith("s2-")), false);
  const week1 = itemsForWeek(101);
  assert.ok(week1.length > 0);
  assert.ok(week1.every((item) => item.chapter === 20));
  assert.equal(isTerm2Week(101), true);
  assert.equal(isTerm2Week(15), false);
  const all = itemsForTerm2Week(112);
  const pala = all.filter((item) => item.hebrew.includes("פָּלָא") || item.hebrew.includes("פָּלָא"));
  assert.equal(pala.length, 1);
  assert.equal(secondTermBlock("/drill", 2), null);
  assert.equal(secondTermBlock("/game", 2), "/bbh");
  assert.equal(TERM2_LESSONS.length, 16);
  assert.equal(TERM2_LESSONS[0].chapter, 20);
  assert.equal(TERM2_LESSONS[15].chapter, 35);
  assert.equal(VOCAB_S2.some((item) => item.gloss.includes("cs)")), false);
  assert.equal(VOCAB_S2.filter((item) => item.hebrew === "אֲרוֹן").length, 1);
});
