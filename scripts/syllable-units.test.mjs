import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { SYLLABLE_UNITS, SYLLABLE_QUIZ_LEN, shuffleQuiz } = await jiti.import("/workspace/src/lib/syllables.ts");

test("eight units, each with Tanakh verses and a long quiz pool", () => {
  assert.equal(SYLLABLE_UNITS.length, 8);
  assert.equal(SYLLABLE_QUIZ_LEN, 12);
  for (const u of SYLLABLE_UNITS) {
    assert.ok(u.verses.length >= 3, `unit ${u.id} verses`);
    assert.ok(u.samples.length >= 4, `unit ${u.id} samples`);
    assert.ok(u.quiz.length >= 14, `unit ${u.id} quiz pool ${u.quiz.length}`);
    for (const v of u.verses) {
      assert.ok(v.he.includes(v.hit), `unit ${u.id} ${v.ref} missing hit ${v.hit}`);
    }
    for (const q of u.quiz) {
      assert.ok(q.choices.includes(q.answer), `unit ${u.id} ${q.q}`);
      assert.equal(new Set(q.choices).size, q.choices.length, `dup choices: ${q.q}`);
    }
  }
});

test("a play draws 12 shuffled questions, not the whole pool in order", () => {
  const unit = SYLLABLE_UNITS[0];
  const a = shuffleQuiz(unit);
  const b = shuffleQuiz(unit);
  assert.equal(a.length, 12);
  assert.equal(b.length, 12);
  for (const q of a) assert.ok(q.choices.includes(q.answer));
});

test("wayyar splits through doubled yod; quiescent alef stays in the second slice", () => {
  const unit = SYLLABLE_UNITS.find((u) => u.id === 6);
  assert.ok(unit);
  const sample = unit.samples.find((s) => s.word === "וַיַּרְא");
  assert.equal(sample.split, "וַיְ | יַרְא");
  assert.notEqual(sample.split, "וַיַּרְ | א");
  const q = unit.quiz.find((item) => item.q === "How does וַיַּרְא split?");
  assert.ok(q);
  assert.equal(q.answer, "וַיְ | יַרְא");
});

test("diphthong rule names whole words, not shredded niqqud", () => {
  const unit = SYLLABLE_UNITS.find((u) => u.id === 7);
  assert.ok(unit);
  assert.match(unit.rule, /בַּיִת/);
  assert.match(unit.rule, /מָוֶת/);
  assert.doesNotMatch(unit.rule, /ַ֫יִ/);
  assert.match(unit.rule, /dual/i);
  const hands = unit.samples.find((s) => s.word === "יָדַיִם");
  assert.ok(hands);
  assert.equal(hands.split, "יָ | דַיִם");
  const q = unit.quiz.find((item) => item.q === "How does יָדַיִם split?");
  assert.ok(q);
  assert.equal(q.answer, "יָ | דַיִם");
});
