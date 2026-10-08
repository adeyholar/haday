import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { addedCents, modelRates, monthKey } = await jiti.import("/workspace/src/lib/ask-budget.ts");

test("Haiku stays cheap enough for a class month", () => {
  assert.equal(modelRates("claude-haiku-5-5").inPerM, 10);
  const one = addedCents("claude-haiku-5-5", 8_000, 500);
  assert.ok(one <= 2);
  const month = one * 4_000;
  assert.ok(month < 14_000);
});

test("an unknown model is priced like Sonnet so the cap stops early", () => {
  assert.equal(addedCents("something-new", 1_000_000, 0), 200);
});

test("the month key is UTC", () => {
  assert.equal(monthKey(new Date("2026-10-08T03:00:00Z")), "m:2026-10");
});
