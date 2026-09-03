import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { hebrewClusters, clusterWeight, clusterAtTime } = await jiti.import("/workspace/src/lib/hebrew-phones.ts");
const { chapterAudio, wordAtTime } = await jiti.import("/workspace/src/lib/reading.ts");

test("shewa is shorter than a long vowel — letter count is not", () => {
  const begin = hebrewClusters("בְּרֵאשִׁ֖ית");
  assert.ok(begin.length >= 3, `clusters ${begin.map((c) => c.glyph).join("|")}`);
  assert.ok(begin[0].weight < begin[1].weight, "bə is shorter than rē");
  const et = clusterWeight("אֵ֥ת");
  const shamayim = clusterWeight("הַשָּׁמַ֖יִם");
  assert.ok(shamayim > et * 1.6, `hashamayim ${shamayim} vs et ${et}`);
  const bara = hebrewClusters("בָּרָ֣א");
  assert.equal(bara.length, 2);
  assert.ok(bara[1].glyph.includes("א"));
});

test("cluster playhead walks through a word", () => {
  const w = "אֱלֹהִ֑ים";
  assert.equal(clusterAtTime(w, 0, 3, 0), 0);
  assert.ok(clusterAtTime(w, 0, 3, 2.8) >= 1);
});

test("Gen 1:1 phoneme weights give את a shorter slot than בראשית", () => {
  const starts = chapterAudio(1).words[0];
  const d0 = starts[1] - starts[0];
  const dEt = starts[4] - starts[3];
  assert.ok(d0 > dEt, `begin ${d0} vs et ${dEt}`);
  assert.equal(wordAtTime(1, 1, starts[0]), 0);
});
