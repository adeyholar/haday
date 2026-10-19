/**
 * Reading Lab on phones: no sideways scroll, no word off the screen, 44px taps.
 *
 * Needs a running app with the Scripture Path open for the session, so it is
 * skipped unless WLC_E2E_BASE is set, e.g.
 *   VITE_AUTH_ENABLED=false npm run dev   (pick Scripture Path once)
 *   WLC_E2E_BASE=http://127.0.0.1:8080 node --test scripts/wlc-mobile.e2e.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

const base = process.env.WLC_E2E_BASE;
const CHAPTERS = ["Gen/1", "Esth/8", "1Kgs/8", "1Chr/13", "Ps/119"];
const SIZES = ["tight", "small", "page", "large"];

test("Reading Lab fits a 375px phone at every type size", { skip: !base && "set WLC_E2E_BASE to run" }, async () => {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    for (const size of SIZES) {
      const ctx = await browser.newContext({
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });
      await ctx.addInitScript((s) => localStorage.setItem("haday.wlc.size", s), size);
      const page = await ctx.newPage();
      for (const ch of CHAPTERS) {
        await page.goto(`${base}/iibs/wlc/${ch}`, { waitUntil: "networkidle" });
        await page.waitForSelector(".ms-word", { timeout: 20000 });
        await page.evaluate(() => document.fonts.ready);
        const m = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const words = [...document.querySelectorAll(".ms-word")];
          return {
            sideways: document.documentElement.scrollWidth - vw,
            offscreen: words.filter((e) => {
              const r = e.getBoundingClientRect();
              return r.right > vw + 0.5 || r.left < -0.5;
            }).length,
            shortTaps: words.filter((e) => e.getBoundingClientRect().height < 44).length,
          };
        });
        assert.equal(m.sideways, 0, `${ch} ${size}: page scrolls sideways by ${m.sideways}px`);
        assert.equal(m.offscreen, 0, `${ch} ${size}: ${m.offscreen} words off the screen`);
        assert.equal(m.shortTaps, 0, `${ch} ${size}: ${m.shortTaps} words under 44px tall`);
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
});
