import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { ketivDisplay } = await jiti.import(join(root, "src/lib/ketiv-qere.ts"));
const { lemmaForReading, ketivQereNumbers } = await jiti.import(join(root, "src/lib/reading-loop/strong-lemma.ts"));
const { lettersOnly } = await jiti.import(join(root, "src/lib/hebrew.ts"));
const { iibsPathItems } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { VOCAB } = await jiti.import(join(root, "src/lib/vocab.ts"));
const iibs = iibsPathItems();

function written(verse) {
  return verse.words.filter((word) => word.kq_role !== "qere");
}

function loadVerse(ref) {
  const [book, chapter, verse] = ref.split(".");
  const data = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, `${chapter}.json.gz`))));
  const row = data.verses.find((item) => item.ref === ref);
  return written(row);
}

function atFor(ref, index) {
  const [book, chapter, verse] = ref.split(".");
  const words = loadVerse(ref);
  const at = { book, chapter: Number(chapter), verse: Number(verse), index };
  const qereNumbers = ketivQereNumbers(words, index);
  if (qereNumbers) at.qereNumbers = qereNumbers;
  return { words, word: words[index], at };
}

const splitNone = [
  ["Isa.44.24", 15, "אתי"],
  ["1Sam.9.1", 2, "בנימין"],
  ["1Sam.20.2", 6, "לא"],
  ["1Sam.24.9", 5, "מערה"],
  ["2Chr.34.6", 6, "חרב"],
  ["2Kgs.6.25", 15, "דביונים"],
  ["Jer.29.23", 17, "יודע"],
  ["Judg.16.25", 1, "טוב"],
  ["Lam.1.6", 1, "בת"],
  ["Lam.4.3", 9, "יענים"],
];

const splitKeep = [
  ["1Kgs.17.15", 5],
  ["2Sam.21.12", 22],
  ["Ezek.42.9", 0],
  ["Isa.52.5", 1],
  ["Job.38.1", 4],
  ["Job.40.6", 4],
];

function note(ref, index) {
  return ketivDisplay(loadVerse(ref), index);
}

test("a split ketiv shows the qere that sits on the next ketiv", () => {
  for (const [ref, index, letters] of splitNone) {
    const shown = note(ref, index);
    assert.ok(shown, ref);
    assert.ok(shown.q, `${ref} read form`);
    assert.match(lettersOnly(shown.q), new RegExp(letters));
    const { word, at } = atFor(ref, index);
    assert.equal(shown.k, word.surface);
    assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, iibs, at), undefined, ref);
    assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at), undefined, ref);
  }
  for (const [ref, index] of splitKeep) {
    const shown = note(ref, index);
    assert.ok(shown?.q, ref);
    const { word, at } = atFor(ref, index);
    const scripture = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
    const grammar = lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at);
    assert.ok(scripture || grammar, `${ref} keeps its card`);
  }
  const job = note("Job.38.12", 3);
  assert.ok(job?.q);
  assert.match(lettersOnly(job.q), /ידעתה/);
  const jobRow = atFor("Job.38.12", 3);
  assert.equal(lemmaForReading(jobRow.word.surface, jobRow.word.lemma, jobRow.word.morph, iibs, jobRow.at), undefined);
  assert.equal(lemmaForReading(jobRow.word.surface, jobRow.word.lemma, jobRow.word.morph, VOCAB, jobRow.at), undefined);
  const dawn = atFor("Job.38.12", 4);
  assert.ok(lemmaForReading(dawn.word.surface, dawn.word.lemma, dawn.word.morph, iibs, dawn.at));
});

test("Genesis 30:11 notes the ketiv and still has no card", () => {
  const shown = note("Gen.30.11", 2);
  assert.ok(shown);
  assert.match(lettersOnly(shown.q), /בא/);
  assert.match(lettersOnly(shown.q), /גד/);
  assert.equal(shown.k, "בגד");
  const word = loadVerse("Gen.30.11")[2];
  const at = { book: "Gen", chapter: 30, verse: 11, index: 2 };
  assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, iibs, at), undefined);
  assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at), undefined);
});

test("a written-not-read ketiv has no read form and no lemma", () => {
  for (const [ref, index] of [
    ["2Kgs.5.18", 22],
    ["Ezek.48.16", 11],
    ["Jer.38.16", 9],
    ["Jer.39.12", 10],
    ["Jer.51.3", 2],
    ["Ruth.3.12", 4],
  ]) {
    assert.equal(note(ref, index), null, ref);
    const { word, at } = atFor(ref, index);
    assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, iibs, at), undefined, ref);
    assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at), undefined, ref);
  }
});

test("the ketiv note file matches the display rule, including empty-qere splits", () => {
  const notes = JSON.parse(readFileSync(join(root, "public/tanakh/ketiv-qere.json"), "utf8"));
  let tokens = 0;
  let emptyOwn = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const words = written(verse);
        words.forEach((word, index) => {
          const shown = ketivDisplay(words, index);
          const got = notes[verse.ref]?.[String(index)] ?? null;
          assert.deepEqual(got, shown, `${verse.ref}#${index}`);
          if (shown) tokens += 1;
          if (word.kq_role === "ketiv" && !(word.qere || []).length && shown) emptyOwn += 1;
        });
      }
    }
  }
  assert.equal(emptyOwn, 17);
  assert.ok(tokens > 234);
  assert.equal(notes["2Kgs.5.18"], undefined);
  assert.ok(notes["Isa.44.24"]["15"].q);
  assert.ok(notes["Job.38.12"]["3"].q);
  assert.ok(notes["Gen.30.11"]["2"].q);
});

test("English stays on the Grammar Path verse and word card", () => {
  const reading = readFileSync(join(root, "src/components/tanakh-reading.tsx"), "utf8");
  const sheet = readFileSync(join(root, "src/components/word-sheet.tsx"), "utf8");
  assert.match(reading, /EnglishVerse/);
  assert.match(reading, /English stays on the page/);
  assert.match(reading, /Which English is this verse\?/);
  assert.match(sheet, /EnglishVerse/);
  assert.doesNotMatch(reading, /The English translation stays off this page/);
  assert.match(reading, /ketivAt/);
  assert.match(readFileSync(join(root, "src/components/wlc-desk.tsx"), "utf8"), /ketivDisplay/);
});

test("every override still sits on the word it names", () => {
  const file = JSON.parse(readFileSync(join(root, "data/lemma-overrides.json"), "utf8"));
  assert.equal(file.version, 1);
  const rows = file.overrides;
  assert.equal(rows.filter((row) => row.rule === "7").length, 58);
  assert.equal(rows.filter((row) => row.ref === "Zech.8.23" && row.scripture === "iibs-e-tbwdu6" && row.grammar === null).length, 1);
  for (const row of rows) {
    const word = loadVerse(row.ref)[row.index];
    assert.ok(word, row.ref);
    assert.equal(word.surface, row.surface, `${row.ref}#${row.index} surface`);
    assert.equal(word.lemma, row.lemma, `${row.ref}#${row.index} lemma`);
    assert.equal(word.morph, row.morph, `${row.ref}#${row.index} morph`);
    const [book, chapter, verse] = row.ref.split(".");
    const at = { book, chapter: Number(chapter), verse: Number(verse), index: row.index };
    const scripture = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
    const grammar = lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at);
    assert.equal(scripture?.id ?? null, row.scripture, `${row.ref}#${row.index} scripture`);
    assert.equal(grammar?.id ?? null, row.grammar, `${row.ref}#${row.index} grammar`);
  }
});
