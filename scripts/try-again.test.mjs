import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { CUE_TRY_AGAIN, CUE_NOT_YET, countsAsMiss, feedbackForWrong, feedbackLabel } = await jiti.import(
  "/workspace/src/lib/try-again.ts",
);

test("try again is never a miss", () => {
  assert.equal(feedbackForWrong(0), "retry");
  assert.equal(countsAsMiss("retry"), false);
  assert.equal(feedbackLabel("retry"), CUE_TRY_AGAIN);
  assert.doesNotMatch(CUE_TRY_AGAIN, /miss/i);
});

test("second wrong is Not yet, not Missed, and counts as a miss", () => {
  assert.equal(feedbackForWrong(1), "fail");
  assert.equal(countsAsMiss("fail"), true);
  assert.equal(feedbackLabel("fail"), CUE_NOT_YET);
  assert.doesNotMatch(CUE_NOT_YET, /missed/i);
  assert.notEqual(CUE_TRY_AGAIN, CUE_NOT_YET);
});
