import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { answerSitting, clockCards, gradeClock, sittingFrom, weqatalOf } = await jiti.import(new URL("../src/lib/qal-clocks.ts", import.meta.url).pathname);
const { openPattern } = await jiti.import(new URL("../src/lib/verbal-system.ts", import.meta.url).pathname);

function form(root, conj, pgn) {
  const pattern = openPattern(root, "qal", conj);
  return pattern.cells.find((cell) => cell.id === pgn).form;
}

test("weqatal is the perfect with the conjunction, not wayyiqtol", () => {
  const shamar = form("shamar", "perfect", "3ms");
  assert.equal(weqatalOf(shamar), "וְ" + shamar);
  const katav = form("katav", "perfect", "3ms");
  assert.equal(weqatalOf(katav), "וְ" + [...katav].filter((ch) => ch !== "\u05BC").join(""));
  const bachar = form("bachar", "perfect", "3ms");
  assert.equal(weqatalOf(bachar), "וּ" + [...bachar].filter((ch) => ch !== "\u05BC").join(""));
  assert.equal(weqatalOf(form("shamar", "perfect", "2mp")), "וּ" + form("shamar", "perfect", "2mp"));
  assert.equal(weqatalOf(form("amad", "perfect", "2mp")), "וַ" + form("amad", "perfect", "2mp"));
  assert.equal(weqatalOf(form("hayah", "perfect", "2mp")), "וֶ" + form("hayah", "perfect", "2mp"));
  const stressed = form("shamar", "perfect", "2ms");
  assert.equal(weqatalOf(stressed), "וְ" + stressed);
  assert.notEqual(weqatalOf(shamar), form("shamar", "wayyiqtol", "3ms"));
});

test("practice deals yiqtol, wayyiqtol, and weqatal", () => {
  const cards = clockCards();
  assert.equal(cards.filter((card) => card.clock === "yiqtol").length, 249);
  assert.equal(cards.filter((card) => card.clock === "wayyiqtol").length, 202);
  assert.equal(cards.filter((card) => card.clock === "weqatal").length, 284);
  const shamar = cards.find((card) => card.rootId === "shamar" && card.clock === "yiqtol" && card.pgn === "3ms");
  assert.equal(shamar.form, "יִשְׁמֹר");
  const story = cards.find((card) => card.rootId === "shamar" && card.clock === "wayyiqtol" && card.pgn === "3ms");
  assert.equal(story.form, "וַיִּשְׁמֹר");
  const want = weqatalOf(form("shamar", "perfect", "2ms"));
  assert.equal(gradeClock(want, want.replace("\u05AB", ""), true).tag, "stress");
  assert.equal(gradeClock("וְשָׁמַר", "ושמר", false).ok, true);
});

test("one root is three rounds, and a miss comes back", () => {
  const cards = [
    { id: "a", clock: "yiqtol", rootId: "shamar", cite: "ש", gloss: "keep", pgn: "3ms", label: "3rd", form: "א" },
    { id: "b", clock: "yiqtol", rootId: "shamar", cite: "ש", gloss: "keep", pgn: "3fs", label: "3rd", form: "ב" },
  ];
  let sitting = sittingFrom(cards);
  assert.equal(sitting.finished, false);
  sitting = answerSitting(sitting, false);
  assert.equal(sitting.queue.map((card) => card.id).join(","), "b,a");
  assert.equal(sitting.misses, 1);
  sitting = answerSitting(sitting, true);
  sitting = answerSitting(sitting, true);
  assert.equal(sitting.round, 2);
  assert.equal(sitting.queue.length, 2);
  sitting = answerSitting(sitting, true);
  sitting = answerSitting(sitting, true);
  assert.equal(sitting.round, 3);
  sitting = answerSitting(sitting, true);
  sitting = answerSitting(sitting, true);
  assert.equal(sitting.finished, true);
  assert.equal(sitting.queue.length, 0);
});
