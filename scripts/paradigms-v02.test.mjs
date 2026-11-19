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
const { bibleSpelling, schoolShownForms, schoolPages, schoolTable, scriptureExamples } = await jiti.import(
  join(root, "src/lib/paradigms/school-view.ts"),
);
const { strongLevels } = await jiti.import(join(root, "src/lib/paradigms/catalog.ts"));
const { accessCacheFor } = await jiti.import(join(root, "src/lib/paradigms/access-cache.ts"));
const { englishSlot, englishPlain, hebrewRefLabel, englishRefLabel, NO_ENGLISH, TRANSLATION_OPTIONS } = await jiti.import(
  join(root, "src/lib/english-line.ts"),
);
const { ketivDisplay } = await jiti.import(join(root, "src/lib/ketiv-qere.ts"));
globalThis.React = React;
const { EnglishAsk, EnglishLines, GlossAsk } = await jiti.import(join(root, "src/components/english-ask.tsx"));
const { AttestedSpellingNote, SpanScripture } = await jiti.import(join(root, "src/components/paradigms/school-paradigm.tsx"));
const { routerContext } = await jiti.import(
  join(root, "node_modules/@tanstack/react-router/dist/esm/routerContext.js"),
);
const linkRouter = {
  isServer: true,
  protocolAllowlist: [],
  basepath: "",
  history: { createHref: (href) => href || "/" },
  stores: { location: { get: () => ({ pathname: "/", search: {}, searchStr: "", hash: "", state: {}, href: "/" }) } },
  buildLocation: () => ({ publicHref: "/listen/read/Gen/1", href: "/listen/read/Gen/1" }),
};
function renderScripture(cells) {
  return renderToStaticMarkup(
    createElement(routerContext.Provider, { value: linkRouter }, createElement(SpanScripture, { cells, labeled: true })),
  );
}

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
      for (const place of Object.values(row.byBinyan)) {
        if (place.kind === "covered") continue;
        for (const cell of place.cells) {
        const file = school.cells.find((item) => item.id === cell.id);
        const shown = schoolShownForms(cell).map((form) => nfc(form));
        const allowed = [];
        if (file.forms?.length) allowed.push(...file.forms.map((form) => nfc(form)));
        else if (file.form) allowed.push(nfc(file.form));
        if ((file.status === "transcribed" || file.status === "dash-no-form") && file.form) {
          assert.deepEqual(shown, [nfc(file.form)], cell.id);
        } else {
          assert.deepEqual(shown, []);
        }
        for (const form of shown) assert.equal(form, nfc(form));
        }
      }
    }
  }
});

