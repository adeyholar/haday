import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { armOwnScroll, hearOwnScroll, readLineInComfort, shouldAutoFollow, shouldFollowScroll } = await jiti.import(
  new URL("../src/lib/read-follow.ts", import.meta.url).pathname,
);

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

test("a paused reader does not follow the next verse, and the same verse does not scroll again", () => {
  assert.equal(shouldAutoFollow(false, "2", "1"), false);
  assert.equal(shouldAutoFollow(true, "2", "1"), true);
  assert.equal(shouldAutoFollow(true, "1", "1"), false);
  assert.equal(shouldAutoFollow(true, "", ""), false);
});

test("a long smooth scroll stays ours until the page is quiet", () => {
  let arm = armOwnScroll(1000);
  for (let now = 1040; now <= 2200; now += 40) {
    const heard = hearOwnScroll(arm, now);
    assert.equal(heard.ours, true, `scroll at ${now} should still be ours`);
    arm = heard.arm;
    assert.equal(arm.startedAt, 1000);
  }
  const afterQuiet = hearOwnScroll(arm, 2400);
  assert.equal(afterQuiet.ours, false);
  assert.equal(afterQuiet.arm.startedAt, 0);
});

test("the hard limit disarms a scroll even while events keep arriving", () => {
  const arm = { startedAt: 1000, heardAt: 2490 };
  assert.equal(hearOwnScroll(arm, 2499).ours, true);
  const cut = hearOwnScroll(arm, 2500);
  assert.equal(cut.ours, false);
  assert.equal(cut.arm.heardAt, 0);
});

test("a cleared arm, including scrollend, is not our scroll", () => {
  assert.equal(hearOwnScroll({ startedAt: 0, heardAt: 0 }, 5000).ours, false);
});

test("both readers follow through the shared hook, and only when the verse changes", () => {
  const hook = readFileSync(new URL("../src/lib/use-follow-scroll.ts", import.meta.url), "utf8");
  const lab = readFileSync(new URL("../src/components/wlc-desk.tsx", import.meta.url), "utf8");
  const grammar = readFileSync(new URL("../src/components/tanakh-reading.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(hook, /addEventListener\("scroll"/);
  assert.match(hook, /addEventListener\("wheel"/);
  assert.match(hook, /addEventListener\("scrollend"/);
  assert.match(hook, /hearOwnScroll/);
  assert.match(hook, /useMemo/);
  assert.match(hook, /prefers-reduced-motion/);
  assert.match(hook, /shouldAutoFollow/);
  assert.match(lab, /useFollowScroll\(spot \? String\(spot\.verse\)/);
  assert.match(lab, /if \(resumeTick\) resume\(\)/);
  assert.match(lab, /\[resumeTick, resume\]/);
  assert.doesNotMatch(lab, /\[resumeTick, follow\]/);
  assert.match(grammar, /useFollowScroll\(verse\.ref\)/);
  const keyAt = grammar.indexOf("const onKey = (event: KeyboardEvent)");
  const keyEnd = grammar.indexOf("function cycleRate", keyAt);
  const key = grammar.slice(keyAt, keyEnd);
  assert.match(key, /\}, \[\]\);/);
  assert.doesNotMatch(key, /\[hideTransport, onNudge, onToggle, follow, playing\]/);
  assert.match(lab, /Back to the reader/);
  assert.match(grammar, /Back to the reader/);
  const page = readFileSync(new URL("../src/routes/iibs/wlc/$book/$ch.tsx", import.meta.url), "utf8");
  assert.match(css, /html:has\(\.read-dock\)/);
  assert.match(page, /Next chapter ›/);
});
