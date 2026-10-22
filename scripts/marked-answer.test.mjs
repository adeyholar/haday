import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { markedLines } = await jiti.import(new URL("../src/lib/marked-answer.ts", import.meta.url).pathname);

test("a hit shows the answer and hides the repeat of it", () => {
  assert.deepEqual(markedLines(true, "king", "king"), { wrote: undefined, answer: "king" });
});

test("a miss shows what was written and the answer", () => {
  assert.deepEqual(markedLines(false, "queen", "king"), { wrote: "queen", answer: "king" });
});

test("a give-up is not treated as something the student wrote", () => {
  assert.deepEqual(markedLines(false, "__noidea__", "מֶלֶךְ"), { wrote: undefined, answer: "מֶלֶךְ" });
});
