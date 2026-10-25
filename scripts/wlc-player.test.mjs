/**
 * Reading Lab play control: inside the speed pill, Play/Pause, 44px.
 *
 * The browser half needs the app and a Scripture Path session:
 *   WLC_E2E_BASE=http://127.0.0.1:8080 WLC_E2E_STATE=/tmp/wlc-player-state.json node --test scripts/wlc-player.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const src = readFileSync(new URL("../src/components/wlc-player.tsx", import.meta.url), "utf8");

function playControl() {
  const start = src.indexOf('aria-label="Play and reading speed"');
  const end = src.indexOf("The recording did not load.");
  assert.ok(start > 0 && end > start);
  return src.slice(start, end);
}

test("Play is the first segment of the reading-speed pill", () => {
  const group = playControl();
  const playAt = group.indexOf('aria-label={playing ? "Pause" : "Play"}');
  const speedsAt = group.indexOf("READ_RATES.map");
  assert.ok(playAt > 0 && playAt < speedsAt, "Play sits before Slow");
  assert.match(group.slice(0, speedsAt), /<Play /);
  assert.match(group.slice(0, speedsAt), /<Pause /);
  assert.match(group.slice(0, speedsAt), /playing \? "Pause" : "Play"/);
  assert.match(group.slice(0, speedsAt), /playing \? "bg-primary text-primary-foreground" : "text-ink"/);
  assert.match(group.slice(0, speedsAt), /rounded-\[var\(--radius-sm\)\]/);
  assert.match(group.slice(speedsAt), /rounded-\[var\(--radius-sm\)\]/);
  assert.match(group.slice(0, speedsAt), /min-h-11/);
  assert.match(group.slice(0, speedsAt), /px-2\.5/);
  assert.match(group.slice(0, speedsAt), /w-px/);
  assert.doesNotMatch(group.slice(0, speedsAt), /aria-pressed/);
  assert.match(group.slice(speedsAt), /aria-pressed=\{rate === row\.value\}/);
  assert.match(src, /onPlay=\{\(\) => setPlaying\(true\)\}/);
  assert.match(src, /onPause=\{\(\) => setPlaying\(false\)\}/);
  assert.match(src, /onEnded=\{\(\) => \{/);
  assert.match(src, /The recording did not load\./);
  assert.match(src, /className="read-dock"/);
  assert.match(src, /Verse \{verseNo\} of/);
  assert.match(src, /event\.key !== " "/);
  assert.match(src, /useDockHeight/);
});

const base = process.env.WLC_E2E_BASE;

test(
  "Genesis 1: Play starts the recording, Pause stops it, the end returns to Play, and speed keeps playing",
  { skip: !base && "set WLC_E2E_BASE to run against the app" },
  async () => {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
    try {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        storageState: process.env.WLC_E2E_STATE || undefined,
      });
      const page = await ctx.newPage();
      await page.goto(`${base}/iibs/wlc/Gen/1`, { waitUntil: "networkidle" });
      await page.waitForSelector(".ms-word", { timeout: 20000 });
      const play = page.getByRole("button", { name: "Play" });
      await play.waitFor({ timeout: 10000 });

      const box = await play.boundingBox();
      assert.ok(box && box.height >= 44, `Play tap target is ${box?.height ?? 0}px`);
      for (const label of ["Slow", "Recorded", "Faster"]) {
        const speed = await page.getByRole("button", { name: label }).boundingBox();
        assert.ok(speed && speed.height >= 44, `${label} tap target is ${speed?.height ?? 0}px`);
      }
      const playRight = box.x + box.width;
      const slow = await page.getByRole("button", { name: "Slow" }).boundingBox();
      assert.ok(slow && slow.x >= playRight - 1, "Play is left of Slow");

      await play.click();
      const pause = page.getByRole("button", { name: "Pause" });
      await pause.waitFor({ timeout: 8000 });
      await page.waitForFunction(() => {
        const audio = document.querySelector("audio");
        return Boolean(audio && !audio.paused && audio.currentTime > 0);
      });
      const playingLook = await pause.evaluate((el) => el.className);
      assert.match(playingLook, /bg-primary/);
      assert.match(playingLook, /text-primary-foreground/);
      assert.doesNotMatch(playingLook, /bg-ink/);

      await page.getByRole("button", { name: "Faster" }).click();
      await page.waitForFunction(() => {
        const audio = document.querySelector("audio");
        return Boolean(audio && !audio.paused && Math.abs(audio.playbackRate - 1.25) < 0.01);
      });
      assert.equal(await pause.isVisible(), true);

      await pause.click();
      await play.waitFor({ timeout: 8000 });
      await page.waitForFunction(() => document.querySelector("audio")?.paused === true);
      const stoppedLook = await play.evaluate((el) => el.className);
      assert.doesNotMatch(stoppedLook, /bg-primary/);

      await play.click();
      await pause.waitFor({ timeout: 8000 });
      await page.evaluate(() => {
        const audio = document.querySelector("audio");
        if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) {
          throw new Error("recording has no duration");
        }
        audio.currentTime = Math.max(0, audio.duration - 0.15);
      });
      await play.waitFor({ timeout: 8000 });
      await page.waitForFunction(() => document.querySelector("audio")?.paused === true);
      assert.equal(await page.getByText("The recording did not load.").count(), 0);
    } finally {
      await browser.close();
    }
  },
);
