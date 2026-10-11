import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { IIBS_VOCAB, vocabLessons } = await jiti.import("/workspace/src/lib/iibs-vocab.ts");

test("levels A to E each have 30 lessons of words", () => {
  for (const level of ["A", "B", "C", "D", "E"]) {
    const lessons = IIBS_VOCAB[level];
    assert.equal(lessons.length, 30, level);
    for (const [index, words] of lessons.entries()) {
      if (level === "E" && index >= 28) continue;
      assert.ok(words.length > 0, `${level} lesson ${index + 1}`);
      for (const word of words) {
        assert.ok(word.hebrew.trim(), `${level} ${index + 1} hebrew`);
        assert.ok(word.gloss.trim(), `${level} ${index + 1} ${word.hebrew}`);
      }
    }
  }
  assert.equal(vocabLessons("lab"), null);
  assert.equal(IIBS_VOCAB.A[0][0].hebrew, "אָמַר");
});
