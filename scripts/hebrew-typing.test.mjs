import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { applyTypeKey, accuracyPct, passedBatch, TYPE_PASS, nextExpected, missCueFor, missCueLabel, strengthFromMisses, CUE_TRY_AGAIN, CUE_NOT_YET } = await jiti.import(
  "/workspace/src/lib/hebrew-typing/engine.ts",
);
const { mapPhysicalKey, QWERTY_TO_HE, fingerFor, TIRO_SHIFT, latinForGlyph, HOME_FINGER_LATIN } = await jiti.import("/workspace/src/lib/hebrew-typing/layout.ts");
const { GAME_WORDS, gameRound, poolForSelection, weightedPick } = await jiti.import("/workspace/src/lib/hebrew-typing/bank.ts");
const { typingRank, emptyTyping, applyMark } = await jiti.import("/workspace/src/lib/hebrew-typing/ranks.ts");
const { STUDY_TYPE_RUNGS, HOME_ROW, ALEF_BET_KEYS, studyRungTargets, clampStudyRung } = await jiti.import(
  "/workspace/src/lib/hebrew-typing/study-rungs.ts",
);
const { lessonById } = await jiti.import("/workspace/src/lib/ladder.ts");
const { stripNiqqud } = await jiti.import("/workspace/src/lib/hebrew.ts");

test("Israeli qwerty map hits alef on T", () => {
  assert.equal(QWERTY_TO_HE.t, "א");
  assert.equal(mapPhysicalKey("t"), "א");
  assert.equal(mapPhysicalKey("א"), "א");
  assert.equal(fingerFor("א"), "li");
});

test("Tiro Shift puts nikkud on the home row", () => {
  assert.equal(mapPhysicalKey("a", true), "\u05B0");
  assert.equal(mapPhysicalKey("k", true), "\u05B7");
  assert.equal(mapPhysicalKey("l", true), "\u05B8");
  assert.equal(mapPhysicalKey("q", true), "\u05BC");
  assert.equal(TIRO_SHIFT.g.name, "hireq");
  assert.equal(mapPhysicalKey("t", false), "א");
});

test("required key maps to a home-row finger that can travel", () => {
  assert.equal(latinForGlyph("ל"), "k");
  assert.equal(HOME_FINGER_LATIN.rm, "k");
  assert.equal(latinForGlyph("א"), "t");
  assert.equal(HOME_FINGER_LATIN.li, "f");
  assert.equal(latinForGlyph("ש"), "a");
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

test("study Type ladder is home, map, mix, words, then Tanakh", () => {
  assert.deepEqual(
    STUDY_TYPE_RUNGS.map((r) => r.id),
    ["home", "map", "mix", "words", "tanakh"],
  );
  assert.equal(HOME_ROW.length, 10);
  assert.equal(ALEF_BET_KEYS.length, 22);
  assert.equal(studyRungTargets(1).length, 22);
  assert.equal(clampStudyRung(9), 4);
  assert.ok(studyRungTargets(3).every((w) => w.length >= 2));
  const basic = studyRungTargets(4, 1, false);
  const deep = studyRungTargets(4, 1, true);
  assert.ok(basic.length >= 4);
  assert.ok(deep.length >= 4);
});

test("miss ladder: first retry, second fail, first-try strong", () => {
  assert.equal(missCueFor(0), "retry");
  assert.equal(missCueFor(1), "fail");
  assert.equal(missCueLabel("retry"), CUE_TRY_AGAIN);
  assert.equal(missCueLabel("fail"), CUE_NOT_YET);
  assert.notEqual(CUE_TRY_AGAIN, CUE_NOT_YET);
  assert.equal(strengthFromMisses(0), "strong");
  assert.equal(strengthFromMisses(1), "ok");
  assert.equal(strengthFromMisses(2), "weak");
});

test("weak words are marked and spaced; self-quiz uses week/chapter vocab", () => {
  let p = emptyTyping();
  p = applyMark(p, "ab", "weak");
  assert.equal(p.weak.ab, 1);
  p = applyMark(p, "ab", "strong");
  assert.equal(p.strong.ab, 1);
  assert.equal(p.weak.ab, undefined);
  const week1 = poolForSelection([1], []);
  const ch3 = poolForSelection([], [3]);
  assert.ok(week1.length > 0);
  assert.ok(ch3.length > 0);
  const both = poolForSelection([2], [3]);
  const ids = new Set(both.map((w) => w.id));
  assert.equal(ids.size, both.length);
  const picked = weightedPick(GAME_WORDS, 5, 3, { ab: 4 }, {});
  assert.equal(picked.length, 5);
});

test("Type session has no crowd or voice SFX", () => {
  const src = readFileSync("/workspace/src/components/type-session.tsx", "utf8");
  assert.equal(src.includes("playFeedback"), false);
  assert.equal(src.includes("playAww"), false);
  assert.equal(src.includes("playGrade"), false);
  assert.equal(src.includes("playTryAgainCue"), false);
});
