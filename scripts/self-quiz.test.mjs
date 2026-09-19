import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { itemsForSelection, itemsForWeek, itemsForChapter } = await jiti.import("/workspace/src/lib/vocab.ts");
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
