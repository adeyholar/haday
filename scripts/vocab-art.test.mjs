import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { VOCAB_ART_IDS, vocabArtSrc } = await jiti.import("/workspace/src/lib/vocab-art.ts");

test("trial plates are 13 concrete Ch. 3–4 nouns", () => {
  assert.equal(VOCAB_ART_IDS.length, 13);
  assert.ok(VOCAB_ART_IDS.includes("sus"));
  assert.ok(VOCAB_ART_IDS.includes("bayit"));
  assert.ok(!VOCAB_ART_IDS.includes("yhwh"));
  assert.ok(!VOCAB_ART_IDS.includes("et"));
  assert.ok(!VOCAB_ART_IDS.includes("rosh"));
});

test("art src only for trial ids, and files exist", () => {
  assert.equal(vocabArtSrc("sus"), "/vocab-art/sus.jpg");
  assert.equal(vocabArtSrc("dabar"), undefined);
  for (const id of VOCAB_ART_IDS) {
    assert.ok(existsSync(`/workspace/public/vocab-art/${id}.jpg`), id);
  }
});
