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
const { normalizeHebrewFull, liveMatchAny } = await jiti.import(new URL("../src/lib/hebrew.ts", import.meta.url).pathname);
const { normalizeParadigm } = await jiti.import(new URL("../src/lib/paradigm/normalize.ts", import.meta.url).pathname);
const { strongCells } = await jiti.import(new URL("../src/lib/paradigm/strong-set.ts", import.meta.url).pathname);
const { VOCAB } = await jiti.import(new URL("../src/lib/vocab.ts", import.meta.url).pathname);
const { VOCAB_S2 } = await jiti.import(new URL("../src/lib/vocab-s2.ts", import.meta.url).pathname);
const { buildForm, needsTone, FORMS, ROOTS, expectedThird, expectsMerge, displayRoot, rootDisplay } = await jiti.import(
  new URL("../src/lib/qal-perfect-builder.ts", import.meta.url).pathname,
);
const { perfectVerse } = await jiti.import(new URL("../src/lib/verbal-paradigm-verses.ts", import.meta.url).pathname);

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
    meteg: ["קטל", "כתב", "שמר"].map((root) => {
      const row = strongCells().find((item) => item.root.root === root && item.pgn === "3fs");
      return gradeAnswer(row, row.cell.form.replaceAll(METEG, ""));
    }),
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
  assert.equal(savav.alternates.every((alt) => alt.includes(OLE)), true);
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

test("tamam 3fs and 3cp take penultimate ole, and a bare typing is only lenient", () => {
  const fs = cell("tam", "3fs");
  const cp = cell("tam", "3cp");
  assert.equal(fs.cell.form, "תַּ֫מָּה");
  assert.equal(cp.cell.form, "תַּ֫מּוּ");
  assert.equal(gradeAnswer(fs, fs.cell.form, true).ok, true);
  assert.equal(gradeAnswer(cp, cp.cell.form, true).ok, true);
  const bareFs = gradeAnswer(fs, fs.cell.form.replaceAll(OLE, ""), true);
  const bareCp = gradeAnswer(cp, cp.cell.form.replaceAll(OLE, ""), true);
  assert.equal(bareFs.ok, false);
  assert.deepEqual(bareFs.tags, ["stress"]);
  assert.equal(bareCp.ok, false);
  assert.deepEqual(bareCp.tags, ["stress"]);
  const easyFs = gradeAnswer(fs, fs.cell.form.replaceAll(OLE, ""), false);
  const easyCp = gradeAnswer(cp, cp.cell.form.replaceAll(OLE, ""), false);
  assert.equal(easyFs.ok, true);
  assert.equal(easyFs.lenient, true);
  assert.equal(easyFs.alt, false);
  assert.equal(easyCp.ok, true);
  assert.equal(easyCp.lenient, true);
});

test("contracted geminate alternates need ole unless the check is lenient", () => {
  const fs = cell("savav", "3fs");
  const cp = cell("savav", "3cp");
  assert.equal(fs.cell.form, "סָבְבָה");
  assert.equal(cp.cell.form, "סָבְבוּ");
  assert.equal(fs.cell.form.includes(OLE), false);
  assert.equal(cp.cell.form.includes(OLE), false);
  assert.deepEqual(fs.alternates, ["סַ֫בָּה"]);
  assert.deepEqual(cp.alternates, ["סַ֫בּוּ"]);
  for (const item of [fs, cp]) {
    const marked = item.alternates[0];
    const bare = marked.replaceAll(OLE, "");
    const strict = gradeAnswer(item, marked, true);
    assert.equal(strict.ok, true);
    assert.equal(strict.alt, true);
    assert.equal(strict.lenient, false);
    const missed = gradeAnswer(item, bare, true);
    assert.equal(missed.ok, false);
    assert.deepEqual(missed.tags, ["stress"]);
    const easy = gradeAnswer(item, bare, false);
    assert.equal(easy.ok, true);
    assert.equal(easy.lenient, true);
    assert.equal(easy.alt, true);
    assert.equal(gradeAnswer(item, item.cell.form, true).ok, true);
  }
});

test("the hollow 3fs diff shows the ole as a changed mark", () => {
  const weak = cell("qum", "3fs").cell.form;
  assert.equal(weak, "קָ֫מָה");
  const pieces = diff.highlightWeak("3fs", weak);
  const ole = pieces.find((piece) => piece.ch === OLE);
  assert.equal(ole?.changed, true);
  assert.equal(diff.strongPerfect("3fs").includes(OLE), false);
  assert.equal(normalizeParadigm(diff.strongPerfect("3fs")).includes(OLE), false);
  const amad = diff.highlightWeak("2ms", cell("amad", "2ms").cell.form);
  const amadOle = amad.filter((piece) => piece.ch === OLE);
  assert.ok(amadOle.length > 0);
  assert.equal(amadOle.every((piece) => piece.changed === false), true);
});

