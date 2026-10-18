import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const {
  buildEtchSitting,
  buildEtchFromIds,
  applyDrillReviews,
  choiceLabel,
  contrastChoices,
  tokenFitsLemma,
  verseTapTokens,
  consonantsOf,
  drillProgress,
  drillGate,
  drillCardChoices,
  drillDistance,
  vocabDistance,
  hydrateDrillRuns,
  queueDrillMiss,
  verseForLemma,
  tapCarriesOver,
  etchHint,
  GUESS_MS,
} = await jiti.import(join(root, "src/lib/etch.ts"));
const { hydrateGame } = await jiti.import(join(root, "src/lib/game.ts"));
const { VOCAB, itemsForWeek, glossMatches, liveGloss, studySenseLine } = await jiti.import(join(root, "src/lib/vocab.ts"));
const { applyRating, newCard } = await jiti.import(join(root, "src/lib/srs.ts"));
const { coachLine, guideKeys } = await jiti.import(join(root, "src/lib/show-me.ts"));

const WAYS = [
  "study:he",
  "contrast:he",
  "contrast:en",
  "contrast:audio",
  "produce:audio",
  "produce:he",
  "produce:consonants",
  "produce:spell",
  "say:en",
];

test("every word is asked in every way, and card 2 is a question", () => {
  const pool = VOCAB.filter((v) => v.chapter === 3);
  const sitting = buildEtchSitting(pool, {}, undefined, Date.now(), undefined, 42);
  assert.ok(pool.length > 2);
  assert.equal(sitting[0].kind, "study");
  assert.notEqual(sitting[1].kind, "study");
  for (const item of pool) {
    const mine = sitting.filter((t) => t.item.id === item.id && t.back === 0);
    const got = new Set(mine.map((t) => `${t.kind}:${t.cue}`));
    for (const way of WAYS) assert.ok(got.has(way), `${item.id} ${way}`);
    if (verseForLemma(item)) assert.ok(got.has("verse:he"), `${item.id} verse`);
    else assert.equal(got.has("verse:he"), false);
  }
  assert.match(drillProgress(sitting, 11), /Group/);
});

test("the same seed deals the same cards, and a saved place rebuilds card N", () => {
  const pool = VOCAB.filter((v) => v.chapter === 3);
  const a = buildEtchSitting(pool, {}, undefined, Date.now(), undefined, 42);
  const b = buildEtchSitting(pool, {}, undefined, Date.now(), undefined, 7);
  const ids = a.filter((t) => t.kind === "study").map((t) => t.item.id);
  const again = buildEtchFromIds(pool, ids, 42);
  assert.deepEqual(again.map((t) => t.key), a.map((t) => t.key));
  assert.notEqual(b[2].key, a[2].key);
  const withReview = applyDrillReviews(again, [{ key: again[0].baseKey, at: 4, n: 1 }]);
  assert.equal(withReview[4].back, 1);
  assert.equal(withReview[4].baseKey, again[0].baseKey);
});

test("a drill place survives hydrateGame", () => {
  const place = {
    seed: 42,
    ids: ["av", "ben"],
    index: 3,
    reviews: [{ key: "study:he:av:0", at: 4, n: 1 }],
    hits: 2,
    checks: 4,
    fingerprint: "abc",
  };
  const game = hydrateGame({ drillRuns: { "3:due": place, "nope": { seed: 1 } } });
  assert.deepEqual(game.drillRuns["3:due"], place);
  assert.equal(game.drillRuns.nope, undefined);
  assert.equal(hydrateDrillRuns(null)["3:due"], undefined);
});

test("the study card shows the English only after Show meaning", () => {
  const src = readFileSync(join(root, "src/components/etch-play.tsx"), "utf8");
  assert.match(src, /typed\.trim\(\) \? "Check" : "Show meaning"/);
  assert.match(src, /Type a guess, or show the meaning/);
  assert.match(src, /I knew it/);
  assert.match(src, /Not yet/);
  assert.match(src, /Not quite/);
  assert.match(src, /study && revealed/);
  assert.match(src, /Hear the line/);
  assert.match(src, /Check the typed word/);
});

