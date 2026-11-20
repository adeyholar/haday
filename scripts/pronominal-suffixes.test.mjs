import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { PRONOMINAL_SUFFIXES, pronominalSuffixItems } = await jiti.import(
  new URL("../src/lib/pronominal-suffixes.ts", import.meta.url).pathname,
);
const { VOCAB, itemsForWeek, quizChoices, glossMatches } = await jiti.import(
  new URL("../src/lib/vocab.ts", import.meta.url).pathname,
);
const { hydrateDrillRuns, suffixDrillKey, choiceLabel } = await jiti.import(
  new URL("../src/lib/etch.ts", import.meta.url).pathname,
);
const { blockedDestination, ownerDoorBlock, pronounSittingPath, secondTermBlock } = await jiti.import(
  new URL("../src/lib/path.ts", import.meta.url).pathname,
);
const { normalizeHebrewFull } = await jiti.import(new URL("../src/lib/hebrew.ts", import.meta.url).pathname);

const root = new URL("../", import.meta.url);
const IDS = ["suf-3ms", "suf-3fs", "suf-2ms", "suf-2fs", "suf-1cs", "suf-3mp", "suf-3fp", "suf-2mp", "suf-2fp", "suf-1cp"];

test("the suffix chart is ten persons and stays off the week list", () => {
  assert.equal(PRONOMINAL_SUFFIXES.length, 10);
  assert.deepEqual(PRONOMINAL_SUFFIXES.map((row) => row.id), IDS);
  const glosses = PRONOMINAL_SUFFIXES.map((row) => row.gloss);
  assert.equal(new Set(glosses).size, glosses.length);
  const hebrew = PRONOMINAL_SUFFIXES.map((row) => row.hebrew);
  assert.equal(new Set(hebrew).size, hebrew.length);
  const byId = Object.fromEntries(PRONOMINAL_SUFFIXES.map((row) => [row.id, row.hebrew]));
  assert.equal(byId["suf-3ms"], "קְטָלוֹ");
  assert.equal(byId["suf-3fs"], "קְטָלָהּ");
  assert.equal(byId["suf-2ms"], "קְטָֽלְךָ");
  assert.equal(byId["suf-2fs"], "קְטָלֵךְ");
  assert.equal(byId["suf-1cs"], "קְטָלַ֫נִי");
  assert.equal(byId["suf-3mp"], "קְטָלָם");
  assert.equal(byId["suf-3fp"], "קְטָלָן");
  assert.equal(byId["suf-2mp"], "קְטָֽלְכֶם");
  assert.equal(byId["suf-2fp"], "קְטָֽלְכֶן");
  assert.equal(byId["suf-1cp"], "קְטָלָ֫נוּ");
  assert.ok(byId["suf-2ms"].includes("\u05BD"));
  assert.ok(byId["suf-2mp"].includes("\u05BD"));
  assert.ok(byId["suf-2fp"].includes("\u05BD"));
  assert.ok(byId["suf-1cs"].includes("\u05AB"));
  assert.ok(byId["suf-1cp"].includes("\u05AB"));
  assert.equal(normalizeHebrewFull(byId["suf-2ms"]), normalizeHebrewFull(byId["suf-2ms"].replace(/\u05BD/g, "")));
  assert.equal(normalizeHebrewFull(byId["suf-1cs"]), normalizeHebrewFull(byId["suf-1cs"].replace(/\u05AB/g, "")));
  for (const id of IDS) assert.equal(VOCAB.some((item) => item.id === id), false, id);
  for (const week of [1, 5, 7, 12, 15, 20, 36]) {
    const ids = itemsForWeek(week).map((item) => item.id);
    for (const id of IDS) assert.equal(ids.includes(id), false, `${week} ${id}`);
  }
  const hen = VOCAB.find((item) => item.id === "hen");
  assert.equal(hen.pos, "particle");
});

