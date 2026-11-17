import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { lemmaForReading, verbStem } = await jiti.import(join(root, "src/lib/reading-loop/strong-lemma.ts"));
const { parseOshbLemma } = await jiti.import(join(root, "src/lib/oshb-lemma.ts"));
const { iibsPathItems } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { VOCAB } = await jiti.import(join(root, "src/lib/vocab.ts"));
const iibs = iibsPathItems();

function contentNumbers(raw) {
  return parseOshbLemma(String(raw ?? "")).parts.map((part) => Number(part.strong.slice(1))).filter((n) => n > 0);
}

function atFor(book, chapter, verse, word) {
  const at = { book, chapter, verse };
  if (word.kq_role === "ketiv") at.qereLemma = word.qere?.[0]?.lemma ?? "";
  return at;
}

const hits = [];
function take(book, chapter, verse, index) {
  const data = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, `${chapter}.json.gz`))));
  const row = data.verses.find((verseRow) => verseRow.ref === `${book}.${chapter}.${verse}`);
  const words = row.words.filter((word) => word.kq_role !== "qere");
  const word = words[index];
  const at = atFor(book, chapter, verse, word);
  const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
  return { word, item };
}

test("H3212 qal is הָלַךְ, and the hiphil stays הוֹלִיךְ", () => {
  let qal = 0;
  let qalKept = 0;
  let hiphil = 0;
  let other = 0;
  let qal1980 = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const [bk, ch, vs] = verse.ref.split(".");
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        words.forEach((word, index) => {
          const numbers = contentNumbers(word.lemma);
          if (numbers.length !== 1 || (numbers[0] !== 3212 && numbers[0] !== 1980)) return;
          const at = atFor(bk, Number(ch), Number(vs), word);
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
          const stem = verbStem(word.morph).stem;
          if (numbers[0] === 3212 && stem === "q") {
            qal += 1;
            const qere = contentNumbers(word.qere?.[0]?.lemma);
            const blocked = word.kq_role === "ketiv" && !(qere.length === 1 && qere[0] === 3212);
            if (blocked) assert.equal(item, undefined, `${verse.ref}#${index}`);
            else {
              qalKept += 1;
              assert.equal(item?.id, "iibs-a-1msybw9", `${verse.ref}#${index}`);
            }
          } else if (numbers[0] === 3212 && stem === "h") {
            hiphil += 1;
            assert.equal(item?.id, "iibs-c-1tp6utj", `${verse.ref}#${index}`);
          } else if (numbers[0] === 3212) {
            other += 1;
            assert.equal(item, undefined, `${verse.ref}#${index} ${word.morph}`);
          } else if (stem === "q") {
            qal1980 += 1;
            assert.equal(item?.id, "iibs-a-1msybw9", `${verse.ref}#${index}`);
          }
        });
      }
    }
  }
  assert.equal(qal, 998);
  assert.equal(qalKept, 995);
  assert.equal(hiphil, 45);
  assert.equal(other, 1);
  assert.equal(qal1980 > 0, true);
  const walked = take("1Chr", 11, 4, 0);
  assert.equal(walked.item?.id, "iibs-a-1msybw9");
});

test("H5324 niphal is נִצַּב, hophal has no lemma, and hiphil stays הִצִּיב", () => {
  let niphal = 0;
  let hiphil = 0;
  let hophal = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        const [bk, ch, vs] = verse.ref.split(".");
        words.forEach((word) => {
          if (contentNumbers(word.lemma)[0] !== 5324 || contentNumbers(word.lemma).length !== 1) return;
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, atFor(bk, Number(ch), Number(vs), word));
          const stem = verbStem(word.morph).stem;
          if (stem === "N") {
            niphal += 1;
            assert.equal(item?.id, "iibs-c-11jl9et");
          } else if (stem === "h") {
            hiphil += 1;
            assert.equal(item?.id, "iibs-c-1jg2v39");
          } else if (stem === "H") {
            hophal += 1;
            assert.equal(item, undefined);
          } else {
            assert.equal(item, undefined);
          }
        });
      }
    }
  }
  assert.equal(niphal, 50);
  assert.equal(hiphil, 21);
  assert.equal(hophal, 3);
  for (const [book, ch, verse, index] of [["Gen", 28, 12, 3], ["Judg", 9, 6, 14], ["Nah", 2, 8, 0]]) {
    assert.equal(take(book, ch, verse, index).item, undefined, `${book} ${ch}:${verse}`);
  }
});

test("Aramaic H606 has no Hebrew card", () => {
  const map = JSON.parse(readFileSync(join(root, "src/lib/reading-loop/strong-map.json"), "utf8"));
  assert.equal(map.iibs["606"], undefined);
  assert.equal(map.bbh["606"], undefined);
  let n = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const [bk, ch, vs] = verse.ref.split(".");
        for (const word of verse.words) {
          if (word.kq_role === "qere") continue;
          if (contentNumbers(word.lemma).length !== 1 || contentNumbers(word.lemma)[0] !== 606) continue;
          n += 1;
          assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, iibs, atFor(bk, Number(ch), Number(vs), word)), undefined);
          assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, atFor(bk, Number(ch), Number(vs), word)), undefined);
        }
      }
    }
  }
  assert.equal(n, 25);
});

