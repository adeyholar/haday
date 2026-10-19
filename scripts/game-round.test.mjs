import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("a mix round does not rebuild the deck when progress is saved", () => {
  const src = readFileSync(new URL("../src/components/game-stage.tsx", import.meta.url).pathname, "utf8");
  assert.match(src, /\[term2, chapter, stage, mixKey\]/);
  assert.match(src, /\[chapter, stage, deal, mixKey, pool\]/);
  assert.doesNotMatch(src, /mixChapters, mixKey/);
});
