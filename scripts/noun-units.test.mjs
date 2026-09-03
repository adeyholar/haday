import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { NOUN_UNITS, NOUN_QUIZ_LEN, NOUN_UNIT_MAX, buildNounQuiz } = await jiti.import("/workspace/src/lib/nouns.ts");

test("six units, Tanakh verses, long quiz pools", () => {
  assert.equal(NOUN_UNITS.length, NOUN_UNIT_MAX);
  assert.equal(NOUN_QUIZ_LEN, 12);
  for (const u of NOUN_UNITS) {
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
    assert.doesNotMatch(u.rule, /בִים|בַ֫יִם|בָה(?!\s)/u);
  }
});

test("a play draws 12 shuffled questions; later units mix review", () => {
  const a = buildNounQuiz(1);
  const b = buildNounQuiz(1);
  assert.equal(a.length, 12);
  assert.equal(b.length, 12);
  for (const q of a) assert.ok(q.choices.includes(q.answer));
  const later = buildNounQuiz(4);
  assert.equal(later.length, 12);
  assert.ok(later.some((q) => q.review), "unit 4 should replay earlier items");
  assert.equal(buildNounQuiz(1).filter((q) => q.review).length, 0);
});

test("special duals and lexical form stay in the teaching", () => {
  const ex = NOUN_UNITS.find((u) => u.id === 4);
  assert.ok(ex);
  assert.match(ex.rule, /שָׁמַיִם/);
  assert.match(ex.rule, /מַיִם/);
  assert.match(ex.rule, /מִצְרַיִם/);
  const read = NOUN_UNITS.find((u) => u.id === 6);
  assert.ok(read);
  const lex = read.quiz.find((q) => q.q.includes("lexical form of בָּנוֹת"));
  assert.ok(lex);
  assert.equal(lex.answer, "בַּת");
});

test("rules keep whole Hebrew words, not shredded niqqud clusters", () => {
  for (const u of NOUN_UNITS) {
    assert.doesNotMatch(u.rule, /[ְֱֲֳִֵֶַָֹֻ]{2,}/);
  }
});

test("dual ending requires the ay diphthong", () => {
  const u2 = NOUN_UNITS.find((u) => u.id === 2);
  assert.ok(u2);
  assert.match(u2.rule, /diphthong/i);
  assert.match(u2.rule, /בַּיִת/);
  assert.match(u2.rule, /required/i);
  const req = u2.quiz.find((q) => /diphthong/i.test(q.q) || /diphthong/i.test(q.answer));
  assert.ok(req, "unit 2 quiz names the diphthong");
  const split = u2.quiz.find((q) => q.q.includes("סוּסַיִם"));
  assert.ok(split);
  assert.equal(split.answer, "סוּ | סַיִם");
  const u3 = NOUN_UNITS.find((u) => u.id === 3);
  assert.ok(u3);
  assert.match(u3.rule, /diphthong/i);
  const u1 = NOUN_UNITS.find((u) => u.id === 1);
  assert.ok(u1);
  assert.match(u1.rule, /diphthong/i);
});
