import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { mergeFinalDrillRuns, readFinalDrillRuns, writeFinalDrillRun, clearFinalDrillFile, FINAL_DRILL_STORAGE_KEY } =
  await jiti.import(join(root, "src/lib/final-drill-place.ts"));

function place(index, fingerprint = "list") {
  return { seed: 3, ids: ["banah", "shaal"], index, reviews: [], hits: 1, checks: 2, fingerprint };
}

function memory() {
  const bag = new Map();
  return {
    getItem: (key) => (bag.has(key) ? bag.get(key) : null),
    setItem: (key, value) => bag.set(key, String(value)),
    removeItem: (key) => bag.delete(key),
  };
}

test("a final exam sitting on the device is kept when the server snapshot is older", () => {
  const local = place(12);
  const merged = mergeFinalDrillRuns({ "3:due": place(2, "week") }, { "final:due": local });
  assert.equal(merged["final:due"].index, 12);
  assert.equal(merged["3:due"].fingerprint, "week");

  const ahead = mergeFinalDrillRuns({ "final:due": place(4) }, { "final:due": place(9) });
  assert.equal(ahead["final:due"].index, 9);

  const serverAhead = mergeFinalDrillRuns({ "final:due": place(9) }, { "final:due": place(4) });
  assert.equal(serverAhead["final:due"].index, 9);

  const otherList = mergeFinalDrillRuns({ "final:due": place(4, "old") }, { "final:due": place(9, "new") });
  assert.equal(otherList["final:due"].fingerprint, "old");
});

test("the device copy is written, read back for the same account, and cleared on start over", () => {
  const store = memory();
  writeFinalDrillRun(store, "student-a", "final:due", place(7));
  writeFinalDrillRun(store, "student-a", "final:weak", place(2, "weak"));
  assert.equal(readFinalDrillRuns(store, "student-a")["final:due"].index, 7);
  assert.equal(readFinalDrillRuns(store, "student-a")["final:weak"].index, 2);
  assert.equal(readFinalDrillRuns(store, "student-b")["final:due"], undefined);

  writeFinalDrillRun(store, "student-a", "final:due", null);
  assert.equal(readFinalDrillRuns(store, "student-a")["final:due"], undefined);
  assert.equal(readFinalDrillRuns(store, "student-a")["final:weak"].index, 2);

  clearFinalDrillFile(store);
  assert.equal(store.getItem(FINAL_DRILL_STORAGE_KEY), null);
});
