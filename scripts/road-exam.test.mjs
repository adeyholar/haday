import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { parseRoadLetter, roadChoices, buildRoadDeck, glossHead } = await jiti.import("/workspace/src/lib/road-exam.ts");
const { itemsForWeek } = await jiti.import("/workspace/src/lib/vocab.ts");

test("spoken letters map to A B C D", () => {
  assert.equal(parseRoadLetter("A"), "A");
  assert.equal(parseRoadLetter("it's bee"), "B");
  assert.equal(parseRoadLetter("see"), "C");
  assert.equal(parseRoadLetter("option dee"), "D");
  assert.equal(parseRoadLetter("hello there"), null);
});

test("week 7 road card has four different glosses and one answer", () => {
  const pool = itemsForWeek(7);
  assert.ok(pool.length > 40);
  const deck = buildRoadDeck(pool);
  assert.equal(deck.length, pool.length);
  const card = deck[0];
  assert.equal(card.choices.length, 4);
  assert.equal(card.choices.filter((c) => c.correct).length, 1);
  const glosses = new Set(card.choices.map((c) => c.gloss.toLowerCase()));
  assert.equal(glosses.size, 4);
  const letters = card.choices.map((c) => c.letter).join("");
  assert.equal(letters, "ABCD");
  const item = pool.find((v) => v.id === "abraham") ?? pool[0];
  const choices = roadChoices(item, pool);
  assert.equal(choices.filter((c) => c.correct)[0].gloss, glossHead(item.gloss));
});

test("road exam does not play clap or miss sounds", () => {
  const src = readFileSync(new URL("../src/routes/game/road.tsx", import.meta.url), "utf8");
  assert.equal(src.includes("playFeedback"), false);
  assert.equal(src.includes("playGrade"), false);
  assert.equal(src.includes("playAww"), false);
  assert.equal(src.includes("speakLine"), false);
  assert.match(src, /label="Retry"/);
  assert.match(src, /label="Not quite"/);
});
