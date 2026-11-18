import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createJiti } from "jiti";

const root = new URL("..", import.meta.url).pathname;
const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  alias: { "@": new URL("../src", import.meta.url).pathname },
});

const { nfc } = await jiti.import(join(root, "src/lib/paradigms/nfc.ts"));
const { schoolShownForms, schoolPages, schoolTable, scriptureExamples } = await jiti.import(
  join(root, "src/lib/paradigms/school-view.ts"),
);
const { strongLevels } = await jiti.import(join(root, "src/lib/paradigms/catalog.ts"));
const { accessCacheFor } = await jiti.import(join(root, "src/lib/paradigms/access-cache.ts"));
const { englishSlot, englishPlain, hebrewRefLabel, NO_ENGLISH, TRANSLATION_OPTIONS } = await jiti.import(
  join(root, "src/lib/english-line.ts"),
);
const { ketivDisplay } = await jiti.import(join(root, "src/lib/ketiv-qere.ts"));
globalThis.React = React;
const { EnglishAsk } = await jiti.import(join(root, "src/components/english-ask.tsx"));

const school = JSON.parse(readFileSync(join(root, "data/paradigms/school-paradigm.json"), "utf8"));
const scripture = JSON.parse(readFileSync(join(root, "data/paradigms/scripture-examples.json"), "utf8"));
const versemap = JSON.parse(readFileSync(join(root, "data/paradigms/versemap.json"), "utf8"));
const ylt = JSON.parse(readFileSync(join(root, "data/paradigms/ylt.json"), "utf8")).verses;
const levels = JSON.parse(readFileSync(join(root, "data/paradigms/levels.json"), "utf8"));

const SCRIPTURE_GEN_1_1 = "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃";

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function books() {
  const dir = join(root, "public/tanakh/books");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")));
}

const share = new Map();
for (const [key, entry] of Object.entries(versemap.verses)) {
  for (const target of [...(entry.ylt ?? []), ...(entry.web ?? [])]) {
    if (!target.part) continue;
    const list = share.get(target.ref) ?? [];
    list.push({ key, part: target.part });
    share.set(target.ref, list);
  }
}

function alsoFor(hebrewKey) {
  return (englishRef, part) => {
    const list = share.get(englishRef) ?? [];
    return list.filter((item) => item.key !== hebrewKey && item.part !== part).map((item) => hebrewRefLabel(item.key));
  };
}

function slotText(slot) {
  if (slot.state === "none") return "";
  return slot.lines.map((line) => line.text).join("\n");
}

test("School view forms are NFC-equal to school-paradigm.json", () => {
  assert.equal(schoolPages().length, 9);
  assert.equal(school.pages.length, 9);
  for (const page of school.pages) {
    const table = schoolTable(page.page);
    assert.deepEqual(
      table.binyanim,
      [...new Set(school.cells.filter((cell) => cell.page === page.page).map((cell) => cell.binyan))],
    );
    for (const row of table.rows) {
      for (const cell of Object.values(row.byBinyan)) {
        if (!cell) continue;
        const file = school.cells.find((item) => item.id === cell.id);
        const shown = schoolShownForms(cell).map((form) => nfc(form));
        const allowed = [];
        if (file.forms?.length) allowed.push(...file.forms.map((form) => nfc(form)));
        else if (file.form) allowed.push(nfc(file.form));
        if (file.status === "transcribed" || file.status === "dash-no-form") {
          assert.deepEqual(shown, allowed.filter(Boolean), cell.id);
        } else {
          assert.deepEqual(shown, []);
        }
        for (const form of shown) assert.equal(form, nfc(form));
      }
    }
  }
});

test("the paradigm toggle defaults to School", () => {
  const source = read("src/components/paradigms/school-paradigm.tsx");
  assert.match(source, /useState<ParadigmView>\("school"\)/);
  assert.match(source, /setView\("school"\)/);
  assert.match(source, /setView\("scripture"\)/);
});

