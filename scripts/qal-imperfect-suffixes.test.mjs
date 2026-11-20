import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { QAL_IMPERFECT_SUFFIXES, qalImperfectSuffixItems } = await jiti.import(
  new URL("../src/lib/qal-imperfect-suffixes.ts", import.meta.url).pathname,
);
const { VOCAB, itemsForWeek, quizChoices, glossMatches } = await jiti.import(
  new URL("../src/lib/vocab.ts", import.meta.url).pathname,
);
const { hydrateDrillRuns, yiqtolDrillKey, choiceLabel } = await jiti.import(
  new URL("../src/lib/etch.ts", import.meta.url).pathname,
);
const { blockedDestination, ownerDoorBlock, pronounSittingPath, secondTermBlock } = await jiti.import(
  new URL("../src/lib/path.ts", import.meta.url).pathname,
);
const { normalizeHebrewFull } = await jiti.import(new URL("../src/lib/hebrew.ts", import.meta.url).pathname);

const root = new URL("../", import.meta.url);

const EXPECTED = {
  "yiq-3ms": "\u05D9\u05B4\u05E7\u05B0\u05D8\u05B9\u05DC",
  "yiq-3ms-before": "\u05D9\u05B4\u05E7\u05B0\u05D8\u05B0\u05DC",
  "yiq-3fs": "\u05EA\u05BC\u05B4\u05E7\u05B0\u05D8\u05B9\u05DC",
  "yiq-3fs-before": "\u05EA\u05BC\u05B4\u05E7\u05B0\u05D8\u05B0\u05DC",
  "yiq-2fs": "\u05EA\u05BC\u05B4\u05E7\u05B0\u05D8\u05B0\u05DC\u05B4\u05D9",
  "yiq-1cs": "\u05D0\u05B6\u05E7\u05B0\u05D8\u05B9\u05DC",
  "yiq-1cs-before": "\u05D0\u05B6\u05E7\u05B0\u05D8\u05B0\u05DC",
  "yiq-3mp": "\u05D9\u05B4\u05E7\u05B0\u05D8\u05B0\u05DC\u05D5\u05BC",
  "yiq-2mp": "\u05EA\u05BC\u05B4\u05E7\u05B0\u05D8\u05B0\u05DC\u05D5\u05BC",
  "yiq-1cp": "\u05E0\u05B4\u05E7\u05B0\u05D8\u05B9\u05DC",
  "yiq-1cp-before": "\u05E0\u05B4\u05E7\u05B0\u05D8\u05B0\u05DC",
  "yiq-fp": "\u05EA\u05BC\u05B4\u05E7\u05B0\u05D8\u05AB\u05B9\u05DC\u05B0\u05E0\u05B8\u05D4",
};

test("the imperfect suffix chart keeps each spelling once and stays off the week list", () => {
  assert.equal(QAL_IMPERFECT_SUFFIXES.length, 12);
  const ids = QAL_IMPERFECT_SUFFIXES.map((row) => row.id);
  assert.deepEqual(ids, Object.keys(EXPECTED));
  const hebrews = QAL_IMPERFECT_SUFFIXES.map((row) => row.hebrew);
  assert.equal(new Set(hebrews).size, hebrews.length);
  const glosses = QAL_IMPERFECT_SUFFIXES.map((row) => row.gloss);
  assert.equal(new Set(glosses).size, glosses.length);
  for (const row of QAL_IMPERFECT_SUFFIXES) {
    assert.equal(row.hebrew, EXPECTED[row.id], row.id);
    assert.equal(VOCAB.some((item) => item.id === row.id), false, row.id);
  }
  for (let week = 1; week <= 15; week++) {
    const weekIds = itemsForWeek(week).map((item) => item.id);
    for (const id of ids) assert.equal(weekIds.includes(id), false, `${week} ${id}`);
  }
  const plain = EXPECTED["yiq-3ms"];
  const before = EXPECTED["yiq-3ms-before"];
  assert.notEqual(normalizeHebrewFull(plain), normalizeHebrewFull(before));
  const fp = EXPECTED["yiq-fp"];
  assert.ok(fp.includes("\u05AB"));
  assert.equal(normalizeHebrewFull(fp), normalizeHebrewFull(fp.replace(/\u05AB/g, "")));
});

