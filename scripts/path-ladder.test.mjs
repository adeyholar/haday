import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { blockedDestination, homeForAccount, levelOpen, ownerDoorBlock, pathForHeard } = await jiti.import("/workspace/src/lib/path.ts");

test("only Level A is open until an exam is passed", () => {
  assert.equal(levelOpen("A", null, false), true);
  assert.equal(levelOpen("B", null, false), false);
  assert.equal(levelOpen("lab", null, false), false);
});

test("passing a level opens only the next one", () => {
  assert.equal(levelOpen("B", "A", false), true);
  assert.equal(levelOpen("C", "A", false), false);
  assert.equal(levelOpen("lab", "E", false), true);
  assert.equal(levelOpen("lab", "D", false), false);
});

test("the owner opens every level", () => {
  assert.equal(levelOpen("lab", null, true), true);
});

test("a student cannot walk into the other door", () => {
  assert.equal(blockedDestination("/bbh", { path: "iibs", admin: false }), "/");
  assert.equal(blockedDestination("/iibs/B", { path: "bbh", admin: false }), "/");
  assert.equal(blockedDestination("/iibs/A", { path: "iibs", admin: false }), null);
  assert.equal(blockedDestination("/game", { path: "iibs", admin: true }), null);
  assert.equal(blockedDestination("/bbh", { path: null, admin: false }), "/");
  assert.equal(blockedDestination("/", { path: null, admin: false }), null);
});

test("the owner must come back to the doors before switching", () => {
  assert.equal(ownerDoorBlock("/iibs", "bbh"), "/");
  assert.equal(ownerDoorBlock("/bbh", "iibs"), "/");
  assert.equal(ownerDoorBlock("/game", "iibs"), "/");
  assert.equal(ownerDoorBlock("/iibs/A", "iibs"), null);
  assert.equal(ownerDoorBlock("/bbh", "bbh"), null);
  assert.equal(ownerDoorBlock("/game", null), "/");
  assert.equal(ownerDoorBlock("/", "bbh"), null);
});

test("college and IIBS place the course, and internet or a friend must choose", () => {
  assert.equal(pathForHeard("college", ""), "bbh");
  assert.equal(pathForHeard("college", "iibs"), "bbh");
  assert.equal(pathForHeard("iibs", ""), "iibs");
  assert.equal(pathForHeard("iibs", "bbh"), "iibs");
  assert.equal(pathForHeard("other", ""), null);
  assert.equal(pathForHeard("other", "bbh"), "bbh");
  assert.equal(pathForHeard("other", "iibs"), "iibs");
  assert.equal(pathForHeard("", "bbh"), null);
});

test("a signed-in student opens their study from home", () => {
  assert.equal(homeForAccount({ path: "bbh", admin: false }), "/bbh");
  assert.equal(homeForAccount({ path: "iibs", admin: false }), "/iibs");
  assert.equal(homeForAccount({ path: null, admin: false }), null);
  assert.equal(homeForAccount({ path: "bbh", admin: true }), null);
  assert.equal(homeForAccount({ path: "iibs", admin: true }), null);
});
