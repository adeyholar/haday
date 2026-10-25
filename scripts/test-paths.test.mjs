import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const dir = new URL(".", import.meta.url);

test("tests resolve @ from this repo, not a hard-coded /workspace/src", () => {
  const files = readdirSync(dir).filter((name) => name.endsWith(".test.mjs"));
  const hits = [];
  for (const name of files) {
    if (name === "test-paths.test.mjs") continue;
    const text = readFileSync(new URL(name, dir), "utf8");
    if (text.includes("/workspace/src") || text.includes('alias: { "@": "/workspace')) hits.push(name);
  }
  assert.deepEqual(hits, []);
});
