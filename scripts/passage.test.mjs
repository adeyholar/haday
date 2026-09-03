import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const {
  parseReadSearch,
  resolvePassage,
  passageSearch,
  passageLabel,
  playingLabel,
  nextPlayLoc,
  prevPlayLoc,
  verseWindow,
  versesInChapter,
  isFullChapter,
} = await jiti.import("/workspace/src/lib/passage.ts");
const { sliceVerses, audioWindow, verseStartFrom, chapterAudio, readingVerses } = await jiti.import(
  "/workspace/src/lib/reading.ts",
);

test("Genesis 2 has 25 verses and 7–10 is a legal window", () => {
  assert.equal(versesInChapter("Gen", 2), 25);
  assert.equal(versesInChapter("Gen", 1), 31);
  assert.equal(versesInChapter("Ps", 119), 176);
  assert.equal(versesInChapter("Obad", 1), 21);
  const p = resolvePassage("Gen", 2, { v1: 7, v2: 10 });
  assert.equal(p.kind, "verses");
  assert.equal(p.fromV, 7);
  assert.equal(p.toV, 10);
  assert.equal(passageLabel(p), "Genesis 2:7–10");
  assert.deepEqual(verseWindow(p), { from: 7, to: 10 });
  assert.equal(isFullChapter(p), false);
});

test("swaps and clamps inverted or oversized verse numbers", () => {
  const swapped = resolvePassage("Gen", 2, { v1: 10, v2: 7 });
  assert.equal(swapped.fromV, 7);
  assert.equal(swapped.toV, 10);
  const wide = resolvePassage("Gen", 2, { v1: 1, v2: 99 });
  assert.equal(wide.toV, 25);
  const search = parseReadSearch({ v1: "7", v2: "10", loop: "1" });
  assert.deepEqual(search, { v1: 7, v2: 10, loop: true });
  assert.deepEqual(passageSearch(swapped), { v1: 7, v2: 10 });
});

test("chapter range Genesis 1–5 advances then loops", () => {
  const p = resolvePassage("Gen", 1, { c1: 1, c2: 5, loop: true });
  assert.equal(p.kind, "chapters");
  assert.equal(passageLabel(p), "Genesis 1–5");
  assert.deepEqual(nextPlayLoc(p), { book: "Gen", chapter: 2 });
  const last = resolvePassage("Gen", 5, { c1: 1, c2: 5, loop: true });
  assert.deepEqual(nextPlayLoc(last), { book: "Gen", chapter: 1 });
  const stop = resolvePassage("Gen", 5, { c1: 1, c2: 5 });
  assert.equal(nextPlayLoc(stop), null);
  const outside = resolvePassage("Gen", 8, { c1: 1, c2: 5 });
  assert.equal(outside.chapter, 5);
});

test("book and whole Tanakh scopes", () => {
  const book = resolvePassage("Exod", 40, { scope: "book" });
  assert.equal(book.kind, "book");
  assert.equal(passageLabel(book), "Exodus");
  assert.equal(nextPlayLoc(book), null);
  const loopBook = resolvePassage("Exod", 40, { scope: "book", loop: true });
  assert.deepEqual(nextPlayLoc(loopBook), { book: "Exod", chapter: 1 });
  const all = resolvePassage("Gen", 50, { scope: "all" });
  assert.equal(all.kind, "all");
  assert.equal(passageLabel(all), "Tanakh");
  assert.deepEqual(nextPlayLoc(all), { book: "Exod", chapter: 1 });
  const end = resolvePassage("2Chr", 36, { scope: "all" });
  assert.equal(nextPlayLoc(end), null);
  const loopAll = resolvePassage("2Chr", 36, { scope: "all", loop: true });
  assert.deepEqual(nextPlayLoc(loopAll), { book: "Gen", chapter: 1 });
  assert.deepEqual(prevPlayLoc(resolvePassage("Gen", 1, { scope: "all" })), null);
});

test("single chapter is the default passage", () => {
  const p = resolvePassage("Gen", 3, {});
  assert.equal(p.kind, "chapters");
  assert.equal(p.fromCh, 3);
  assert.equal(p.toCh, 3);
  assert.equal(p.fromV, 1);
  assert.equal(p.toV, 24);
  assert.equal(playingLabel(p), "Genesis 3");
  assert.equal(isFullChapter(p), true);
  assert.equal(nextPlayLoc(p), null);
});

test("slice and audio window keep Genesis 2:7–10 on the recording", () => {
  const meta = chapterAudio(2);
  assert.ok(meta);
  const win = audioWindow(meta, 7, 10, meta.duration);
  assert.equal(win.start, verseStartFrom(meta, 7));
  assert.ok(win.end > win.start);
  assert.equal(win.end, verseStartFrom(meta, 11));
  assert.ok(win.start > 30, "verse 7 is well into the chapter");
  const rows = sliceVerses(readingVerses(2), 7, 10);
  assert.equal(rows.length, 4);
  assert.equal(rows[0]?.verse, 7);
  assert.equal(rows.at(-1)?.verse, 10);
  assert.ok(rows[0]?.en.toLowerCase().includes("dust"));
});
