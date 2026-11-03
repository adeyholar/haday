import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { iibsWeekItems, iibsWordId, firstRepairTarget } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { keepStudyCards } = await jiti.import(join(root, "src/lib/card-ids.ts"));
const { hydrateIibsDrillRuns, drillFingerprint } = await jiti.import(join(root, "src/lib/etch.ts"));
const { E_SLOT_FREEZE, E_REPAIR_SLOTS, E_PRIOR_IDS } = await jiti.import(join(root, "src/lib/iibs-e-freeze.ts"));
const { applyIibsLesson, levelCleared, levelUnlocked } = await jiti.import(join(root, "src/lib/iibs-game.ts"));
const { defaultGame } = await jiti.import(join(root, "src/lib/game.ts"));
const { vocabLessons } = await jiti.import(join(root, "src/lib/iibs-vocab.ts"));

function cleanGloss(gloss) {
  return gloss.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").replace(/\s+([,;])/g, "$1").trim();
}

function levelE() {
  const words = [];
  for (let week = 1; week <= 30; week += 1) words.push(...iibsWeekItems("E", week));
  return words;
}

const birdSlot = "iibs-e-01-04";
const wagonSlot = "iibs-e-04-05";
const birdFrom = E_SLOT_FREEZE.find((row) => row.slot === birdSlot).id;
const wagonFrom = E_SLOT_FREEZE.find((row) => row.slot === wagonSlot).id;

test("an old place id and a pre-fix id both reach the repaired word", () => {
  const words = levelE();
  const bird = words.find((item) => item.hebrew === "צִפּוֹר");
  assert.ok(bird);
  assert.equal(bird.id, iibsWordId("E", bird.hebrew, bird.gloss));
  assert.notEqual(bird.id, birdFrom);
  const fromPlace = keepStudyCards({ [birdSlot]: { reps: 4, interval: 2 } });
  assert.equal(fromPlace[bird.id].reps, 4);
  assert.equal(fromPlace[birdSlot], undefined);
  const chained = keepStudyCards({ [birdFrom]: { reps: 6, interval: 3 } });
  assert.equal(chained[bird.id].reps, 6);
  assert.equal(chained[birdFrom], undefined);
  assert.equal(E_REPAIR_SLOTS.includes(birdSlot), true);
});

test("a split word moves progress to the first new word only", () => {
  assert.equal(firstRepairTarget([wagonSlot, "iibs-e-04-06"]), wagonSlot);
  const words = levelE();
  const wagon = words.find((item) => item.hebrew === "עֲגָלָה");
  const next = words.find((item) => item.hebrew === "עָוֶל");
  assert.ok(wagon && next);
  assert.notEqual(wagon.id, next.id);
  const kept = keepStudyCards({ [wagonFrom]: { reps: 8, interval: 3 } });
  assert.equal(kept[wagon.id].reps, 8);
  assert.equal(kept[next.id], undefined);
  assert.equal(Object.keys(kept).length, 1);
});

test("a paused Level E drill is remapped, and a broken one is dropped", () => {
  const week = iibsWeekItems("E", 1);
  const oldIds = E_SLOT_FREEZE.filter((row) => row.slot.startsWith("iibs-e-01-"))
    .sort((a, b) => a.slot.localeCompare(b.slot))
    .map((row) => row.id);
  assert.equal(oldIds.length, week.length);
  const bird = week.find((item) => item.hebrew === "צִפּוֹר");
  const runs = hydrateIibsDrillRuns({
    "E:1:due": {
      seed: 3,
      ids: oldIds,
      index: 4,
      reviews: [{ key: `contrast:he:${birdFrom}:0`, at: 2, n: 1 }],
      hits: 1,
      checks: 2,
      fingerprint: "stale",
    },
  });
  const place = runs["E:1:due"];
  assert.ok(place);
  assert.deepEqual(place.ids, week.map((item) => item.id));
  assert.equal(place.fingerprint, drillFingerprint(week.map((item) => item.id)));
  assert.equal(place.index, 4);
  assert.match(place.reviews[0].key, new RegExp(bird.id));
  const dropped = hydrateIibsDrillRuns({
    "E:1:due": { seed: 1, ids: ["iibs-e-nope"], index: 2, reviews: [], hits: 1, checks: 1, fingerprint: "x" },
  });
  assert.equal(dropped["E:1:due"], undefined);
});

test("a live id is never read as an old id, and a prior repair id still chains", () => {
  const words = levelE();
  const word = words.find((item) => item.hebrew === "מָרְדֳּכַי");
  assert.ok(word);
  const slot = "iibs-e-01-09";
  const prior = E_PRIOR_IDS.find((row) => row.slot === slot).id;
  const freeze = E_SLOT_FREEZE.find((row) => row.slot === slot).id;
  assert.notEqual(prior, word.id);
  assert.notEqual(freeze, word.id);
  assert.notEqual(prior, freeze);
  const fromPrior = keepStudyCards({ [prior]: { reps: 3, interval: 1 } });
  assert.equal(fromPrior[word.id].reps, 3);
  assert.equal(fromPrior[prior], undefined);
  const fromFreeze = keepStudyCards({ [freeze]: { reps: 5, interval: 1 } });
  assert.equal(fromFreeze[word.id].reps, 5);
  const live = keepStudyCards({ [word.id]: { reps: 7, interval: 2 } });
  assert.equal(live[word.id].reps, 7);
  assert.equal(Object.keys(live).length, 1);
});

test("every repaired Level E place chains its frozen id to the word there now", () => {
  const words = levelE();
  const live = new Set(words.map((item) => item.id));
  const lessons = vocabLessons("E");
  for (const slot of E_REPAIR_SLOTS) {
    const from = E_SLOT_FREEZE.find((row) => row.slot === slot).id;
    const lesson = Number(slot.slice(7, 9));
    const place = Number(slot.slice(10, 12));
    const word = lessons[lesson - 1][place - 1];
    const gloss = cleanGloss(word.gloss);
    assert.ok(gloss, slot);
    const expectId = iibsWordId("E", word.hebrew, gloss);
    assert.equal(live.has(from), false, slot);
    const kept = keepStudyCards({ [from]: { reps: 1, interval: 1 } });
    assert.deepEqual(Object.keys(kept), [expectId], slot);
  }
  for (const row of E_PRIOR_IDS) {
    const kept = keepStudyCards({ [row.id]: { reps: 1, interval: 1 } });
    assert.equal(Object.keys(kept).length, 1, row.slot);
    assert.equal(live.has(Object.keys(kept)[0]), true, row.slot);
  }
  assert.equal(words.filter((item) => item.hebrew === "זֵרָה").length, 1);
  assert.equal(words.some((item) => item.hebrew === "זָרָה"), false);
  for (const hebrew of ["מְצֹרָע / צָרוּעַ", "אֵלָה / אֵלוֹן", "אוֹפַן / אוֹפָן", "רַן / רָנַן", "רַע / רָעַע"]) {
    assert.equal(words.filter((item) => item.hebrew === hebrew).length, 1, hebrew);
  }
});

test("clearing the 28 Level E lessons still opens the Reading Lab", () => {
  let game = defaultGame();
  for (let lesson = 1; lesson <= 28; lesson += 1) game = applyIibsLesson(game, "E", lesson, 90);
  assert.equal(levelCleared(game.iibs, "E"), true);
  assert.equal(levelUnlocked(game.iibs, "lab", false), true);
});
