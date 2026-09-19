import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { itemsForSelection, itemsForWeek, itemsForChapter, quizChoices, VOCAB } = await jiti.import("/workspace/src/lib/vocab.ts");
const { verseFor } = await jiti.import("/workspace/src/lib/verses.ts");
const { tanakhVerseFor } = await jiti.import("/workspace/src/lib/tanakh-pool.ts");
const { lessonById } = await jiti.import("/workspace/src/lib/ladder.ts");

test("self-quiz deck is the full week/chapter union, not a 12-cap", () => {
  const week3 = itemsForWeek(3);
  const ch5 = itemsForChapter(5);
  const mix = itemsForSelection([3], [5]);
  assert.ok(week3.length > 12, "week 3 has more than a short round");
  assert.equal(mix.length, new Set(mix.map((v) => v.id)).size);
  assert.ok(mix.length >= week3.length);
  assert.ok(mix.length >= ch5.length);
  assert.ok(mix.every((v) => v.hebrew && v.gloss));
});

test("Alef letter Drill is still not week quiz", () => {
  const lesson = lessonById("alef-bereshit");
  const drill = lesson.actions.find((a) => a.kind === "drill");
  assert.ok(drill);
  assert.notEqual(drill.href, "/drill");
});

test("four-way choices are the gloss plus three nearby traps", () => {
  const week3 = itemsForWeek(3);
  const item = week3.find((v) => v.pos === "noun") ?? week3[0];
  const choices = quizChoices(item, week3);
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices).size, 4);
  assert.ok(choices.includes(item.gloss));
  const traps = choices.filter((c) => c !== item.gloss);
  for (const g of traps) {
    const src = VOCAB.find((v) => v.gloss === g);
    assert.ok(src, g);
    const near = Math.abs(src.chapter - item.chapter) <= 4 || src.pos === item.pos;
    assert.ok(near, `${g} (ch ${src.chapter} ${src.pos}) is too far from ${item.gloss}`);
  }
});

test("complete-miss Tanakh examples have Hebrew and English", () => {
  const week3 = itemsForWeek(3);
  const hits = week3.filter((v) => {
    const verse = verseFor(v.id) ?? tanakhVerseFor(v.id);
    return Boolean(verse?.he && verse?.en);
  });
  assert.ok(hits.length >= Math.min(8, week3.length), "most week-3 lemmas have a short Tanakh line");
});
