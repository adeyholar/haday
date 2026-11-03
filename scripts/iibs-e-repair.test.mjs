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
const { E_SLOT_FREEZE, E_REPAIR_SLOTS } = await jiti.import(join(root, "src/lib/iibs-e-freeze.ts"));
const { applyIibsLesson, levelCleared, levelUnlocked } = await jiti.import(join(root, "src/lib/iibs-game.ts"));
const { defaultGame } = await jiti.import(join(root, "src/lib/game.ts"));

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

test("clearing the 28 Level E lessons still opens the Reading Lab", () => {
  let game = defaultGame();
  for (let lesson = 1; lesson <= 28; lesson += 1) game = applyIibsLesson(game, "E", lesson, 90);
  assert.equal(levelCleared(game.iibs, "E"), true);
  assert.equal(levelUnlocked(game.iibs, "lab", false), true);
});
