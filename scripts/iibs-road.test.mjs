import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { iibsRoadList, IIBS_ROAD_LEVELS } = await jiti.import("/workspace/src/lib/iibs-road.ts");

test("each IIBS level is its own road list, and All is every level once", () => {
  const counts = {};
  let sum = 0;
  for (const level of IIBS_ROAD_LEVELS) {
    const list = iibsRoadList(level);
    assert.ok(list.length > 10, level);
    const keys = new Set(list.map((item) => item.hebrew));
    assert.equal(keys.size, list.length, `${level} keeps each word once`);
    assert.ok(list.every((item) => item.plainEnglish && item.id.startsWith("iibs-")));
    counts[level] = list.length;
    sum += list.length;
  }
  const all = iibsRoadList("all");
  assert.ok(all.length > 0);
  assert.ok(all.length <= sum);
  assert.equal(new Set(all.map((item) => item.id)).size, all.length);
  const said = iibsRoadList("A").find((item) => item.gloss === "he said");
  assert.ok(said);
  assert.equal(said.heVoiceId, "amar");
  assert.equal(said.gloss.includes("("), false);
});

test("the road voice speaks an IIBS gloss, not another course's clip", () => {
  const src = readFileSync("/workspace/src/lib/listen.ts", "utf8");
  assert.match(src, /plainEnglish/);
  assert.match(src, /alsoHebrew/);
  assert.match(src, /heVoiceId/);
  const page = readFileSync("/workspace/src/routes/iibs/road.tsx", "utf8");
  assert.match(page, /iibsRoadList\("all"\)/);
  assert.match(page, /IIBS · audio/);
});