test("a Hebrew answer is walked, not printed", () => {
  const src = readFileSync(join(root, "src/components/etch-play.tsx"), "utf8");
  const start = { clean: true, started: false, next: "ב" };
  assert.equal(coachLine(start, 0), "What does it start with?");
  assert.equal(coachLine(start, 1), "Bet");
  assert.equal(coachLine({ clean: true, started: true, next: "\u05B7" }, 0), "Which point under it?");
  assert.equal(coachLine({ clean: false, started: true, next: null }, 0), "Backspace to the last right piece.");
  const keys = guideKeys("ב", 0);
  assert.equal(keys.length, 3);
  assert.ok(keys.includes("ב"));
  assert.deepEqual(guideKeys("ב", 1), ["ב"]);
  assert.match(src, /Show me/);
  assert.match(src, /guideKeys/);
  assert.match(src, /You built it/);
  assert.match(src, /It comes back once, with no help/);
  assert.match(src, /!guidedKind && \(/);
  assert.match(src, /showMeOnce/);
  assert.equal(etchHint("produce", "spell").includes("Show me"), false);
  assert.equal(etchHint("contrast", "en").includes("Show me"), false);
  assert.equal(etchHint("verse", "he").includes("Show me"), false);
  assert.match(etchHint("produce", "spell", true), /does not print the word/);
  assert.match(etchHint("contrast", "en", true), /does not print the word/);
  assert.match(etchHint("verse", "he", true), /does not print the word/);
  assert.equal(etchHint("contrast", "he", true).includes("Show me"), false);
  assert.match(readFileSync(join(root, "src/components/drill-sitting.tsx"), "utf8"), /answerIsHebrew/);
  assert.match(readFileSync(join(root, "src/components/game-stage.tsx"), "utf8"), /coachLine\(progress, guideDepth\)/);
});

test("a second miss rebuilds in the order it happened", () => {
  const pool = VOCAB.filter((v) => v.chapter === 3);
  const base = buildEtchSitting(pool, {}, undefined, Date.now(), undefined, 42);
  let tasks = base.map((task) => ({ ...task, choices: task.choices.slice() }));
  const reviews = [];
  const first = queueDrillMiss(tasks, 0, tasks[0]);
  tasks = first.tasks;
  reviews.push(first.review);
  const backAt = first.review.at;
  const second = queueDrillMiss(tasks, backAt, tasks[backAt]);
  tasks = second.tasks;
  reviews.push(second.review);
  const mid = backAt + 1;
  const third = queueDrillMiss(tasks, mid, tasks[mid]);
  assert.ok(third.review);
  tasks = third.tasks;
  reviews.push(third.review);
  assert.ok(third.review.at < second.review.at);
  const rebuilt = applyDrillReviews(base, reviews);
  assert.deepEqual(
    rebuilt.map((task) => task.key),
    tasks.map((task) => task.key),
  );
});

test("week 15 deals in under half a second, and a card still has choices", () => {
  const pool = itemsForWeek(15);
  const started = Date.now();
  const sitting = buildEtchSitting(pool, {}, undefined, Date.now(), undefined, 42);
  const ms = Date.now() - started;
  assert.ok(sitting.length > 1000);
  assert.ok(ms < 500, `deal took ${ms} ms`);
  const choices = drillCardChoices(sitting[0], pool, 42);
  assert.ok(choices.some((item) => item.id === sitting[0].item.id));
  assert.ok(choices.length > 1);
});

test("a miss rebuilds to the same cards, and a finished or changed place does not continue", () => {
  const pool = VOCAB.filter((v) => v.chapter === 3);
  const sitting = buildEtchSitting(pool, {}, undefined, Date.now(), undefined, 42);
  const first = queueDrillMiss(sitting, 0, sitting[0]);
  assert.equal(first.review?.n, 1);
  assert.equal(first.tasks[first.review.at].back, 1);
  const backAt = first.review.at;
  const second = queueDrillMiss(first.tasks, backAt, first.tasks[backAt]);
  assert.equal(second.review?.n, 2);
  const rebuilt = applyDrillReviews(sitting, [first.review, second.review]);
  assert.deepEqual(
    rebuilt.map((task) => task.key),
    second.tasks.map((task) => task.key),
  );
  const third = queueDrillMiss(second.tasks, second.review.at, second.tasks[second.review.at]);
  assert.equal(third.review, null);

  const place = {
    seed: 42,
    ids: sitting.filter((task) => task.kind === "study").map((task) => task.item.id),
    index: 4,
    reviews: [],
    hits: 1,
    checks: 2,
    fingerprint: "abc",
  };
  assert.equal(drillGate(place, "other", sitting.length), "changed");
  assert.equal(drillGate(place, "abc", sitting.length), "resume");
  assert.equal(drillGate({ ...place, index: sitting.length }, "abc", sitting.length), "fresh");
  assert.equal(drillGate(undefined, "abc", sitting.length), "fresh");
  const page = readFileSync(join(root, "src/components/drill-sitting.tsx"), "utf8");
  assert.match(page, /persist\(null\)/);
  assert.match(page, /This week's list changed/);
  assert.match(page, /Start over/);
  assert.match(readFileSync(join(root, "src/routes/drill.tsx"), "utf8"), /DrillSitting/);
});

test("hebrew-to-english choices stay distinct, and the meaning stays hidden", () => {
  const shamar = VOCAB.find((item) => item.id === "shamar");
  const natsar = VOCAB.find((item) => item.id === "natsar");
  const shaqad = VOCAB.find((item) => item.id === "shaqad");
  const shamad = VOCAB.find((item) => item.id === "shamad");
  assert.ok(shamar && natsar && shaqad && shamad);
  const board = [shamar, natsar, shaqad, shamad];
  const labels = board.map((item) => choiceLabel(item, board));
  assert.equal(new Set(labels).size, board.length);
  assert.equal(choiceLabel(shamar, [shamar]), "to watch");
  const src = readFileSync(join(root, "src/components/etch-play.tsx"), "utf8");
  assert.match(src, /answerIsEnglish/);
  assert.match(src, /choiceLabel/);
});

test("contrast board never seats the answer first and includes the lemma", () => {
  const pool = VOCAB.filter((v) => v.chapter <= 5);
  const em = pool.find((v) => v.id === "em");
  assert.ok(em);
  for (let i = 0; i < 20; i++) {
    const set = contrastChoices(em, pool);
    assert.ok(set.some((x) => x.id === "em"));
    if (set.length > 1) assert.notEqual(set[0].id, "em");
  }
});

test("verse tap tokens match the hit", () => {
  const toks = verseTapTokens("בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ");
  assert.ok(toks.length > 4);
  const erets = VOCAB.find((v) => v.id === "erets");
  assert.ok(erets);
  assert.equal(tokenFitsLemma("הָאָרֶץ", erets, "הָאָרֶץ"), true);
  assert.equal(tokenFitsLemma("בָּרָא", erets, "הָאָרֶץ"), false);
});

test("consonants drop vowel points and keep the shin dot", () => {
  const week = itemsForWeek(8);
  assert.ok(week.length >= 30);
  for (const item of week) {
    assert.match(item.hebrew, /[\u05B0-\u05BB\u05C7]/, `${item.id} is stored with vowel points`);
  }
  const shamar = VOCAB.find((item) => item.id === "shamar");
  assert.ok(shamar);
  const bare = consonantsOf(shamar);
  assert.match(bare, /\u05C1/);
  assert.equal(/[\u05B0-\u05BB\u05C7]/.test(bare), false);
  assert.equal(glossMatches(shamar, "to watch"), true);
  assert.equal(glossMatches(shamar, "to watch, guard"), true);
  assert.equal(glossMatches(shamar, "watch"), true);
  assert.equal(glossMatches(shamar, "to destroy"), false);
  assert.equal(liveGloss(shamar, "to wa"), "prefix");
  assert.equal(liveGloss(shamar, "banana"), "off");
  const halak = VOCAB.find((item) => item.id === "halak");
  assert.ok(halak);
  assert.equal(glossMatches(halak, "to walk"), true);
  assert.equal(glossMatches(halak, "walk"), true);
  assert.equal(glossMatches(halak, "to go"), true);
  assert.equal(liveGloss(halak, "to wal"), "prefix");
  assert.equal(studySenseLine(halak), "to go, walk · behave · lead · bring");
  const barak = VOCAB.find((item) => item.id === "barak");
  const al = VOCAB.find((item) => item.id === "al-neg");
  const now = VOCAB.find((item) => item.id === "attah-now");
  assert.match(halak?.stems ?? "", /\(Hi\) lead/);
  assert.match(barak?.stems ?? "", /\(Pu\) be blessed/);
  assert.match(barak?.stems ?? "", /\(Hith\)/);
  assert.equal(al?.gloss, "do not (command)");
  assert.match(al?.stems ?? "", /jussive/);
  assert.equal(glossMatches(al, "do not"), true);
  assert.equal(glossMatches(al, "not"), false);
  assert.equal(glossMatches(al, "no"), false);
  const lo = VOCAB.find((item) => item.id === "lo");
  assert.equal(lo?.gloss, "not (statement)");
  assert.equal(glossMatches(lo, "not"), true);
  assert.equal(glossMatches(lo, "no, not"), true);
  assert.equal(glossMatches(lo, "do not"), false);
  assert.equal(now?.hebrew.includes("\u05BC"), false);
  for (const item of week) {
    if (item.pos === "verb") assert.ok(item.stems, `${item.id} has its stems`);
  }
  for (const item of VOCAB) {
    const first = item.gloss.split(/[,;]/)[0]?.trim();
    assert.equal(glossMatches(item, first), true, `${item.id}: ${first}`);
  }
});

test("a second miss waits a day, not ten minutes", () => {
  const now = Date.now();
  const first = applyRating(newCard(now), "again", now);
  assert.ok(first.due - now < 15 * 60_000);
  const second = applyRating(first, "again", now);
  assert.ok(second.due - now >= 20 * 60 * 60_000);
});

test("a drill shows the sitting left and the week's words left", () => {
  assert.deepEqual(drillDistance(0, 40), { done: 0, total: 40, left: 40, pct: 0 });
  assert.deepEqual(drillDistance(10, 40), { done: 10, total: 40, left: 30, pct: 25 });
  assert.deepEqual(drillDistance(40, 40), { done: 40, total: 40, left: 0, pct: 100 });
  assert.deepEqual(vocabDistance(12, 4, 34), { met: 12, mastered: 4, total: 34, left: 30, pct: 12 });
  assert.deepEqual(vocabDistance(40, 40, 34), { met: 34, mastered: 34, total: 34, left: 0, pct: 100 });
  const play = readFileSync(join(root, "src/components/drill-sitting.tsx"), "utf8");
  assert.match(play, /This drill/);
  assert.match(play, /These words/);
});

test("a tap that leaves with the last card does not grade the next one", () => {
  const shown = 1_000;
  assert.equal(tapCarriesOver(shown, shown + GUESS_MS - 1), true);
  assert.equal(tapCarriesOver(shown, shown + GUESS_MS), false);
  const play = readFileSync(join(root, "src/components/etch-play.tsx"), "utf8");
  assert.match(play, /if \(boardKey\.current !== task\.key\)/);
  assert.match(play, /setPicked\(null\)/);
  assert.match(play, /carryOver\(\)/);
  assert.match(play, /listenGen/);
  const sitting = readFileSync(join(root, "src/components/drill-sitting.tsx"), "utf8");
  assert.match(sitting, /key=\{task\.key\}/);
});
