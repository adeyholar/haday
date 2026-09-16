import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { CONSONANTS } = await jiti.import("/workspace/src/lib/alphabet.ts");
const {
  BERESHIT_WORD,
  alefBetWalk,
  bereshitSteps,
  letterIdForGlyph,
  splitConsonantGlyphs,
} = await jiti.import("/workspace/src/lib/alef-notice.ts");
const { LESSONS, lessonById, lessonsFor } = await jiti.import("/workspace/src/lib/ladder.ts");
const { isBookId } = await jiti.import("/workspace/src/lib/tanakh-canon.ts");
const { PSALM_119_STANZAS, acrosticLetters } = await jiti.import("/workspace/src/lib/psalm-119-acrostic.ts");
const { letterNameSrc, LETTER_SAY_EN } = await jiti.import("/workspace/src/lib/letter-clips.ts");

test("Genesis 1:1 first word splits into six letters ending in tav", () => {
  const parts = splitConsonantGlyphs(BERESHIT_WORD);
  assert.equal(parts.length, 6);
  assert.equal(parts[0].cons, "ב");
  assert.equal(parts.at(-1).cons, "ת");
  assert.deepEqual(
    parts.map((p) => p.cons),
    ["ב", "ר", "א", "ש", "י", "ת"],
  );
  const steps = bereshitSteps();
  assert.deepEqual(
    steps.map((s) => s.letterId),
    ["bet", "resh", "alef", "shin", "yod", "tav"],
  );
  assert.equal(letterIdForGlyph("ש", parts[3].glyph), "shin");
});

test("alef-bet walk is א to ת from CONSONANTS", () => {
  const walk = alefBetWalk();
  assert.equal(walk.length, CONSONANTS.length);
  assert.equal(walk[0].letter, "א");
  assert.equal(walk.at(-1).letter, "ת");
  assert.equal(walk[0].id, "alef");
  assert.equal(walk.at(-1).id, "tav");
});

test("Psalm 119 acrostic is 22 stanzas on book id Ps, not lesson 1", () => {
  assert.equal(isBookId("Ps"), true);
  const alef = lessonsFor("alef");
  assert.deepEqual(
    alef.map((l) => l.id),
    ["alef-bereshit", "alef-ps119", "alef-hear"],
  );
  assert.equal(alef[0].order, 1);
  const lesson = lessonById("alef-ps119");
  assert.equal(lesson.order, 2);
  assert.equal(lessonById("alef-acrostic").id, "alef-ps119");
  assert.equal(lesson.order, 2);
  assert.equal(lesson.lab.book, "Ps");
  assert.equal(lesson.lab.ch, 119);
  assert.equal(PSALM_119_STANZAS.length, 22);
  assert.equal(PSALM_119_STANZAS[0].letter, "א");
  assert.equal(PSALM_119_STANZAS[0].v1, 1);
  assert.equal(PSALM_119_STANZAS.at(-1).letter, "ת");
  assert.equal(PSALM_119_STANZAS.at(-1).v2, 176);
  assert.equal(PSALM_119_STANZAS.every((s, i) => s.v1 === i * 8 + 1 && s.v2 === i * 8 + 8), true);
  const letters = acrosticLetters();
  assert.equal(letters.length, 22);
  assert.equal(letters.some((l) => l.id === "sin"), false);
  assert.match(PSALM_119_STANZAS.find((s) => s.letterId === "shin").head, /שׂ/);
  assert.equal(
    LESSONS.filter((l) => l.id === "alef-ps119").length,
    1,
  );
});

test("letter name clips exist for shin and sin, not English shi-n", () => {
  assert.equal(letterNameSrc("shin"), "/audio/letters/shin.mp3");
  assert.equal(letterNameSrc("sin"), "/audio/letters/sin.mp3");
  assert.equal(letterNameSrc("alef"), "/audio/letters/alef.mp3");
  assert.equal(LETTER_SAY_EN.shin, "sheen");
  assert.equal(LETTER_SAY_EN.sin, "seen");
  assert.equal(LETTER_SAY_EN.tav, "tahv");
  assert.notEqual(LETTER_SAY_EN.shin, "shin");
});
