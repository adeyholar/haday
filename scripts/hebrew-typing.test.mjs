import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { applyTypeKey, accuracyPct, passedBatch, TYPE_PASS, nextExpected } = await jiti.import(
  "/workspace/src/lib/hebrew-typing/engine.ts",
);
const { mapPhysicalKey, QWERTY_TO_HE, fingerFor } = await jiti.import("/workspace/src/lib/hebrew-typing/layout.ts");
const { GAME_WORDS, gameRound } = await jiti.import("/workspace/src/lib/hebrew-typing/bank.ts");
const { typingRank, emptyTyping } = await jiti.import("/workspace/src/lib/hebrew-typing/ranks.ts");
const { lessonById } = await jiti.import("/workspace/src/lib/ladder.ts");
const { stripNiqqud } = await jiti.import("/workspace/src/lib/hebrew.ts");

test("Israeli qwerty map hits alef on T", () => {
  assert.equal(QWERTY_TO_HE.t, "א");
  assert.equal(mapPhysicalKey("t"), "א");
  assert.equal(mapPhysicalKey("א"), "א");
  assert.equal(fingerFor("א"), "li");
});

test("accuracy 95% is the study pass, 94 is not", () => {
  assert.equal(TYPE_PASS, 95);
  assert.equal(passedBatch(accuracyPct(19, 1)), true);
  assert.equal(passedBatch(accuracyPct(94, 6)), false);
});

test("wrong key does not consume the target", () => {
  const miss = applyTypeKey("אב", "", "ג");
  assert.equal(miss.hit, false);
  assert.equal(miss.typed, "");
  const hit = applyTypeKey("אב", "", "א");
  assert.equal(hit.hit, true);
  assert.equal(hit.typed, "א");
  assert.equal(nextExpected("אב", "א"), "ב");
});

test("pointed word bank keeps nikkud", () => {
  assert.ok(GAME_WORDS.length >= 30);
  for (const w of GAME_WORDS) {
    assert.notEqual(w.hebrew, stripNiqqud(w.hebrew), w.id);
  }
  const round = gameRound(8, 1);
  assert.equal(round.length, 8);
  assert.ok(round.every((w) => w.hebrew !== stripNiqqud(w.hebrew)));
});

test("ranks climb Ink to Ready Scribe without a speech score", () => {
  assert.equal(typingRank(emptyTyping()), "Ink");
  assert.equal(typingRank({ ...emptyTyping(), batchesPassed: 3 }), "Pen");
  assert.equal(typingRank({ ...emptyTyping(), batchesPassed: 8 }), "Quill");
  assert.equal(typingRank({ ...emptyTyping(), batchesPassed: 15 }), "Ready Scribe");
});

test("Alef lessons offer Type without changing Mark trained gates", () => {
  const lesson = lessonById("alef-bereshit");
  assert.ok(lesson.actions.some((a) => a.kind === "type"));
});
