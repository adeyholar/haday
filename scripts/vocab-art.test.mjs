import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { VOCAB_ART_IDS, vocabArtSrc } = await jiti.import("/workspace/src/lib/vocab-art.ts");

test("trial plates cover picturable Ch. 3–5 nouns", () => {
  assert.ok(VOCAB_ART_IDS.includes("bat"));
  assert.ok(VOCAB_ART_IDS.includes("ben"));
  assert.ok(VOCAB_ART_IDS.includes("yam"));
  assert.ok(VOCAB_ART_IDS.includes("sus"));
  assert.ok(!VOCAB_ART_IDS.includes("yhwh"));
  assert.ok(!VOCAB_ART_IDS.includes("elohim"));
  assert.ok(!VOCAB_ART_IDS.includes("dabar"));
  assert.equal(VOCAB_ART_IDS.length, 39);
});

test("art src only for trial ids, and files exist", () => {
  assert.equal(vocabArtSrc("sus"), "/vocab-art/sus.jpg");
  assert.equal(vocabArtSrc("dabar"), undefined);
  for (const id of VOCAB_ART_IDS) {
    assert.ok(existsSync(`/workspace/public/vocab-art/${id}.jpg`), id);
  }
});
