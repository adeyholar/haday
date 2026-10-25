import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { readLineInComfort, scrollWasOurs, shouldFollowScroll } = await jiti.import(new URL("../src/lib/read-follow.ts", import.meta.url).pathname);

test("a line in the open band does not pull the page", () => {
  assert.equal(readLineInComfort(300, 360, 56, 700), true);
  assert.equal(readLineInComfort(230, 280, 56, 700), true);
  assert.equal(shouldFollowScroll(true, true), false);
});

test("a line under the dock would be brought back, until the student scrolls", () => {
  assert.equal(readLineInComfort(760, 820, 56, 700), false);
  assert.equal(shouldFollowScroll(true, false), true);
  assert.equal(shouldFollowScroll(false, false), false);
});

test("both readers follow through the shared hook, and only when the verse changes", () => {
  const hook = readFileSync(new URL("../src/lib/use-follow-scroll.ts", import.meta.url), "utf8");
  const lab = readFileSync(new URL("../src/components/wlc-desk.tsx", import.meta.url), "utf8");
  const grammar = readFileSync(new URL("../src/components/tanakh-reading.tsx", import.meta.url), "utf8");
  assert.match(hook, /addEventListener\("scroll"/);
  assert.match(hook, /addEventListener\("wheel"/);
  assert.match(hook, /prefers-reduced-motion/);
  assert.match(hook, /scrollWasOurs/);
  assert.match(lab, /useFollowScroll\(spot \? String\(spot\.verse\)/);
  assert.match(grammar, /useFollowScroll\(verse\.ref\)/);
  assert.match(lab, /Back to the reader/);
  assert.match(grammar, /Back to the reader/);
});

test("a scroll the reader started is not a hand scroll", () => {
  assert.equal(scrollWasOurs(1000, 1500), true);
  assert.equal(scrollWasOurs(1000, 2000), false);
  assert.equal(scrollWasOurs(0, 1500), false);
});
