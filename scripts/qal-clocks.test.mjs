import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { answerSitting, clockCards, gradeClock, sittingFrom, weqatalOf } = await jiti.import(new URL("../src/lib/qal-clocks.ts", import.meta.url).pathname);
const { openPattern, ROOTS } = await jiti.import(new URL("../src/lib/verbal-system.ts", import.meta.url).pathname);
const { accentPlace, accentStillOpen, liveMatchParadigm } = await jiti.import(new URL("../src/lib/paradigm/normalize.ts", import.meta.url).pathname);
const { placeChosenMark } = await jiti.import(new URL("../src/lib/verb-paradigm-quest.ts", import.meta.url).pathname);

function form(root, conj, pgn) {
  const pattern = openPattern(root, "qal", conj);
  return pattern.cells.find((cell) => cell.id === pgn).form;
}

test("weqatal is the perfect with the conjunction, not wayyiqtol", () => {
  const shamar = form("shamar", "perfect", "3ms");
  assert.equal(weqatalOf(shamar), "וְ" + shamar);
  const katav = form("katav", "perfect", "3ms");
  assert.equal(weqatalOf(katav), "וְ" + [...katav].filter((ch) => ch !== "\u05BC").join(""));
  const bachar = form("bachar", "perfect", "3ms");
  assert.equal(weqatalOf(bachar), "וּ" + [...bachar].filter((ch) => ch !== "\u05BC").join(""));
  assert.equal(weqatalOf(form("shamar", "perfect", "2mp")), "וּ" + form("shamar", "perfect", "2mp"));
  assert.equal(weqatalOf(form("amad", "perfect", "2mp")), "וַ" + form("amad", "perfect", "2mp"));
  assert.equal(weqatalOf(form("hayah", "perfect", "2mp")), "וֶ" + form("hayah", "perfect", "2mp"));
  const stressed = form("shamar", "perfect", "2ms");
  assert.equal(weqatalOf(stressed), "וְ" + stressed);
  assert.notEqual(weqatalOf(shamar), form("shamar", "wayyiqtol", "3ms"));
});

test("practice deals yiqtol, wayyiqtol, and weqatal", () => {
  const cards = clockCards();
  assert.equal(cards.filter((card) => card.clock === "yiqtol").length, 259);
  assert.equal(cards.filter((card) => card.clock === "wayyiqtol").length, 212);
  assert.equal(cards.filter((card) => card.clock === "weqatal").length, 293);
  const shamar = cards.find((card) => card.rootId === "shamar" && card.clock === "yiqtol" && card.pgn === "3ms");
  assert.equal(shamar.form, "יִשְׁמֹר");
  const story = cards.find((card) => card.rootId === "shamar" && card.clock === "wayyiqtol" && card.pgn === "3ms");
  assert.equal(story.form, "וַיִּשְׁמֹר");
  const want = weqatalOf(form("shamar", "perfect", "2ms"));
  assert.equal(gradeClock(want, want.replace("\u05AB", ""), true).tag, "stress");
  assert.equal(gradeClock("וְשָׁמַר", "ושמר", false).ok, true);
});

test("one root is three rounds, and a miss comes back", () => {
  const cards = [
    { id: "a", clock: "yiqtol", rootId: "shamar", cite: "ש", gloss: "keep", pgn: "3ms", label: "3rd", form: "א" },
    { id: "b", clock: "yiqtol", rootId: "shamar", cite: "ש", gloss: "keep", pgn: "3fs", label: "3rd", form: "ב" },
  ];
  let sitting = sittingFrom(cards);
  assert.equal(sitting.finished, false);
  sitting = answerSitting(sitting, false);
  assert.equal(sitting.queue.map((card) => card.id).join(","), "b,a");
  assert.equal(sitting.misses, 1);
  sitting = answerSitting(sitting, true);
  sitting = answerSitting(sitting, true);
  assert.equal(sitting.round, 2);
  assert.equal(sitting.queue.length, 2);
  sitting = answerSitting(sitting, true);
  sitting = answerSitting(sitting, true);
  assert.equal(sitting.round, 3);
  sitting = answerSitting(sitting, true);
  sitting = answerSitting(sitting, true);
  assert.equal(sitting.finished, true);
  assert.equal(sitting.queue.length, 0);
});

