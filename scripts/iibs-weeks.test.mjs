import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { IIBS_WEEK_LEVELS, IIBS_WEEKS, iibsWeekCount, iibsWeekItems, iibsStudyIdSet, iibsWordId } = await jiti.import(
  join(root, "src/lib/iibs-weeks.ts"),
);
const { hydrateGame } = await jiti.import(join(root, "src/lib/game.ts"));
const { keepStudyCards } = await jiti.import(join(root, "src/lib/card-ids.ts"));
const { glossMatches } = await jiti.import(join(root, "src/lib/vocab.ts"));

test("each Scripture Path level is thirty weeks, and a week is not the whole level", () => {
  for (const level of IIBS_WEEK_LEVELS) {
    assert.equal(iibsWeekCount(level), IIBS_WEEKS, level);
    let words = 0;
    const ids = new Set();
    for (let week = 1; week <= IIBS_WEEKS; week += 1) {
      const list = iibsWeekItems(level, week);
      assert.ok(list.length > 0 && list.length <= 20, `${level} week ${week} has ${list.length}`);
      words += list.length;
      for (const item of list) {
        assert.equal(ids.has(item.id), false, item.id);
        ids.add(item.id);
        assert.match(item.id, /^iibs-[a-e]-[0-9a-z]+$/);
        assert.equal(item.id, iibsWordId(level, item.hebrew, item.gloss));
        assert.doesNotMatch(item.id, /^iibs-[a-e]-\d{2}-\d{2}$/);
        assert.equal(item.gloss.includes("("), false);
        assert.equal(item.chapter, 0);
      }
    }
    assert.ok(words > 100, `${level} ${words}`);
  }
  const first = iibsWeekItems("A", 1);
  assert.equal(first[0]?.gloss, "he said");
  const levelA = [];
  for (let week = 1; week <= IIBS_WEEKS; week += 1) levelA.push(...iibsWeekItems("A", week));
  const withPrep = levelA.find((item) => item.hebrew === "עִם");
  const people = levelA.find((item) => item.hebrew === "עַם");
  assert.ok(withPrep, "with");
  assert.ok(people, "people");
  assert.notEqual(withPrep.id, people.id);
  const there = levelA.find((item) => item.hebrew === "שָׁם");
  const name = levelA.find((item) => item.hebrew === "שֵׁם");
  assert.ok(there && name);
  assert.notEqual(there.id, name.id);
  const behold = levelA.find((item) => item.hebrew === "הִנֵּה");
  const they = levelA.find((item) => item.hebrew === "הֵנָּה");
  assert.ok(behold && they);
  assert.notEqual(behold.id, they.id);
  const said = levelA.find((item) => item.hebrew === "אָמַר" && item.gloss === "he said");
  assert.ok(said);
  assert.equal(said.id, iibsWordId("A", "אָמַר", "he said"));
  const carried = keepStudyCards({ "iibs-a-01-01": { reps: 4, interval: 2 } });
  assert.equal(carried[said.id].reps, 4);
  assert.equal(carried["iibs-a-01-01"], undefined);
  const sample = first[0];
  const kept = keepStudyCards({
    [sample.id]: { reps: 3, interval: 2 },
    "iibs-a-שלום": { reps: 9 },
    "iibs-a-99-99": { reps: 9 },
  });
  assert.equal(kept[sample.id].reps, 3);
  assert.equal(kept["iibs-a-שלום"], undefined);
  assert.equal(kept["iibs-a-99-99"], undefined);
  assert.equal(iibsStudyIdSet().has(sample.id), true);
  const baal = levelA.filter((item) => item.hebrew === "בַּעַל");
  assert.equal(baal.length, 2);
  assert.equal(glossMatches(baal[0], baal[1].gloss.split(",")[0].trim()), true);
  assert.equal(glossMatches(baal[1], baal[0].gloss.split(",")[0].trim()), true);
  const place = { seed: 1, ids: ["iibs-a-x"], index: 2, reviews: [], hits: 1, checks: 2, fingerprint: "abc" };
  const game = hydrateGame({
    drillRuns: { "3:due": place },
    iibsDrillRuns: { "A:1:due": place, "A:99:due": place, "nope": place },
  });
  assert.ok(game.drillRuns["3:due"]);
  assert.ok(game.iibsDrillRuns["A:1:due"]);
  assert.equal(game.iibsDrillRuns["A:99:due"], undefined);
  assert.equal(game.drillRuns["A:1:due"], undefined);
  const page = readFileSync(join(root, "src/routes/iibs/study/$level/$week.tsx"), "utf8");
  assert.match(page, /DrillSitting/);
  assert.match(page, /iibsWeekItems/);
  assert.doesNotMatch(page, /iibsRoadList/);
});
