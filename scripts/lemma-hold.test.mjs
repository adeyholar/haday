import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { lemmaForReading, verbStem, ketivQereNumbers, strongNumberHasPlus } = await jiti.import(join(root, "src/lib/reading-loop/strong-lemma.ts"));
const { parseOshbLemma } = await jiti.import(join(root, "src/lib/oshb-lemma.ts"));
const { iibsPathItems } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { VOCAB } = await jiti.import(join(root, "src/lib/vocab.ts"));
const iibs = iibsPathItems();

function contentNumbers(raw) {
  return parseOshbLemma(String(raw ?? "")).parts.map((part) => Number(part.strong.slice(1))).filter((n) => n > 0);
}

function atFor(book, chapter, verse, words, index) {
  const at = { book, chapter, verse, index };
  const qereNumbers = ketivQereNumbers(words, index);
  if (qereNumbers) at.qereNumbers = qereNumbers;
  return at;
}

const hits = [];
function take(book, chapter, verse, index) {
  const data = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, `${chapter}.json.gz`))));
  const row = data.verses.find((verseRow) => verseRow.ref === `${book}.${chapter}.${verse}`);
  const words = row.words.filter((word) => word.kq_role !== "qere");
  const word = words[index];
  const at = atFor(book, chapter, verse, words, index);
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
          const at = atFor(bk, Number(ch), Number(vs), words, index);
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
          const stem = verbStem(word.morph).stem;
          if (numbers[0] === 3212 && stem === "q") {
            qal += 1;
            const qereNumbers = ketivQereNumbers(words, index) ?? [];
            const blocked = word.kq_role === "ketiv" && !qereNumbers.includes(3212);
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
        words.forEach((word, index) => {
          if (contentNumbers(word.lemma)[0] !== 5324 || contentNumbers(word.lemma).length !== 1) return;
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, atFor(bk, Number(ch), Number(vs), words, index));
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
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        words.forEach((word, index) => {
          if (contentNumbers(word.lemma).length !== 1 || contentNumbers(word.lemma)[0] !== 606) return;
          n += 1;
          assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, iibs, atFor(bk, Number(ch), Number(vs), words, index)), undefined);
          assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, atFor(bk, Number(ch), Number(vs), words, index)), undefined);
        });
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
        words.forEach((word, index) => {
          if (contentNumbers(word.lemma).length !== 1 || contentNumbers(word.lemma)[0] !== 3526) return;
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, atFor(bk, Number(ch), Number(vs), words, index));
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
          const at = atFor(bk, Number(ch), Number(vs), words, index);
          if (numbers.length > 1) {
            found.push(`${verse.ref}#${index}`);
            assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, iibs, at), undefined);
            assert.equal(lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at), undefined);
          }
          if (numbers.length !== 1) return;
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
          const grammar = lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at);
          if (numbers[0] === 639 && word.morph === "HTa") {
            anger += 1;
            assert.equal(item?.id, "iibs-b-qtu1ft", `${verse.ref}#${index}`);
            assert.equal(grammar?.id, "aph", `${verse.ref}#${index}`);
            if (item?.id === "iibs-a-1it90xu") angerAlso += 1;
            return;
          }
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
  assert.equal(anger, 274);
  assert.equal(also, 134);
  assert.equal(take("Num", 12, 9, 0).item, undefined);
  assert.equal(take("2Sam", 6, 7, 0).item, undefined);
});

test("a ketiv keeps its lemma when its number is in the qere", () => {
  const keep = new Set([
    "Job.38.1#4",
    "Job.38.1#5",
    "Job.38.12#4",
    "Job.40.6#4",
    "Job.40.6#5",
    "Exod.4.2#3",
    "1Sam.20.2#7",
    "2Sam.21.12#22",
    "2Sam.21.12#23",
    "Ezek.42.9#0",
    "Ezek.42.9#1",
    "Ezek.9.11#11",
    "1Kgs.17.15#5",
    "Isa.52.5#1",
  ]);
  const writtenNotRead = new Set([
    "2Kgs.5.18#22",
    "Ezek.48.16#11",
    "Jer.38.16#9",
    "Jer.39.12#10",
    "Jer.51.3#2",
    "Ruth.3.12#4",
  ]);
  let differ = 0;
  let same = 0;
  let appendix = 0;
  const kept = [];
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const [bk, ch, vs] = verse.ref.split(".");
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        words.forEach((word, index) => {
          if (word.kq_role !== "ketiv") return;
          const kn = contentNumbers(word.lemma);
          if (kn.length > 1) return;
          const qereNumbers = ketivQereNumbers(words, index) ?? [];
          const at = atFor(bk, Number(ch), Number(vs), words, index);
          const where = { book: bk, chapter: Number(ch), verse: Number(vs), index };
          const item = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
          const plain = lemmaForReading(word.surface, word.lemma, word.morph, iibs, where);
          const grammar = lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at);
          const grammarPlain = lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, where);
          const key = `${verse.ref}#${index}`;
          const matched = kn.length === 1 && qereNumbers.includes(kn[0]);
          if (matched) {
            same += 1;
            assert.equal(item?.id, plain?.id, key);
            assert.equal(grammar?.id, grammarPlain?.id, key);
          } else if (kn.length === 1 || qereNumbers.length) {
            differ += 1;
            assert.equal(item, undefined, key);
            assert.equal(grammar, undefined, key);
            if (plain || grammarPlain) appendix += 1;
          } else {
            same += 1;
          }
          if (keep.has(key)) {
            kept.push(key);
            assert.equal(item?.id, plain?.id, key);
            assert.equal(grammar?.id, grammarPlain?.id, key);
            assert.ok(plain || grammarPlain, key);
            if (key === "Isa.52.5#1") assert.equal(grammarPlain?.id, "mah");
          }
          if (writtenNotRead.has(key)) assert.equal(item, undefined, key);
        });
      }
    }
  }
  assert.equal(kept.length, keep.size);
  assert.equal(same, 1034);
  assert.equal(differ, 234);
  assert.equal(appendix, 101);
  assert.equal(take("Isa", 44, 24, 15).item, undefined);
  assert.equal(take("Song", 2, 13, 8).item, undefined);
  assert.equal(take("Isa", 10, 32, 7).item, undefined);
  assert.equal(take("Neh", 2, 13, 16).item, undefined);
  assert.equal(take("Job", 38, 12, 3).item, undefined);
  const neh = take("Neh", 2, 13, 16);
  const job = take("Job", 38, 12, 3);
  const dawn = take("Job", 38, 12, 4);
  assert.equal(lemmaForReading(neh.word.surface, neh.word.lemma, neh.word.morph, VOCAB, { book: "Neh", chapter: 2, verse: 13, index: 16 }), undefined);
  assert.equal(lemmaForReading(job.word.surface, job.word.lemma, job.word.morph, VOCAB, { book: "Job", chapter: 38, verse: 12, index: 3 }), undefined);
  assert.ok(dawn.item);
  assert.notEqual(dawn.item?.id, "iibs-a-1vjj7fa");
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

