import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const bookMod = await jiti.import(new URL("../src/lib/paradigm/book.ts", import.meta.url).pathname);
const gen = await jiti.import(new URL("../src/lib/paradigm/generate.ts", import.meta.url).pathname);
const gradeMod = await jiti.import(new URL("../src/lib/paradigm/grade.ts", import.meta.url).pathname);
const srs = await jiti.import(new URL("../src/lib/paradigm/srs.ts", import.meta.url).pathname);
const diff = await jiti.import(new URL("../src/lib/paradigm/diff.ts", import.meta.url).pathname);
const choices = await jiti.import(new URL("../src/lib/paradigm/choices.ts", import.meta.url).pathname);
const { normalizeHebrewFull } = await jiti.import(new URL("../src/lib/hebrew.ts", import.meta.url).pathname);

const { book, allCells, perfectCells, practiceCells, renderCell, shownInPractice } = bookMod;
const { generationGaps, placeOle, shownForm } = gen;
const { gradeAnswer, MISS_TAGS } = gradeMod;
const OLE = "\u05AB";
const METEG = "\u05BD";

function cell(rootId, pgn, conjugation = "qal_perfect") {
  const root = book.roots.find((row) => row.id === rootId);
  const table = root.conjugations[conjugation];
  return {
    id: `${rootId}:${conjugation}:${pgn}`,
    root,
    conjugation,
    pgn,
    cell: table.cells[pgn],
    alternates: table.alternates[pgn] ?? [],
  };
}

test("the signed Qal perfect table is what practice shows", () => {
  assert.equal(book.schemaVersion, 1);
  assert.equal(book.roots.length, 14);
  const perfect = book.roots.flatMap((root) => Object.values(root.conjugations.qal_perfect.cells));
  assert.equal(perfect.length, 126);
  for (const row of perfect) {
    assert.equal(row.status, "verified");
    assert.equal(row.form, row.form.normalize("NFC"));
    assert.equal(renderCell(row), row.form);
  }
  assert.equal(allCells().length, 108);
  assert.equal(perfectCells().length, 126);
  assert.equal(practiceCells("class:I-nun").length, 9);
  assert.equal(allCells().some((row) => row.conjugation !== "qal_perfect"), false);
  assert.equal(shownInPractice("to_verify", 1), false);
  assert.equal(shownInPractice("verified", 2), false);
  assert.equal(shownInPractice("verified", 1), true);
  const hayah = book.roots.find((row) => row.id === "hayah");
  assert.equal(hayah.conjugations.qal_imperative.cells["2fp"], undefined);
  assert.deepEqual(
    book.roots.filter((row) => row.memorize).map((row) => row.id),
    ["savav", "qum"],
  );
  const again = JSON.parse(JSON.stringify(book));
  assert.equal(again.roots.length, book.roots.length);
  assert.equal(again.roots[4].conjugations.qal_perfect.cells["3ms"].form, "בָּנָה");
});

test("a draft never replaces a signed form", () => {
  const gaps = generationGaps();
  const open = new Set(gaps.map((gap) => gap.rootId));
  for (const id of ["amad", "bachar", "shama", "matsa", "banah", "alah"]) assert.equal(open.has(id), false);
  for (const root of book.roots) {
    for (const pgn of Object.keys(root.conjugations.qal_perfect.cells)) {
      assert.equal(shownForm(root, pgn), root.conjugations.qal_perfect.cells[pgn].form);
    }
  }
  assert.ok(gaps.length > 0);
});

test("the grader accepts the table and the approved alternates", () => {
  const banah = cell("banah", "3ms");
  assert.equal(gradeAnswer(banah, banah.cell.form).ok, true);
  assert.equal(gradeAnswer(banah, "קָטַל").ok, false);
  const savav = cell("savav", "3ms");
  const alt = gradeAnswer(savav, savav.alternates[0]);
  assert.equal(alt.ok, true);
  assert.equal(alt.alt, true);
  assert.equal(gradeAnswer(savav, "סָבַבּ").ok, false);
});