test("you and them are not one answer", () => {
  const pool = pronominalSuffixItems();
  assert.equal(pool.length, 10);
  assert.equal(pool.every((item) => item.pos === "verb" && item.chapter === 12), true);
  for (const item of pool) {
    const choices = quizChoices(item, pool);
    assert.equal(choices.length, 4, item.id);
    assert.ok(choices.includes(item.gloss), item.id);
    assert.equal(new Set(choices).size, choices.length, item.id);
    assert.equal(glossMatches(item, "you"), false, item.id);
    assert.equal(glossMatches(item, "them"), false, item.id);
    assert.equal(glossMatches(item, "he killed it"), false, item.id);
    assert.equal(glossMatches(item, "he killed you"), false, item.id);
    assert.equal(glossMatches(item, "he killed them"), false, item.id);
  }
  const byId = Object.fromEntries(pool.map((item) => [item.id, item]));
  assert.equal(glossMatches(byId["suf-3ms"], "he killed him"), true);
  assert.equal(glossMatches(byId["suf-3ms"], "he killed him (it)"), true);
  assert.equal(glossMatches(byId["suf-3ms"], byId["suf-3fs"].gloss), false);
  assert.equal(glossMatches(byId["suf-3fs"], "he killed her"), true);
  assert.equal(glossMatches(byId["suf-2ms"], byId["suf-2fs"].gloss), false);
  assert.equal(glossMatches(byId["suf-2fs"], byId["suf-2ms"].gloss), false);
  assert.equal(glossMatches(byId["suf-3mp"], byId["suf-3fp"].gloss), false);
  assert.equal(glossMatches(byId["suf-2mp"], "he killed you mp"), true);
  assert.equal(glossMatches(byId["suf-1cs"], "he killed me"), true);
  assert.equal(glossMatches(byId["suf-1cp"], "killed us"), true);
  const labels = pool.map((item) => choiceLabel(item, pool));
  assert.equal(new Set(labels).size, labels.length);
});

test("the suffix drill keeps its own place, and either door may open it", () => {
  assert.equal(suffixDrillKey("due"), "suffixes:due");
  assert.equal(suffixDrillKey("weak"), "suffixes:weak");
  const place = { seed: 1, ids: ["suf-3ms"], index: 2, reviews: [], hits: 0, checks: 0, fingerprint: "s" };
  assert.equal(hydrateDrillRuns({ "suffixes:due": place })["suffixes:due"]?.index, 2);
  assert.equal(hydrateDrillRuns({ "suffixes:nope": place })["suffixes:nope"], undefined);
  assert.equal(ownerDoorBlock("/quiz", "iibs", { set: "suffixes" }), null);
  assert.equal(ownerDoorBlock("/drill", "iibs", "?set=suffixes"), null);
  assert.equal(ownerDoorBlock("/quiz", "iibs"), "/");
  assert.equal(blockedDestination("/quiz", { path: "iibs", admin: false }, { set: "suffixes" }), null);
  assert.equal(blockedDestination("/drill", { path: "bbh", admin: false }, { set: "suffixes" }), null);
  assert.equal(blockedDestination("/quiz", { path: "iibs", admin: false }), "/");
  assert.equal(secondTermBlock("/drill", 1, true, { set: "suffixes" }), null);
  assert.equal(pronounSittingPath("/quiz", { set: "suffixes" }), false);
});

test("suffix quiz and drill sit on every module", () => {
  const links = readFileSync(new URL("src/components/independent-pronouns.tsx", root), "utf8");
  assert.equal(links.match(/set: "suffixes"/g).length, 2);
  assert.match(links, /Suffix quiz/);
  assert.match(links, /Suffix drill/);
  const hub = readFileSync(new URL("src/components/path-hub.tsx", root), "utf8");
  assert.equal(hub.match(/suffixes: "quiz"/g).length, 2);
  assert.equal(hub.match(/suffixes: "drill"/g).length, 2);
  assert.equal(hub.match(/pronouns: "quiz"/g).length, 2);
  const quiz = readFileSync(new URL("src/routes/quiz.tsx", root), "utf8");
  const drill = readFileSync(new URL("src/routes/drill.tsx", root), "utf8");
  assert.match(quiz, /pronominalSuffixItems/);
  assert.match(drill, /suffixDrillKey/);
  assert.match(drill, /grid-cols-2/);
});
