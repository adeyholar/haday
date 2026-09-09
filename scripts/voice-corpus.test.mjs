import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { voiceCorpus, corpusScript, resolveCorpusId } = await jiti.import("/workspace/src/lib/voice-corpus.ts");

test("corpus covers letters, vowels, names, vocab", () => {
  const items = voiceCorpus();
  const kinds = new Set(items.map((i) => i.kind));
  assert.ok(kinds.has("letter"));
  assert.ok(kinds.has("vowel"));
  assert.ok(kinds.has("vocab"));
  assert.ok(items.some((i) => i.id === "alef" && i.speakHe.includes("אָלֶף")));
  assert.ok(items.some((i) => i.id === "qamets"));
  assert.ok(items.some((i) => i.id === "abraham"));
  assert.equal(resolveCorpusId("ch1-alef"), "alef");
  const script = corpusScript(items);
  assert.match(script, /^abraham\the\t/m);
  assert.ok(items.length > 200);
});