test("merged cells span one column and every slot keeps its own row", () => {
  for (const page of school.pages) {
    const cells = school.cells.filter((cell) => cell.page === page.page);
    const expectedKeys = [];
    const seen = new Set();
    for (const cell of cells) {
      const key = `${cell.conjugation}|${cell.pgn}`;
      if (seen.has(key)) continue;
      seen.add(key);
      expectedKeys.push(key);
    }
    const table = schoolTable(page.page);
    assert.deepEqual(
      table.rows.map((row) => row.key),
      expectedKeys,
      `page ${page.page}`,
    );
    assert.deepEqual(
      table.rows.map((row) => row.label),
      expectedKeys.map((key) => {
        const [conjugation, pgn] = key.split("|");
        return !pgn || pgn === "-" ? conjugation : `${conjugation} ${pgn}`;
      }),
      `page ${page.page} labels`,
    );

    const seenIds = new Map();
    for (const row of table.rows) {
      for (const [binyan, place] of Object.entries(row.byBinyan)) {
        if (place.kind === "cells") {
          for (const cell of place.cells) {
            assert.equal(cell.mergedRows, undefined, `${cell.id} is not a span`);
            assert.equal(`${cell.conjugation}|${cell.pgn}`, row.key, cell.id);
            assert.equal(cell.binyan, binyan);
            seenIds.set(cell.id, (seenIds.get(cell.id) ?? 0) + 1);
          }
        } else if (place.kind === "span") {
          const cell = place.cells[0];
          assert.equal(place.rowSpan, cell.mergedRows.length, cell.id);
          assert.equal(cell.binyan, binyan);
          for (const item of place.cells) seenIds.set(item.id, (seenIds.get(item.id) ?? 0) + 1);
          const covered = cell.mergedRows.map((slot) => slot.replace(":", "|"));
          const start = table.rows.findIndex((item) => item.key === covered[0]);
          for (let offset = 1; offset < covered.length; offset += 1) {
            const coveredRow = table.rows[start + offset];
            assert.equal(coveredRow?.key, covered[offset], cell.id);
            assert.equal(coveredRow.byBinyan[binyan]?.kind, "covered", cell.id);
          }
        } else {
          assert.equal(place.kind, "covered");
        }
      }
    }
    for (const [id, count] of seenIds) assert.equal(count, 1, id);
    const splitRows = new Map();
    for (const row of table.rows) {
      for (const place of Object.values(row.byBinyan)) {
        if (place.kind === "covered") continue;
        const indexes = place.cells.map((cell) => cell.position?.index ?? 0);
        assert.deepEqual(indexes, [...indexes].sort((a, b) => a - b));
        for (const cell of place.cells) {
          const split = /^(.*)#\d+$/.exec(cell.id);
          if (!split) continue;
          const at = splitRows.get(split[1]) ?? new Set();
          at.add(row.key);
          splitRows.set(split[1], at);
        }
      }
    }
    for (const [base, keys] of splitRows) assert.equal(keys.size, 1, `${page.page} ${base}`);
    for (const cell of cells) {
      if (!cell.mergedRows?.length) continue;
      assert.equal(seenIds.get(cell.id) ?? 0, 1, cell.id);
    }
  }

  const page1 = schoolTable(1);
  const absolute = page1.rows.find((row) => row.key === "infinitive-absolute|-");
  const construct = page1.rows.find((row) => row.key === "infinitive-construct|-");
  assert.equal(absolute.label, "infinitive-absolute");
  assert.equal(construct.label, "infinitive-construct");
  assert.equal(absolute.byBinyan.Qal.kind, "cells");
  assert.equal(construct.byBinyan.Qal.kind, "cells");
  assert.notEqual(absolute.byBinyan.Qal.cells[0].id, construct.byBinyan.Qal.cells[0].id);
  assert.equal(absolute.byBinyan.Piel.kind, "span");
  assert.equal(absolute.byBinyan.Piel.rowSpan, 2);
  assert.equal(construct.byBinyan.Piel.kind, "covered");

  const page8 = schoolTable(8);
  const fs = page8.rows.find((row) => row.key === "participle|fs");
  const mp = page8.rows.find((row) => row.key === "participle|mp");
  const fp = page8.rows.find((row) => row.key === "participle|fp");
  assert.equal(fs.label, "participle fs");
  assert.equal(mp.label, "participle mp");
  assert.equal(fp.label, "participle fp");
  assert.equal(fs.byBinyan.Pual.kind, "span");
  assert.equal(fs.byBinyan.Pual.rowSpan, 3);
  assert.equal(fs.byBinyan.Pual.cells[0].status, "dash-no-form");
  assert.equal(mp.byBinyan.Pual.kind, "covered");
  assert.equal(fp.byBinyan.Pual.kind, "covered");
  assert.equal(fs.byBinyan.Qal.kind, "cells");
  assert.equal(mp.byBinyan.Qal.kind, "cells");
  assert.equal(fp.byBinyan.Qal.kind, "cells");
});

