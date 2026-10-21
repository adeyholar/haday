import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const follow = await jiti.import(join(root, "src/lib/wlc-follow.ts"));

test("a matching verse marks the spoken word", () => {
  const verses = [{ words: [{ kq_role: null }, { kq_role: null }] }, { words: [{ kq_role: null }] }];
  const spot = follow.followSpot(verses, [0, 2], [[0, 1], [2]], 1.2);
  assert.deepEqual(spot, { verse: 0, word: 1 });
});

test("a ketiv verse stays on the verse when the counts differ", () => {
  const verses = [{ words: [{ kq_role: "ketiv" }, { kq_role: "qere" }, { kq_role: null }] }];
  const spot = follow.followSpot(verses, [0], [[0]], 0.2);
  assert.deepEqual(spot, { verse: 0, word: null });
});

test("qere is not a spoken slot", () => {
  const verses = [{ words: [{ kq_role: "ketiv" }, { kq_role: "qere" }] }];
  const spot = follow.followSpot(verses, [0], [[0]], 0.2);
  assert.deepEqual(spot, { verse: 0, word: 0 });
});
