import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { parseRoadLetter, parseRoadHeard, roadChoices, buildRoadDeck, glossHead, parkMiss, packRoadRun, unpackRoadRun } = await jiti.import("/workspace/src/lib/road-exam.ts");
const { itemsForWeek } = await jiti.import("/workspace/src/lib/vocab.ts");

test("spoken letters map to A B C D", () => {
  assert.equal(parseRoadLetter("A"), "A");
  assert.equal(parseRoadLetter("it's bee"), "B");
  assert.equal(parseRoadLetter("see"), "C");
  assert.equal(parseRoadLetter("option dee"), "D");
  assert.equal(parseRoadLetter("hello there"), null);
});

test("the English word on the button counts, and a later letter can correct it", () => {
  const choices = [
    { letter: "A", gloss: "hat" },
    { letter: "B", gloss: "father" },
    { letter: "C", gloss: "Abraham" },
    { letter: "D", gloss: "and" },
  ];
  assert.equal(parseRoadHeard("hat", choices), "A");
  assert.equal(parseRoadHeard("a hat", choices), "A");
  assert.equal(parseRoadHeard("it's Abraham", choices), "C");
  assert.equal(parseRoadHeard("bee", choices), "B");
  assert.equal(parseRoadHeard("father, A", choices), "A");
  assert.equal(parseRoadHeard("A, father", choices), "B");
  assert.equal(parseRoadHeard("Abraham and", choices), "C");
  assert.equal(parseRoadHeard("and", choices), "D");
  assert.equal(parseRoadHeard("hello there", choices), null);
  const short = [
    { letter: "A", gloss: "to" },
    { letter: "B", gloss: "land" },
    { letter: "C", gloss: "day" },
    { letter: "D", gloss: "king" },
  ];
  assert.equal(parseRoadHeard("to", short), "A");
  assert.equal(parseRoadHeard("to the land", short), "B");
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

test("a miss goes to the back of the deck, and a later miss goes back again", () => {
  const deck = [
    { key: "a:0" },
    { key: "b:1" },
    { key: "c:2" },
  ];
  const next = parkMiss(deck, deck[0]);
  assert.deepEqual(
    next.map((c) => c.key),
    ["a:0", "b:1", "c:2", "a:0:back:1"],
  );
  const again = parkMiss(next, next[3]);
  assert.deepEqual(
    again.map((c) => c.key),
    ["a:0", "b:1", "c:2", "a:0:back:1", "a:0:back:2"],
  );
});

test("a road circle packs, resumes, and drops when it is finished", () => {
  const pool = itemsForWeek(7);
  const deck = buildRoadDeck(pool);
  const parked = parkMiss(deck, deck[0]);
  const packed = packRoadRun(parked, 2, 4, 3);
  assert.ok(packed);
  assert.equal(packed.index, 2);
  assert.equal(packed.order.length, pool.length + 1);
  assert.equal(packed.order[packed.order.length - 1].id, deck[0].item.id);
  const back = unpackRoadRun(packed, pool);
  assert.ok(back);
  assert.equal(back.index, 2);
  assert.equal(back.heard, 4);
  assert.equal(back.held, 3);
  assert.equal(back.queue[2].item.id, parked[2].item.id);
  assert.deepEqual(back.queue[2].choices, parked[2].choices);
  assert.equal(back.queue[back.queue.length - 1].key, parked[parked.length - 1].key);
  assert.equal(packRoadRun(deck, deck.length, 1, 1), null);
  assert.equal(unpackRoadRun({ ...packed, index: packed.order.length }, pool), null);
  const broken = {
    ...packed,
    order: packed.order.map((slot, n) => (n === 0 ? { ...slot, id: "missing-word" } : slot)),
  };
  assert.equal(unpackRoadRun(broken, pool), null);
});

test("a saved road circle survives game hydrate", async () => {
  const { hydrateGame, defaultGame } = await jiti.import("/workspace/src/lib/game.ts");
  const pool = itemsForWeek(7);
  const deck = buildRoadDeck(pool);
  const run = packRoadRun(deck, 3, 5, 4);
  const game = hydrateGame({ ...defaultGame(), roadRun: run });
  assert.equal(game.roadRun?.index, 3);
  assert.equal(game.roadRun?.order[3].id, deck[3].item.id);
  const again = hydrateGame(JSON.parse(JSON.stringify(game)));
  assert.equal(again.roadRun?.heard, 5);
  assert.equal(again.roadRun?.held, 4);
  assert.equal(hydrateGame({ roadRun: { order: [], index: 0 } }).roadRun, null);
});

test("road exam does not play clap or miss sounds", () => {
  const src = readFileSync(new URL("../src/routes/game/road.tsx", import.meta.url), "utf8");
  assert.equal(src.includes("playFeedback"), false);
  assert.equal(src.includes("playGrade"), false);
  assert.equal(src.includes("playAww"), false);
  assert.equal(src.includes("speakLine"), false);
  assert.match(src, /label="Retry"/);
  assert.match(src, /label="Not quite"/);
  assert.match(src, /bg-good/);
  assert.match(src, /bg-danger/);
  assert.equal(src.includes("bg-bad"), false);
  assert.match(src, /saveRoadRun/);
  assert.match(src, /Continue — word/);
  assert.match(src, /Circle clear/);
  assert.equal(src.includes('endsWith(":back")'), false);
});