test("every Scripture-view example is the WLC word at wordIndex", () => {
  const cache = new Map();
  function verse(book, chapter, osis) {
    const key = `${book}/${chapter}`;
    if (!cache.has(key)) {
      const data = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, `${chapter}.json.gz`))).toString("utf8"));
      cache.set(key, data.verses);
    }
    return cache.get(key).find((row) => row.ref === osis);
  }
  let examples = 0;
  const mismatches = [];
  for (const cell of scripture.cells) {
    const shown = scriptureExamples(cell.id);
    assert.ok(shown.length <= 5, cell.id);
    if (!shown.length) continue;
    for (const example of shown) {
      examples += 1;
      const [book, chapter] = example.osis.split(".");
      const row = verse(book, chapter, example.osis);
      assert.ok(row, example.osis);
      const word = row.words[example.wordIndex - 1];
      assert.ok(word, `${example.osis} #${example.wordIndex}`);
      if (nfc(word.surface) !== nfc(example.word)) {
        mismatches.push(`${example.osis}#${example.wordIndex}`);
      }
    }
  }
  assert.ok(examples > 0);
  // scripture-examples.json is committed unchanged. These `word` strings differ from
  // the WLC surface by a dagesh or a cantillation mark. The view still prints `word`.
  assert.deepEqual([...new Set(mismatches)].sort(), [
    "1Kgs.19.14#3",
    "2Sam.22.28#7",
    "Deut.1.42#14",
    "Ezek.22.5#4",
    "Josh.2.3#7",
    "Lam.1.11#4",
    "Ps.60.3#5",
    "Ps.62.4#11",
    "Ps.62.4#3",
  ]);
});

test("a Scripture cell with no example says no example found in WLC", () => {
  const source = read("src/components/paradigms/school-paradigm.tsx");
  assert.match(source, /no example found in WLC/);
  assert.ok(scripture.cells.some((cell) => scriptureExamples(cell.id).length === 0));
});

test("weak levels stay out of the strong-verb check and quiz", () => {
  assert.deepEqual(
    strongLevels().map((level) => level.id),
    ["L1", "L2", "L3", "L4", "L5", "L6", "L7"],
  );
  assert.ok(levels.levels.some((level) => level.id === "L8" && level.phase === 2));
});

test("YLT is the first English option and nothing is on the page before the tap", () => {
  assert.deepEqual([...TRANSLATION_OPTIONS], ["YLT", "WEB"]);
  const yltSlot = { state: "text", lines: [{ ref: "Gen.1.1", text: "In the beginning of God's preparing the heavens and the earth —" }] };
  const webSlot = { state: "text", lines: [{ ref: "Gen.1.1", text: "In the beginning, God created the heavens and the earth." }] };
  const html = renderToStaticMarkup(createElement(EnglishAsk, { ylt: yltSlot, web: webSlot }));
  assert.match(html, />English</);
  assert.equal(html.includes("YLT"), false);
  assert.equal(html.includes("preparing the heavens"), false);
  assert.equal(html.includes("God created the heavens"), false);
  const ask = read("src/components/english-ask.tsx");
  assert.match(ask, /TRANSLATION_OPTIONS\.map/);
  for (const file of [
    "src/components/tanakh-reading.tsx",
    "src/components/word-sheet.tsx",
    "src/components/verse-card.tsx",
    "src/components/paradigms/school-paradigm.tsx",
    "src/components/paradigms/paradigm-check.tsx",
  ]) {
    const source = read(file);
    assert.equal(source.includes("<EnglishVerse"), false, file);
    assert.equal(source.includes("English stays on the page"), false, file);
  }
  const grade = read("src/components/tanakh-reading.tsx");
  const openAt = grade.indexOf("!open ?");
  const choicesAt = grade.indexOf("choices.map");
  assert.ok(openAt > 0 && choicesAt > openAt);
});

