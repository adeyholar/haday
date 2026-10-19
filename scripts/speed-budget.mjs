import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

/** The signed-out shell must not pull the course lists into the first script. */
test("the public shell does not import the study store or the word lists", () => {
  const shell = readFileSync("/workspace/src/components/app-shell.tsx", "utf8");
  assert.equal(shell.includes("@/lib/store"), false);
  assert.equal(shell.includes("@/lib/vocab"), false);
  assert.equal(shell.includes("@/lib/tanakh-pool"), false);
  assert.equal(shell.includes("@/lib/iibs-game"), false);
  assert.match(shell, /import\("\.\/signed-in-shell"\)/);
});