test("each miss tag has three seeded examples", () => {
  const banah3 = cell("banah", "3ms");
  const amad = cell("amad", "3ms");
  const amad2 = cell("amad", "2mp");
  const shama = cell("shama", "2fs");
  const matsa = cell("matsa", "2ms");
  const qum = cell("qum", "3ms");
  const natan = cell("natan", "2ms");
  const savav = cell("savav", "2ms");
  const imp = cell("amad", "3ms", "qal_imperfect");
  const seeds = {
    wrong_suffix: [gradeAnswer(banah3, "בָּנְתֶּם"), gradeAnswer(cell("amad", "3ms"), "עָמַדְנו"), gradeAnswer(cell("qum", "3ms"), "קָמְתֶּם")],
    wrong_prefix: [gradeAnswer(imp, "מַעֲמֹד"), gradeAnswer(cell("bachar", "3ms", "qal_imperfect"), "מִבְחַר"), gradeAnswer(cell("shama", "3ms", "qal_imperfect"), "מִשְׁמַע")],
    stem_vowel: [gradeAnswer(amad, "עָמֹד"), gradeAnswer(cell("bachar", "3ms"), "בָּחֹר"), gradeAnswer(cell("qum", "2ms"), "קֹמְתָּ")],
    guttural_composite_shewa: [gradeAnswer(amad2, "עְמַדְתֶּם"), gradeAnswer(cell("alah", "2mp"), "עְלִיתֶם"), gradeAnswer(cell("bachar", "3fs"), "בָּחְרָה")],
    furtive_patah: [gradeAnswer(shama, "שָׁמַעְתְּ"), gradeAnswer(shama, "שָׁמַעתְּ"), gradeAnswer(shama, "שָׁמַעֹתְּ")],
    quiescent_aleph: [gradeAnswer(matsa, "מָצַאתָ"), gradeAnswer(cell("matsa", "3ms"), "מָצַא"), gradeAnswer(cell("raah", "3ms"), "רַאָה")],
    III_he_ending: [gradeAnswer(banah3, "בָּנְתֶּם"), gradeAnswer(cell("alah", "3ms"), "עָלַל"), gradeAnswer(cell("hayah", "3ms"), "הָיְית")],
    gemination_dagesh: [gradeAnswer(savav, "סַבוֹתָ"), gradeAnswer(cell("savav", "1cs"), "סַבוֹתִי"), gradeAnswer(cell("tam", "3fs"), "תַּמה")],
    hollow_vowel: [gradeAnswer(qum, "קוּם"), gradeAnswer(cell("sim", "3ms"), "שִׂים"), gradeAnswer(cell("bo", "3fs"), "בּוֹאָה")],
    nun_assimilation: [gradeAnswer(natan, "נָתַנְתָּ"), gradeAnswer(cell("natan", "1cs"), "נָתַנְתִּי"), gradeAnswer(cell("natan", "3fs"), "נָנְתְנָה")],
    final_form_letter: [gradeAnswer(cell("shama", "2fp"), "שְׁמַעְתֶּנ"), gradeAnswer(cell("banah", "2fp"), "בְּנִיתֶנ"), gradeAnswer(cell("natan", "3ms"), "נָתַנ")],
    missing_dagesh_lene: [gradeAnswer(banah3, "בָנָה"), gradeAnswer(cell("bachar", "3ms"), "בָחַר"), gradeAnswer(cell("bo", "3ms"), "בָא")],
    missing_vowel: [gradeAnswer(banah3, "בנה"), gradeAnswer(amad, "עמד"), gradeAnswer(cell("shama", "3ms"), "שמע")],
    extra_mark: [gradeAnswer(amad, "עָמַדְ"), gradeAnswer(cell("qum", "3fs"), "קָמָהּ"), gradeAnswer(cell("bo", "3ms"), "בָּאְ")],
    pgn_confusion: [gradeAnswer(banah3, cell("banah", "3fs").cell.form), gradeAnswer(amad, cell("amad", "3cp").cell.form), gradeAnswer(qum, cell("qum", "3fs").cell.form)],
    other: [gradeAnswer(amad, "abc"), gradeAnswer(amad, "123"), gradeAnswer(amad, "…")],
    stress: [
      gradeAnswer(cell("amad", "2ms"), cell("amad", "2ms").cell.form.replaceAll(OLE, "")),
      gradeAnswer(cell("qum", "3fs"), cell("qum", "3fs").cell.form.replace(OLE, "").replace(/מ([\u05B0-\u05BC]*)/, "מ$1" + OLE)),
      gradeAnswer(cell("amad", "2fs"), placeOle(cell("amad", "2fs").cell.form, 1)),
    ],
  };
  for (const tag of MISS_TAGS) {
    const rows = seeds[tag];
    assert.equal(rows.length, 3, tag);
    for (const row of rows) assert.ok(row.tags.includes(tag), `${tag} got ${row.tags.join(",")}`);
  }
});

test("a miss is due again before a hit", () => {
  const now = 1_700_000_000_000;
  const missed = srs.schedule(undefined, false, now);
  const hit = srs.schedule(undefined, true, now);
  assert.ok(missed.due < hit.due);
  const state = { a: missed, b: hit };
  assert.deepEqual(srs.dueIds(["a", "b"], state, missed.due), ["a"]);
  assert.deepEqual(srs.importProgress(srs.exportProgress(state)), state);
});

test("the strong-verb diff marks the letters that changed", () => {
  const pieces = diff.highlightWeak("3ms", cell("banah", "3ms").cell.form);
  assert.equal(pieces.some((piece) => piece.changed), true);
  assert.equal(normalizeHebrewFull(diff.strongPerfect("3ms")).includes("ק"), true);
});

