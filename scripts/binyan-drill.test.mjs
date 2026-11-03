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
const vs = await jiti.import(join(root, "src/lib/verbal-system.ts"));

test("strong stem cards cover the seven stems and hide the mark", () => {
  const cards = drill.strongBinyanCards();
  assert.ok(cards.length > 10);
  const stems = new Set(cards.map((card) => card.stem));
  assert.deepEqual([...stems].sort(), ["hiphil", "hithpael", "hophal", "niphal", "piel", "pual", "qal"]);
  for (const card of cards) {
    assert.equal(drill.isStrongCard(card), true);
    for (const mode of ["verb-stem", "stem-verb", "same-root"]) {
      const prompt = drill.binyanPrompt(card, mode);
      assert.equal(prompt.hebrew.includes(drill.STEM_CARDS[card.stem].mark), false);
      assert.equal(prompt.line.includes(drill.STEM_CARDS[card.stem].mark), false);
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
  assert.doesNotMatch(clue, /wrong/i);
  const qal = drill.binyanClue({ stem: "qal", conj: "imperfect", rootId: "shamar" });
  assert.match(qal, /person prefix/);
  assert.doesNotMatch(qal, /No prefix/);
  const hiphil = drill.binyanClue({ stem: "hiphil", conj: "imperfect", rootId: "katav" });
  assert.match(hiphil, /Patah/);
  assert.doesNotMatch(hiphil, /Hireq under the prefix/);
  const hiphilPtc = drill.binyanClue({ stem: "hiphil", conj: "participle", rootId: "katav" });
  assert.match(hiphilPtc, /Mem with patah/);
  const swapped = drill.binyanClue({ stem: "hithpael", conj: "perfect", rootId: "shamar" });
  assert.match(swapped, /traded places/);
  const hit = drill.binyanClue({ stem: "hithpael", conj: "imperfect", rootId: "qatal" });
  assert.match(hit, /person prefix, then tav/);
});

test("the drill hides the forms whose pointing is not signed yet", () => {
  const cards = drill.strongBinyanCards();
  const tav = new Set(["3fs", "2ms", "2fs", "3fp", "2mp", "2fp"]);
  const begad = new Set(["ב", "ג", "ד", "כ", "פ", "ת"]);
  const sibilant = new Set(["ש", "ס", "צ", "ז"]);
  for (const card of cards) {
    const cell = card.id.split(":").at(-1);
    assert.equal(card.conj === "imperfect" && tav.has(cell), false, card.id);
    const root = vs.rootById(card.rootId);
    assert.equal(card.stem === "niphal" && begad.has(root.letters[1]), false, card.id);
    assert.equal(card.stem === "hithpael" && sibilant.has(root.letters[0]), false, card.id);
    assert.equal(card.form.includes("ך"), false, card.id);
    const prompt = drill.binyanPrompt(card, "verb-stem");
    assert.equal(prompt.line.includes(drill.binyanClue(card)), false);
  }
  assert.equal(drill.heldFromDrill({ id: "shamar:qal:imperfect:2ms", stem: "qal", conj: "imperfect", rootId: "shamar", form: "תִּשְׁמֹר" }), true);
  assert.ok(cards.length > 10);
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