test("a root label uses the final letter and the built form does not", () => {
  const toFinal = { כ: "ך", מ: "ם", נ: "ן", פ: "ף", צ: "ץ" };
  for (const root of ROOTS) {
    const label = displayRoot(root.c);
    const storedLast = [...root.c].at(-1);
    assert.equal([...label].at(-1), toFinal[storedLast] ?? storedLast, root.c);
    const shown = rootDisplay(root).replace(/[^\u05D0-\u05EA]/g, "");
    assert.equal([...shown].at(-1), [...label].at(-1), root.c);
  }
  const shakan = ROOTS.find((root) => root.c === "שכנ");
  assert.equal(displayRoot(shakan.c), "שכן");
  assert.equal(shakan.c, "שכנ");
  const strong = strongCells().find((item) => item.root.root === "שכנ");
  assert.equal(strong.root.id, "strong-שכנ");
  assert.deepEqual(strong.root.letters, ["ש", "כ", "נ"]);
  function built(pgn) {
    const form = FORMS.find((row) => row.k === pgn);
    return buildForm(
      shakan,
      {
        v1: form.v1,
        v2: form.v2,
        v3: expectedThird(shakan, form),
        end: form.end,
        merge: expectsMerge(shakan, pgn),
        tone: needsTone(pgn),
      },
      pgn,
    );
  }
  for (const pgn of ["2ms", "1cp"]) {
    const word = built(pgn);
    assert.equal(word.includes("נ"), true, pgn);
    assert.equal(word.includes("ן"), false, pgn);
  }
  assert.equal(built("2ms").includes("ת"), true);
  assert.equal(built("1cp").includes("ו"), true);
  const verse = perfectVerse("שכנ");
  assert.equal(verse.where, "Deuteronomy 33:20");
  assert.equal(verse.ref, "Deut.33.20");
});

function clustersOf(word) {
  const parts = [];
  for (const ch of word) {
    const cp = ch.codePointAt(0) ?? 0;
    if ((cp >= 0x05d0 && cp <= 0x05ea) || parts.length === 0) parts.push(ch);
    else parts[parts.length - 1] += ch;
  }
  return parts;
}

function moveMark(word, mark, slot) {
  const parts = clustersOf(word);
  const index = parts.findIndex((part) => [...part].includes(mark));
  const chars = [...parts[index]];
  const base = chars[0];
  const rest = chars.slice(1).filter((ch) => ch !== mark);
  if (slot === "before-vowel") {
    const at = rest.findIndex((ch) => /[\u05B0-\u05BB]/.test(ch));
    rest.splice(at < 0 ? 0 : at, 0, mark);
  } else {
    const vowels = rest.flatMap((ch, i) => (/[\u05B0-\u05BB]/.test(ch) ? [i] : []));
    const at = vowels.length ? vowels[vowels.length - 1] + 1 : rest.length;
    rest.splice(at, 0, mark);
  }
  parts[index] = base + rest.join("");
  return parts.join("");
}

test("mark order and a separated shin dot still match the strong answer", () => {
  const qatal2 = strongCells().find((item) => item.root.root === "קטל" && item.pgn === "2ms");
  const qatal3 = strongCells().find((item) => item.root.root === "קטל" && item.pgn === "3fs");
  const shamar2 = strongCells().find((item) => item.root.root === "שמר" && item.pgn === "2ms");
  const variants = [
    moveMark(qatal2.cell.form, OLE, "before-vowel"),
    moveMark(qatal2.cell.form, OLE, "after-vowel"),
    moveMark(qatal2.cell.form, "\u05BC", "before-vowel"),
    moveMark(qatal2.cell.form, "\u05BC", "after-vowel"),
    moveMark(qatal3.cell.form, METEG, "before-vowel"),
    moveMark(qatal3.cell.form, METEG, "after-vowel"),
  ];
  assert.equal(variants[0] === qatal2.cell.form, false);
  assert.equal(variants[3] === qatal2.cell.form, false);
  assert.equal(variants[4] === qatal3.cell.form, false);
  for (const typed of variants.slice(0, 4)) {
    assert.equal(normalizeParadigm(typed), normalizeParadigm(qatal2.cell.form));
    assert.equal(gradeAnswer(qatal2, typed, true).ok, true);
  }
  for (const typed of variants.slice(4)) {
    assert.equal(normalizeParadigm(typed, { meteg: true }), normalizeParadigm(qatal3.cell.form, { meteg: true }));
    assert.equal(gradeAnswer(qatal3, typed, true).ok, true);
  }
  const parts = clustersOf(shamar2.cell.form);
  const shin = [...parts[0]];
  const dot = "\u05C1";
  const rest = shin.slice(1).filter((ch) => ch !== dot);
  parts[0] = "ש" + rest.join("") + dot;
  const separated = parts.join("");
  assert.notEqual(separated, shamar2.cell.form);
  assert.equal(separated.normalize("NFD").includes(dot), true);
  assert.equal(normalizeParadigm(separated), normalizeParadigm(shamar2.cell.form));
  assert.equal(gradeAnswer(shamar2, separated, true).ok, true);
});

