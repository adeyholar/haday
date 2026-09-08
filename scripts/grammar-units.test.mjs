import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { GRAMMAR_TRACKS } = await jiti.import("/workspace/src/lib/grammar-tracks.ts");
const { GRAMMAR_QUIZ_LEN, buildGrammarQuiz, grammarQuizPool, isGrammarTrackId } = await jiti.import(
  "/workspace/src/lib/grammar.ts",
);
const { VOCAB } = await jiti.import("/workspace/src/lib/vocab.ts");
const { applyGrammarResult, defaultGame, GAME_STAGE_PASS, isGrammarUnitUnlocked } = await jiti.import(
  "/workspace/src/lib/game.ts",
);

const VOCAB_IDS = new Set(VOCAB.map((v) => v.id));

test("six grammar tracks, four units, Tanakh verses, class vocab ids", () => {
  assert.equal(GRAMMAR_TRACKS.length, 6);
  assert.equal(GRAMMAR_QUIZ_LEN, 12);
  assert.deepEqual(
    GRAMMAR_TRACKS.map((t) => t.chapter),
    [6, 7, 8, 9, 10, 11],
  );
  for (const t of GRAMMAR_TRACKS) {
    assert.ok(isGrammarTrackId(t.id), t.id);
    assert.equal(t.units.length, 4, `${t.id} units`);
    for (const u of t.units) {
      assert.ok(u.verses.length >= 3, `${t.id} ${u.id} verses`);
      assert.ok(u.samples.length >= 3, `${t.id} ${u.id} samples`);
      assert.ok(u.rule.length > 80, `${t.id} ${u.id} rule`);
      assert.doesNotMatch(u.rule, /Gesenius|Davidson/i);
      for (const v of u.verses) {
        assert.ok(v.he.includes(v.hit), `${t.id} ${u.id} ${v.ref} missing hit ${v.hit}`);
        if (v.vocabId) {
          assert.ok(VOCAB_IDS.has(v.vocabId), `${t.id} ${u.id} ${v.ref} unknown vocabId ${v.vocabId}`);
          const item = VOCAB.find((x) => x.id === v.vocabId);
          assert.ok(item.chapter <= 11, `${t.id} ${u.id} ${v.vocabId} is ch ${item.chapter}, not class 1–11`);
        }
      }
      const pool = grammarQuizPool(t, u);
      assert.ok(pool.length >= 12, `${t.id} ${u.id} quiz pool ${pool.length}`);
      for (const q of pool) {
        assert.ok(q.choices.includes(q.answer), `${t.id} ${u.id} ${q.q}`);
        assert.equal(new Set(q.choices).size, q.choices.length, `dup choices: ${q.q}`);
        assert.doesNotMatch(q.q + q.why + q.answer, /Gesenius|Davidson/i);
      }
    }
  }
});

test("a play draws 12 shuffled questions; later units mix review", () => {
  for (const t of GRAMMAR_TRACKS) {
    const a = buildGrammarQuiz(t, 1);
    assert.equal(a.length, 12, `${t.id} unit 1`);
    for (const q of a) assert.ok(q.choices.includes(q.answer));
    assert.equal(a.filter((q) => q.review).length, 0);
    const later = buildGrammarQuiz(t, 4);
    assert.equal(later.length, 12, `${t.id} unit 4`);
    assert.ok(later.some((q) => q.review), `${t.id} unit 4 should replay earlier items`);
  }
});

test("90% unlocks the next grammar unit; a miss does not", () => {
  let g = defaultGame();
  assert.equal(isGrammarUnitUnlocked(g, "prep", 1), true);
  assert.equal(isGrammarUnitUnlocked(g, "prep", 2), false);
  g = applyGrammarResult(g, "prep", 1, { stars: 3, score: GAME_STAGE_PASS, firstTryRate: 1 });
  assert.equal(isGrammarUnitUnlocked(g, "prep", 2), true);
  assert.equal(g.lessons.prep.units["1"].cleared, true);
  g = applyGrammarResult(g, "prep", 2, { stars: 1, score: 80, firstTryRate: 0.5 });
  assert.equal(isGrammarUnitUnlocked(g, "prep", 3), false);
  assert.equal(g.lessons.adj.unlockedUnit, 1);
});

test("prepositions teach inseparable fusion and min; numbers distinguish cardinal and ordinal", () => {
  const prep = GRAMMAR_TRACKS.find((t) => t.id === "prep");
  const u2 = prep.units.find((u) => u.id === 2);
  assert.match(u2.rule, /בְּ/);
  assert.match(u2.rule, /הַמֶּלֶךְ/);
  const u3 = prep.units.find((u) => u.id === 3);
  assert.match(u3.rule, /assimilat/i);
  const numbers = GRAMMAR_TRACKS.find((t) => t.id === "numbers");
  const n4 = numbers.units.find((u) => u.id === 4);
  assert.match(n4.rule, /רִאשׁוֹן/);
  assert.ok(n4.verses.some((v) => v.vocabId === "shebii"));
  const n2 = numbers.units.find((u) => u.id === 2);
  assert.ok(n2.verses.every((v) => v.vocabId !== "sheba" || !v.hit.includes("שַׁבָּת")));
});