test("H3526 piel stays, and the passive stems and the fuller participles do not", () => {
  let piel = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const [bk, ch, vs] = verse.ref.split(".");
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        words.forEach((word) => {
          if (contentNumbers(word.lemma).length !== 1 || contentNumbers(word.lemma)[0] !== 3526) return;
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, atFor(bk, Number(ch), Number(vs), word));
          if (verbStem(word.morph).stem === "p") {
            piel += 1;
            assert.equal(item?.id, "iibs-b-11dtd9c");
          }
        });
      }
    }
  }
  assert.equal(piel, 44);
  for (const [book, ch, verse, index] of [
    ["Lev", 13, 55, 3],
    ["Lev", 13, 56, 7],
    ["Lev", 13, 58, 14],
    ["Lev", 15, 17, 9],
    ["2Kgs", 18, 17, 31],
    ["Isa", 7, 3, 20],
    ["Isa", 36, 2, 19],
  ]) {
    assert.equal(take(book, ch, verse, index).item, undefined, `${book}.${ch}.${verse}#${index}`);
  }
});

test("two Strong’s numbers get no lemma, and H639 anger is not אַף also", () => {
  const found = [];
  let angerAlso = 0;
  let alsoAnger = 0;
  let anger = 0;
  let also = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const [bk, ch, vs] = verse.ref.split(".");
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        words.forEach((word, index) => {
          const numbers = contentNumbers(word.lemma);
          const at = atFor(bk, Number(ch), Number(vs), word);
          if (numbers.length > 1) {
            found.push(`${verse.ref}#${index}`);
            assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, iibs, at), undefined);
            assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at), undefined);
          }
          if (numbers.length !== 1) return;
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
          if (numbers[0] === 639 && item) {
            anger += 1;
            if (item.id === "iibs-a-1it90xu") angerAlso += 1;
          }
          if (numbers[0] === 637 && item) {
            also += 1;
            if (item.id === "iibs-b-qtu1ft") alsoAnger += 1;
            assert.equal(item.id, "iibs-a-1it90xu");
          }
        });
      }
    }
  }
  assert.deepEqual(found.sort(), [
    "1Chr.20.4#1",
    "2Chr.20.1#1",
    "2Chr.20.35#0",
    "2Sam.6.7#0",
    "2Sam.8.1#1",
    "Num.12.9#0",
    "Ps.149.1#0",
    "Ps.150.1#0",
  ]);
  assert.equal(found.length, 8);
  assert.equal(angerAlso, 0);
  assert.equal(alsoAnger, 0);
  assert.ok(anger > 0);
  assert.ok(also > 0);
  assert.equal(take("Num", 12, 9, 0).item, undefined);
  assert.equal(take("2Sam", 6, 7, 0).item, undefined);
});

test("a ketiv whose Strong’s number is not the qere’s gets no lemma", () => {
  let differ = 0;
  let same = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const [bk, ch, vs] = verse.ref.split(".");
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        words.forEach((word) => {
          if (word.kq_role !== "ketiv") return;
          const kn = contentNumbers(word.lemma);
          const qn = contentNumbers(word.qere?.[0]?.lemma);
          const k = kn.length === 1 ? kn[0] : 0;
          const q = qn.length === 1 ? qn[0] : 0;
          if (kn.length > 1 || qn.length > 1) return;
          const at = atFor(bk, Number(ch), Number(vs), word);
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
          const plain = lemmaForReading(word.surface, word.lemma, word.morph, iibs, { book: bk, chapter: Number(ch), verse: Number(vs) });
          if (k !== q) {
            differ += 1;
            assert.equal(item, undefined, verse.ref);
          } else {
            same += 1;
            assert.equal(item?.id, plain?.id);
          }
        });
      }
    }
  }
  assert.equal(differ, 250);
  assert.equal(same, 1018);
  assert.equal(take("Isa", 44, 24, 15).item, undefined);
  assert.equal(take("Song", 2, 13, 8).item, undefined);
  assert.equal(take("Isa", 10, 32, 7).item, undefined);
});

test("H1323 is not Zion, and Isaiah 10:32 is unmatched", () => {
  const map = JSON.parse(readFileSync(join(root, "src/lib/reading-loop/strong-map.json"), "utf8"));
  for (const path of ["bbh", "iibs"]) {
    const row = map[path]["1323"] ?? [];
    assert.equal(row.some(([id]) => id === "zion" || id === "iibs-a-10um24x"), false);
  }
  assert.equal(take("Isa", 10, 32, 8).item, undefined);
  hits.push("locked");
});
