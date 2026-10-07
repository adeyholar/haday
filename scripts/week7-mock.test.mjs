import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const {
  WEEK7_ITEMS,
  answerMatches,
  startWeek7Run,
  takeWeek7,
  week7Grade,
  week7Item,
} = await jiti.import("/workspace/src/lib/week7-mock.ts");

test("typed answers ignore capitals and punctuation", () => {
  const land = week7Item("x-land");
  const city = week7Item("a-tova");
  assert.ok(land && city);
  assert.equal(answerMatches(land, "And the land."), true);
  assert.equal(answerMatches(land, "and the earth"), true);
  assert.equal(answerMatches(city, "The city is good"), true);
  assert.equal(answerMatches(city, "good is the city"), true);
});

test("and a horse is not and the horse", () => {
  const horse = week7Item("x-and-horse");
  assert.ok(horse);
  assert.equal(answerMatches(horse, "and a horse"), true);
  assert.equal(answerMatches(horse, "and the horse"), false);
});

test("a suffix code, a spaced code, or the English gloss all count", () => {
  const land = week7Item("s-artzo");
  assert.ok(land);
  assert.equal(answerMatches(land, "3MS"), true);
  assert.equal(answerMatches(land, "3 ms"), true);
  assert.equal(answerMatches(land, "his land"), true);
  assert.equal(answerMatches(land, "her land"), false);
});

test("a cloud with the pronoun after it is that cloud, not that is a cloud", () => {
  const cloud = week7Item("d-anan");
  assert.ok(cloud);
  assert.equal(answerMatches(cloud, "that cloud"), true);
  assert.equal(answerMatches(cloud, "that is a cloud"), false);
});

test("a miss returns to the back and does not change the first-answer grade", () => {
  const item = WEEK7_ITEMS[0];
  const start = { order: [item.id], index: 0, first: {}, choices: {} };
  const missed = takeWeek7(start, "nope");
  assert.equal(missed.ok, false);
  assert.equal(missed.run.first[item.id], false);
  assert.deepEqual(missed.run.order, [item.id, item.id]);
  const later = takeWeek7(missed.run, item.accept[0]);
  assert.equal(later.ok, true);
  assert.equal(later.run.first[item.id], false);
  assert.equal(later.done, true);
  assert.deepEqual(week7Grade(later.run), { held: 0, total: WEEK7_ITEMS.length, pct: 0 });
});

test("only a correct first answer counts toward the grade", () => {
  const item = WEEK7_ITEMS[0];
  const start = { order: [item.id], index: 0, first: {}, choices: {} };
  const hit = takeWeek7(start, item.accept[0]);
  assert.equal(hit.run.first[item.id], true);
  const grade = week7Grade(hit.run);
  assert.equal(grade.held, 1);
  assert.equal(grade.total, WEEK7_ITEMS.length);
});

test("the feminine they card offers behold and does not treat it as the answer", () => {
  const run = startWeek7Run(7);
  const hen = week7Item("v-hen");
  assert.ok(hen);
  const choices = run.choices["v-hen"];
  assert.ok(choices.includes("behold"));
  assert.ok(choices.includes("they (feminine)"));
  assert.equal(answerMatches(hen, "behold"), false);
  assert.equal(answerMatches(hen, "they (feminine)"), true);
});
