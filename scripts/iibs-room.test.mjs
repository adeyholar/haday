import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { parseIibsRoom } = await jiti.import("/workspace/src/lib/iibs-room.ts");

test("a scripture room is one level, not every level and not the lab", () => {
  assert.equal(parseIibsRoom("A"), "A");
  assert.equal(parseIibsRoom("E"), "E");
  assert.equal(parseIibsRoom("all"), null);
  assert.equal(parseIibsRoom("lab"), null);
  assert.equal(parseIibsRoom("1"), null);
  assert.equal(parseIibsRoom(null), null);
});
