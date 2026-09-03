import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { cleanTitle, cleanBody, parseArea, parseStatus, IDEA_STATUSES } = await jiti.import("/workspace/src/lib/idea-text.ts");

test("idea text is trimmed and capped", () => {
  assert.equal(cleanTitle("  Slow   Genesis  "), "Slow Genesis");
  assert.equal(cleanTitle("x".repeat(200)).length, 80);
  assert.equal(cleanBody("  hello class  ").startsWith("hello"), true);
  assert.equal(cleanBody("y".repeat(2000)).length, 800);
});

test("area and status fall back safely", () => {
  assert.equal(parseArea("listen"), "listen");
  assert.equal(parseArea("nonsense"), "app");
  assert.equal(parseStatus("planned"), "planned");
  assert.equal(parseStatus(""), "new");
  assert.ok(IDEA_STATUSES.includes("shipped"));
});
