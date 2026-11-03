import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { IIBS_STAGES, applyIibsLesson, applyIibsStage, emptyIibsGame, heldIibsRank, iibsGlossHit, lessonUnlocked, levelCleared, levelUnlocked, stageUnlocked } =
  await jiti.import(new URL("../src/lib/iibs-game.ts", import.meta.url).pathname);
const { defaultGame } = await jiti.import(new URL("../src/lib/game.ts", import.meta.url).pathname);

test("every Scripture Path level and lesson starts open", () => {
  const progress = emptyIibsGame();
  for (const id of ["A", "B", "C", "D", "E", "lab"]) {
    assert.equal(levelUnlocked(progress, id, false), true, id);
  }
  assert.equal(levelUnlocked(progress, "Z", false), false);
  assert.equal(lessonUnlocked(progress, "A", 1, false), true);
  assert.equal(lessonUnlocked(progress, "A", 2, false), true);
  assert.equal(lessonUnlocked(progress, "E", 1, false), true);
  assert.equal(lessonUnlocked(progress, "E", 15, false), true);
  assert.equal(lessonUnlocked(progress, "E", 28, false), true);
});

test("the Hebrew stage shows English and the student types Hebrew", () => {
  const hebrew = IIBS_STAGES.find((item) => item.id === "hebrew");
  assert.equal(hebrew?.prompt, "English on the card. Type the Hebrew with the keys.");
  const src = readFileSync(new URL("../src/components/iibs-write-play.tsx", import.meta.url), "utf8");
  assert.equal(src.includes('stage === "gloss" || stage === "hebrew"'), false);
  assert.equal(src.includes('stage === "gloss" ?'), true);
});

test("stage results do not change which lessons are open", () => {
  let game = defaultGame();
  game = applyIibsStage(game, "A", 1, "multiple", 90);
  assert.equal(stageUnlocked(game.iibs, "A", 1, "gloss", false), true);
  assert.equal(stageUnlocked(game.iibs, "A", 1, "hebrew", false), false);
  assert.equal(lessonUnlocked(game.iibs, "A", 2, false), true);
  game = applyIibsStage(game, "A", 1, "gloss", 90);
  game = applyIibsStage(game, "A", 1, "hebrew", 90);
  game = applyIibsStage(game, "A", 1, "strict", 89);
  assert.equal(lessonUnlocked(game.iibs, "A", 2, false), true);
  assert.equal(game.iibs.lessons["A:1"]?.stages.strict.cleared, false);
  game = applyIibsStage(game, "A", 1, "strict", 90);
  assert.equal(lessonUnlocked(game.iibs, "A", 2, false), true);
  assert.equal(lessonUnlocked(game.iibs, "A", 3, false), true);
  assert.equal(game.iibs.lessons["A:1"]?.stages.strict.cleared, true);
});

test("a gloss hit accepts one English sense", () => {
  assert.equal(iibsGlossHit("mountain, hill (m.s.)", "mountain"), true);
  assert.equal(iibsGlossHit("mountain, hill (m.s.)", "river"), false);
  assert.equal(iibsGlossHit("he said", "he said"), true);
});

test("levels stay open, and a rank still needs every lesson that has words", () => {
  const fresh = defaultGame();
  assert.equal(levelUnlocked(fresh.iibs, "B", false), true);
  assert.equal(levelUnlocked(fresh.iibs, "C", false), true);
  assert.equal(lessonUnlocked(fresh.iibs, "B", 2, false), true);
  assert.equal(lessonUnlocked(fresh.iibs, "B", 3, false), true);
  let game = defaultGame();
  for (let lesson = 1; lesson <= 30; lesson += 1) game = applyIibsLesson(game, "A", lesson, 90);
  assert.equal(levelCleared(game.iibs, "A"), true);
  assert.equal(levelUnlocked(game.iibs, "B", false), true);
  assert.equal(lessonUnlocked(game.iibs, "B", 1, false), true);
  assert.equal(lessonUnlocked(game.iibs, "B", 2, false), true);
  assert.equal(levelUnlocked(game.iibs, "C", false), true);
  assert.equal(heldIibsRank(emptyIibsGame()), null);
  assert.equal(heldIibsRank(game.iibs)?.title, "Bearer of Words");
});

test("skipping ahead keeps the lesson record and does not award the rank", () => {
  const game = applyIibsLesson(defaultGame(), "E", 1, 90);
  assert.equal(game.iibs.lessons["E:1"]?.stages.strict.cleared, true);
  let onlyLast = applyIibsLesson(defaultGame(), "A", 30, 90);
  assert.equal(levelCleared(onlyLast.iibs, "A"), false);
  assert.equal(heldIibsRank(onlyLast.iibs), null);
  for (let lesson = 1; lesson <= 29; lesson += 1) onlyLast = applyIibsLesson(onlyLast, "A", lesson, 90);
  assert.equal(levelCleared(onlyLast.iibs, "A"), true);
  assert.equal(heldIibsRank(onlyLast.iibs)?.title, "Bearer of Words");
  let levelE = defaultGame();
  for (let lesson = 1; lesson <= 28; lesson += 1) levelE = applyIibsLesson(levelE, "E", lesson, 90);
  assert.equal(levelCleared(levelE.iibs, "E"), true);
});
