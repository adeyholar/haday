import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { readLineInComfort, shouldFollowScroll } = await jiti.import("/workspace/src/lib/read-follow.ts");

test("a line in the middle third does not pull the page", () => {
  assert.equal(readLineInComfort(300, 360, 56, 700), true);
  assert.equal(shouldFollowScroll(true, true), false);
});

test("a line under the dock would be brought back, until the student scrolls", () => {
  assert.equal(readLineInComfort(760, 820, 56, 700), false);
  assert.equal(shouldFollowScroll(true, false), true);
  assert.equal(shouldFollowScroll(false, false), false);
});
