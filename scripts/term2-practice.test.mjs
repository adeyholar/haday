import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const game = await jiti.import(new URL("../src/lib/term2-game.ts", import.meta.url).pathname);
const exams = await jiti.import(new URL("../src/lib/term2-exams.ts", import.meta.url).pathname);
const cards = await jiti.import(new URL("../src/lib/card-ids.ts", import.meta.url).pathname);
const path = await jiti.import(new URL("../src/lib/path.ts", import.meta.url).pathname);
const core = await jiti.import(new URL("../src/lib/game.ts", import.meta.url).pathname);
const vocab = await jiti.import(new URL("../src/lib/vocab-s2.ts", import.meta.url).pathname);

const pass = { stars: 3, score: 90, firstTryRate: 0.9 };
const miss = { stars: 1, score: 89, firstTryRate: 0.89 };

test("semester 2 game scores stay off the first-term map", () => {
  const start = game.emptyTerm2Game();
  assert.equal(game.isTerm2ChapterUnlocked(start, 20), true);
  assert.equal(game.isTerm2ChapterUnlocked(start, 21), false);
  assert.equal(game.isTerm2ExamUnlocked(start, 20), true);
  assert.equal(game.isTerm2ExamUnlocked(start, 21), false);

  let g = start;
  for (const stage of ["recognize", "gloss", "spell-lenient"]) {
    g = game.applyTerm2Stage(g, 20, stage, pass);
  }
  assert.equal(g.chapters["20"].cleared, true);
  assert.equal(g.unlockedChapter, 21);
  assert.equal(game.isTerm2ChapterUnlocked(g, 21), true);

  const failed = game.applyTerm2Stage(game.emptyTerm2Game(), 20, "recognize", miss);
  assert.equal(failed.chapters["20"].stages.recognize.cleared, false);
  assert.equal(failed.unlockedChapter, 20);

  const examMiss = game.applyTerm2Exam(start, 20, { stars: 1, score: 80 });
  assert.equal(examMiss.exams["20"].cleared, false);
  assert.equal(game.isTerm2ExamUnlocked(examMiss, 21), false);
  const examHit = game.applyTerm2Exam(start, 20, { stars: 3, score: 90 });
  assert.equal(examHit.exams["20"].cleared, true);
  assert.equal(game.isTerm2ExamUnlocked(examHit, 21), true);
  assert.equal(game.applyTerm2Exam(start, 21, { stars: 3, score: 100 }).exams["21"], undefined);

  const sealed = core.hydrateGame({
    unlockedChapter: 4,
    chapters: { "3": { cleared: true, stars: 9, stages: {} } },
    term2: examHit,
  });
  assert.equal(sealed.term2.exams["20"].cleared, true);
  assert.equal(sealed.chapters["20"], undefined);
  const afterClass = core.applyStageResult(sealed, 1, "recognize", pass);
  assert.equal(afterClass.term2.exams["20"].cleared, true);
  assert.equal(afterClass.chapters["20"], undefined);
});

test("closed-book exams cover chapters 20 through 35", () => {
  const chapters = exams.term2ExamChapters();
  assert.deepEqual(chapters, [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]);
  for (const chapter of chapters) {
    const rows = exams.term2Exam(chapter);
    assert.equal(rows.length, 10, `chapter ${chapter}`);
    for (const row of rows) {
      assert.equal(new Set(row.choices).size, 4, row.q);
      assert.ok(row.choices.includes(row.answer));
      assert.ok(row.why.length > 10);
    }
  }
});

test("saves stay on the semester 2 list, and Semester 1 Game stays shut", () => {
  assert.ok(vocab.term2Vocab().every((item) => item.id.startsWith("s2-")));
  assert.equal(cards.keepStudyCards({ "s2-20-1": { reps: 3 }, "s2-99-9": { reps: 9 } })["s2-20-1"].reps, 3);
  assert.equal(cards.keepStudyCards({ "s2-99-9": { reps: 9 } })["s2-99-9"], undefined);
  assert.equal(path.secondTermBlock("/study/term2/game", 2), null);
  assert.equal(path.secondTermBlock("/study/term2/listen", 2), null);
  assert.equal(path.secondTermBlock("/study/term2/listen/road", 2), null);
  assert.equal(path.secondTermBlock("/study/term2/exam/20", 2), null);
  assert.equal(path.secondTermBlock("/game", 2), "/bbh");
  assert.equal(path.secondTermBlock("/listen", 2), "/bbh");
  assert.equal(path.secondTermBlock("/study/term2/game", 2, true), "/bbh");
});
