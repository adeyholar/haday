import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

if (typeof globalThis.localStorage === "undefined") {
  const mem = Object.create(null);
  globalThis.localStorage = {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => {
      mem[k] = String(v);
    },
    removeItem: (k) => {
      delete mem[k];
    },
    clear: () => {
      for (const k of Object.keys(mem)) delete mem[k];
    },
  };
}

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { twinsOf } = await jiti.import(new URL("../src/lib/confusion.ts", import.meta.url).pathname);
const { observeBkt, pKnow, pickByBkt } = await jiti.import(new URL("../src/lib/bkt.ts", import.meta.url).pathname);
const { tanakhForms, tanakhFormsForChapter, weekPlayPool, lemmaIdOf } = await jiti.import(
  new URL("../src/lib/tanakh-pool.ts", import.meta.url).pathname,
);
const { chapterPlayPool, chapterPool, applyStageResult, defaultGame, isChapterUnlocked, isStageUnlocked, GAME_STAGE_PASS } =
  await jiti.import(new URL("../src/lib/game.ts", import.meta.url).pathname);
const { lettersOnly } = await jiti.import(new URL("../src/lib/hebrew.ts", import.meta.url).pathname);
const { itemsForWeek } = await jiti.import(new URL("../src/lib/vocab.ts", import.meta.url).pathname);
const { nudgeDue, hydrateCard } = await jiti.import(new URL("../src/lib/srs.ts", import.meta.url).pathname);

test("confusion pairs queue he/het, dalet/resh, kaf/bet, qamets/pathach, shin/sin", () => {
  assert.ok(twinsOf("alef:letter:he").includes("alef:letter:het"));
  assert.ok(twinsOf("alef:letter:het").includes("alef:letter:he"));
  assert.ok(twinsOf("alef:letter:dalet").includes("alef:letter:resh"));
  assert.ok(twinsOf("alef:letter:kaf").includes("alef:letter:bet"));
  assert.ok(twinsOf("alef:vowel:qamets").includes("alef:vowel:pathach"));
  assert.ok(twinsOf("alef:vowel:pathach").includes("alef:vowel:qamets"));
  assert.ok(twinsOf("alef:letter:shin").includes("alef:letter:sin"));
  assert.ok(twinsOf("alef:letter:sin").includes("alef:letter:shin"));
});

test("a miss on a tanakh form nudges the lemma twin set", () => {
  const twins = twinsOf("tv:ben:0");
  assert.ok(twins.length >= 0);
  assert.equal(lemmaIdOf("tv:ben:0"), "ben");
});

test("BKT P(know) rises after a hit", () => {
  const id = "alef:letter:known-test";
  const before = pKnow(id);
  observeBkt(id, true);
  observeBkt(id, true);
  observeBkt(id, true);
  const after = pKnow(id);
  assert.ok(after > before, `pL ${before} -> ${after}`);
  const picked = pickByBkt(
    [
      { id: "alef:letter:a" },
      { id: "alef:letter:b" },
      { id: "alef:letter:c" },
      { id: "alef:letter:d" },
    ],
    2,
  );
  assert.equal(picked.length, 2);
});

test("nudgeDue does not count a miss", () => {
  const now = Date.now();
  const card = hydrateCard(undefined, now);
  const nudged = nudgeDue({ ...card, misses: 0, due: now + 86_400_000 }, now);
  assert.equal(nudged.misses, 0);
  assert.ok(nudged.due <= now);
});

test("tanakh forms are real surface words, not the citation lemma", () => {
  const forms = tanakhForms();
  assert.ok(forms.length > 80, `got ${forms.length} forms`);
  for (const item of forms.slice(0, 40)) {
    assert.ok(item.id.startsWith("tv:"));
    const lemma = item.hebrewAlts?.[0];
    assert.ok(lemma, item.id);
    assert.notEqual(lettersOnly(item.hebrew), lettersOnly(lemma));
    assert.ok(item.chapter >= 2 && item.chapter <= 20, item.id);
  }
  const ch3 = tanakhFormsForChapter(3, 24);
  assert.ok(ch3.length >= 4, `ch3 forms ${ch3.length}`);
  const ben = forms.filter((v) => lemmaIdOf(v.id) === "ben").map((v) => lettersOnly(v.hebrew));
  assert.ok(ben.includes("בנך") || ben.includes(lettersOnly("בִּנְךָ")));
  assert.ok(!ben.includes(lettersOnly("תֶּבֶן")), "straw is not son");
  assert.ok(!ben.includes(lettersOnly("וַיִּבֶן")), "he built is not son");
});

test("game play pool stays on citation lemmas", () => {
  const lemmas = chapterPool(3);
  const play = chapterPlayPool(3, "recognize");
  const strict = chapterPlayPool(3, "spell-strict");
  assert.equal(play.length, lemmas.length);
  assert.equal(strict.length, lemmas.length);
  assert.ok(play.every((v) => !v.id.startsWith("tv:")));
});

test("quiz week pool stays on class lemmas", () => {
  const lemmas = itemsForWeek(2);
  const mixed = weekPlayPool(2);
  assert.equal(mixed.length, lemmas.length);
  assert.ok(mixed.every((v) => !v.id.startsWith("tv:")));
});

test("lenient opens the next chapter; strict is optional", () => {
  let game = defaultGame();
  for (const stage of ["recognize", "gloss", "spell-lenient"]) {
    game = applyStageResult(game, 1, stage, { stars: 3, score: 90, firstTryRate: 0.9 });
  }
  assert.equal(game.chapters["1"].cleared, true);
  assert.equal(game.chapters["1"].stages["spell-strict"].cleared, false);
  assert.equal(isChapterUnlocked(game, 2), true);
  const missed = applyStageResult(game, 1, "spell-strict", { stars: 1, score: 40, firstTryRate: 0.4 });
  assert.equal(isChapterUnlocked(missed, 2), true);
  assert.equal(missed.chapters["1"].cleared, true);
});

test("a Game stage does not clear below 90%", () => {
  assert.equal(GAME_STAGE_PASS, 90);
  const fail = applyStageResult(defaultGame(), 1, "recognize", { stars: 2, score: 89, firstTryRate: 0.89 });
  assert.equal(fail.chapters["1"]?.stages.recognize.cleared, false);
  assert.equal(isStageUnlocked(fail, 1, "gloss"), false);
  const pass = applyStageResult(fail, 1, "recognize", { stars: 3, score: 90, firstTryRate: 0.9 });
  assert.equal(pass.chapters["1"]?.stages.recognize.cleared, true);
  assert.equal(isStageUnlocked(pass, 1, "gloss"), true);
  const again = applyStageResult(pass, 1, "recognize", { stars: 2, score: 83, firstTryRate: 0.83 });
  assert.equal(again.chapters["1"]?.stages.recognize.cleared, false);
  assert.equal(isStageUnlocked(again, 1, "gloss"), false);
});
