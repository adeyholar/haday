import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const box = "/work" + "space/";

test("unit tests do not hard-code the build box path", () => {
  const hits = [];
  for (const name of readdirSync(new URL(".", import.meta.url))) {
    if (!name.endsWith(".test.mjs")) continue;
    const text = readFileSync(new URL(name, import.meta.url), "utf8");
    if (text.includes(box)) hits.push(name);
  }
  assert.deepEqual(hits, []);
});
