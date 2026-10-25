import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const prefs = await jiti.import(new URL("../src/lib/wlc-prefs.ts", import.meta.url).pathname);

test("the speed chip cycles 0.7, 1, and 1.25", () => {
  assert.equal(prefs.nextReadRate(0.7), 1);
  assert.equal(prefs.nextReadRate(1), 1.25);
  assert.equal(prefs.nextReadRate(1.25), 0.7);
  assert.equal(prefs.readRateLabel(0.7), "0.7×");
  assert.equal(prefs.readRateLabel(1), "1×");
  assert.equal(prefs.readRateLabel(1.25), "1.25×");
  assert.equal(prefs.rateFromStorage("0.7"), 0.7);
  assert.equal(prefs.rateFromStorage("nope"), 1);
});

test("a saved type size wins over the wide-screen default", () => {
  assert.equal(prefs.defaultSheetSize("small", true), "small");
  assert.equal(prefs.defaultSheetSize("large", false), "large");
  assert.equal(prefs.defaultSheetSize(null, true), "large");
  assert.equal(prefs.defaultSheetSize(null, false), "page");
  assert.equal(prefs.defaultSheetWidth("wide"), "wide");
  assert.equal(prefs.defaultSheetWidth(null), "normal");
});

test("the dock steps verses, not chapters, and the bars use variables", () => {
  const player = readFileSync(new URL("../src/components/wlc-player.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/routes/iibs/wlc/$book/$ch.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const prefsSrc = readFileSync(new URL("../src/lib/wlc-prefs.ts", import.meta.url), "utf8");
  assert.match(player, /aria-label="Previous verse"/);
  assert.match(player, /aria-label="Next verse"/);
  assert.doesNotMatch(player, /Previous chapter|Next chapter/);
  assert.match(player, /rounded-full/);
  assert.match(player, /Reading speed,/);
  assert.match(player, /haday\.wlc\.rate|WLC_RATE_KEY/);
  assert.match(player, /aria-label="Seek recording"/);
  assert.match(player, /aria-valuetext/);
  assert.match(player, /preload="metadata"/);
  assert.match(player, /readyState < 1/);
  assert.match(player, /loadedmetadata/);
  assert.match(player, /disabled=\{!hasStarts/);
  assert.match(player, /if \(!starts\.length\) return/);
  assert.match(player, /onEngageRef\.current\?\.\(\)/);
  assert.doesNotMatch(player, /starts\[next\] \?\? 0|verses\[next\] \?\? 0/);
  assert.match(page, /aria-label="Previous chapter"/);
  assert.match(page, /aria-label="Next chapter"/);
  assert.match(page, /Next chapter ›/);
  assert.doesNotMatch(prefsSrc, /window|localStorage/);
  const pageHead = page.slice(0, page.indexOf("function readSheet"));
  assert.doesNotMatch(pageHead, /window|localStorage/);
  assert.match(page, /WLC_WIDTH_KEY/);
  assert.match(page, /wlc-wide/);
  const storageAt = player.indexOf("localStorage");
  assert.ok(storageAt > player.indexOf("useEffect"), "speed is read inside an effect");
  const dock = css.slice(css.indexOf(".read-dock {"), css.indexOf(".read-line {"));
  assert.doesNotMatch(dock, /3\.5rem|5\.5rem|6rem/);
  assert.match(dock, /bottom:\s*var\(--nav-h\)/);
  assert.match(dock, /bottom:\s*calc\(var\(--nav-h\) \+ var\(--dock-h\)\)/);
  const wide = css.slice(css.indexOf("@media (min-width: 1024px)"));
  assert.match(wide, /body:has\(\.wlc-stage\) main/);
  assert.doesNotMatch(wide, /body:has\(\.wlc-stage\):has\(\.wlc-card\)/);
  assert.match(wide, /body:has\(\.wlc-wide\) main/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("the first play stays in the tap, and the sheet hides only on a wide screen", () => {
  const player = readFileSync(new URL("../src/components/wlc-player.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const gesture = player.slice(player.indexOf("function gesturePlay"), player.indexOf("function toggle"));
  const playAt = gesture.indexOf("el.play()");
  assert.ok(playAt > 0, "the tap calls play()");
  assert.equal(/\bawait\b/.test(gesture.slice(0, playAt)), false, "no await before play()");
  const toggle = player.slice(player.indexOf("function toggle("), player.indexOf("function jumpVerse"));
  assert.match(toggle, /gesturePlay\(/);
  assert.equal(/\bawait\b/.test(toggle), false, "toggle does not await");
  assert.match(player, /pendingSeek\.current = time/);
  assert.match(player, /function applyPending/);
  assert.match(player, /onLoadedMetadata=\{[\s\S]*?applyPending\(event\.currentTarget\)/);
  assert.match(player, /onCanPlay=\{\(event\) => applyPending\(event\.currentTarget\)\}/);
  assert.match(player, /const METADATA_WAIT_MS = 5000/);
  assert.match(player, /setTimeout\(\(\) => finish\("timeout"\), METADATA_WAIT_MS\)/);
  assert.match(player, /removeEventListener\("loadedmetadata", onReady\)/);
  assert.match(player, /removeEventListener\("canplay", onReady\)/);
  assert.match(player, /removeEventListener\("error", onError\)/);
  assert.deepEqual(player.match(/\.src\s*=/g), [".src ="]);
  const chapterLoad = player.slice(player.indexOf("void fetchBookAlign"), player.indexOf("function paint"));
  assert.match(chapterLoad, /srcRef\.current = timed\.src \|\| chapterAudioSrc\(book, chapter\)/);
  assert.match(chapterLoad, /attachSrc\(el\)/);
  assert.equal(/\bel\.src\s*=/.test(chapterLoad), false, "the chapter load does not assign src early");
  const wideAt = css.indexOf("@media (min-width: 1024px)");
  assert.ok(wideAt > 0);
  assert.equal(/wlc-stage:not\(\.wlc-sized\)/.test(css.slice(0, wideAt)), false);
  assert.match(css.slice(wideAt), /\.wlc-stage:not\(\.wlc-sized\) \.manuscript-sheet \{[^}]*opacity:\s*0/);
});

const base = process.env.WLC_E2E_BASE;

function near(actual, expected, slack, message) {
  assert.ok(Math.abs(actual - expected) <= slack, `${message}: ${actual} vs ${expected}`);
}

test(
  "Genesis 1 dock stays in the sheet at phone and desktop widths",
  { skip: !base && "set WLC_E2E_BASE to run against the app" },
  async () => {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
    const state = process.env.WLC_E2E_STATE || undefined;
    try {
      const viewports = [
        { width: 320, height: 700 },
        { width: 375, height: 812 },
        { width: 390, height: 844 },
        { width: 768, height: 1024 },
        { width: 1024, height: 816 },
        { width: 1440, height: 900 },
        { width: 844, height: 390, landscape: true },
      ];
      for (const viewport of viewports) {
        const ctx = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.height >= viewport.width ? viewport.width < 500 : false,
          hasTouch: viewport.width < 800,
          storageState: state,
        });
        const page = await ctx.newPage();
        await page.goto(`${base}/iibs/wlc/Gen/1`, { waitUntil: "networkidle" });
        await page.waitForSelector(".ms-word", { timeout: 20000 });
        assert.equal(new URL(page.url()).pathname, "/iibs/wlc/Gen/1", `${viewport.width}: left the chapter`);
        const label = `${viewport.width}x${viewport.height}`;
        const overflow = async () =>
          page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok((await overflow()) <= 1, `${label}: horizontal overflow`);

        const sheet = await page.locator(".manuscript-sheet").boundingBox();
        const dock = await page.locator(".read-dock").boundingBox();
        const dockSheet = await page.locator(".read-dock-sheet").boundingBox();
        const play = await page.getByRole("button", { name: "Play" }).boundingBox();
        assert.ok(sheet && dock && dockSheet && play, `${label}: missing dock or sheet`);
        near(dockSheet.x, sheet.x, 8, `${label}: dock sheet left`);
        near(dockSheet.width, sheet.width, 12, `${label}: dock sheet width`);
        near(play.x + play.width / 2, sheet.x + sheet.width / 2, 18, `${label}: Play centre`);
        assert.ok(play.height >= 44 && Math.abs(play.width - play.height) < 2, `${label}: Play is ${play.width}x${play.height}`);
        assert.ok(dock.y + dock.height <= viewport.height + 1, `${label}: dock below the screen`);
        const nav = await page.locator("nav.fixed").boundingBox();
        if (nav) assert.ok(dock.y + dock.height <= nav.y + 2, `${label}: dock overlaps the nav`);

        if (viewport.landscape) {
          assert.equal(await page.locator("header.sticky").boundingBox(), null, `${label}: header still showing`);
          assert.equal(nav, null, `${label}: nav still showing`);
        } else if (viewport.width >= 1024) {
          await page.waitForSelector(".manuscript-large", { timeout: 4000 });
        } else if (viewport.width === 390) {
          await page.waitForSelector(".manuscript-page", { timeout: 4000 });
        }

        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(200);
        const last = await page.evaluate(() => {
          const verses = [...document.querySelectorAll(".ms-verse")];
          const verse = verses[verses.length - 1]?.getBoundingClientRect();
          const bar = document.querySelector(".read-dock")?.getBoundingClientRect();
          return { verseBottom: verse?.bottom ?? -1, dockTop: bar?.top ?? -1 };
        });
        assert.ok(last.verseBottom <= last.dockTop + 2, `${label}: last verse ${last.verseBottom} under dock ${last.dockTop}`);
        assert.ok((await overflow()) <= 1, `${label}: overflow after scroll`);
        await ctx.close();
      }

      const phone = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        storageState: state,
      });
      const page = await phone.newPage();
      await page.goto(`${base}/iibs/wlc/Gen/1`, { waitUntil: "networkidle" });
      await page.waitForSelector(".ms-word", { timeout: 20000 });
      assert.equal(await page.getByRole("button", { name: "Previous chapter", exact: true }).count(), 1);
      assert.equal(await page.getByRole("button", { name: "Next chapter", exact: true }).count(), 1);
      assert.equal(await page.getByRole("button", { name: "Next chapter ›", exact: true }).count(), 1);
      assert.equal(await page.getByRole("button", { name: "Previous verse", exact: true }).count(), 1);
      assert.equal(await page.getByRole("button", { name: "Next verse", exact: true }).count(), 1);

      const speed = page.getByRole("button", { name: /Reading speed/ });
      const order = ["0.7×", "1×", "1.25×"];
      let shown = (await speed.innerText()).trim();
      assert.ok(order.includes(shown), `chip showed ${shown}`);
      const play = page.getByRole("button", { name: "Play" });
      await play.click();
      await page.waitForFunction(() => {
        const audio = document.querySelector("audio");
        return Boolean(audio && !audio.paused && audio.currentTime > 0);
      });
      const pause = page.getByRole("button", { name: "Pause" });
      assert.match(await pause.evaluate((el) => el.className), /bg-primary/);
      for (let step = 0; step < 3; step += 1) {
        const next = order[(order.indexOf(shown) + 1) % order.length];
        await speed.click();
        await page.waitForFunction((label) => document.querySelector("[aria-label^='Reading speed']")?.textContent?.trim() === label, next);
        shown = next;
      }
      assert.equal(shown, (await speed.innerText()).trim());

      const verse = page.locator("#wlc-verse");
      await page.waitForFunction(() => {
        const next = document.querySelector('[aria-label="Next verse"]');
        const select = document.querySelector("#wlc-verse");
        return Boolean(next && !next.disabled && select && !select.disabled);
      });
      const beforeVerse = await verse.inputValue();
      await page.getByRole("button", { name: "Next verse" }).click();
      await page.waitForFunction((prev) => document.querySelector("#wlc-verse")?.value !== prev, beforeVerse);
      assert.equal(Number(await verse.inputValue()), Number(beforeVerse) + 1);

      const beforeTime = await page.evaluate(() => document.querySelector("audio")?.currentTime ?? 0);
      await page.waitForFunction(() => {
        const slider = document.querySelector(".audio-seek");
        return Boolean(slider && !slider.disabled);
      });
      const seek = await page.getByRole("slider", { name: "Seek recording" }).boundingBox();
      assert.ok(seek);
      await page.mouse.click(seek.x + seek.width * 0.55, seek.y + seek.height / 2);
      await page.waitForFunction((time) => Math.abs((document.querySelector("audio")?.currentTime ?? 0) - time) > 0.4, beforeTime);

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1200);
      assert.ok((await page.evaluate(() => window.scrollY)) < 8, "a hand scroll did not stay put");
      await phone.close();

      for (const viewport of [
        { width: 390, height: 844, beside: false },
        { width: 768, height: 1024, beside: false },
        { width: 1024, height: 816, beside: true },
        { width: 1440, height: 900, beside: true },
      ]) {
        const ctx = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          storageState: state,
        });
        const cardPage = await ctx.newPage();
        await cardPage.goto(`${base}/iibs/wlc/Gen/1`, { waitUntil: "networkidle" });
        await cardPage.waitForSelector(".ms-word", { timeout: 20000 });
        await cardPage.waitForSelector(".wlc-sized", { timeout: 4000 });
        if (viewport.beside) await cardPage.waitForSelector(".manuscript-large", { timeout: 4000 });
        const beforeX = await cardPage.evaluate(() => document.querySelector(".ms-word")?.getBoundingClientRect().x ?? Number.NaN);
        const beforeDock = await cardPage.evaluate(() => document.querySelector(".read-dock-sheet")?.getBoundingClientRect().x ?? Number.NaN);
        const beforeBar = await cardPage.evaluate(() => document.querySelector(".wlc-toolbar")?.getBoundingClientRect().x ?? Number.NaN);
        await cardPage.locator(".ms-word").first().click();
        const card = cardPage.locator(".wlc-card");
        await card.waitFor({ timeout: 5000 });
        const sheet = await cardPage.locator(".manuscript-sheet").boundingBox();
        const cardBox = await card.boundingBox();
        const dock = await cardPage.locator(".read-dock").boundingBox();
        assert.ok(sheet && cardBox && dock, `${viewport.width}: card layout missing`);
        const label = `${viewport.width} card`;
        if (viewport.beside) {
          assert.ok(sheet.width >= 720 && sheet.width <= 820, `${label}: Hebrew is ${sheet.width}`);
          assert.ok(cardBox.x >= sheet.x + sheet.width - 8, `${label}: card is not beside the text`);
          const opened = await cardPage.evaluate(() => ({
            word: document.querySelector(".ms-word")?.getBoundingClientRect().x ?? Number.NaN,
            dock: document.querySelector(".read-dock-sheet")?.getBoundingClientRect().x ?? Number.NaN,
            bar: document.querySelector(".wlc-toolbar")?.getBoundingClientRect().x ?? Number.NaN,
          }));
          assert.ok(Math.abs(opened.word - beforeX) <= 1, `${label}: word moved ${opened.word - beforeX}px when the card opened`);
          assert.ok(Math.abs(opened.dock - beforeDock) <= 1, `${label}: dock moved ${opened.dock - beforeDock}px when the card opened`);
          assert.ok(Math.abs(opened.bar - beforeBar) <= 1, `${label}: toolbar moved ${opened.bar - beforeBar}px when the card opened`);
          await cardPage.getByRole("button", { name: "Close", exact: true }).click();
          await cardPage.waitForSelector(".wlc-card", { state: "detached" });
          const closedX = await cardPage.evaluate(() => document.querySelector(".ms-word")?.getBoundingClientRect().x ?? Number.NaN);
          assert.ok(Math.abs(closedX - beforeX) <= 1, `${label}: word moved ${closedX - beforeX}px when the card closed`);
        } else {
          assert.ok(cardBox.y >= 0 && cardBox.y + cardBox.height <= dock.y + 2, `${label}: card is not fully above the dock`);
          assert.ok(cardBox.x <= sheet.x + 24, `${label}: phone card left the sheet`);
        }
        const overflow = await cardPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 1, `${label}: overflow ${overflow}`);
        await ctx.close();
      }

      const wide = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        storageState: state,
      });
      await wide.addInitScript(() => {
        localStorage.setItem("haday.wlc.size", "small");
      });
      const widePage = await wide.newPage();
      await widePage.goto(`${base}/iibs/wlc/Gen/1`, { waitUntil: "networkidle" });
      await widePage.waitForSelector(".manuscript-small", { timeout: 4000 });
      await widePage.getByRole("button", { name: "Type size and lamp" }).click();
      await widePage.getByRole("button", { name: "Wide", exact: true }).click();
      await widePage.waitForTimeout(200);
      const wideSheet = await widePage.locator(".manuscript-sheet").boundingBox();
      assert.ok(wideSheet && wideSheet.width >= 860 && wideSheet.width <= 940, `Wide column is ${wideSheet?.width}`);
      const wideOverflow = await widePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(wideOverflow <= 1, `Wide overflow ${wideOverflow}`);
      await wide.close();
    } finally {
      await browser.close();
    }
  },
);

