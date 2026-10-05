import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { activeStudyStamp } = await jiti.import("/workspace/src/lib/store.ts");

const DAY_GAP = 3;

function localNoon(y, m, d, hour = 12) {
  return new Date(y, m, d, hour, 0, 0, 0).getTime();
}

test("a first study action starts a 1-day streak and one session", () => {
  const now = localNoon(2026, 9, 4);
  const stamp = activeStudyStamp(0, 0, 0, now);
  assert.equal(stamp.streak, 1);
  assert.equal(stamp.sessions, 1);
  assert.equal(stamp.lastStudyDay, new Date(2026, 9, 4).setHours(0, 0, 0, 0));
});

test("another answer the same day does not add a session or a streak day", () => {
  const now = localNoon(2026, 9, 4);
  const first = activeStudyStamp(0, 0, 0, now);
  const again = activeStudyStamp(first.lastStudyDay, first.streak, first.sessions, localNoon(2026, 9, 4, 18));
  assert.equal(again.streak, 1);
  assert.equal(again.sessions, 1);
  assert.equal(again.lastStudyDay, first.lastStudyDay);
});

test("the next calendar day continues the streak", () => {
  const now = localNoon(2026, 9, 4);
  const first = activeStudyStamp(0, 0, 0, now);
  const next = activeStudyStamp(first.lastStudyDay, first.streak, first.sessions, localNoon(2026, 9, 5));
  assert.equal(next.streak, 2);
  assert.equal(next.sessions, 2);
});

test("a gap resets the streak to 1", () => {
  const now = localNoon(2026, 9, 4);
  const first = activeStudyStamp(0, 0, 0, now);
  const later = activeStudyStamp(first.lastStudyDay, first.streak, first.sessions, localNoon(2026, 9, 4 + DAY_GAP));
  assert.equal(later.streak, 1);
  assert.equal(later.sessions, 2);
});

test("study quizzes call the study-day stamp", () => {
  const quiz = readFileSync(new URL("../src/routes/quiz.tsx", import.meta.url), "utf8");
  const self = readFileSync(new URL("../src/routes/self-quiz.tsx", import.meta.url), "utf8");
  const rules = readFileSync(new URL("../src/routes/rules.tsx", import.meta.url), "utf8");
  const classify = readFileSync(new URL("../src/components/classify-drill.tsx", import.meta.url), "utf8");
  const grammar = readFileSync(new URL("../src/components/grammar-play.tsx", import.meta.url), "utf8");
  assert.match(quiz, /rate\(item\.id/);
  assert.match(quiz, /noteActiveStudy\(\)/);
  assert.match(self, /rate\(id,/);
  assert.match(self, /onAttempt=\{noteActiveStudy\}/);
  assert.match(rules, /noteActiveStudy\(\)/);
  assert.match(classify, /noteActiveStudy\(\)/);
  assert.match(grammar, /noteActiveStudy\(\)/);
});