test("Scripture view of a merged span lists every group cell's examples", () => {
  const fileExamples = new Map(scripture.cells.map((cell) => [cell.id, (cell.examples ?? []).slice(0, 5)]));
  let groups = 0;
  for (const page of school.pages) {
    const table = schoolTable(page.page);
    for (const row of table.rows) {
      for (const place of Object.values(row.byBinyan)) {
        if (place.kind !== "span") continue;
        groups += 1;
        const html = renderScripture(place.cells);
        let empty = 0;
        for (const cell of place.cells) {
          const record = scripture.cells.find((item) => item.id === cell.id);
          const examples = fileExamples.get(cell.id) ?? [];
          const label = cell.pgn === "-" ? cell.conjugation : `${cell.conjugation} ${cell.pgn}`;
          assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
          if (!examples.length) {
            if (record?.flag) assert.ok(html.includes(record.flag), cell.id);
            else empty += 1;
            continue;
          }
          for (const example of examples) {
            assert.ok(html.includes(example.word), `${cell.id} ${example.ref}`);
            assert.ok(html.includes(example.ref), `${cell.id} ${example.ref}`);
          }
        }
        const misses = html.split("no example found in WLC").length - 1;
        assert.equal(misses, empty, `${page.page} ${place.cells.map((cell) => cell.id).join(",")}`);
      }
    }
  }
  assert.ok(groups >= 13);
  const page8 = schoolTable(8);
  const piel = page8.rows.find((row) => row.key === "infinitive-absolute|-").byBinyan.Piel;
  assert.equal(piel.kind, "span");
  assert.ok(piel.cells.some((cell) => cell.id === "Hollow:Piel.infinitive-construct"));
  const construct = fileExamples.get("Hollow:Piel.infinitive-construct");
  assert.equal(construct.length, 5);
  const html = renderScripture(piel.cells);
  for (const example of construct) assert.ok(html.includes(example.ref), example.ref);
  const absolute = scripture.cells.find((cell) => cell.id === "Hollow:Piel.infinitive-absolute");
  assert.equal((absolute.examples ?? []).length, 0);
  assert.ok(html.includes(absolute.flag));
});

test("the paradigm toggle defaults to School", () => {
  const source = read("src/components/paradigms/school-paradigm.tsx");
  assert.match(source, /useState<ParadigmView>\("school"\)/);
  assert.match(source, /setView\("school"\)/);
  assert.match(source, /setView\("scripture"\)/);
});

test("every scripture example word NFC-equals the reader surface at its index", () => {
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
  for (const cell of scripture.cells) {
    assert.ok(scriptureExamples(cell.id).length <= 5, cell.id);
    for (const example of cell.examples ?? []) {
      examples += 1;
      const [book, chapter] = example.osis.split(".");
      const row = verse(book, chapter, example.osis);
      assert.ok(row, example.osis);
      const word = row.words[example.wordIndex - 1];
      assert.ok(word, `${cell.id} ${example.osis} #${example.wordIndex}`);
      assert.equal(nfc(word.surface), nfc(example.word), `${cell.id} ${example.osis} #${example.wordIndex}`);
    }
  }
  assert.equal(examples, 3796);
  const piel = scripture.cells.find((cell) => cell.id === "Piel.participle.mp");
  assert.equal(piel.examples.some((example) => example.osis === "Lam.1.11"), false);
  const qatal = scripture.cells.find((cell) => cell.id === "III-Aleph:Piel.qatal.1cs");
  assert.equal(qatal.examples.some((example) => example.osis === "1Kgs.19.14" && example.wordIndex === 3), false);
  const absolute = scripture.cells.find((cell) => cell.id === "III-Aleph:Piel.infinitive-absolute");
  assert.equal(absolute.examples.some((example) => example.osis === "1Kgs.19.14" && example.wordIndex === 2), true);
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
  assert.equal(desk.includes("VerseEnglish"), false);
  assert.equal(page.includes("VerseEnglish"), false);
  assert.equal(scriptureLine("Gen", 1, "Gen.1.1"), SCRIPTURE_GEN_1_1);
});

test("no component passes one slot as both YLT and WEB", () => {
  const files = [];
  function walk(dir) {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, name.name);
      if (name.isDirectory()) walk(path);
      else if (name.name.endsWith(".tsx")) files.push(path);
    }
  }
  walk(join(root, "src"));
  for (const path of files) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /ylt=\{([A-Za-z0-9_.]+)\}[^>]*web=\{\1\}/, path);
    assert.doesNotMatch(source, /ylt=\{asEnglishSlot\(([^)]+)\)\}[^>]*web=\{asEnglishSlot\(\1\)\}/, path);
  }
});

