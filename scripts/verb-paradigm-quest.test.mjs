import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const quest = await jiti.import(join(root, "src/lib/verb-paradigm-quest.ts"));
const game = await jiti.import(join(root, "src/lib/game.ts"));

const Q = "\u05B8";
const P = "\u05B7";
const S = "\u05B0";
const H = "\u05B4";
const E = "\u05B6";
const D = "\u05BC";
const O = "\u05AB";
const M = "\u05BD";
const SHIN = "\u05C1";

const chart = {
  "3ms": "ק" + Q + "ט" + P + "ל",
  "3fs": "ק" + Q + M + "ט" + S + "ל" + Q + "ה",
  "2ms": "ק" + Q + "ט" + P + O + "ל" + S + "ת" + D + Q,
  "2fs": "ק" + Q + "ט" + P + "ל" + S + "ת" + D + S,
  "1cs": "ק" + Q + "ט" + P + O + "ל" + S + "ת" + D + H + "י",
  "3cp": "ק" + Q + M + "ט" + S + "ל" + "ו" + D,
  "2mp": "ק" + S + "ט" + P + "ל" + S + "ת" + D + E + "ם",
  "2fp": "ק" + S + "ט" + P + "ל" + S + "ת" + D + E + "ן",
  "1cp": "ק" + Q + "ט" + P + O + "ל" + S + "נ" + "ו" + D,
};

test("the nine Qal perfect forms match the chart, including accent and meteg", () => {
  const forms = quest.qalPerfect(quest.QATAL);
  assert.equal(forms.length, 9);
  for (const row of forms) {
    assert.equal(row.form, quest.canonicalize(chart[row.pgn]), row.pgn);
  }
  const by = Object.fromEntries(forms.map((row) => [row.pgn, row.form]));
  assert.equal(by["2ms"].includes(O), true);
  assert.equal(by["1cs"].includes(O), true);
  assert.equal(by["1cp"].includes(O), true);
  assert.equal(by["3ms"].includes(O), false);
  assert.equal(by["3fs"].includes(M), true);
  assert.equal(by["3cp"].includes(M), true);
  assert.equal(by["2fs"].includes(M), false);
});

test("accent and meteg count, in either order, and a missing dot is wrong", () => {
  const forms = Object.fromEntries(quest.qalPerfect(quest.QATAL).map((row) => [row.pgn, row.form]));
  const swapped = forms["2ms"].replace("ט" + P + O, "ט" + O + P);
  assert.equal(quest.canonicalize(swapped), forms["2ms"]);
  const missing = quest.gradeVerb(forms["2ms"].replaceAll(O, ""), forms["2ms"], "2ms");
  assert.equal(missing.correct, false);
  assert.equal(missing.nudge, "accent");
  const extra = quest.gradeVerb(forms["3ms"] + O, forms["3ms"], "3ms");
  assert.equal(extra.correct, false);
  assert.equal(extra.nudge, "accent");
  const noMeteg = quest.gradeVerb(forms["3fs"].replaceAll(M, ""), forms["3fs"], "3fs");
  assert.equal(noMeteg.correct, false);
  assert.equal(noMeteg.nudge, "meteg");
  const noDagesh = quest.gradeVerb(forms["2ms"].replaceAll(D, ""), forms["2ms"], "2ms");
  assert.equal(noDagesh.correct, false);
  assert.equal(noDagesh.nudge, null);
});

test("new roots keep dagesh, shin, and final kaf, and weak roots stay out", () => {
  const roots = quest.transferRoots();
  const ids = roots.map((row) => row.id);
  for (const id of ["shamar", "katab", "zakar-v", "malak", "paqad"]) assert.equal(ids.includes(id), true, id);
  for (const id of ["banah", "kaved", "natan"]) assert.equal(ids.includes(id), false, id);
  const katab = roots.find((row) => row.id === "katab");
  const wrote = quest.qalPerfect(katab).find((row) => row.pgn === "3ms").form;
  assert.equal(wrote.includes("כ" + D) || wrote.includes(D), true);
  assert.equal(wrote.startsWith("כ"), true);
  const shamar = roots.find((row) => row.id === "shamar");
  const guarded = quest.qalPerfect(shamar).find((row) => row.pgn === "3ms").form;
  assert.equal(guarded.includes(SHIN), true);
  const bare = quest.gradeVerb(guarded.replaceAll(SHIN, ""), guarded, "3ms", "מ");
  assert.equal(bare.correct, false);
  const malak = roots.find((row) => row.id === "malak");
  const reigned = quest.qalPerfect(malak);
  assert.equal(reigned.find((row) => row.pgn === "3ms").form.includes("ך"), true);
  assert.equal(reigned.find((row) => row.pgn === "2ms").form.includes("ך"), false);
  assert.equal(reigned.find((row) => row.pgn === "2ms").form.includes("כ"), true);
});

test("a guttural at the start takes hateph pathach, not plain shewa", () => {
  const roots = quest.transferRoots();
  const akol = roots.find((row) => row.id === "akol");
  const ate = quest.qalPerfect(akol).find((row) => row.pgn === "2mp").form;
  assert.equal(ate.includes("\u05B2"), true);
  assert.equal(ate.startsWith("א\u05B0"), false);
  const said = quest.qalPerfect(roots.find((row) => row.id === "amar")).find((row) => row.pgn === "2mp").form;
  assert.equal(said.includes("א\u05B2"), true);
});

