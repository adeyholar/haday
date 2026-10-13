import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { IIBS_WEEK_LEVELS, IIBS_WEEKS, iibsWeekCount, iibsWeekItems } = await jiti.import("/workspace/src/lib/iibs-weeks.ts");
const { hydrateGame } = await jiti.import("/workspace/src/lib/game.ts");

test("each Scripture Path level is thirty weeks, and a week is not the whole level", () => {
  for (const level of IIBS_WEEK_LEVELS) {
    assert.equal(iibsWeekCount(level), IIBS_WEEKS, level);
    let words = 0;
    const ids = new Set();
    for (let week = 1; week <= IIBS_WEEKS; week += 1) {
      const list = iibsWeekItems(level, week);
      assert.ok(list.length > 0 && list.length <= 16, `${level} week ${week} has ${list.length}`);
      words += list.length;
      for (const item of list) {
        assert.equal(ids.has(item.id), false, item.id);
        ids.add(item.id);
        assert.equal(item.gloss.includes("("), false);
        assert.equal(item.chapter, 0);
      }
    }
    assert.ok(words > 100, `${level} ${words}`);
  }
  const first = iibsWeekItems("A", 1);
  assert.equal(first[0]?.gloss, "he said");
  const place = { seed: 1, ids: ["iibs-a-x"], index: 2, reviews: [], hits: 1, checks: 2, fingerprint: "abc" };
  const game = hydrateGame({
    drillRuns: { "3:due": place },
    iibsDrillRuns: { "A:1:due": place, "A:99:due": place, "nope": place },
  });
  assert.ok(game.drillRuns["3:due"]);
  assert.ok(game.iibsDrillRuns["A:1:due"]);
  assert.equal(game.iibsDrillRuns["A:99:due"], undefined);
  assert.equal(game.drillRuns["A:1:due"], undefined);
  const page = readFileSync("/workspace/src/routes/iibs/study/$level/$week.tsx", "utf8");
  assert.match(page, /DrillSitting/);
  assert.match(page, /iibsWeekItems/);
  assert.doesNotMatch(page, /iibsRoadList/);
});