test("Num 17:13 and Deut 13:3 use their versemap English refs", () => {
  const num = JSON.parse(readFileSync(join(root, "public/tanakh/books/Num.json"), "utf8"));
  const deut = JSON.parse(readFileSync(join(root, "public/tanakh/books/Deut.json"), "utf8"));
  const numRow = num.chapters["17"].find((row) => row.v === 13);
  const deutRow = deut.chapters["13"].find((row) => row.v === 3);
  assert.deepEqual(numRow.en.lines.map((line) => line.ref), ["Num.16.48"]);
  assert.deepEqual(numRow.ylt.lines.map((line) => line.ref), ["Num.16.48"]);
  assert.deepEqual(deutRow.en.lines.map((line) => line.ref), ["Deut.13.2"]);
  assert.deepEqual(deutRow.ylt.lines.map((line) => line.ref), ["Deut.13.2"]);
  assert.equal(englishRefLabel("Mal.4.1"), "Mal 4:1");
  assert.equal(englishRefLabel("Num.16.48"), "Num 16:48");
  const lines = renderToStaticMarkup(createElement(EnglishLines, { slot: numRow.ylt }));
  assert.match(lines, /Num 16:48/);
  assert.equal(lines.includes("Num.16.48"), false);
});

test("the next grade question starts with no English in the DOM", async () => {
  const { GradeCard } = await jiti.import(join(root, "src/components/tanakh-reading.tsx"));
  const first = {
    id: "Gen 1:1:0",
    verse: {
      ref: "Gen 1:1",
      words: ["בְּרֵאשִׁית"],
      en: "In the beginning, God created the heavens and the earth.",
      ylt: "In the beginning of God's preparing the heavens and the earth",
      enSlot: { state: "text", lines: [{ ref: "Gen.1.1", text: "In the beginning, God created the heavens and the earth." }] },
      yltSlot: { state: "text", lines: [{ ref: "Gen.1.1", text: "In the beginning of God's preparing the heavens and the earth" }] },
    },
    choices: ["In the beginning, God created the heavens and the earth.", "A neighbour verse"],
    answer: "In the beginning, God created the heavens and the earth.",
    yltChoices: ["In the beginning of God's preparing the heavens and the earth"],
    yltAnswer: "In the beginning of God's preparing the heavens and the earth",
  };
  const second = {
    ...first,
    id: "Gen 1:2:1",
    verse: { ...first.verse, ref: "Gen 1:2", words: ["וְהָאָרֶץ"] },
    choices: ["And the earth was waste and void."],
    answer: "And the earth was waste and void.",
    yltChoices: ["And the earth hath existed waste and void"],
    yltAnswer: "And the earth hath existed waste and void",
  };
  const closed = (item, qi) =>
    renderToStaticMarkup(createElement(GradeCard, { item, qi, total: 2, picked: null, onPick: () => {} }));
  const opened = closed(first, 0);
  assert.match(opened, />English</);
  assert.equal(opened.includes("God created the heavens"), false);
  assert.equal(opened.includes("preparing the heavens"), false);
  const next = closed(second, 1);
  assert.match(next, />English</);
  assert.equal(next.includes("waste and void"), false);
  assert.equal(next.includes("God created the heavens"), false);
  const reading = read("src/components/tanakh-reading.tsx");
  assert.match(reading, /<GradeCard key=\{quiz\[qi\]!\.id\}/);
  assert.match(reading, /openId === item\.id/);
});

test("a class gloss is absent until the English control is opened", async () => {
  const { TanakhLearnVerse } = await jiti.import(join(root, "src/components/tanakh-learn-verse.tsx"));
  const { learnVerseExplain } = await jiti.import(join(root, "src/lib/tanakh-learn-note.ts"));
  const verse = {
    ref: "Gen.1.1",
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים",
    en: "In the beginning God created the heavens and the earth.",
    hit: "בְּרֵאשִׁית",
  };
  const explained = learnVerseExplain(verse, "article", []);
  const html = renderToStaticMarkup(createElement(TanakhLearnVerse, { verse, kind: "article" }));
  assert.match(html, />English</);
  if (explained.lemmaGloss) assert.equal(html.includes(explained.lemmaGloss), false, explained.lemmaGloss);
  assert.equal(html.includes("In the beginning God created"), false);
});

