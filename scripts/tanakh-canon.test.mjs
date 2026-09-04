import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const {
  TANAKH_BOOKS,
  TANAKH_CHAPTERS,
  TANAKH_VERSES,
  SECTIONS,
  isBookId,
  bookMeta,
  mechonAudioFile,
  mechonAudioUrl,
  psalmMechonCode,
  chapterAudioSrc,
  localTanakhSrc,
  nextChapter,
  prevChapter,
  isLegacyGenesisParam,
  parseChapter,
} = await jiti.import("/workspace/src/lib/tanakh-canon.ts");
const { versesFromDump, estimateTiming, progressId, audioFor } = await jiti.import("/workspace/src/lib/reading.ts");

test("catalog is the Hebrew Tanakh: 39 books, 929 chapters", () => {
  assert.equal(TANAKH_BOOKS.length, 39);
  assert.equal(TANAKH_CHAPTERS, 929);
  assert.ok(TANAKH_VERSES > 23000);
  assert.equal(SECTIONS.length, 3);
  assert.equal(TANAKH_BOOKS[0].id, "Gen");
  assert.equal(TANAKH_BOOKS.at(-1).id, "2Chr");
  assert.equal(bookMeta("Joel")?.chapters, 4);
  assert.equal(bookMeta("Mal")?.chapters, 3);
  assert.equal(bookMeta("Ps")?.chapters, 150);
  assert.equal(isBookId("Gen"), true);
  assert.equal(isBookId("Genesis"), false);
});

test("legacy Genesis 1–5 URLs still resolve", () => {
  assert.equal(isLegacyGenesisParam("1"), true);
  assert.equal(isLegacyGenesisParam("5"), true);
  assert.equal(isLegacyGenesisParam("all"), true);
  assert.equal(isLegacyGenesisParam("6"), false);
  assert.equal(isLegacyGenesisParam("Gen"), false);
  assert.equal(parseChapter("12", 50), 12);
  assert.equal(parseChapter("0", 50), null);
  assert.equal(parseChapter("51", 50), null);
});

test("Mechon Mamre chapter codes match Talking Bibles / Shmuelof", () => {
  assert.equal(mechonAudioFile("Gen", 1), "t0101.mp3");
  assert.equal(mechonAudioFile("Exod", 20), "t0220.mp3");
  assert.equal(mechonAudioFile("1Sam", 1), "t08a01.mp3");
  assert.equal(mechonAudioFile("2Sam", 1), "t08b01.mp3");
  assert.equal(mechonAudioFile("Ezra", 1), "t35a01.mp3");
  assert.equal(mechonAudioFile("Neh", 1), "t35b01.mp3");
  assert.equal(mechonAudioFile("1Chr", 1), "t25a01.mp3");
  assert.equal(mechonAudioFile("2Chr", 36), "t25b36.mp3");
  assert.equal(psalmMechonCode(1), "01");
  assert.equal(psalmMechonCode(99), "99");
  assert.equal(psalmMechonCode(100), "a0");
  assert.equal(psalmMechonCode(119), "b9");
  assert.equal(psalmMechonCode(150), "f0");
  assert.equal(mechonAudioFile("Ps", 1), "t2601.mp3");
  assert.equal(mechonAudioFile("Ps", 150), "t26f0.mp3");
  assert.equal(mechonAudioUrl("Gen", 1), "https://mechon-mamre.org/mp3/t0101.mp3");
});

test("Genesis 1–5 use local audio; the rest stream", () => {
  assert.equal(localTanakhSrc("Gen", 1), "/audio/tanakh/01-Gen_01.mp3");
  assert.equal(localTanakhSrc("Gen", 6), undefined);
  assert.equal(chapterAudioSrc("Gen", 1).startsWith("/audio/"), true);
  assert.equal(chapterAudioSrc("Gen", 6).startsWith("https://mechon-mamre.org/"), true);
  assert.equal(audioFor("Gen", 1).verses.length > 0, true);
  assert.equal(audioFor("Exod", 1).verses.length, 0);
});

test("next and prev walk the whole canon", () => {
  assert.deepEqual(nextChapter("Gen", 50), { book: "Exod", chapter: 1 });
  assert.deepEqual(prevChapter("Exod", 1), { book: "Gen", chapter: 50 });
  assert.equal(prevChapter("Gen", 1), null);
  assert.equal(nextChapter("2Chr", 36), null);
  assert.deepEqual(nextChapter("Mal", 3), { book: "Ps", chapter: 1 });
});

test("per-book JSON matches the catalog and Genesis 1:1", () => {
  const dump = JSON.parse(readFileSync("/workspace/public/tanakh/books/Gen.json", "utf8"));
  const verses = versesFromDump(dump, 1);
  assert.equal(dump.chapters["1"].length, 31);
  assert.equal(verses[0].he.includes("בְּרֵאשִׁ"), true);
  assert.equal(verses[0].en.toLowerCase().includes("beginning"), true);
  assert.equal(verses[0].words.length, 7);
  assert.equal(progressId("Gen", 1), "Gen.1");
  const est = estimateTiming(verses, 180);
  assert.equal(est.verses.length, 31);
  assert.equal(est.words.length, 31);
  assert.equal(est.words[0].length, verses[0].words.length);
  assert.ok(est.verses[0] >= 3);
  const joel = JSON.parse(readFileSync("/workspace/public/tanakh/books/Joel.json", "utf8"));
  assert.equal(Object.keys(joel.chapters).length, 4);
  const mal = JSON.parse(readFileSync("/workspace/public/tanakh/books/Mal.json", "utf8"));
  assert.equal(Object.keys(mal.chapters).length, 3);
});

test("Genesis waveform alignment covers all 50 chapters", () => {
  const align = JSON.parse(readFileSync("/workspace/public/tanakh/align/Gen.json", "utf8"));
  const dump = JSON.parse(readFileSync("/workspace/public/tanakh/books/Gen.json", "utf8"));
  assert.equal(Object.keys(align).length, 50);
  for (let ch = 1; ch <= 50; ch++) {
    const meta = align[String(ch)];
    const rows = dump.chapters[String(ch)];
    assert.ok(meta?.aligned, `Gen ${ch} aligned`);
    assert.equal(meta.verses.length, rows.length, `Gen ${ch} verses`);
    assert.equal(meta.words.length, rows.length, `Gen ${ch} words`);
    assert.equal(meta.words[0].length, rows[0].words.length);
    assert.ok(meta.verses[0] >= 1.5, `Gen ${ch} skips the heading ${meta.verses[0]}`);
    assert.ok(meta.duration > 20);
  }
});

test("every Tanakh book has a waveform map for each chapter", () => {
  for (const book of TANAKH_BOOKS) {
    const align = JSON.parse(readFileSync(`/workspace/public/tanakh/align/${book.id}.json`, "utf8"));
    assert.equal(Object.keys(align).length, book.chapters, book.id);
    const last = align[String(book.chapters)];
    assert.ok(last?.aligned, book.id);
    assert.ok(last.verses.length >= 1, book.id);
    assert.equal(last.words.length, last.verses.length, book.id);
  }
});