test("a second accent miss only moves the mark", () => {
  const form = quest.qalPerfect(quest.QATAL).find((row) => row.pgn === "2ms").form;
  const missing = form.replaceAll("\u05AB", "");
  const placed = quest.placeRequiredMark(missing, form);
  assert.equal(placed, form);
  assert.equal([...placed].length > 4, true);
  const wrongPlace = missing + "\u05AB";
  assert.equal(quest.placeRequiredMark(wrongPlace, form), form);
});

test("a wrong vowel is not hidden behind the accent note", () => {
  const form = quest.qalPerfect(quest.QATAL).find((row) => row.pgn === "2ms").form;
  const bad = form.replace("\u05B7", "\u05B6").replaceAll("\u05AB", "");
  const graded = quest.gradeVerb(bad, form, "2ms");
  assert.equal(graded.nudge, null);
  assert.equal(graded.correct, false);
  assert.equal(graded.lines.some((line) => line.startsWith("Check the vowel")), true);
  assert.equal(graded.lines[0].startsWith("Almost"), false);
});

test("an unfinished 3fs is not accused of a missing meteg", () => {
  const form = quest.qalPerfect(quest.QATAL).find((row) => row.pgn === "3fs").form;
  const short = quest.gradeVerb("ק", form, "3fs");
  assert.equal(short.correct, false);
  assert.equal(short.lines[0], "That is not the full form yet.");
  assert.equal(short.lines.some((line) => /meteg/i.test(line)), false);
  const withMeteg = quest.gradeVerb("ק" + Q + M, form, "3fs");
  assert.equal(withMeteg.lines.some((line) => /forgot the meteg|Tap Meteg/i.test(line)), false);
  const bare = form.replaceAll(M, "");
  const missing = quest.gradeVerb(bare, form, "3fs");
  assert.equal(missing.nudge, "meteg");
  assert.equal(missing.lines.some((line) => /Qamets is not the meteg/.test(line)), true);
  const placed = quest.placeChosenMark("ק" + Q, form, M);
  assert.equal(placed.status, "placed");
  const kept = placed.text + "ט" + S + "ל" + Q + "ה";
  assert.equal(quest.gradeVerb(kept, form, "3fs").correct, true);
});

test("a tapped accent or meteg lands on the letter that form requires", () => {
  const forms = Object.fromEntries(quest.qalPerfect(quest.QATAL).map((row) => [row.pgn, row.form]));
  const bare2 = forms["2ms"].replaceAll(O, "");
  const accent = quest.placeChosenMark(bare2, forms["2ms"], O);
  assert.equal(accent.status, "placed");
  assert.equal(accent.text, forms["2ms"]);
  const bare3 = forms["3fs"].replaceAll(M, "");
  const meteg = quest.placeChosenMark(bare3, forms["3fs"], M);
  assert.equal(meteg.status, "placed");
  assert.equal(meteg.text, forms["3fs"]);
  assert.equal(quest.placeChosenMark("", forms["2ms"], O).status, "wait");
  assert.equal(quest.placeChosenMark(forms["3ms"], forms["3ms"], O).status, "skip");
});

test("the first check is the grade", () => {
  assert.equal(quest.firstAnswer(null, true, false), true);
  assert.equal(quest.firstAnswer(null, false, false), false);
  assert.equal(quest.firstAnswer(false, true, false), false);
  assert.equal(quest.firstAnswer(null, true, true), false);
});

test("one miss can still be ninety percent", () => {
  const nineClean = Array.from({ length: 9 }, () => true);
  assert.equal(quest.questPercent(nineClean), 100);
  const oneMiss = [...Array.from({ length: 8 }, () => true), false, true];
  assert.equal(quest.questPercent(oneMiss), 90);
  const missedAgain = [...Array.from({ length: 8 }, () => true), false, false];
  assert.equal(quest.questPercent(missedAgain), 80);
  const twoMisses = [...Array.from({ length: 7 }, () => true), false, false, true, true];
  assert.equal(quest.questPercent(twoMisses), 82);
  const passed = quest.recordVerbQuest(quest.emptyVerbQuest(), 1, 90, null);
  assert.equal(passed.unlocked, 2);
  const held = quest.recordVerbQuest(quest.emptyVerbQuest(), 1, 89, null);
  assert.equal(held.unlocked, 1);
});

test("the voice bank can find a paradigm form", async () => {
  const voice = await jiti.import(join(root, "src/lib/voice-corpus.ts"));
  const ids = [...voice.corpusIds()];
  assert.equal(ids.includes("vpq-qal-pf-qatal-2ms"), true);
  assert.equal(ids.includes("vpq-qal-pf-akol-2mp"), true);
});

test("a cleared board stays in the save", () => {
  const first = quest.recordVerbQuest(quest.emptyVerbQuest(), 1, 90, null);
  assert.equal(first.unlocked, 2);
  assert.equal(first.cleared[1], true);
  const held = quest.recordVerbQuest(first, 1, 80, null);
  assert.equal(held.unlocked, 2);
  const sealed = quest.recordVerbQuest(first, 2, 100, "qatal");
  assert.equal(sealed.sealed.includes("qatal"), true);
  const saved = game.hydrateGame({ verbParadigmQuest: sealed });
  assert.equal(saved.verbParadigmQuest.unlocked, 3);
  assert.equal(saved.verbParadigmQuest.sealed[0], "qatal");
  const dropped = game.hydrateGame({});
  assert.equal(dropped.verbParadigmQuest.unlocked, 1);
});
