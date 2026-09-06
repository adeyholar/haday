import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const jiti = createJiti(import.meta.url, { alias: { "@": src } });
const {
  readingVerses,
  readingGradeQuiz,
  parseReadingKey,
  chapterAudio,
  verseAtTime,
  wordAtTime,
  mediaClockTime,
  formatPlayTime,
  HIGHLIGHT_LEAD,
  READ_RATES,
  withEstimatedTiming,
  estimateTiming,
  repairWordTimes,
  audioFor,
} = await jiti.import(path.join(src, "lib/reading.ts"));

test("Genesis 1–5 public-domain reading is complete", () => {
  assert.equal(parseReadingKey("all"), "all");
  assert.equal(parseReadingKey("3"), 3);
  const all = readingVerses("all");
  assert.equal(all.length, 31 + 25 + 24 + 26 + 32);
  const one = readingVerses(1);
  assert.equal(one[0]?.he.includes("בְּרֵאשִׁ"), true);
  assert.equal(one[0]?.en.toLowerCase().includes("beginning"), true);
  assert.equal(one.at(-1)?.verse, 31);
  const g3 = readingVerses(3).find((v) => v.verse === 15);
  assert.ok(g3?.he.includes("אָשִׁ"));
  assert.ok(!g3?.en.toLowerCase().includes("fire"));
});

test("grade quiz uses verses from that chapter", () => {
  const quiz = readingGradeQuiz(1, 10);
  assert.equal(quiz.length, 10);
  for (const q of quiz) {
    assert.equal(q.verse.chapter, 1);
    assert.ok(q.choices.includes(q.answer));
    assert.equal(q.choices.length, 4);
  }
});

test("recorded chapter audio has a start time for every verse", () => {
  for (const ch of [1, 2, 3, 4, 5]) {
    const n = readingVerses(ch).length;
    const meta = chapterAudio(ch);
    assert.ok(meta, `missing audio for Genesis ${ch}`);
    assert.equal(meta.verses.length, n, `Genesis ${ch} starts ${meta.verses.length} vs ${n} verses`);
    assert.ok(meta.src.endsWith(`01-Gen_0${ch}.mp3`) || meta.src.endsWith(`01-Gen_${String(ch).padStart(2, "0")}.mp3`));
    assert.equal(verseAtTime(ch, meta.verses[0]), 1);
    assert.equal(verseAtTime(ch, meta.verses.at(-1)), n);
    assert.ok(meta.verses[0] > 2, "skip the spoken heading");
    assert.equal(meta.words?.length, n);
    const v1 = readingVerses(ch)[0];
    assert.equal(meta.words?.[0]?.length, v1.words.length);
    assert.equal(wordAtTime(ch, 1, meta.words[0][0]), 0);
    if (v1.words.length > 1) {
      assert.equal(wordAtTime(ch, 1, meta.words[0].at(-1)), v1.words.length - 1);
    }
  }
});

test("slow and fast clocks stay on the recording timeline", () => {
  const start = { media: 12.72, wall: 1_000, rate: 1 };
  assert.equal(mediaClockTime(12.72, false, start, 1_000, 400), 12.72);
  const slow = mediaClockTime(12.72, false, { ...start, rate: 0.7 }, 1_000 + 80, 400);
  assert.ok(slow > 12.72);
  assert.ok(slow <= 12.72 + 0.05 + 1e-9);
  const fast = mediaClockTime(12.72, false, { ...start, rate: 1.25 }, 1_000 + 40, 400);
  assert.ok(fast > 12.72);
  assert.ok(fast <= 12.72 + 0.05 + 1e-9);
  assert.equal(mediaClockTime(18, true, { media: 18, wall: 1_000, rate: 0.7 }, 5_000, 400), 18);
  const runaway = mediaClockTime(12.72, false, { ...start, rate: 1 }, 1_000 + 10_000, 400);
  assert.ok(runaway <= 12.72 + 0.051);
  assert.ok(READ_RATES.some((r) => r.label === "Slow" && r.value === 0.7));
  assert.ok(READ_RATES.some((r) => r.label === "Faster" && r.value === 1.25));
});

test("playhead time labels", () => {
  assert.equal(formatPlayTime(0), "0:00");
  assert.equal(formatPlayTime(72), "1:12");
  assert.equal(formatPlayTime(364.04), "6:04");
});

test("highlight stays on the spoken word interval", () => {
  assert.ok(HIGHLIGHT_LEAD >= 0 && HIGHLIGHT_LEAD <= 0.12);
  const meta = chapterAudio(1);
  const w1 = meta.words[0][1];
  assert.equal(wordAtTime(1, 1, w1), 1);
  assert.equal(wordAtTime(1, 1, w1 + 0.01), 1);
});

test("does not freeze a one-second guess before the MP3 duration is known", () => {
  const verses = readingVerses(1);
  const early = withEstimatedTiming(audioFor("Exod", 1), verses, 0);
  assert.equal(early.aligned, false);
  assert.equal(early.verses.length, 0);
  const later = withEstimatedTiming(early, verses, 364);
  assert.equal(later.verses.length, 31);
  assert.equal(later.words?.length, 31);
  assert.equal(later.aligned, false);
  const locked = withEstimatedTiming(later, verses, 364.2);
  assert.equal(locked.verses[0], later.verses[0]);
});

test("packed word stamps inside a gold verse are re-spaced by syllable weight", () => {
  const verses = readingVerses(1);
  const packed = {
    src: "/x.mp3",
    duration: 40,
    aligned: true,
    verses: [10, 12, 20],
    words: [
      Array.from({ length: verses[0].words.length }, (_, i) => 10 + i * 0.03),
      [12, 12.4],
      [20],
    ],
  };
  const fixed = repairWordTimes(packed, verses.slice(0, 3));
  assert.equal(fixed[0].length, verses[0].words.length);
  assert.ok(fixed[0].at(-1) - fixed[0][0] > 1);
  assert.ok(medianDiff(fixed[0]) > 0.08);
});

test("Genesis 1 word map follows the recording, not a 40ms strobe", () => {
  const meta = chapterAudio(1);
  assert.equal(meta.words.length, 31);
  assert.equal(meta.phones?.length, 31);
  const v1 = meta.words[0];
  assert.ok(v1[1] - v1[0] >= 0.25, `bereshit ${v1[1] - v1[0]}`);
  const v4 = meta.words[3];
  const gaps = v4.slice(1).map((t, i) => t - v4[i]);
  const median = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
  assert.ok(median >= 0.1, `verse 4 median ${median}`);
  assert.ok(v4[0] >= 24 && v4[0] <= 50, `verse 4 start ${v4[0]}`);
  const g2 = chapterAudio(2);
  const v5 = g2.words[4];
  assert.ok(v5.at(-1) - v5[0] >= 6, `Gen 2:5 span ${v5.at(-1) - v5[0]}`);
  assert.ok((g2.verses[5] ?? g2.duration) - g2.verses[4] >= 6, "Gen 2:5 verse window");
});

function medianDiff(starts) {
  const gaps = [];
  for (let i = 1; i < starts.length; i++) gaps.push(starts[i] - starts[i - 1]);
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)] ?? 0;
}

