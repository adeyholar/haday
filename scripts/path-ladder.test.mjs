import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { blockedDestination, homeForAccount, levelOpen, noteServerTerm, ownerDoorBlock, pathForHeard, publishTerm, readTerm, secondTermBlock, shouldShowPathChooser, signInLanding, termForAccount, termRevisionNow } = await jiti.import(new URL("../src/lib/path.ts", import.meta.url).pathname);

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
  for (const page of ["/about", "/blogs", "/blogs/aleph", "/learning-hebrabbai", "/learning-hebrabbai/two-paths", "/teachings", "/teachings/aleph", "/legal", "/credits", "/how-to-memorize-biblical-hebrew-vocabulary"]) {
    assert.equal(blockedDestination(page, { path: "iibs", admin: false }), null);
    assert.equal(blockedDestination(page, { path: "bbh", admin: false }), null);
    assert.equal(blockedDestination(page, { path: null, admin: false }), null);
    assert.equal(ownerDoorBlock(page, "bbh"), null);
    assert.equal(ownerDoorBlock(page, "iibs"), null);
    assert.equal(secondTermBlock(page, 2), null);
    assert.equal(secondTermBlock(page, 2, true), null);
  }
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
  assert.equal(signInLanding({ path: null, admin: false }), "/");
  assert.equal(signInLanding({ path: "bbh", admin: false }), "/bbh");
  assert.equal(signInLanding({ path: "iibs", admin: false }), "/iibs");
  assert.equal(shouldShowPathChooser({ signedIn: true, resolved: true, admin: false, path: null }), true);
  assert.equal(shouldShowPathChooser({ signedIn: true, resolved: false, admin: false, path: "bbh" }), false);
  assert.equal(shouldShowPathChooser({ signedIn: true, resolved: true, admin: false, path: "iibs" }), false);
  assert.equal(shouldShowPathChooser({ signedIn: true, resolved: true, admin: true, path: "bbh" }), true);
  assert.equal(shouldShowPathChooser({ signedIn: false, resolved: false, admin: false, path: null }), true);
  const shell = readFileSync(new URL("../src/components/signed-in-shell.tsx", import.meta.url).pathname, "utf8");
  assert.equal(shell.includes('pathname === "/" && studentHome'), false);
  const doors = readFileSync(new URL("../src/routes/index.tsx", import.meta.url).pathname, "utf8");
  assert.match(doors, /shouldShowPathChooser/);
  assert.match(doors, /Continue to your study/);
});

test("each semester is its own room, and the hall is not a room", () => {
  assert.equal(termForAccount({ term: 2 }), 2);
  assert.equal(termForAccount({ term: 1 }), 1);
  assert.equal(secondTermBlock("/drill", 1), null);
  assert.equal(secondTermBlock("/drill", 1, true), "/bbh");
  assert.equal(secondTermBlock("/drill", 2), null);
  assert.equal(secondTermBlock("/quiz", 2), null);
  assert.equal(secondTermBlock("/study/term2/20", 2), null);
  assert.equal(secondTermBlock("/game", 2), "/bbh");
  assert.equal(secondTermBlock("/listen", 2), "/bbh");
  assert.equal(secondTermBlock("/keep", 2), "/bbh");
  assert.equal(secondTermBlock("/study", 2), "/bbh");
  assert.equal(secondTermBlock("/drill", 2, true), "/bbh");
  assert.equal(secondTermBlock("/bbh", 2, true), null);
  assert.equal(secondTermBlock("/ask", 2), null);
  const seen = termRevisionNow();
  publishTerm(2);
  assert.equal(noteServerTerm(1, seen), 2);
  publishTerm(1);
  const home = readFileSync(new URL("../src/routes/bbh.tsx", import.meta.url).pathname, "utf8");
  assert.match(home, /SemesterHall/);
  const doors = readFileSync(new URL("../src/routes/index.tsx", import.meta.url).pathname, "utf8");
  assert.match(doors, /markTermHall/);
});
