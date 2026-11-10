import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { iibsWeekItems, iibsWordId, iibsLegacyId, cleanGloss } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { keepStudyCards } = await jiti.import(join(root, "src/lib/card-ids.ts"));
const { hydrateIibsDrillRuns, drillFingerprint } = await jiti.import(join(root, "src/lib/etch.ts"));
const { A_SLOT_FREEZE, A_REPAIR_SLOTS, A_PRIOR_IDS, A_SPLITS } = await jiti.import(join(root, "src/lib/iibs-a-freeze.ts"));
const { B_SLOT_FREEZE, B_REPAIR_SLOTS, B_PRIOR_IDS, B_SPLITS } = await jiti.import(join(root, "src/lib/iibs-b-freeze.ts"));
const { vocabLessons } = await jiti.import(join(root, "src/lib/iibs-vocab.ts"));

const books = [
  { level: "A", freeze: A_SLOT_FREEZE, slots: A_REPAIR_SLOTS, prior: A_PRIOR_IDS, splits: A_SPLITS },
  { level: "B", freeze: B_SLOT_FREEZE, slots: B_REPAIR_SLOTS, prior: B_PRIOR_IDS, splits: B_SPLITS },
];

function wordAt(level, slot) {
  const lesson = Number(slot.slice(7, 9));
  const place = Number(slot.slice(10, 12));
  const word = vocabLessons(level)[lesson - 1][place - 1];
  const gloss = cleanGloss(word.gloss);
  assert.ok(gloss, slot);
  return { word, id: iibsWordId(level, word.hebrew, gloss) };
}

function weekOf(level, id) {
  for (let week = 1; week <= 30; week += 1) {
    const items = iibsWeekItems(level, week);
    if (items.some((item) => item.id === id)) return { week, items };
  }
  return null;
}

test("each frozen id and its place slot reach the repaired word", () => {
  for (const book of books) {
    assert.deepEqual(
      book.slots.slice().sort(),
      book.freeze.map((row) => row.slot).slice().sort(),
    );
    assert.equal(book.prior.length, 0);
    assert.equal(book.splits.length, 0);
    for (const row of book.freeze) {
      const { id } = wordAt(book.level, row.slot);
      assert.notEqual(id, row.id, row.slot);
      const fromFreeze = keepStudyCards({ [row.id]: { reps: 4, interval: 2 } });
      assert.deepEqual(Object.keys(fromFreeze), [id], row.slot);
      assert.equal(fromFreeze[id].reps, 4);
      assert.equal(fromFreeze[row.id], undefined);
      const fromPlace = keepStudyCards({ [row.slot]: { reps: 6, interval: 3 } });
      assert.deepEqual(Object.keys(fromPlace), [id], row.slot);
      assert.equal(fromPlace[row.slot], undefined);
    }
  }
});

test("a live id is never read as an old id", () => {
  for (const book of books) {
    for (const row of book.freeze) {
      const { id } = wordAt(book.level, row.slot);
      assert.equal(iibsLegacyId(id), undefined, row.slot);
      assert.equal(iibsLegacyId(row.id), id, row.slot);
      const live = keepStudyCards({ [id]: { reps: 7, interval: 2 } });
      assert.deepEqual(Object.keys(live), [id], row.slot);
      assert.equal(live[id].reps, 7);
    }
  }
});

test("a paused drill remaps when the one repaired id is the frozen id", () => {
  for (const book of books) {
    for (const row of book.freeze) {
      const { id } = wordAt(book.level, row.slot);
      const found = weekOf(book.level, id);
      assert.ok(found, row.slot);
      const current = found.items.map((item) => item.id);
      const ids = current.map((item) => (item === id ? row.id : item));
      assert.equal(ids.filter((item) => item === row.id).length, 1, row.slot);
      const key = `${book.level}:${found.week}:due`;
      const runs = hydrateIibsDrillRuns({
        [key]: {
          seed: 3,
          ids,
          index: 2,
          reviews: [{ key: `contrast:he:${row.id}:0`, at: 2, n: 1 }],
          hits: 1,
          checks: 2,
          fingerprint: "stale",
        },
      });
      const place = runs[key];
      assert.ok(place, row.slot);
      assert.deepEqual(place.ids, current, row.slot);
      assert.equal(place.fingerprint, drillFingerprint(current), row.slot);
      assert.equal(place.index, 2);
      assert.match(place.reviews[0].key, new RegExp(id));
    }
  }
});