test("book English waits for the tap and shares one download per book", async () => {
  const { shareBookLoad } = await jiti.import(join(root, "src/lib/verse-english.ts"));
  let calls = 0;
  const load = () => {
    calls += 1;
    return new Promise((resolve) => setTimeout(() => resolve({ id: "Gen", chapters: {} }), 10));
  };
  const [first, second] = await Promise.all([shareBookLoad("Gen", load), shareBookLoad("Gen", load)]);
  assert.equal(calls, 1);
  assert.equal(first, second);
  const closed = renderToStaticMarkup(
    createElement(EnglishAsk, {
      loading: true,
      ylt: { state: "none", message: "No English for this verse" },
      web: { state: "none", message: "No English for this verse" },
      verseKey: "Gen.1.1",
    }),
  );
  assert.match(closed, />English</);
  assert.equal(closed.includes("Loading"), false);
  assert.equal(closed.includes("No English for this verse"), false);
  const html = renderToStaticMarkup(
    createElement(EnglishAsk, {
      loading: true,
      startOpen: true,
      ylt: { state: "none", message: "No English for this verse" },
      web: { state: "none", message: "No English for this verse" },
      verseKey: "Gen.1.1",
    }),
  );
  assert.match(html, /Loading…/);
  assert.equal(html.includes("No English for this verse"), false);
  const source = read("src/components/verse-english.tsx");
  assert.match(source, /useVerseSlots\(verseRef, asked\)/);
  assert.match(source, /askedRef === verseRef/);
  assert.match(read("src/components/english-ask.tsx"), /Loading…/);
});

test("the printed Qal infinitive construct and the page 9 flag come from the data", () => {
  const printed = school.cells.find((cell) => cell.id === "Qal.infinitive-construct");
  assert.deepEqual(schoolShownForms(printed).map((form) => nfc(form)), [nfc(printed.form)]);
  assert.ok(printed.form.includes("w/suffix"));
  const flagged = scripture.cells.find((cell) => cell.id === "Geminate:Hiphil.wayyiqtol.3ms");
  assert.equal(flagged.flag, "school print, no strict WLC match");
  assert.equal(flagged.examples.length, 0);
  const attested = flagged.nearestAttested[0];
  assert.equal(attested.ref, "Exod 13:18");
  const [book, chapter] = attested.osis.split(".");
  const data = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, `${chapter}.json.gz`))).toString("utf8"));
  const verse = data.verses.find((row) => row.ref === attested.osis);
  assert.equal(nfc(verse.words[attested.wordIndex - 1].surface), nfc(attested.word));
  const view = read("src/components/paradigms/school-paradigm.tsx");
  assert.match(view, /scriptureFlag/);
  assert.match(view, /nearestAttested/);
  assert.match(view, /note\.text\.includes\(cell\.form\)/);
  assert.match(view, /Bible spelling differs\. See the note below\./);
  assert.match(view, /How the Hebrew Bible writes it/);
  assert.match(view, /<bdi>/);
  assert.equal(/[\u0590-\u05FF]/.test(view), false);
  const schoolCell = school.cells.find((cell) => cell.id === "Geminate:Hiphil.wayyiqtol.3ms");
  const spelling = bibleSpelling(schoolCell.id);
  assert.equal(nfc(spelling.printed), nfc(schoolCell.form));
  assert.equal(spelling.count, flagged.nearestAttested.length);
  assert.equal(nfc(spelling.attested), nfc(flagged.nearestAttested[0].word).replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C6\u034F]/g, ""));
  const cellHtml = renderScripture([{ id: schoolCell.id, conjugation: "wayyiqtol", pgn: "3ms" }]);
  assert.match(cellHtml, /Bible spelling differs\. See the note below\./);
  assert.equal(cellHtml.includes("Exod 13:18"), false);
  const noteHtml = renderToStaticMarkup(
    createElement(routerContext.Provider, { value: linkRouter }, createElement(AttestedSpellingNote, { id: schoolCell.id })),
  );
  assert.match(noteHtml, /How the Hebrew Bible writes it/);
  assert.ok(noteHtml.includes(spelling.printed));
  assert.ok(noteHtml.includes(spelling.attested));
  assert.match(noteHtml, new RegExp(`all ${spelling.count} places below`));
  assert.match(noteHtml, /<bdi><a [^>]*>Exod 13:18<\/a><\/bdi>/);
  assert.match(noteHtml, /<bdi><a [^>]*>2Sam 20:12<\/a><\/bdi>/);
  const sheet = read("src/components/word-sheet.tsx");
  assert.match(sheet, /<div className="mt-3 text-sm text-ink">/);
  assert.match(sheet, /label="Meaning"/);
  assert.equal(sheet.includes('<p className="mt-3 text-sm text-ink">'), false);
  const closed = renderToStaticMarkup(createElement(GlossAsk, { text: "beginning", label: "Meaning" }));
  assert.match(closed, />Meaning</);
  assert.equal(closed.includes("beginning"), false);
  const opened = renderToStaticMarkup(createElement(GlossAsk, { text: "a primitive root\nKJV: to turn", label: "Meaning", startOpen: true }));
  assert.match(opened, /a primitive root/);
  assert.match(opened, /KJV: to turn/);
  assert.equal(opened.includes(">Meaning<"), false);
  const glance = read("src/components/strong-glance.tsx");
  assert.equal((glance.match(/<GlossAsk/g) ?? []).length, 1);
  assert.equal(glance.includes("{row.def ?"), false);
  assert.match(glance, /KJV: \$\{row\.kjv\}/);
  const builder = read("src/components/qal-imperfect-builder.tsx");
  assert.match(builder, /scripture \?/);
  assert.match(builder, /VerseEnglish verseRef=\{root\.ref\}/);
  assert.match(read("src/routes/iibs/qal-imperfect.tsx"), /QalImperfectBuilder scripture/);
});

