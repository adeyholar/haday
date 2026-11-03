import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const drill = await jiti.import(join(root, "src/lib/binyan-drill.ts"));
const game = await jiti.import(join(root, "src/lib/game.ts"));
const path = await jiti.import(join(root, "src/lib/path.ts"));

test("strong stem cards cover the seven stems and the full pool", () => {
  const cards = drill.strongBinyanCards();
  assert.equal(cards.length, 1096);
  const stems = new Set(cards.map((card) => card.stem));
  assert.deepEqual([...stems].sort(), ["hiphil", "hithpael", "hophal", "niphal", "piel", "pual", "qal"]);
  for (const card of cards) {
    assert.equal(drill.isStrongCard(card), true);
    for (const mode of ["verb-stem", "stem-verb", "same-root"]) {
      const prompt = drill.binyanPrompt(card, mode);
      const clue = drill.binyanClue(card);
      assert.equal(prompt.hebrew.includes(clue), false);
      assert.equal(prompt.line.includes(clue), false);
    }
  }
  for (const stem of stems) {
    const examples = drill.stemExamples(stem, cards);
    assert.equal(examples.length, 3);
    assert.deepEqual(examples.map((card) => card.conj), ["perfect", "imperfect", "participle"]);
  }
});

test("a round stays inside the open set and 90% opens the next", () => {
  const first = drill.dealBinyanRound(drill.stemsOpen(0), () => 0.3);
  assert.equal(first.length, 10);
  for (const card of first) assert.ok(["qal", "piel", "hiphil"].includes(card.stem));
  const progress = drill.emptyBinyan();
  assert.equal(drill.finishBinyanRound(progress, 8).set, 0);
  assert.equal(drill.finishBinyanRound(progress, 9).set, 1);
  assert.deepEqual(drill.stemsOpen(1), ["qal", "piel", "hiphil", "niphal", "hithpael"]);
  assert.equal(drill.finishBinyanRound({ set: 2, stems: {} }, 10).set, 2);
  const noted = drill.noteBinyanFirst(progress, "qal", false);
  assert.deepEqual(noted.stems.qal, { seen: 1, first: 0 });
  const clue = drill.binyanClue({ stem: "piel", conj: "perfect", rootId: "qatal" });
  assert.match(clue, /Piel/);
  assert.match(clue, /Dagesh/);
  assert.match(clue, /doubled \(forte\), no qibbuts under the first letter/i);
  assert.doesNotMatch(clue, /wrong/i);
  const qal = drill.binyanClue({ stem: "qal", conj: "imperfect", rootId: "shamar" });
  assert.match(qal, /only a person prefix/);
  assert.match(qal, /No stem prefix/);
  assert.match(qal, /only lene/);
  const hiphil = drill.binyanClue({ stem: "hiphil", conj: "imperfect", rootId: "katav" });
  assert.match(hiphil, /Patah under the prefix/);
  assert.doesNotMatch(hiphil, /He with hireq/);
  const hiphilPtc = drill.binyanClue({ stem: "hiphil", conj: "participle", rootId: "katav" });
  assert.match(hiphilPtc, /Patah under the prefix/);
  const swapped = drill.binyanClue({ stem: "hithpael", conj: "perfect", rootId: "shamar" });
  assert.match(swapped, /tav moves after/);
  assert.match(swapped, /הִשְׁתַּ/);
  const zayin = drill.binyanClue({ stem: "hithpael", conj: "perfect", rootId: "zakar" });
  assert.match(zayin, /tav moves after/);
  assert.match(zayin, /becomes ד after ז/);
  assert.match(drill.binyanClue({ stem: "hithpael", conj: "perfect", rootId: "savav" }), /הִשְׁתַּ/);
  assert.match(drill.binyanClue({ stem: "hithpael", conj: "perfect", rootId: "sim" }), /הִשְׁתַּ/);
  const hit = drill.binyanClue({ stem: "hithpael", conj: "imperfect", rootId: "qatal" });
  assert.match(hit, /תִּתְ/);
  assert.match(drill.binyanClue({ stem: "niphal", conj: "perfect", rootId: "qatal" }), /Nun with hireq/);
  assert.match(drill.binyanClue({ stem: "niphal", conj: "imperfect", rootId: "qatal" }), /first letter is doubled/);
  assert.match(drill.binyanClue({ stem: "pual", conj: "perfect", rootId: "qatal" }), /Qibbuts/);
  assert.match(drill.binyanClue({ stem: "hophal", conj: "perfect", rootId: "qatal" }), /no doubling/);
  assert.match(drill.binyanClue({ stem: "hiphil", conj: "perfect", rootId: "qatal" }), /shewa under the first letter/);
});

test("hydrateGame keeps per-stem accuracy and drops a foreign stem", () => {
  const saved = game.hydrateGame({
    binyan: { set: 1, stems: { qal: { seen: 4, first: 3 }, nope: { seen: 9, first: 9 }, piel: { seen: 2, first: 5 } } },
  });
  assert.equal(saved.binyan.set, 1);
  assert.deepEqual(saved.binyan.stems.qal, { seen: 4, first: 3 });
  assert.deepEqual(saved.binyan.stems.piel, { seen: 2, first: 2 });
  assert.equal(saved.binyan.stems.nope, undefined);
  const again = game.hydrateGame(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(again.binyan, saved.binyan);
  assert.equal(game.hydrateGame({}).binyan.set, 0);
  assert.equal(path.blockedDestination("/iibs/binyanim", { path: "bbh", admin: false }), "/");
  assert.equal(path.blockedDestination("/iibs/binyanim", { path: "iibs", admin: false }), null);
});
