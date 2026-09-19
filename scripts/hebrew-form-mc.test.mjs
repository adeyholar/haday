import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { hebrewFormChoices, hardTraps } = await jiti.import("/workspace/src/lib/hebrew-form-mc.ts");
const { GAME_WORDS } = await jiti.import("/workspace/src/lib/hebrew-typing/bank.ts");
const { CONSONANTS } = await jiti.import("/workspace/src/lib/alphabet.ts");

test("choose offers four Hebrew forms including the correct one", () => {
  const pool = GAME_WORDS.map((w) => w.hebrew);
  const correct = pool[0];
  const choices = hebrewFormChoices(correct, pool, "choose");
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices).size, 4);
  assert.ok(choices.includes(correct));
});

test("hard traps swap lookalikes, finals, or nikkud", () => {
  const bet = hardTraps("ב");
  assert.ok(bet.includes("כ") || bet.includes("פ"));
  const dalet = hardTraps("ד");
  assert.ok(dalet.includes("ר"));
  const kaf = hardTraps("כ");
  assert.ok(kaf.includes("ך") || kaf.includes("ב") || kaf.includes("פ"));
  const pointed = hardTraps("מֶלֶךְ");
  assert.ok(pointed.length >= 1);
  const letters = CONSONANTS.map((c) => c.letter);
  const hard = hebrewFormChoices("ב", letters, "hard");
  assert.equal(hard.length, 4);
  assert.ok(hard.includes("ב"));
});