test("you and they are not one imperfect answer", () => {
  const pool = qalImperfectSuffixItems();
  assert.equal(pool.length, 12);
  const labels = pool.map((item) => choiceLabel(item, pool));
  assert.equal(new Set(labels).size, labels.length);
  for (const item of pool) {
    const choices = quizChoices(item, pool);
    assert.equal(choices.length, 4, item.id);
    assert.ok(choices.includes(item.gloss), item.id);
    assert.equal(new Set(choices).size, choices.length, item.id);
    assert.equal(glossMatches(item, "you"), false, item.id);
    assert.equal(glossMatches(item, "they"), false, item.id);
    assert.equal(glossMatches(item, "he will kill"), false, item.id);
    assert.equal(glossMatches(item, "will kill"), false, item.id);
  }
  const byId = Object.fromEntries(pool.map((item) => [item.id, item]));
  assert.equal(glossMatches(byId["yiq-3ms"], byId["yiq-3ms-before"].gloss), false);
  assert.equal(glossMatches(byId["yiq-3fs"], "3fs and 2ms with no suffix"), true);
  assert.equal(glossMatches(byId["yiq-3fs-before"], byId["yiq-3fs"].gloss), false);
  assert.equal(glossMatches(byId["yiq-fp"], "3fp and 2fp take no pronominal suffix"), true);
  assert.match(byId["yiq-2fs"].gloss, /unchanged/);
  assert.match(byId["yiq-3mp"].gloss, /unchanged/);
  assert.match(byId["yiq-2mp"].gloss, /unchanged/);
});

test("the imperfect suffix drill keeps its own place, and either door may open it", () => {
  assert.equal(yiqtolDrillKey("due"), "yiqtol:due");
  assert.equal(yiqtolDrillKey("weak"), "yiqtol:weak");
  const place = { seed: 1, ids: ["yiq-3ms"], index: 2, reviews: [], hits: 0, checks: 0, fingerprint: "y" };
  assert.equal(hydrateDrillRuns({ "yiqtol:due": place })["yiqtol:due"]?.index, 2);
  assert.equal(hydrateDrillRuns({ "yiqtol:nope": place })["yiqtol:nope"], undefined);
  assert.equal(ownerDoorBlock("/quiz", "iibs", { set: "yiqtol" }), null);
  assert.equal(ownerDoorBlock("/drill", "iibs", "?set=yiqtol"), null);
  assert.equal(blockedDestination("/quiz", { path: "iibs", admin: false }, { set: "yiqtol" }), null);
  assert.equal(blockedDestination("/quiz", { path: "iibs", admin: false }), "/");
  assert.equal(secondTermBlock("/drill", 1, true, { set: "yiqtol" }), null);
  assert.equal(pronounSittingPath("/quiz", { set: "yiqtol" }), false);
});

test("imperfect suffix quiz and drill sit on every module", () => {
  const links = readFileSync(new URL("src/components/independent-pronouns.tsx", root), "utf8");
  assert.equal(links.match(/set: "yiqtol"/g).length, 2);
  const hub = readFileSync(new URL("src/components/path-hub.tsx", root), "utf8");
  assert.equal(hub.match(/yiqtol: "quiz"/g).length, 2);
  assert.equal(hub.match(/yiqtol: "drill"/g).length, 2);
  const quiz = readFileSync(new URL("src/routes/quiz.tsx", root), "utf8");
  const drill = readFileSync(new URL("src/routes/drill.tsx", root), "utf8");
  assert.match(quiz, /set === "yiqtol"/);
  assert.match(drill, /set === "yiqtol"/);
  assert.match(drill, /grid-cols-2/);
});
