import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { applyIibsLesson, emptyIibsGame, lessonUnlocked, levelCleared, levelUnlocked } = await jiti.import(
  "/workspace/src/lib/iibs-game.ts",
);
const { defaultGame } = await jiti.import("/workspace/src/lib/game.ts");

test("only Level A lesson 1 starts open", () => {
  const progress = emptyIibsGame();
  assert.equal(levelUnlocked(progress, "A", false), true);
  assert.equal(levelUnlocked(progress, "B", false), false);
  assert.equal(lessonUnlocked(progress, "A", 1, false), true);
  assert.equal(lessonUnlocked(progress, "A", 2, false), false);
});

test("90% opens the next lesson and a short score does not", () => {
  let game = defaultGame();
  game = applyIibsLesson(game, "A", 1, 89);
  assert.equal(lessonUnlocked(game.iibs, "A", 2, false), false);
  game = applyIibsLesson(game, "A", 1, 90);
  assert.equal(lessonUnlocked(game.iibs, "A", 2, false), true);
  assert.equal(lessonUnlocked(game.iibs, "A", 3, false), false);
});

test("clearing Level A opens Level B lesson 1 only", () => {
  let game = defaultGame();
  for (let lesson = 1; lesson <= 30; lesson += 1) game = applyIibsLesson(game, "A", lesson, 90);
  assert.equal(levelCleared(game.iibs, "A"), true);
  assert.equal(levelUnlocked(game.iibs, "B", false), true);
  assert.equal(lessonUnlocked(game.iibs, "B", 1, false), true);
  assert.equal(lessonUnlocked(game.iibs, "B", 2, false), false);
  assert.equal(levelUnlocked(game.iibs, "C", false), false);
});
