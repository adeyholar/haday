import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { VOCAB_ART_IDS, vocabArtSrc } = await jiti.import(new URL("../src/lib/vocab-art.ts", import.meta.url).pathname);

test("trial plates cover picturable Ch. 3–5 nouns", () => {
  assert.ok(VOCAB_ART_IDS.includes("bat"));
  assert.ok(VOCAB_ART_IDS.includes("zion-light"));
  assert.ok(VOCAB_ART_IDS.includes("yam"));
  assert.ok(!VOCAB_ART_IDS.includes("dabar"));
  assert.equal(VOCAB_ART_IDS.length, 40);
});

test("art src only for trial ids, and files exist", () => {
  assert.equal(vocabArtSrc("sus"), "/vocab-art/sus.jpg");
  assert.equal(vocabArtSrc("dabar"), undefined);
  assert.equal(vocabArtSrc("yhwh"), "/vocab-art/zion-light.jpg");
  assert.equal(vocabArtSrc("elohim"), "/vocab-art/zion-light.jpg");
  assert.equal(vocabArtSrc("el-god"), "/vocab-art/zion-light.jpg");
  for (const id of VOCAB_ART_IDS) {
    assert.ok(existsSync(new URL(`../public/vocab-art/${id}.jpg`, import.meta.url)), id);
  }
});