test("curated Hebrew matches the WLC reader text at its ref", async () => {
  const { VERSES } = await jiti.import(join(root, "src/lib/verses.ts"));
  const { PARADIGM_VERSES } = await jiti.import(join(root, "src/lib/verbal-paradigm-verses.ts"));
  const names = { "1 Sam": "1Sam", "2 Sam": "2Sam", "1 Kgs": "1Kgs", "2 Kgs": "2Kgs", "1 Chr": "1Chr", "2 Chr": "2Chr" };
  function parseRef(ref) {
    const dotted = /^(\S+)\.(\d+)\.(\d+)$/.exec(ref);
    if (dotted) return [dotted[1], dotted[2], dotted[3]];
    const spaced = /^(.+?)\s+(\d+):(\d+)$/.exec(ref);
    assert.ok(spaced, ref);
    return [names[spaced[1]] ?? spaced[1], spaced[2], spaced[3]];
  }
  function plain(text) {
    return nfc(text).replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C6\u034F]/g, "").replace(/[־]/g, " ").replace(/\s+/g, " ").trim();
  }
  const cache = new Map();
  function reader(ref) {
    const [book, chapter, verse] = parseRef(ref);
    const key = `${book}/${chapter}`;
    if (!cache.has(key)) {
      const data = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, `${chapter}.json.gz`))).toString("utf8"));
      cache.set(key, data.verses);
    }
    const row = cache.get(key).find((item) => item.ref === `${book}.${chapter}.${verse}`);
    assert.ok(row, ref);
    return row.words.filter((word) => word.kq_role !== "qere").map((word) => word.surface).join(" ");
  }
  function matches(row) {
    return plain(reader(row.ref)).includes(plain(row.he));
  }
  for (const [id, row] of Object.entries(PARADIGM_VERSES)) {
    assert.ok(matches(row), id);
  }
  const missed = Object.entries(VERSES).filter(([, row]) => !matches(row)).map(([id]) => id);
  assert.equal(missed.includes("hattat"), false);
  assert.equal(missed.includes("ein"), false);
  assert.deepEqual(missed, [
    "moses",
    "jerusalem",
    "isaac",
    "saul",
    "naarah",
    "zar",
    "ha-int",
    "matteh",
    "zakar-v",
    "baal",
    "avon",
    "lama",
    "yad",
    "kohen",
    "esh",
    "shabbat",
    "yatsa",
    "banah",
    "lamad",
    "sane",
    "salah",
    "tsaaq",
    "qadash",
    "nata",
    "shabar",
    "shamad",
    "nuah",
    "shakab",
    "mashal",
    "nahag",
  ]);
});

test("the paradigms flag clears when the account changes", () => {
  const source = read("src/components/paradigms/use-paradigm-progress.ts");
  assert.match(source, /setEnabled\(false\)/);
  const access = read("src/lib/paradigms/access-cache.ts");
  assert.match(access, /reuse:/);
});
