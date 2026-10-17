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

test("ninety percent opens the next level and the save keeps the board", () => {
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
