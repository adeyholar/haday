import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { applyIibsLesson, applyIibsStage, emptyIibsGame, heldIibsRank, iibsGlossHit, lessonUnlocked, levelCleared, levelUnlocked, stageUnlocked } =
  await jiti.import("/workspace/src/lib/iibs-game.ts");
const { defaultGame } = await jiti.import("/workspace/src/lib/game.ts");

test("only Level A lesson 1 starts open", () => {
  const progress = emptyIibsGame();
  assert.equal(levelUnlocked(progress, "A", false), true);
  assert.equal(levelUnlocked(progress, "B", false), false);
  assert.equal(lessonUnlocked(progress, "A", 1, false), true);
  assert.equal(lessonUnlocked(progress, "A", 2, false), false);
});

test("90% on Multiple does not open the next lesson", () => {
  let game = defaultGame();
  game = applyIibsStage(game, "A", 1, "multiple", 90);
  assert.equal(stageUnlocked(game.iibs, "A", 1, "gloss", false), true);
  assert.equal(stageUnlocked(game.iibs, "A", 1, "hebrew", false), false);
  assert.equal(lessonUnlocked(game.iibs, "A", 2, false), false);
  game = applyIibsStage(game, "A", 1, "gloss", 90);
  game = applyIibsStage(game, "A", 1, "hebrew", 90);
  game = applyIibsStage(game, "A", 1, "strict", 89);
  assert.equal(lessonUnlocked(game.iibs, "A", 2, false), false);
  game = applyIibsStage(game, "A", 1, "strict", 90);
  assert.equal(lessonUnlocked(game.iibs, "A", 2, false), true);
  assert.equal(lessonUnlocked(game.iibs, "A", 3, false), false);
});

test("a gloss hit accepts one English sense", () => {
  assert.equal(iibsGlossHit("mountain, hill (m.s.)", "mountain"), true);
  assert.equal(iibsGlossHit("mountain, hill (m.s.)", "river"), false);
  assert.equal(iibsGlossHit("he said", "he said"), true);
});

test("clearing Level A opens Level B lesson 1 only", () => {
  let game = defaultGame();
  for (let lesson = 1; lesson <= 30; lesson += 1) game = applyIibsLesson(game, "A", lesson, 90);
  assert.equal(levelCleared(game.iibs, "A"), true);
  assert.equal(levelUnlocked(game.iibs, "B", false), true);
  assert.equal(lessonUnlocked(game.iibs, "B", 1, false), true);
  assert.equal(lessonUnlocked(game.iibs, "B", 2, false), false);
  assert.equal(levelUnlocked(game.iibs, "C", false), false);
  assert.equal(heldIibsRank(emptyIibsGame()), null);
  assert.equal(heldIibsRank(game.iibs)?.title, "Bearer of Words");
});