test("stress is required only where the perfect is not final", () => {
  const amad2 = cell("amad", "2ms");
  assert.equal(amad2.cell.form.includes(OLE), true);
  assert.equal(gradeAnswer(amad2, amad2.cell.form.replaceAll(OLE, "")).tags.includes("stress"), true);
  assert.equal(gradeAnswer(amad2, amad2.cell.form).ok, true);
  const withMeteg = amad2.cell.form.replace("\u05B8", "\u05B8" + METEG);
  assert.equal(gradeAnswer(amad2, withMeteg).ok, true);
  const fs = cell("amad", "2fs");
  assert.equal(fs.cell.form.includes(OLE), false);
  assert.equal(gradeAnswer(fs, placeOle(fs.cell.form, 1)).tags.includes("stress"), true);
  const qum = cell("qum", "3fs");
  assert.equal(gradeAnswer(qum, qum.cell.form).ok, true);
  const shifted = qum.cell.form.replace(OLE, "").replace(/מ([\u05B0-\u05BC]*)/, "מ$1" + OLE);
  const moved = gradeAnswer(qum, shifted);
  assert.equal(moved.ok, false);
  assert.equal(moved.tags.includes("stress"), true);
  const savav = cell("savav", "3fs");
  assert.equal(gradeAnswer(savav, savav.cell.form).alt, false);
  assert.equal(savav.cell.form.includes(OLE), false);
  for (const alt of savav.alternates) {
    const row = gradeAnswer(savav, alt);
    assert.equal(row.ok, true);
    assert.equal(row.alt, true);
  }
  assert.equal(savav.alternates.some((alt) => alt.includes(OLE)), true);
  assert.equal(savav.alternates.some((alt) => !alt.includes(OLE)), true);
});

test("a consonant-only hit does not move the review box", () => {
  const now = 1_700_000_000_000;
  const prev = { box: 3, due: 50 };
  assert.deepEqual(srs.schedule(prev, true, now, true), prev);
  assert.ok(srs.schedule(prev, true, now, false).box > prev.box);
  const bare = gradeAnswer(cell("amad", "3ms"), "עמד", false);
  assert.equal(bare.ok, true);
  assert.equal(bare.lenient, true);
  const dagesh = gradeAnswer(cell("banah", "3ms"), "בָנָה");
  assert.deepEqual(dagesh.tags, ["missing_dagesh_lene"]);
});

test("parse chips do not keep the answer in one seat", () => {
  const indexes = [];
  for (let i = 0; i < 24; i++) {
    indexes.push(choices.shuffledChoices(`item-${i}`, "ok", ["a", "b", "c", "d", "e"]).indexOf("ok"));
  }
  assert.ok(new Set(indexes).size > 1);
  const once = choices.shuffledChoices("same", "ok", ["a", "b", "c"]);
  assert.deepEqual(choices.shuffledChoices("same", "ok", ["a", "b", "c"]), once);
});

test("study misses lead the next test and do not move mastery", () => {
  const now = 1_700_000_000_000;
  const ids = ["a", "b", "c"];
  const state = { a: { box: 4, due: now + 9_000_000 }, b: { box: 1, due: 0 }, c: { box: 1, due: 0 } };
  let log = {};
  log = srs.notePractice(log, "a", false, ["stress"]);
  assert.deepEqual(state.a, { box: 4, due: now + 9_000_000 });
  assert.equal(srs.selectTestIds(ids, state, log, now)[0], "a");
  assert.equal(srs.masteryCount(ids, state), 0);
});

test("practice lives in study and the test stays graded", () => {
  const study = readFileSync(new URL("../src/routes/study/verb-lab.qal-perfect.tsx", import.meta.url), "utf8");
  const game = readFileSync(new URL("../src/routes/game/qal-perfect.tsx", import.meta.url), "utf8");
  const lab = readFileSync(new URL("../src/components/paradigm-lab.tsx", import.meta.url), "utf8");
  const hub = readFileSync(new URL("../src/components/path-hub.tsx", import.meta.url), "utf8");
  assert.match(study, /StudyLab/);
  assert.equal(study.includes("schedule"), false);
  assert.match(game, /GameTest/);
  assert.equal(game.includes("hintFor"), false);
  const studyFn = lab.slice(lab.indexOf("export function StudyLab"), lab.indexOf("export function GameTest"));
  const gameFn = lab.slice(lab.indexOf("export function GameTest"), lab.indexOf("function Prompt"));
  assert.equal(studyFn.includes("schedule("), false);
  assert.match(gameFn, /schedule\(/);
  assert.equal(gameFn.includes("Full pointing"), false);
  assert.equal(gameFn.includes("hintFor"), false);
  assert.equal((hub.match(/Qal perfect practice/g) ?? []).length, 2);
  assert.equal((hub.match(/Qal perfect test/g) ?? []).length, 2);
  const banned = [["Chapter", "14"].join(" "), ["ch", "14"].join(""), ["chapter", "Cells"].join("")];
  const roots = [new URL("../src", import.meta.url).pathname, new URL("../scripts", import.meta.url).pathname];
  const leaks = [];
  for (const root of roots) {
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx|mjs|json)$/.test(name)) {
          const text = readFileSync(path, "utf8");
          for (const needle of banned) if (text.includes(needle)) leaks.push(`${path}: ${needle}`);
        }
      }
    };
    walk(root);
  }
  assert.deepEqual(leaks, []);
});

