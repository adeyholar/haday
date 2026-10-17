import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("a mix round does not rebuild the deck when progress is saved", () => {
  const src = readFileSync("/workspace/src/components/game-stage.tsx", "utf8");
  assert.match(src, /\[chapter, stage, mixKey\]/);
  assert.match(src, /\[chapter, stage, deal, mixKey, pool\]/);
  assert.doesNotMatch(src, /mixChapters, mixKey/);
});
