import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { applyRating, newCard, isHighWeak, isWeak, weaknessScore } = await jiti.import("/workspace/src/lib/srs.ts");

test("a Tell-me reveal is weaker than a miss", () => {
  const now = Date.now();
  const told = applyRating(newCard(now), "reveal", now);
  const missed = applyRating(newCard(now), "again", now);
  assert.ok(weaknessScore(told) > weaknessScore(missed));
  assert.equal(isHighWeak(told), true);
  assert.equal(isHighWeak(missed), false);
  assert.equal(isWeak(missed), true);
  assert.ok(told.reveals === 1);
  assert.ok(missed.reveals === 0);
});