test("person order starts at 3ms and the next round keeps it", () => {
  const row = (id, clock, pgn) => ({ id, clock, rootId: "qatal", cite: "ק", gloss: "kill", pgn, label: pgn, form: id });
  const cards = [
    row("fs", "yiqtol", "3fs"),
    row("cp", "weqatal", "3cp"),
    row("mp", "yiqtol", "3mp"),
    row("msw", "wayyiqtol", "3ms"),
    row("fp", "yiqtol", "3fp"),
    row("ms", "yiqtol", "3ms"),
    row("we", "weqatal", "1cp"),
  ];
  const want = "yiqtol:3ms,yiqtol:3fs,yiqtol:3mp,yiqtol:3fp,wayyiqtol:3ms,weqatal:3cp,weqatal:1cp";
  let sitting = sittingFrom(cards, "pgn");
  const line = (queue) => queue.map((card) => `${card.clock}:${card.pgn}`).join(",");
  assert.equal(line(sitting.queue), want);
  sitting = answerSitting(sitting, false);
  assert.equal(sitting.queue[0].id, "fs");
  assert.equal(sitting.queue.at(-1).id, "ms");
  for (let i = 0; i < cards.length; i++) sitting = answerSitting(sitting, true);
  assert.equal(sitting.round, 2);
  assert.equal(line(sitting.queue), want);
});

test("each tap stays on the form, and the accent is still open until it is typed", () => {
  const stressed = form("shamar", "perfect", "2ms");
  const bare = stressed.replaceAll("\u05AB", "");
  assert.equal(liveMatchParadigm(stressed, ""), "empty");
  assert.equal(liveMatchParadigm(stressed, [...bare][0]), "prefix");
  assert.equal(liveMatchParadigm(stressed, bare), "prefix");
  assert.equal(accentStillOpen(stressed, bare), true);
  assert.equal(liveMatchParadigm(stressed, stressed), "exact");
  assert.equal(accentStillOpen(stressed, stressed), false);
  assert.equal(liveMatchParadigm(stressed, "ק"), "off");
});

test("an extra dagesh lene is not a miss; a dagesh the form has still counts", () => {
  const D = "\u05BC";
  const fs = form("qatal", "imperfect", "3fs");
  const withLene = "ת" + D + fs.slice(1);
  assert.equal(liveMatchParadigm(fs, "ת" + D), "prefix");
  assert.equal(liveMatchParadigm(fs, withLene), "exact");
  assert.equal(gradeClock(fs, withLene, true).ok, true);
  const story = form("qatal", "wayyiqtol", "3ms");
  assert.equal(liveMatchParadigm(story, story.replace(D, "")), "off");
  const two = form("qatal", "perfect", "2ms");
  assert.equal(gradeClock(two, two.replace(D, ""), true).ok, false);
});

test("qatal is the first strong verb, and the engine signs it", () => {
  assert.equal(ROOTS[0].id, "qatal");
  assert.equal(ROOTS[0].cls, "strong");
  assert.equal(form("qatal", "perfect", "3ms"), "קָטַל");
  assert.equal(form("qatal", "imperfect", "3ms"), "יִקְטֹל");
  assert.equal(form("qatal", "wayyiqtol", "3ms"), "וַיִּקְטֹל");
  const cards = clockCards().filter((card) => card.rootId === "qatal");
  assert.equal(cards.filter((card) => card.clock === "yiqtol").length, 10);
  assert.equal(cards.filter((card) => card.clock === "wayyiqtol").length, 10);
  assert.equal(cards.filter((card) => card.clock === "weqatal").length, 9);
});

test("yiqtol 3fp and 2fp take the accent on the theme vowel", () => {
  const OLE = "\u05AB";
  const HOLEM = "\u05B9";
  const D = "\u05BC";
  for (const pgn of ["3fp", "2fp"]) {
    const y = form("qatal", "imperfect", pgn);
    const w = form("qatal", "wayyiqtol", pgn);
    assert.ok(y.includes(HOLEM + OLE), y);
    assert.ok(w.includes(HOLEM + OLE), w);
    const bare = y.replaceAll(OLE, "");
    assert.equal(liveMatchParadigm(y, bare), "prefix");
    assert.equal(accentStillOpen(y, bare), true);
    assert.equal(gradeClock(y, bare, true).tag, "stress");
    const withLene = "ת" + D + y.slice(1);
    assert.equal(liveMatchParadigm(y, withLene), "exact");
    assert.equal(gradeClock(y, withLene, true).ok, true);
    const seated = placeChosenMark(bare, y, OLE);
    assert.equal(seated.status, "placed");
    assert.equal(gradeClock(y, seated.text, true).ok, true);
    assert.equal(accentPlace(y, bare + OLE), "wrong");
  }
  assert.equal(form("qatal", "imperfect", "2mp").includes(OLE), false);
  assert.equal(form("shama", "imperfect", "3fp").includes("\u05B7" + OLE), true);
  assert.equal(form("amad", "wayyiqtol", "2fp").includes(HOLEM + OLE), true);
});
