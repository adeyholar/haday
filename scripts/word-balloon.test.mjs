import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { placeWordBalloon } = await jiti.import(join(root, "src/lib/word-balloon.ts"));

const view = { viewportWidth: 390, ceiling: 64, floor: 700, rootFontPx: 16 };

test("a tapped word opens the card under the word, not under the chapter", () => {
  const word = { left: 180, right: 230, top: 180, bottom: 220 };
  const box = placeWordBalloon({ ...view, word });
  assert.equal(box.side, "below");
  assert.ok(box.top >= word.bottom, "the card starts after the word");
  assert.ok(box.top + box.maxHeight <= view.floor + 0.1);
  assert.ok(box.left >= 8 && box.left + box.width <= view.viewportWidth - 8);
  assert.ok(Math.abs(box.left + box.tail - (word.left + word.right) / 2) < 1);
});

test("a word near the player opens the card above it", () => {
  const word = { left: 40, right: 90, top: 620, bottom: 660 };
  const box = placeWordBalloon({ ...view, word });
  assert.equal(box.side, "above");
  assert.ok(box.top + box.maxHeight <= word.top + 0.1);
  assert.ok(box.top >= view.ceiling);
});

test("a word with no room uses a sheet that stays above the player", () => {
  const word = { left: 20, right: 360, top: 80, bottom: 640 };
  const box = placeWordBalloon({ ...view, word });
  assert.equal(box.side, "sheet");
  assert.ok(box.top >= view.ceiling - 0.1);
  assert.ok(box.top + box.maxHeight <= view.floor + 0.1);
});

test("the listen card is a balloon, not a block under the reading", () => {
  const reading = readFileSync(join(root, "src/components/tanakh-reading.tsx"), "utf8");
  const sheet = readFileSync(join(root, "src/components/word-sheet.tsx"), "utf8");
  assert.match(reading, /placeWordBalloon/);
  assert.match(reading, /data-word-pick/);
  assert.doesNotMatch(sheet, /className="mt-4 rounded/);
  assert.match(sheet, /createPortal/);
  assert.match(sheet, /word-balloon/);
});
