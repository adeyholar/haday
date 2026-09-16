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
