import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const vs = await jiti.import(join(root, "src/lib/verbal-system.ts"));

test("every paradigm root, stem, and conjugation is internally consistent", () => {
  assert.deepEqual(vs.auditPatterns(), []);
});

test("a strong root opens every stem; a weak root does not", () => {
  assert.deepEqual(vs.stemsFor("katav"), ["qal", "niphal", "piel", "pual", "hiphil", "hophal", "hithpael"]);
  assert.deepEqual(vs.stemsFor("nafal"), ["qal"]);
  assert.ok(vs.conjsFor("nafal", "qal").includes("perfect"));
  assert.ok(vs.conjsFor("nafal", "qal").includes("imperfect"));
  assert.ok(vs.stemsFor("shamar").includes("hithpael"));
  assert.ok(vs.conjsFor("katav", "hithpael").includes("perfect"));
});

test("Tanakh paradigm forms the class already knows", () => {
  const form = (id, stem, conj, cell) => vs.openPattern(id, stem, conj).cells.find((row) => row.id === cell).form;
  assert.equal(form("shamar", "qal", "perfect", "3ms"), "שָׁמַר");
  assert.equal(form("shamar", "qal", "perfect", "3fs"), "\u05e9\u05c1\u05b8\u05bd\u05de\u05b0\u05e8\u05b8\u05d4");
  assert.equal(form("shamar", "qal", "perfect", "2ms"), "\u05e9\u05c1\u05b8\u05de\u05b7\u05ab\u05e8\u05b0\u05ea\u05bc\u05b8");
  assert.equal(form("shamar", "qal", "imperfect", "3ms"), "יִשְׁמֹר");
  assert.equal(form("shamar", "qal", "wayyiqtol", "3ms"), "וַיִּשְׁמֹר");
  assert.equal(form("amad", "qal", "imperfect", "3ms"), "יַעֲמֹד");
  assert.equal(form("amar", "qal", "imperfect", "3ms"), "יֹאמַר");
  assert.equal(form("amar", "qal", "wayyiqtol", "3ms"), "וַיֹּאמֶר");
  assert.equal(form("nafal", "qal", "perfect", "3ms"), "נָפַל");
  assert.equal(form("nafal", "qal", "imperfect", "3ms"), "יִפֹּל");
  assert.equal(form("natan", "qal", "perfect", "3ms"), "נָתַן");
  assert.equal(form("natan", "qal", "imperfect", "3ms"), "יִתֵּן");
  assert.equal(form("yashav", "qal", "perfect", "3ms"), "יָשַׁב");
  assert.equal(form("yashav", "qal", "imperfect", "3ms"), "יֵשֵׁב");
  assert.equal(form("qum", "qal", "perfect", "3ms"), "קָם");
  assert.equal(form("qum", "qal", "wayyiqtol", "3ms"), "וַיָּקָם");
  assert.equal(form("bo", "qal", "wayyiqtol", "3ms"), "וַיָּבֹא");
  assert.equal(form("asah", "qal", "perfect", "2ms"), "עָשִׂיתָ");
  assert.equal(form("raah", "qal", "wayyiqtol", "3ms"), "וַיַּרְא");
  assert.equal([...form("halak", "qal", "wayyiqtol", "3ms")].at(-1), "ך");
  assert.equal([...form("barak", "piel", "perfect", "3ms")].at(-1), "ך");
  const hishtammer = "\u05d4\u05b4\u05e9\u05c1\u05b0\u05ea\u05b7\u05de\u05bc\u05b5\u05e8";
  const hizdakker = "\u05d4\u05b4\u05d6\u05b0\u05d3\u05b7\u05db\u05bc\u05b5\u05e8";
  assert.equal(form("shamar", "hithpael", "perfect", "3ms"), hishtammer);
  assert.equal(form("zakar", "hithpael", "perfect", "3ms"), hizdakker);
  assert.equal(form("shakan", "qal", "perfect", "1cp"), "\u05e9\u05c1\u05b8\u05db\u05b7\u05ab\u05e0\u05bc\u05d5\u05bc");
});

test("a round is ten builds and 90% clears it", () => {
  const pattern = vs.openPattern("shamar", "qal", "perfect");
  const deck = vs.dealRound(pattern.cells, () => 0);
  assert.equal(deck.length, vs.ROUND);
  assert.equal(vs.PASS, 90);
  assert.equal(vs.cleared(9), true);
  assert.equal(vs.cleared(8), false);
  const cell = pattern.cells[0];
  assert.equal(vs.gradeCell(pattern, cell, cell.answer).ok, true);
  assert.equal(vs.gradeCell(pattern, cell, {}).ok, false);
});