test("a strong answer that misses both ole and meteg names both", () => {
  for (const pgn of ["3fs", "3cp"]) {
    const row = strongCells().find((item) => item.root.root === "קטל" && item.pgn === pgn);
    const typed = placeOle(row.cell.form.replaceAll(METEG, ""), 0);
    assert.equal(typed.includes(OLE), true);
    assert.equal(typed.includes(METEG), false);
    const missed = gradeAnswer(row, typed, true);
    assert.equal(missed.ok, false);
    assert.deepEqual(missed.tags, ["stress", "meteg"]);
  }
});

test("strict vocab spelling ignores ole on every stressed lemma", () => {
  const spans = [];
  for (const item of [...VOCAB, ...VOCAB_S2]) {
    for (const field of [item.hebrew, item.stems ?? ""]) {
      for (const span of field.match(/[\u0590-\u05FF]+/g) ?? []) {
        if (span.includes(OLE)) spans.push({ id: item.id, span });
      }
    }
  }
  assert.equal(spans.length, 8);
  for (const { id, span } of spans) {
    const typed = span.replaceAll(OLE, "");
    assert.notEqual(typed, span, id);
    assert.equal(liveMatchAny(span, typed, [], true), "exact", id);
    assert.equal(normalizeHebrewFull(span), normalizeHebrewFull(typed), id);
    assert.notEqual(normalizeParadigm(span), normalizeParadigm(typed), id);
  }
});

test("the natan 2ms alternate takes ole on the first tav", () => {
  const item = cell("natan", "2ms");
  const marked = "\u05E0\u05B8\u05EA\u05B7\u05AB\u05EA\u05B8\u05BC\u05D4";
  assert.deepEqual(item.alternates, [marked]);
  const strict = gradeAnswer(item, marked, true);
  assert.equal(strict.ok, true);
  assert.equal(strict.alt, true);
  const missed = gradeAnswer(item, marked.replaceAll(OLE, ""), true);
  assert.equal(missed.ok, false);
  assert.deepEqual(missed.tags, ["stress"]);
  const easy = gradeAnswer(item, marked.replaceAll(OLE, ""), false);
  assert.equal(easy.ok, true);
  assert.equal(easy.lenient, true);
});

test("strong 3fs and 3cp grade the builder meteg", () => {
  const cells = strongCells();
  assert.equal(cells.every((item) => item.cell.verifiedBy === "generated"), true);
  assert.equal(cells.some((item) => item.cell.verifiedBy === "Tutor"), false);
  for (const root of ROOTS) {
    for (const form of FORMS) {
      const row = cells.find((item) => item.root.root === root.c && item.pgn === form.k);
      const built = buildForm(
        root,
        {
          v1: form.v1,
          v2: form.v2,
          v3: expectedThird(root, form),
          end: form.end,
          merge: expectsMerge(root, form.k),
          tone: needsTone(form.k),
        },
        form.k,
      );
      assert.equal(row.cell.form, built, `${root.c} ${form.k}`);
    }
  }
  for (const pgn of ["3fs", "3cp"]) {
    const row = cells.find((item) => item.root.root === "קטל" && item.pgn === pgn);
    assert.equal(row.cell.form.includes(METEG), true);
    assert.equal(gradeAnswer(row, row.cell.form, true).ok, true);
    const missed = gradeAnswer(row, row.cell.form.replaceAll(METEG, ""), true);
    assert.equal(missed.ok, false);
    assert.deepEqual(missed.tags, ["meteg"]);
  }
  const plain = cells.find((item) => item.root.root === "קטל" && item.pgn === "3ms");
  assert.equal(plain.cell.form.includes(METEG), false);
});

test("parse chips reshuffle when the card is shown again", () => {
  const indexes = [];
  for (let i = 0; i < 24; i++) {
    indexes.push(choices.shuffledChoices(`item-${i}`, "ok", ["a", "b", "c", "d", "e"]).indexOf("ok"));
  }
  assert.ok(new Set(indexes).size > 1);
  const once = choices.shuffledChoices("card:show-1", "ok", ["a", "b", "c"]);
  assert.deepEqual(choices.shuffledChoices("card:show-1", "ok", ["a", "b", "c"]), once);
  const again = new Set();
  for (let show = 0; show < 12; show++) {
    again.add(choices.shuffledChoices(`card:show-${show}`, "ok", ["a", "b", "c", "d"]).join(","));
  }
  assert.ok(again.size > 1);
  const studyFn = readFileSync(new URL("../src/components/paradigm-lab.tsx", import.meta.url), "utf8");
  assert.match(studyFn, /shownDeal/);
  assert.match(studyFn, /\$\{item\.id\}:root:\$\{shownDeal\}/);
  assert.match(studyFn, /\$\{item\.id\}:pgn:\$\{shownDeal\}/);
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
  assert.match(gameFn, /with the accent and the meteg/);
  assert.match(gameFn, /Meteg is ignored/);
  const door = readFileSync(new URL("../src/components/term-door.tsx", import.meta.url), "utf8");
  assert.match(door, /with the accent and the meteg/);
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

