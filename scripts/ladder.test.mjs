import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const {
  BRAND_BLOCK,
  LESSONS,
  STATIONS,
  canTrain,
  continueTarget,
  defaultLadder,
  hydrateLadder,
  isStationUnlocked,
  labSearch,
  lessonById,
  lessonsFor,
  isAlefStationLesson,
  openLadderText,
  stationComplete,
  trainLadderLesson,
  visitLadder,
} = await jiti.import("/workspace/src/lib/ladder.ts");
const { defaultGame, hydrateGame } = await jiti.import("/workspace/src/lib/game.ts");

test("five stations, creative names, Realm on top", () => {
  assert.deepEqual(
    STATIONS.map((s) => s.name),
    ["Alef-bet Station", "House of Names", "Verb Tent", "Many Voices Camp", "Realm of the Word"],
  );
  assert.equal(STATIONS.at(-1).id, "realm");
  assert.equal(STATIONS[0].order, 1);
});

test("student-facing copy has no textbook brands", () => {
  for (const s of STATIONS) {
    const blob = `${s.name} ${s.goal} ${s.doneWhen} ${s.hebrew}`;
    assert.doesNotMatch(blob, BRAND_BLOCK, s.id);
  }
  for (const l of LESSONS) {
    const blob = `${l.title} ${l.notice} ${l.distinction} ${l.rule} ${l.hearAgain} ${l.labLabel} ${l.doneWhen} ${l.actions.map((a) => a.label).join(" ")}`;
    assert.doesNotMatch(blob, BRAND_BLOCK, l.id);
  }
});

test("every lesson opens Lab text first", () => {
  for (const l of LESSONS) {
    assert.ok(l.lab.book, l.id);
    assert.ok(l.lab.ch >= 1, l.id);
    assert.ok(l.actions.some((a) => a.kind === "lab"), `${l.id} lab action`);
  }
});

test("cannot skip rungs; cannot train without text", () => {
  let p = defaultLadder();
  assert.equal(p.unlockedLevel, 1);
  assert.equal(isStationUnlocked(p, "alef"), true);
  assert.equal(isStationUnlocked(p, "names"), false);
  const skipped = visitLadder(p, "names", "names-who");
  assert.equal(skipped.currentStationId, "alef");
  const noTrain = trainLadderLesson(p, "alef-bereshit");
  assert.equal(noTrain.trained["alef-bereshit"], undefined);
  assert.equal(canTrain(p, "alef-bereshit"), false);
  p = openLadderText(p, "alef-bereshit");
  assert.equal(p.openedText["alef-bereshit"], true);
  assert.equal(canTrain(p, "alef-bereshit"), true);
});

test("training a full station unlocks the next rung", () => {
  let p = defaultLadder();
  for (const lesson of lessonsFor("alef")) {
    p = openLadderText(p, lesson.id);
    p = trainLadderLesson(p, lesson.id);
  }
  assert.equal(stationComplete(p, "alef"), true);
  assert.equal(p.unlockedLevel, 2);
  assert.equal(isStationUnlocked(p, "names"), true);
  assert.equal(isStationUnlocked(p, "verbs"), false);
});

test("continue points at first untrained open lesson", () => {
  const p = openLadderText(defaultLadder(), "alef-bereshit");
  const t = continueTarget(p);
  assert.equal(t.lessonId, "alef-bereshit");
  const trained = trainLadderLesson(p, "alef-bereshit");
  assert.equal(continueTarget(trained).lessonId, "alef-ps119");
});

test("game snapshot keeps ladder through hydrate", () => {
  const g = defaultGame();
  assert.equal(g.ladder.unlockedLevel, 1);
  const opened = openLadderText(g.ladder, "alef-bereshit");
  const round = hydrateGame({ ...g, ladder: opened });
  assert.equal(round.ladder.openedText["alef-bereshit"], true);
  const old = hydrateGame({ unlockedChapter: 3 });
  assert.equal(old.ladder.unlockedLevel, 1);
  assert.ok(lessonById("alef-bereshit"));
  assert.deepEqual(hydrateLadder(null).currentLessonId, defaultLadder().currentLessonId);
});

test("lab search carries the Stations lesson id", () => {
  const lab = lessonById("alef-bereshit").lab;
  assert.deepEqual(labSearch(lab, "alef-bereshit").from, "alef-bereshit");
  assert.equal("from" in labSearch(lab), false);
});

test("Alef-bet Drill is the letter quiz, not week vocab", () => {
  assert.equal(isAlefStationLesson("alef-bereshit"), true);
  assert.equal(isAlefStationLesson("alef-ps119"), true);
  assert.equal(isAlefStationLesson("alef-hear"), true);
  assert.equal(isAlefStationLesson("names-who"), false);
  const legacy = hydrateLadder({
    unlockedLevel: 1,
    currentLessonId: "alef-acrostic",
    openedText: { "alef-acrostic": true },
  });
  assert.equal(legacy.currentLessonId, "alef-ps119");
  assert.equal(legacy.openedText["alef-ps119"], true);
});