test("a trailing plus is not a class lemma, except the number stays on the map for Beer-sheba", () => {
  const map = JSON.parse(readFileSync(join(root, "src/lib/reading-loop/strong-map.json"), "utf8"));
  assert.equal(map.iibs["6307"], undefined);
  assert.equal(map.iibs["7418"], undefined);
  assert.equal(map.bbh["6307"], undefined);
  assert.equal(map.bbh["7418"], undefined);
  assert.ok(map.iibs["884"]);
  assert.ok(map.iibs["758"]);
  assert.ok(map.iibs["5045"]);
  assert.equal(Object.keys(map.bbh).length, 559);
  assert.equal(Object.keys(map.iibs).length, 1680);
  let cleared = 0;
  let otherPlus = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const [bk, ch, vs] = verse.ref.split(".");
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        words.forEach((word, index) => {
          const lemma = String(word.lemma ?? "");
          const hit = /(^|\/)(6307|7418)\+?(?=\/|$)/.test(lemma);
          if (!hit && !strongNumberHasPlus(lemma)) return;
          const at = atFor(bk, Number(ch), Number(vs), words, index);
          const scripture = lemmaForReading(word.surface, lemma, word.morph, iibs, at);
          const grammar = lemmaForReading(word.surface, lemma, word.morph, VOCAB, at);
          if (hit) {
            cleared += 1;
            assert.equal(scripture, undefined, `${verse.ref}#${index}`);
            assert.equal(grammar, undefined, `${verse.ref}#${index}`);
            return;
          }
          const nums = contentNumbers(lemma);
          if (strongNumberHasPlus(lemma) && !(nums.length === 1 && nums[0] === 884)) {
            otherPlus += 1;
            assert.equal(scripture, undefined, `${verse.ref}#${index}`);
            assert.equal(grammar, undefined, `${verse.ref}#${index}`);
          }
        });
      }
    }
  }
  // 10 first words of Paddan-aram, 10 following אֲרָם, Gen 48:7 #2, and 1Sam 30:27 #4–#5.
  assert.equal(cleared, 23);
  assert.equal(otherPlus, 755);
  assert.equal(take("Gen", 28, 2, 2).item, undefined);
  assert.equal(take("Gen", 28, 2, 3).item, undefined);
  assert.equal(take("Gen", 48, 7, 2).item, undefined);
  assert.equal(take("1Sam", 30, 27, 4).item, undefined);
  assert.equal(take("1Sam", 30, 27, 5).item, undefined);
});

test("H884 Beer-sheba keeps its card", () => {
  const beer = iibs.find((item) => item.gloss === "Beer Sheva");
  assert.ok(beer);
  let marked = 0;
  for (const book of readdirSync(join(root, "data/wlc"))) {
    for (const name of readdirSync(join(root, "data/wlc", book))) {
      if (!name.endsWith(".json.gz")) continue;
      const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, name))));
      for (const verse of chapter.verses) {
        const [bk, ch, vs] = verse.ref.split(".");
        const words = verse.words.filter((word) => word.kq_role !== "qere");
        words.forEach((word, index) => {
          if (!strongNumberHasPlus(word.lemma)) return;
          const nums = contentNumbers(word.lemma);
          if (!(nums.length === 1 && nums[0] === 884)) return;
          marked += 1;
          const at = atFor(bk, Number(ch), Number(vs), words, index);
          const scripture = lemmaForReading(word.surface, word.lemma, word.morph, iibs, at);
          const grammar = lemmaForReading(word.surface, word.lemma, word.morph, VOCAB, at);
          assert.equal(scripture?.id, beer.id, `${verse.ref}#${index}`);
          assert.equal(grammar, undefined, `${verse.ref}#${index}`);
        });
      }
    }
  }
  assert.equal(marked, 34);
  assert.equal(lemmaForReading("בְּאֵ֣ר", "H884", "HNp", iibs)?.id, beer.id);
});
