import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { quizDeck } = await jiti.import("/workspace/src/lib/store.ts");
const { applyRating, newCard } = await jiti.import("/workspace/src/lib/srs.ts");

const now = 1_700_000_000_000;
const word = (id) => ({ id, hebrew: id, gloss: id, translit: id, week: 1 });

test("weak book is missed words only, most misses first", () => {
  const known = applyRating(applyRating(applyRating(newCard(now), "easy", now), "easy", now), "easy", now);
  const once = applyRating(newCard(now), "again", now);
  const often = applyRating(applyRating(applyRating(newCard(now), "again", now), "again", now), "reveal", now);
  const pool = [word("known"), word("once"), word("often"), word("new")];
  const cards = { known, once, often };
  const deck = quizDeck(pool, cards, "weak", now);
  assert.deepEqual(deck.map((w) => w.id), ["often", "once"]);
});

test("due and weak come first, then every other word", () => {
  const once = applyRating(newCard(now), "again", now);
  const often = applyRating(applyRating(newCard(now), "again", now), "again", now);
  const known = applyRating(applyRating(applyRating(newCard(now), "easy", now), "easy", now), "easy", now);
  known.due = now + 86_400_000 * 30;
  const pool = [word("known"), word("once"), word("often"), word("new")];
  const cards = { known, once, often };
  const deck = quizDeck(pool, cards, "due", now).map((w) => w.id);
  assert.deepEqual(deck.slice(0, 2), ["often", "once"]);
  assert.equal(deck.length, 4);
  assert.ok(deck.includes("known"));
  assert.ok(deck.includes("new"));
  assert.ok(deck.indexOf("new") < deck.indexOf("known"));
});
