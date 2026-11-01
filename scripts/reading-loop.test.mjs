import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { chapterKnown, matchInPool } = await jiti.import(join(root, "src/lib/reading-loop/known.ts"));
const { passageDrillKey, isPassageDrillKey, savePassagePack, loadPassagePack } = await jiti.import(join(root, "src/lib/reading-loop/passage.ts"));
const { noteVerse, peekSession, DAILY_GOAL } = await jiti.import(join(root, "src/lib/reading-loop/session.ts"));
const { gradeRealForm, realFormDeck, REAL_FORMS } = await jiti.import(join(root, "src/lib/reading-loop/real-forms.ts"));
const { morphLines, explainMorph } = await jiti.import(join(root, "src/lib/morph-parse.ts"));
const { hydrateDrillRuns } = await jiti.import(join(root, "src/lib/etch.ts"));
const { VOCAB } = await jiti.import(join(root, "src/lib/vocab.ts"));
const { newCard, applyRating } = await jiti.import(join(root, "src/lib/srs.ts"));

const ab = VOCAB.find((item) => item.id === "ab");
const ben = VOCAB.find((item) => item.id === "ben");
assert.ok(ab && ben);

test("known share counts mastered class lemmas only", () => {
  const now = Date.now();
  let card = newCard(now);
  card = applyRating(card, "good", now);
  card = applyRating(card, "good", now + 1);
  card = applyRating(card, "easy", now + 2);
  card.reps = 4;
  card.interval = 8;
  const words = [
    { id: "w1", surface: "אָב" },
    { id: "w2", surface: "אָבִיךָ" },
    { id: "w3", surface: "בֵּן" },
    { id: "w4", surface: "xyz" },
  ];
  const report = chapterKnown(words, [ab, ben], { ab: card }, now + 3);
  assert.equal(report.found, 2);
  assert.equal(report.known, 1);
  assert.equal(report.pct, 50);
  assert.deepEqual(report.unknown.map((item) => item.id), ["ben"]);
  assert.deepEqual(report.unknownWordIds, ["w3"]);
  assert.equal(matchInPool("אָבִיךָ", [ab, ben])?.id, "ab");
});

test("passage pack keeps its own drill key", () => {
  assert.equal(passageDrillKey("iibs", "Gen.1"), "passage:iibs:Gen.1");
  assert.equal(isPassageDrillKey("passage:bbh:1Sam.3"), true);
  assert.equal(isPassageDrillKey("3:due"), false);
  const mem = new Map();
  const store = {
    getItem: (key) => mem.get(key) ?? null,
    setItem: (key, value) => mem.set(key, value),
  };
  savePassagePack({ scope: "bbh", ref: "Gen.1", label: "Genesis 1", ids: ["ab", "ben"], back: "/listen/read/Gen/1" }, store);
  const pack = loadPassagePack(store);
  assert.equal(pack.scope, "bbh");
  assert.deepEqual(pack.ids, ["ab", "ben"]);
  const place = { seed: 1, ids: ["ab"], index: 2, reviews: [], hits: 0, checks: 0, fingerprint: "a" };
  assert.equal(hydrateDrillRuns({ "passage:bbh:Gen.1": place })["passage:bbh:Gen.1"]?.index, 2);
  assert.equal(hydrateDrillRuns({ "passage:nope:Gen.1": place })["passage:nope:Gen.1"], undefined);
});

test("a verse counts once toward the daily goal", () => {
  const mem = new Map();
  const store = {
    getItem: (key) => mem.get(key) ?? null,
    setItem: (key, value) => mem.set(key, value),
  };
  const now = Date.parse("2026-11-01T12:00:00Z");
  const place = { scope: "bbh", book: "Gen", chapter: 1, verse: 1, href: "/listen/read/Gen/1" };
  const first = noteVerse(place, now, store);
  const again = noteVerse(place, now + 1000, store);
  const next = noteVerse({ ...place, verse: 2 }, now + 2000, store);
  assert.equal(first.today, 1);
  assert.equal(again.today, 1);
  assert.equal(next.today, 2);
  assert.equal(next.goal, DAILY_GOAL);
  assert.equal(next.last.verse, 2);
  assert.equal(peekSession(now + 3000, store).today, 2);
  assert.equal(peekSession(now + 86_400_000, store).today, 0);
});

test("real Qal forms grade the attested parse", () => {
  const form = REAL_FORMS.find((row) => row.id === "yishmor");
  assert.equal(gradeRealForm(form, "Qal imperfect 3ms"), true);
  assert.equal(gradeRealForm(form, "Qal perfect 3ms"), false);
  const deck = realFormDeck("perfect", 1);
  assert.ok(deck.length >= 6);
  assert.ok(deck.every((row) => row.aspect === "perfect"));
  assert.equal(realFormDeck("perfect", 1)[0].id, realFormDeck("perfect", 1)[0].id);
});

test("morph lines name stem and person without changing the sentence", () => {
  const code = "HVqp3ms";
  const lines = morphLines(code);
  assert.equal(lines.find((row) => row.label === "Stem")?.value, "Qal");
  assert.equal(lines.find((row) => row.label === "Form")?.value, "perfect");
  assert.equal(lines.find((row) => row.label === "Person")?.value, "3rd");
  assert.match(explainMorph(code), /Qal perfect/);
});