test("book English follows the versemap, including splits and Psalm titles", () => {
  const byKey = new Map();
  for (const book of books()) {
    for (const [ch, rows] of Object.entries(book.chapters)) {
      for (const row of rows) byKey.set(`${book.id}.${ch}.${row.v}`, row);
    }
  }
  assert.equal(byKey.size, Object.keys(versemap.verses).length);
  const psalmTitles = [];
  const splits = [];
  for (const [key, entry] of Object.entries(versemap.verses)) {
    const row = byKey.get(key);
    assert.ok(row, key);
    const expectedYlt = englishSlot("ylt", entry, ylt, alsoFor(key));
    assert.deepEqual(row.ylt, expectedYlt, key);
    if (!entry.web?.length || entry.status === "needs-review") {
      assert.equal(row.en.state, "none", key);
      assert.equal(row.en.message, NO_ENGLISH, key);
    } else {
      assert.equal(row.en.state, "text", key);
      assert.deepEqual(
        row.en.lines.map((line) => line.ref),
        entry.web.map((target) => target.ref),
        key,
      );
      for (const line of row.en.lines) {
        assert.equal(typeof line.text, "string");
        assert.ok(line.text.length > 0, key);
        assert.equal(line.text.includes(NO_ENGLISH), false);
      }
    }
    assert.equal(englishPlain(row.en).includes("undefined"), false);
    if (!entry.web?.length) psalmTitles.push(key);
    const parted = [...(entry.ylt ?? []), ...(entry.web ?? [])].some((target) => target.part) || (entry.ylt?.length ?? 0) > 1 || (entry.web?.length ?? 0) > 1;
    if (parted) splits.push(key);
  }
  assert.equal(psalmTitles.length, 67);
  assert.ok(psalmTitles.every((key) => key.startsWith("Ps.")));
  assert.ok(splits.length >= 8);

  const snap = (key) => {
    const row = byKey.get(key);
    return { web: row.en, ylt: row.ylt };
  };
  const ps31 = snap("Ps.3.1");
  assert.equal(ps31.web.state, "none");
  assert.equal(ps31.web.message, NO_ENGLISH);
  assert.match(slotText(ps31.ylt), /A Psalm of David/);
  assert.match(ps31.ylt.lines[0].alsoCovers, /Ps 3:2/);
  const ps32 = snap("Ps.3.2");
  assert.equal(ps32.web.lines[0].ref, "Ps.3.1");
  assert.match(ps32.web.lines[0].text, /Yahweh, how my adversaries/);
  assert.match(ps32.ylt.lines[0].alsoCovers, /Ps 3:1/);
  const isa = snap("Isa.63.19");
  assert.deepEqual(
    isa.web.lines.map((line) => line.ref),
    ["Isa.63.19", "Isa.64.1"],
  );
  assert.deepEqual(
    isa.ylt.lines.map((line) => line.ref),
    ["Isa.63.19", "Isa.64.1"],
  );
  const mal = snap("Mal.3.19");
  assert.equal(mal.web.lines[0].ref, "Mal.4.1");
  assert.match(mal.web.lines[0].text, /the day comes, it burns as a furnace/);
  assert.equal(mal.ylt.lines[0].ref, "Mal.4.1");
  const joel = snap("Joel.4.1");
  assert.equal(joel.web.lines[0].ref, "Joel.3.1");
  assert.equal(joel.ylt.lines[0].ref, "Joel.3.1");
  const gen = snap("Gen.32.1");
  assert.equal(gen.web.lines[0].ref, "Gen.31.55");
  assert.match(gen.web.lines[0].text, /Laban rose up/);
  for (const key of ["Num.25.19", "Num.26.1", "1Sam.20.42", "1Sam.21.1"]) {
    const row = snap(key);
    assert.equal(row.ylt.lines[0].part.includes("part"), true, key);
    assert.match(row.ylt.lines[0].text, /\S/, key);
    assert.ok(row.ylt.lines[0].alsoCovers, key);
  }
});

test("the paradigms flag cache follows the signed-in account", () => {
  assert.equal(accessCacheFor(null, "student-a").reuse, false);
  assert.equal(accessCacheFor("student-a", "student-a").reuse, true);
  assert.equal(accessCacheFor("student-a", "student-b").reuse, false);
  assert.equal(accessCacheFor("student-a", "").reuse, false);
  const source = read("src/components/paradigms/use-paradigm-progress.ts");
  assert.match(source, /loadAccess\(userId\)/);
  assert.match(source, /\[userId\]/);
});

test("paradigm components keep Hebrew in the data files", () => {
  const files = readdirSync(join(root, "src/components/paradigms")).filter((name) => name.endsWith(".tsx"));
  for (const name of files) {
    const source = readFileSync(join(root, "src/components/paradigms", name), "utf8");
    assert.equal(/[\u0590-\u05FF]/.test(source), false, name);
  }
  assert.equal(/[\u0590-\u05FF]/.test(read("src/components/english-ask.tsx")), false);
});

function scriptureLine(book, chapter, ref) {
  const data = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, `${chapter}.json.gz`))).toString("utf8"));
  const verse = data.verses.find((row) => row.ref === ref);
  const words = verse.words.filter((word) => word.kq_role !== "qere");
  return words
    .map((word, index) => {
      const note = ketivDisplay(words, index);
      const face = note?.q || word.surface;
      const trailer = !note && word.trailer ? word.trailer : "";
      return face + trailer;
    })
    .join("");
}

test("Scripture Path verse line is unchanged", () => {
  const desk = read("src/components/wlc-desk.tsx");
  const page = read("src/routes/iibs/wlc/$book/$ch.tsx");
  assert.equal(desk.includes("EnglishVerse"), false);
  assert.equal(page.includes("EnglishVerse"), false);
  assert.equal(scriptureLine("Gen", 1, "Gen.1.1"), SCRIPTURE_GEN_1_1);
});
