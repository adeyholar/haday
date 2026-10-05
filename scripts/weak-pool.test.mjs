import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { weakPool, packWeakRun, hydrateWeakRun, unpackWeakRun } = await jiti.import("/workspace/src/lib/weak-pool.ts");
const { hydrateGame, defaultGame } = await jiti.import("/workspace/src/lib/game.ts");

function word(id) {
  return {
    id,
    hebrew: id,
    translit: id,
    gloss: id,
    alts: [],
    pos: "noun",
    chapter: 3,
    freq: 1,
  };
}

function card(over) {
  return {
    ease: 2.5,
    interval: 0,
    due: 0,
    reps: 0,
    lapses: 0,
    last: 1,
    hits: 0,
    misses: 0,
    reveals: 0,
    recent: [],
    ...over,
  };
}

const items = [word("a"), word("b"), word("c")];

test("the pool is every weak word, told answers first", () => {
  const cards = {
    a: card({ misses: 1 }),
    b: card({ misses: 1, reveals: 1 }),
    c: card({ hits: 3, reps: 3, interval: 7 }),
  };
  const pool = weakPool(cards, items);
  assert.deepEqual(
    pool.map((item) => item.id),
    ["b", "a"],
  );
});

test("a saved pool resumes on the same word and skips a missing one", () => {
  const run = packWeakRun(["a", "gone", "b"], 2);
  assert.equal(run.index, 2);
  const back = unpackWeakRun(run, items);
  assert.deepEqual(
    back.queue.map((item) => item.id),
    ["a", "b"],
  );
  assert.equal(back.index, 1);
  assert.equal(back.queue[back.index].id, "b");
  const skipped = unpackWeakRun(packWeakRun(["a", "gone", "b"], 1), items);
  assert.equal(skipped.queue[skipped.index].id, "b");
  assert.equal(packWeakRun(["a"], 1), null);
  assert.equal(hydrateWeakRun({ ids: ["a"], index: 1 }), null);
});

test("a saved weak pool survives game hydrate", () => {
  const run = packWeakRun(["abraham", "moses"], 1);
  const game = hydrateGame({ ...defaultGame(), weakRun: run });
  assert.equal(game.weakRun.index, 1);
  assert.deepEqual(game.weakRun.ids, ["abraham", "moses"]);
  const again = hydrateGame(JSON.parse(JSON.stringify(game)));
  assert.equal(again.weakRun.ids[0], "abraham");
  assert.equal(hydrateGame({ weakRun: { ids: [], index: 0 } }).weakRun, null);
});

test("weak pool page saves the sitting and continues it", () => {
  const src = readFileSync(new URL("../src/routes/weak.tsx", import.meta.url), "utf8");
  assert.match(src, /saveWeakRun/);
  assert.match(src, /Continue — word/);
  assert.match(src, /noteActiveStudy\(\)/);
  assert.match(src, /Try again/);
});
