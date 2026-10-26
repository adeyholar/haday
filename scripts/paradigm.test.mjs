import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const bookMod = await jiti.import(new URL("../src/lib/paradigm/book.ts", import.meta.url).pathname);
const gen = await jiti.import(new URL("../src/lib/paradigm/generate.ts", import.meta.url).pathname);
const gradeMod = await jiti.import(new URL("../src/lib/paradigm/grade.ts", import.meta.url).pathname);
const srs = await jiti.import(new URL("../src/lib/paradigm/srs.ts", import.meta.url).pathname);
const diff = await jiti.import(new URL("../src/lib/paradigm/diff.ts", import.meta.url).pathname);
const { normalizeHebrewFull } = await jiti.import(new URL("../src/lib/hebrew.ts", import.meta.url).pathname);

const { book, chapterCells, practiceCells, renderCell, shownInPractice } = bookMod;
const { generationGaps, shownForm } = gen;
const { gradeAnswer, MISS_TAGS } = gradeMod;

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
  assert.equal(chapterCells().length, 108);
  assert.equal(practiceCells("supplementary").length, 18);
  assert.equal(chapterCells().some((row) => row.conjugation !== "qal_perfect"), false);
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
