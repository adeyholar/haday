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
  assert.equal(form("halak", "qal", "wayyiqtol", "3ms").endsWith("ךְ"), true);
  assert.equal(form("barak", "piel", "perfect", "3ms").endsWith("ךְ"), true);
  const hishtammer = "\u05d4\u05b4\u05e9\u05c1\u05b0\u05ea\u05bc\u05b7\u05de\u05bc\u05b5\u05e8";
  const hizdakker = "\u05d4\u05b4\u05d6\u05b0\u05d3\u05bc\u05b7\u05db\u05bc\u05b5\u05e8";
  assert.equal(form("shamar", "hithpael", "perfect", "3ms"), hishtammer);
  assert.equal(form("zakar", "hithpael", "perfect", "3ms"), hizdakker);
  assert.equal(form("shakan", "qal", "perfect", "1cp"), "\u05e9\u05c1\u05b8\u05db\u05b7\u05ab\u05e0\u05bc\u05d5\u05bc");
});

test("Qal weak forms the Tutor marked", () => {
  const form = (id, stem, conj, cell) => vs.openPattern(id, stem, conj).cells.find((row) => row.id === cell);
  assert.equal(form("banah", "qal", "perfect", "2mp").form, "בְּנִיתֶם");
  assert.equal(form("banah", "qal", "perfect", "2mp").form.includes("תּ"), false);
  assert.equal(vs.rootById("nagash").dots[2], "shin");
  assert.equal(form("nagash", "qal", "perfect", "3ms").form, "נָגַשׁ");
  assert.equal(form("nagash", "qal", "imperative", "ms").form, "גַּשׁ");
  assert.equal(form("nagash", "qal", "imperative", "long").form, "גְּשָׁה");
  assert.equal(form("nagash", "qal", "imperative", "fs").form, "גְּשִׁי");
  assert.equal(form("nagash", "qal", "imperative", "mp").form, "גְּשׁוּ");
  assert.equal(form("nagash", "qal", "imperative", "fp").form, "גַּשְׁנָה");
  const fell = form("nafal", "qal", "imperative", "ms");
  assert.equal(fell.form, "נְפֹל");
  assert.equal(fell.form.includes("פּ"), false);
  assert.match(fell.note, /nun stays/);
  assert.doesNotMatch(fell.note, /nun is gone/);
  assert.equal(form("nafal", "qal", "imperative", "fs").form, "נִפְלִי");
  assert.equal(form("nafal", "qal", "imperative", "mp").form, "נִפְלוּ");
});

test("the forms the Tutor marked are pointed", () => {
  const form = (id, stem, conj, cell) => vs.openPattern(id, stem, conj).cells.find((row) => row.id === cell).form;
  assert.equal(form("qatal", "qal", "imperfect", "3ms"), "יִקְטֹל");
  assert.equal(form("qatal", "qal", "imperfect", "2ms"), "תִּקְטֹל");
  assert.equal(form("katav", "niphal", "perfect", "3ms"), "נִכְתַּב");
  assert.equal(form("katav", "niphal", "participle", "ms"), "נִכְתָּב");
  assert.equal(form("shamar", "hithpael", "perfect", "3ms"), "הִשְׁתַּמֵּר");
  assert.equal(form("zakar", "hithpael", "perfect", "3ms"), "הִזְדַּכֵּר");
  assert.equal(form("malak", "qal", "perfect", "3ms").endsWith("ךְ"), true);
  assert.equal(form("qatal", "qal", "participle", "fs"), "קֹטֶלֶת");
  assert.equal(form("qatal", "hiphil", "participle", "mp"), "מַקְטִילִים");
  assert.equal(form("lamad", "qal", "imperfect", "3ms"), "יִלְמַד");
  assert.equal(form("katav", "niphal", "imperfect", "3ms").includes("תּ"), false);
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
  assert.ok(pattern.slots.some((item) => item.id === "v3"));
  assert.equal(pattern.cells.every((row) => row.answer.v3), true);
});

test("the student chooses a pool and a consonant, then passes every form", () => {
  assert.deepEqual(
    vs.consonantsInPool("bi").map((row) => row.letter),
    ["ו", "י"],
  );
  assert.ok(vs.rootsForConsonant("other", "נ").some((root) => root.id === "nafal"));
  assert.ok(vs.rootsForConsonant("tri", "ש").some((root) => root.id === "shamar"));
  assert.equal(vs.rootsForConsonant("tri", "ש").some((root) => root.id === "nafal"), false);
  const pattern = vs.openPattern("shamar", "qal", "perfect");
  assert.equal(pattern.cells.length, 9);
  assert.equal(vs.passDeck(pattern.cells, () => 0).length, 9);
  assert.equal(vs.passedAll(9, 9), true);
  assert.equal(vs.passedAll(8, 9), false);
  const wayy = vs.openPattern("shamar", "qal", "wayyiqtol");
  assert.ok(wayy.cells.some((row) => row.id === "3fp"));
  assert.ok(wayy.cells.some((row) => row.id === "2fp"));
  const jussive = vs.openPattern("shamar", "qal", "jussive");
  assert.equal(jussive.cells.some((row) => row.id === "1cs"), false);
  assert.equal(jussive.cells.length, 8);
  const cohort = vs.openPattern("shamar", "qal", "cohortative");
  assert.equal(cohort.cells.length, 2);
  assert.ok(cohort.cells.every((row) => row.form.includes("ה")));
  assert.ok(vs.openPattern("katav", "hiphil", "imperfect").cells.some((row) => row.id === "3fp"));
  assert.ok(vs.openPattern("shamar", "hithpael", "perfect").cells.some((row) => row.id === "2fs"));
});

