import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const {
  ARTICLE_UNITS,
  ARTICLE_QUIZ_LEN,
  ARTICLE_UNIT_MAX,
  buildArticleQuiz,
  articleQuizPool,
} = await jiti.import("/workspace/src/lib/article.ts");
const { COURSE_WEEKS, GAME_CHAPTER_TITLES, weekForChapter, itemsForWeek } = await jiti.import(
  "/workspace/src/lib/vocab.ts",
);

test("six article units, Tanakh verses, long quiz pools", () => {
  assert.equal(ARTICLE_UNITS.length, ARTICLE_UNIT_MAX);
  assert.equal(ARTICLE_QUIZ_LEN, 12);
  for (const u of ARTICLE_UNITS) {
    assert.ok(u.verses.length >= 3, `unit ${u.id} verses`);
    assert.ok(u.samples.length >= 4, `unit ${u.id} samples`);
    for (const v of u.verses) {
      assert.ok(v.he.includes(v.hit), `unit ${u.id} ${v.ref} missing hit ${v.hit}`);
    }
    const pool = articleQuizPool(u);
    assert.ok(pool.length >= 24, `unit ${u.id} quiz pool ${pool.length}`);
    for (const q of pool) {
      assert.ok(q.choices.includes(q.answer), `unit ${u.id} ${q.q}`);
      assert.equal(new Set(q.choices).size, q.choices.length, `dup choices: ${q.q}`);
    }
  }
});

test("a play draws 12 shuffled questions; later units mix review", () => {
  const a = buildArticleQuiz(1);
  assert.equal(a.length, 12);
  for (const q of a) assert.ok(q.choices.includes(q.answer));
  const later = buildArticleQuiz(5);
  assert.equal(later.length, 12);
  assert.ok(later.some((q) => q.review), "unit 5 should replay earlier items");
  assert.equal(buildArticleQuiz(1).filter((q) => q.review).length, 0);
});

test("article spelling: compensatory vs virtual vs seghol", () => {
  const u3 = ARTICLE_UNITS.find((u) => u.id === 3);
  assert.ok(u3);
  assert.match(u3.rule, /compensatory/i);
  assert.match(u3.rule, /virtual/i);
  assert.match(u3.rule, /הֶ/);
  const words = u3.samples.map((s) => s.word);
  assert.ok(words.includes("הָאִישׁ"));
  assert.ok(words.includes("הַחֶרֶב"));
  assert.ok(words.includes("הֶעָנָן"));
  assert.ok("הָאִישׁ".includes("הָ"));
  assert.ok("הַחֶרֶב".includes("הַ"));
  assert.ok("הֶעָנָן".includes("הֶ"));
});

test("bump vav and special elohim stay in the teaching", () => {
  const u5 = ARTICLE_UNITS.find((u) => u.id === 5);
  assert.ok(u5);
  assert.match(u5.rule, /bump/i);
  assert.match(u5.rule, /וֵאלֹהִים/);
  assert.match(u5.rule, /וִיהוּדָה/);
  const bump = u5.quiz.find((q) => q.he === "וּמֶלֶךְ");
  assert.ok(bump);
  assert.match(bump.answer, /bump|Mem/i);
  const el = u5.quiz.find((q) => q.he === "וֵאלֹהִים");
  assert.ok(el);
  assert.equal(el.answer, "וֵאלֹהִים — tsere, hateph dropped");
});

test("week 3 covers chapters 4 and 5; games stay chapter-titled", () => {
  const w3 = COURSE_WEEKS.find((w) => w.week === 3);
  assert.ok(w3);
  assert.deepEqual([...w3.chapters], [4, 5]);
  assert.equal(weekForChapter(4), 3);
  assert.equal(weekForChapter(5), 3);
  const items = itemsForWeek(3);
  assert.ok(items.some((v) => v.id === "torah"));
  assert.ok(items.some((v) => v.id === "ha"));
  assert.ok(items.some((v) => v.id === "we"));
  assert.ok(items.some((v) => v.id === "yam" && v.hebrew === "יָם"));
  assert.equal(GAME_CHAPTER_TITLES[5], "Article & vav");
});

test("citation lemmas are not prefixed in the class vocab check", () => {
  const u2 = ARTICLE_UNITS.find((u) => u.id === 2);
  assert.ok(u2);
  const lex = u2.quiz.find((q) => q.q.includes("lexical form of הַיָּם"));
  assert.ok(lex);
  assert.equal(lex.answer, "יָם");
});

test("rules keep whole Hebrew words, not shredded niqqud clusters", () => {
  for (const u of ARTICLE_UNITS) {
    assert.doesNotMatch(u.rule, /[ְֱֲֳִֵֶַָֹֻ]{2,}/);
  }
});

test("83% does not open the next article unit; 90% does", async () => {
  const { applyArticleResult, applyNounResult, applySyllableResult, applyAlefBetResult, defaultGame, GAME_STAGE_PASS } =
    await jiti.import("/workspace/src/lib/game.ts");
  assert.equal(GAME_STAGE_PASS, 90);
  const miss = { stars: 2, score: 83, firstTryRate: 0.83 };
  const hit = { stars: 3, score: 90, firstTryRate: 0.9 };
  const afterMiss = applyArticleResult(defaultGame(), 1, miss);
  assert.equal(afterMiss.article.unlockedUnit, 1);
  assert.equal(afterMiss.article.units["1"].cleared, false);
  const afterHit = applyArticleResult(defaultGame(), 1, hit);
  assert.equal(afterHit.article.unlockedUnit, 2);
  assert.equal(afterHit.article.units["1"].cleared, true);
  assert.equal(applyNounResult(defaultGame(), 1, miss).nouns.unlockedUnit, 1);
  assert.equal(applyNounResult(defaultGame(), 1, hit).nouns.unlockedUnit, 2);
  assert.equal(applySyllableResult(defaultGame(), 1, miss).syllables.unlockedUnit, 1);
  assert.equal(applySyllableResult(defaultGame(), 1, hit).syllables.unlockedUnit, 2);
  assert.equal(applyAlefBetResult(defaultGame(), 1, miss).alefBet.unlockedLevel, 1);
  assert.equal(applyAlefBetResult(defaultGame(), 1, hit).alefBet.unlockedLevel, 2);
});
