import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { leadWithWeak, hebrewWeakRank } = await jiti.import(new URL("../src/lib/weak-lead.ts", import.meta.url).pathname);
const { drawRound } = await jiti.import(new URL("../src/lib/quiz-draw.ts", import.meta.url).pathname);
const { applyRating, newCard } = await jiti.import(new URL("../src/lib/srs.ts", import.meta.url).pathname);
const { pickKeepRound } = await jiti.import(new URL("../src/lib/keep.ts", import.meta.url).pathname);
const { buildRoadDeck } = await jiti.import(new URL("../src/lib/road-exam.ts", import.meta.url).pathname);
const { FINAL_VOCAB, startFinalVocab, finalExamDrillItems } = await jiti.import(
  new URL("../src/lib/final-vocab.ts", import.meta.url).pathname,
);
const { startWeek7Run, WEEK7_ITEMS } = await jiti.import(new URL("../src/lib/week7-mock.ts", import.meta.url).pathname);
const { bbhVocab, VOCAB } = await jiti.import(new URL("../src/lib/vocab.ts", import.meta.url).pathname);

const now = 1_700_000_000_000;

test("a new sitting leads with the weakest and does not shuffle that block", () => {
  const out = leadWithWeak(
    ["a", "b", "c", "d"],
    (id) => (id === "c" ? 1 : id === "a" ? 3 : 0),
    (id) => id,
    (list) => list,
  );
  assert.deepEqual(out, ["a", "c", "b", "d"]);
});

test("drawRound keeps a weak question in front when the pool fits", () => {
  const pool = [
    { id: "a" },
    { id: "b" },
    { id: "c" },
  ];
  const got = drawRound(pool, 3, "weak-lead", (row) => row.id, (row) => (row.id === "c" ? 5 : row.id === "a" ? 2 : 0));
  assert.deepEqual(
    got.map((row) => row.id),
    ["c", "a", "b"],
  );
});

test("a hebrew line with a prefix still counts as that weak lemma", () => {
  const item = VOCAB.find((row) => row.hebrew && row.id === "yam") ?? VOCAB.find((row) => row.hebrew.length > 1);
  assert.ok(item);
  const card = applyRating(newCard(now), "again", now);
  const cards = { [item.id]: card };
  assert.ok(hebrewWeakRank(cards, item.hebrew, now) > 0);
  assert.ok(hebrewWeakRank(cards, `וְ${item.hebrew}`, now) > 0);
  assert.equal(hebrewWeakRank(cards, "שלוםעולמי", now), 0);
});

test("keep play deals the weak word before a word that is already known", () => {
  const [weakWord, knownWord] = bbhVocab();
  const weak = applyRating(newCard(now), "reveal", now);
  const known = applyRating(applyRating(applyRating(newCard(now), "easy", now), "easy", now), "easy", now);
  known.due = now + 86_400_000 * 30;
  const round = pickKeepRound({ [weakWord.id]: weak, [knownWord.id]: known }, undefined, 12, now);
  assert.equal(round[0].id, weakWord.id);
  assert.ok(round.findIndex((row) => row.id === weakWord.id) < round.findIndex((row) => row.id === knownWord.id));
});

test("the road exam and the final vocab list open on the missed word", () => {
  const pool = [
    { id: "known", hebrew: "אָב", gloss: "father", translit: "av", alts: [], pos: "noun", chapter: 1, freq: 1 },
    { id: "often", hebrew: "אֵם", gloss: "mother", translit: "em", alts: [], pos: "noun", chapter: 1, freq: 1 },
  ];
  const often = applyRating(applyRating(newCard(now), "again", now), "again", now);
  const deck = buildRoadDeck(pool, { often });
  assert.equal(deck[0].item.id, "often");

  const drill = finalExamDrillItems();
  const index = drill.findIndex((row, i) => i > 0 && row.chapter !== 0);
  assert.ok(index > 0);
  const studyId = drill[index].id;
  const run = startFinalVocab(7, { [studyId]: often });
  assert.equal(run.order[0], FINAL_VOCAB[index].id);
  assert.equal(new Set(run.order).size, FINAL_VOCAB.length);
  assert.deepEqual(startFinalVocab(7).order, startFinalVocab(7).order);
});

test("the week 7 mock keeps each section and leads that section with the weak line", () => {
  const run = startWeek7Run(7, (item) => (item.id === "x-torah" ? 9 : 0));
  const prefix = WEEK7_ITEMS.filter((item) => item.section === "prefix").map((item) => item.id);
  assert.equal(
    run.order.filter((id) => prefix.includes(id))[0],
    "x-torah",
  );
  const parse = new Set(WEEK7_ITEMS.filter((item) => item.section === "parse").map((item) => item.id));
  assert.ok(parse.has(run.order[0]));
  assert.deepEqual(startWeek7Run(7).order, startWeek7Run(7).order);
});
