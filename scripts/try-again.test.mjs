import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { CUE_TRY_AGAIN, CUE_NOT_YET, countsAsMiss, feedbackForWrong, feedbackLabel } = await jiti.import(
  new URL("../src/lib/try-again.ts", import.meta.url).pathname,
);

test("try again is never a miss", () => {
  assert.equal(feedbackForWrong(0), "retry");
  assert.equal(countsAsMiss("retry"), false);
  assert.equal(feedbackLabel("retry"), CUE_TRY_AGAIN);
  assert.doesNotMatch(CUE_TRY_AGAIN, /miss/i);
});

test("a card chimes or ticks, and the clap waits for the end of a sitting", () => {
  const feedback = readFileSync(new URL("../src/lib/try-again.ts", import.meta.url).pathname, "utf8");
  const sfx = readFileSync(new URL("../src/lib/sfx.ts", import.meta.url).pathname, "utf8");
  const drill = readFileSync(new URL("../src/components/drill-sitting.tsx", import.meta.url).pathname, "utf8");
  assert.match(feedback, /playChime\(\)/);
  assert.match(feedback, /playTick\(\)/);
  assert.equal(feedback.includes("playAww"), false);
  assert.match(sfx, /export function playSittingClap/);
  assert.equal(sfx.includes("crowd-aww"), false);
  assert.match(drill, /playSittingClap\(\)/);
});

test("second wrong is Not yet, not Missed, and counts as a miss", () => {
  assert.equal(feedbackForWrong(1), "fail");
  assert.equal(countsAsMiss("fail"), true);
  assert.equal(feedbackLabel("fail"), CUE_NOT_YET);
  assert.doesNotMatch(CUE_NOT_YET, /missed/i);
  assert.notEqual(CUE_TRY_AGAIN, CUE_NOT_YET);
});
