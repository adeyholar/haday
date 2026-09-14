import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { derangeAgainst, shuffleOffFirst, derange } = await jiti.import("/workspace/src/lib/quiz-draw.ts");

function tiles(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `w${i}` }));
}

test("derangeAgainst never seats a pair on the same row", () => {
  for (let n = 2; n <= 8; n++) {
    const left = tiles(n);
    for (let t = 0; t < 80; t++) {
      const right = derangeAgainst(left, tiles(n));
      assert.equal(right.length, n);
      for (let i = 0; i < n; i++) {
        assert.notEqual(right[i].id, left[i].id, `row ${i} n=${n}`);
      }
      assert.deepEqual(
        [...right.map((x) => x.id)].sort(),
        left.map((x) => x.id).sort(),
      );
    }
  }
});

test("shuffleOffFirst never parks the answer first when n>1", () => {
  const items = tiles(6);
  for (let t = 0; t < 40; t++) {
    const pad = shuffleOffFirst(items, (x) => x.id === "w3");
    assert.notEqual(pad[0].id, "w3");
    assert.ok(pad.some((x) => x.id === "w3"));
  }
});

test("derange n=2 is a swap", () => {
  const got = derange(["a", "b"]);
  assert.deepEqual(got, ["b", "a"]);
});
