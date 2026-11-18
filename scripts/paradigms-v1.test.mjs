import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const root = new URL("..", import.meta.url).pathname;
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });

const { nfc } = await jiti.import(join(root, "src/lib/paradigms/nfc.ts"));
const catalog = await jiti.import(join(root, "src/lib/paradigms/catalog.ts"));
const { cellView } = await jiti.import(join(root, "src/lib/paradigms/present.ts"));
const check = await jiti.import(join(root, "src/lib/paradigms/check.ts"));
const placement = await jiti.import(join(root, "src/lib/paradigms/placement.ts"));
const leitner = await jiti.import(join(root, "src/lib/paradigms/leitner.ts"));
const hide = await jiti.import(join(root, "src/lib/paradigms/hide.ts"));
const { paradigmsV1ForEmail } = await jiti.import(join(root, "src/lib/paradigms/flag.ts"));
const { guardParadigmAccess, paradigmDataForClient } = await jiti.import(join(root, "src/lib/paradigms/access.ts"));
const { acceptStudentSave } = await jiti.import(join(root, "src/lib/paradigms/progress-shape.ts"));
const { readLocalProgress, writeLocalProgress } = await jiti.import(join(root, "src/lib/paradigms/local.ts"));
const { ADMIN_EMAILS } = await jiti.import(join(root, "src/lib/admin-access.ts"));
const shape = await jiti.import(join(root, "src/lib/paradigms/progress-shape.ts"));
const { isBookId } = await jiti.import(join(root, "src/lib/tanakh-canon.ts"));

const strong = JSON.parse(readFileSync(join(root, "data/paradigms/strong-verb.json"), "utf8"));
const levels = JSON.parse(readFileSync(join(root, "data/paradigms/levels.json"), "utf8"));
const quiz = JSON.parse(readFileSync(join(root, "data/paradigms/placement-quiz.json"), "utf8"));

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) walk(path, out);
    else if (/\.(tsx|ts)$/.test(name.name)) out.push(path);
  }
  return out;
}

test("strong-verb data is 207 stable cells across 7 binyanim", () => {
  assert.equal(strong.cells.length, 207);
  assert.equal(new Set(strong.cells.map((cell) => cell.id)).size, 207);
  assert.deepEqual(
    [...new Set(strong.cells.map((cell) => cell.binyan))],
    ["Qal", "Niphal", "Piel", "Pual", "Hitpael", "Hiphil", "Hophal"],
  );
  assert.equal(catalog.allCells().length, 207);
  for (const cell of strong.cells) {
    assert.equal(cell.form, nfc(cell.form));
    for (const alt of cell.alternates ?? []) assert.equal(alt.form, nfc(alt.form));
  }
});

test("every shown paradigm form matches the file by NFC", () => {
  for (const cell of catalog.allCells()) {
    const file = strong.cells.find((row) => row.id === cell.id);
    const shown = catalog.shownForms(cell);
    const allowed = new Set([nfc(file.form), ...(file.alternates ?? []).map((alt) => nfc(alt.form))]);
    assert.equal(shown.main.form, nfc(shown.main.form));
    assert.ok(allowed.has(shown.main.form), cell.id);
    const displayed = new Set([shown.main.form, ...shown.also.map((alt) => alt.form)]);
    assert.deepEqual(displayed, allowed, cell.id);
    for (const form of catalog.acceptedForms(cell)) assert.ok(allowed.has(form));
  }
});

test("forms render in data order, and Piel infinitive absolute leads with the attested spelling", () => {
  for (const cell of catalog.allCells()) {
    const shown = catalog.shownForms(cell);
    assert.equal(shown.main.form, nfc(cell.form), cell.id);
    cell.alternates?.forEach((alt, index) => {
      assert.equal(shown.also[index].form, nfc(alt.form), cell.id);
    });
  }
  const piel = catalog.cellById("Piel.infinitive-absolute");
  assert.equal(piel.status, "attested-example");
  assert.equal(piel.exampleRef, "Exod 21:36 #12");
  assert.equal(piel.exampleStrongs, "H7999");
  assert.equal(piel.attestedTokenCount, 28);
  assert.equal([...piel.exampleWord].map((ch) => ch.codePointAt(0)).join(","), "1513,1463,1473,1500,1461,1468,1448,1501");
  assert.equal(piel.alternates[0].status, "paradigm-standard");
  assert.equal(piel.alternates[0].exampleWord, undefined);
  assert.equal(catalog.shownForms(piel).main.form, nfc(piel.form));
  assert.equal(catalog.shownForms(piel).also[0].form, nfc(piel.alternates[0].form));
});

test("paradigm components hard-code no Hebrew and no copyrighted gloss", () => {
  const files = [
    ...walk(join(root, "src/components/paradigms")),
    join(root, "src/routes/paradigms.tsx"),
    ...walk(join(root, "src/lib/paradigms")),
  ];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.equal(/[\u0590-\u05FF]/.test(text), false, file);
    assert.equal(/\b(LSB|NASB)\b/.test(text), false, file);
  }
});

test("no gloss and no translation control when the table has no YLT line", () => {
  const board = readFileSync(join(root, "src/components/paradigms/paradigm-board.tsx"), "utf8");
  assert.equal(board.includes("YLT is not in this copy"), false);
  assert.equal(board.includes("Translation"), false);
  for (const cell of catalog.allCells()) {
    const view = cellView(cell);
    assert.equal(view.gloss, null);
    assert.equal(view.translation, null);
  }
  const fs = catalog.cellById("Qal.participle-active.fs");
  const view = cellView(fs);
  assert.ok(view.example);
  assert.equal(view.example.word, nfc(fs.exampleWord));
  const alt = view.also.find((row) => row.exampleWord);
  assert.ok(alt);
  assert.equal(alt.exampleWord, nfc(fs.alternates[0].exampleWord));
  assert.equal(alt.exampleRef, fs.alternates[0].exampleRef);
});

test("the check can always be skipped and a skip does not move a box", () => {
  assert.equal(check.checkCanSkip("intro"), true);
  assert.equal(check.checkCanSkip("item"), true);
  const source = readFileSync(join(root, "src/components/paradigms/paradigm-check.tsx"), "utf8");
  assert.match(source, /checkCanSkip\("intro"\)/);
  assert.match(source, /checkCanSkip\("item"\)/);
  assert.match(source, />\s*Skip\s*</);
  const cellId = "Qal.qatal.3ms";
  const before = { level: "L1", placed: true, source: "quiz", boxes: { [cellId]: 4 }, skips: [], updatedAt: "" };
  const after = shape.sanitizeProgress({
    ...before,
    skips: [{ at: "2026-11-18T00:00:00.000Z", lessonKey: "study:alef", itemId: "intro" }],
  });
  assert.equal(after.boxes[cellId], 4);
  assert.equal(after.skips.length, 1);
});

test("parse items come only from attested-example cells and fill forms match the file", () => {
  const rng = mulberry32(7);
  for (const level of levels.levels.filter((row) => row.phase === 1 && row.cells?.length)) {
    for (let round = 0; round < 20; round += 1) {
      const items = check.drawCheck({ levelId: level.id, boxes: {}, rng });
      assert.ok(items.length >= 5 && items.length <= 8);
      for (const item of items) {
        const cell = catalog.cellById(item.cellId);
        assert.ok(cell, item.cellId);
        if (item.kind === "parse") {
          assert.equal(cell.status, "attested-example");
          assert.equal(item.prompt, nfc(cell.exampleWord));
          assert.ok((level.parseItemCells ?? []).includes(item.cellId) || levels.levels.some((row) => (row.parseItemCells ?? []).includes(item.cellId)));
          assert.equal(item.answerCellId, item.cellId);
        } else if (item.kind === "fill") {
          const allowed = new Set(catalog.acceptedForms(cell));
          for (const form of item.accepted) assert.ok(allowed.has(nfc(form)), item.cellId);
          assert.equal(item.choices[0] === undefined, false);
          for (const form of item.choices) {
            assert.equal(form, nfc(form));
            assert.ok(catalog.allCells().some((row) => catalog.acceptedForms(row).includes(form)));
          }
        } else {
          assert.fail(item.kind);
        }
      }
    }
  }
});

test("the check mix draws about 70 percent from the current level", () => {
  const rng = mulberry32(11);
  const current = new Set(levels.levels.find((row) => row.id === "L7").cells);
  let fromCurrent = 0;
  let total = 0;
  for (let round = 0; round < 80; round += 1) {
    for (const item of check.drawCheck({ levelId: "L7", boxes: {}, rng, count: 8 })) {
      total += 1;
      if (current.has(item.cellId)) fromCurrent += 1;
    }
  }
  const share = fromCurrent / total;
  assert.ok(share > 0.62 && share < 0.78, String(share));
  const only = check.drawCheck({ levelId: "L1", boxes: {}, rng, count: 6 });
  const l1 = new Set(levels.levels.find((row) => row.id === "L1").cells);
  assert.ok(only.every((item) => l1.has(item.cellId)));
});

test("leitner boxes weight misses above old hits", () => {
  assert.equal(leitner.nextBox(undefined, false), 1);
  assert.equal(leitner.nextBox(undefined, true), 2);
  assert.equal(leitner.nextBox(3, false), 1);
  assert.equal(leitner.nextBox(5, true), 5);
  assert.ok(leitner.boxWeight(1) > leitner.boxWeight(5));
  const heavy = { id: "new" };
  const light = { id: "old" };
  const rng = mulberry32(3);
  let heavyHits = 0;
  for (let i = 0; i < 2000; i += 1) {
    const picked = leitner.pickWeighted([heavy, light], (item) => (item.id === "new" ? leitner.boxWeight(1) : leitner.boxWeight(5)), rng);
    if (picked.id === "new") heavyHits += 1;
  }
  assert.ok(heavyHits > 1400 && heavyHits < 1800, String(heavyHits));
});

test("placement stops at the first miss after two misses, and a skip is L1", () => {
  let step = placement.startPlacement();
  for (let i = 0; i < quiz.items.length; i += 1) step = placement.answerPlacement(step, false);
  assert.equal(step.done, true);
  assert.equal(step.level, "L7");
  assert.equal(step.misses, 0);

  step = placement.startPlacement();
  step = placement.answerPlacement(step, true);
  assert.equal(step.done, false);
  assert.equal(step.firstMissLevel, "L1");
  step = placement.answerPlacement(step, true);
  assert.equal(step.done, true);
  assert.equal(step.level, "L1");

  step = placement.startPlacement();
  for (let i = 0; i < 6; i += 1) step = placement.answerPlacement(step, false);
  step = placement.answerPlacement(step, true);
  assert.equal(step.firstMissLevel, quiz.items[6].level);
  assert.equal(step.done, false);
  step = placement.answerPlacement(step, true);
  assert.equal(step.level, quiz.items[6].level);
  assert.equal(step.done, true);
  assert.equal(step.index, 7);

  assert.deepEqual(placement.skipPlacement(), { level: "L1", source: "skip" });
  const item = quiz.items[0];
  assert.equal(placement.placementWord(item), nfc(item.word));
  assert.ok(placement.placementChoices(item).includes(item.correct));
  assert.ok(placement.placementChoices(item).includes("I don't know") === false);
});

test("every quiz word matches the WLC token at its ref, and its pattern matches the cell", () => {
  for (const item of quiz.items) {
    const cell = strong.cells.find((row) => row.id === item.cellId);
    assert.equal(nfc(item.pattern), nfc(cell.form), item.cellId);
    const match = item.ref.match(/^(\S+)\s+(\d+):(\d+)\s+#(\d+)$/);
    assert.ok(match, item.ref);
    const book = match[1];
    assert.equal(isBookId(book), true);
    const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc", book, `${match[2]}.json.gz`))).toString("utf8"));
    const verse = chapter.verses.find((row) => row.ref.split(".").at(-1) === match[3]);
    const words = verse.words.filter((word) => word.kq_role !== "qere");
    assert.equal(nfc(words[Number(match[4]) - 1].surface), nfc(item.word), item.ref);
  }
});

test("the flag is on for the Chairman only", () => {
  assert.equal(paradigmsV1ForEmail(null), false);
  assert.equal(paradigmsV1ForEmail(""), false);
  assert.equal(paradigmsV1ForEmail("dev@example.com"), false);
  assert.equal(paradigmsV1ForEmail("student@school.edu"), false);
  assert.ok(ADMIN_EMAILS.length > 0);
  for (const email of ADMIN_EMAILS) {
    assert.equal(paradigmsV1ForEmail(email), true, email);
    assert.equal(paradigmsV1ForEmail(email.toUpperCase()), true, email);
  }
});

test("tap to hide, hide a row, and hide all", () => {
  let state = hide.OPEN_HIDE;
  assert.equal(hide.isHidden(state, "a", "row"), false);
  state = hide.tapCell(state, "a", "row");
  assert.equal(hide.isHidden(state, "a", "row"), true);
  state = hide.tapCell(state, "a", "row");
  assert.equal(hide.isHidden(state, "a", "row"), false);
  state = hide.tapRow(state, "row", ["a", "b"]);
  assert.equal(hide.isHidden(state, "a", "row"), true);
  assert.equal(hide.isHidden(state, "b", "row"), true);
  state = hide.tapRow(state, "row", ["a", "b"]);
  assert.equal(hide.isHidden(state, "a", "row"), false);
  state = hide.toggleHideAll(hide.OPEN_HIDE);
  assert.equal(hide.isHidden(state, "a", "row"), true);
  state = hide.toggleHideAll(state);
  assert.equal(hide.isHidden(state, "a", "row"), false);
});

test("a hand-set level stays until the student retakes placement", () => {
  const cellId = "Qal.qatal.3ms";
  const chairman = shape.sanitizeProgress({
    level: "L6",
    placed: true,
    source: "chairman",
    boxes: { [cellId]: 2 },
    skips: [],
    updatedAt: "2026-11-18T00:00:00.000Z",
  });
  const practiced = shape.mergeStudentSave(
    chairman,
    shape.sanitizeProgress({ ...chairman, level: "L1", source: "unset", boxes: { [cellId]: 3 } }),
  );
  assert.equal(practiced.level, "L6");
  assert.equal(practiced.source, "chairman");
  assert.equal(practiced.boxes[cellId], 3);
  const retake = shape.mergeStudentSave(
    chairman,
    shape.sanitizeProgress({ ...chairman, level: "L2", source: "quiz", boxes: chairman.boxes }),
  );
  assert.equal(retake.level, "L2");
  assert.equal(retake.source, "quiz");
});

test("check results are the Hebrew forms and nothing else", () => {
  const rng = mulberry32(1);
  const items = check.drawCheck({ levelId: "L1", boxes: {}, rng, count: 5 });
  for (const item of items) {
    const answer = item.kind === "fill" ? item.accepted[0] : item.answerCellId;
    const line = check.gradedLine(item, answer);
    assert.equal(line.correct, true, item.id);
    assert.equal(/[A-Za-z]/.test(line.right), false, line.right);
    assert.equal(/[A-Za-z]/.test(line.theirs), false, line.theirs);
    assert.ok(catalog.acceptedForms(catalog.cellById(item.cellId)).includes(nfc(line.right)));
  }
});

test("unauthorized paradigm access is denied and returns no table data", () => {
  assert.throws(() => guardParadigmAccess(false), /Forbidden/);
  assert.deepEqual(paradigmDataForClient(false, { cells: 207 }), { enabled: false });
  assert.equal(paradigmDataForClient(true, { cells: 207 }).data.cells, 207);
  assert.equal(paradigmsV1ForEmail("student@school.edu"), false);
});

test("a student cannot assign source chairman", () => {
  const cellId = "Qal.qatal.3ms";
  const spoof = { level: "L7", placed: true, source: "chairman", boxes: { [cellId]: 4 }, skips: [], updatedAt: "2026-11-18T01:00:00.000Z" };
  const fresh = acceptStudentSave(null, spoof);
  assert.equal(fresh.source, "unset");
  assert.equal(fresh.level, "L1");
  assert.equal(fresh.placed, false);
  assert.equal(fresh.boxes[cellId], 4);
  const placed = shape.sanitizeProgress({ level: "L3", placed: true, source: "quiz", boxes: {}, skips: [], updatedAt: "2026-11-18T00:00:00.000Z" });
  const kept = acceptStudentSave(placed, spoof);
  assert.equal(kept.level, "L3");
  assert.equal(kept.source, "quiz");
  const chairman = shape.sanitizeProgress({ level: "L6", placed: true, source: "chairman", boxes: {}, skips: [], updatedAt: "2026-11-18T00:00:00.000Z" });
  const still = acceptStudentSave(chairman, { ...spoof, level: "L1" });
  assert.equal(still.level, "L6");
  assert.equal(still.source, "chairman");
});

test("local progress is stored per account", () => {
  const memory = new Map();
  const previous = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (key) => (memory.has(key) ? memory.get(key) : null),
      setItem: (key, value) => memory.set(key, String(value)),
      removeItem: (key) => memory.delete(key),
    },
  };
  try {
    writeLocalProgress("student-a", { level: "L4", placed: true, source: "quiz", boxes: { "Qal.qatal.3ms": 3 }, skips: [], updatedAt: "2026-11-18T00:00:00.000Z" });
    writeLocalProgress("student-b", { level: "L1", placed: true, source: "skip", boxes: {}, skips: [], updatedAt: "2026-11-18T00:00:00.000Z" });
    assert.equal(readLocalProgress("student-a").level, "L4");
    assert.equal(readLocalProgress("student-a").boxes["Qal.qatal.3ms"], 3);
    assert.equal(readLocalProgress("student-b").level, "L1");
    assert.equal(readLocalProgress("student-b").boxes["Qal.qatal.3ms"], undefined);
    assert.equal(memory.has("haday.paradigms.v1"), false);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test("placement choices are shuffled and the correct answer is not fixed first", () => {
  const rng = mulberry32(4);
  let leading = 0;
  for (const item of quiz.items) {
    const choices = placement.placementChoices(item, rng);
    assert.deepEqual([...choices].sort(), [item.correct, ...item.distractors].sort());
    if (choices[0] === item.correct) leading += 1;
  }
  assert.ok(leading > 0 && leading < quiz.items.length, String(leading));
});

test("ordinary lesson sources do not carry the owner list or the paradigm tables", () => {
  const lessons = [
    "src/routes/study/lesson/$id.tsx",
    "src/routes/lessons/$track/$unit.tsx",
    "src/routes/study/term2/$chapter.tsx",
    "src/routes/iibs/study/$level/$week.tsx",
  ];
  const seen = new Set();
  function walkFile(rel) {
    if (seen.has(rel)) return;
    seen.add(rel);
    const abs = join(root, rel);
    const text = readFileSync(abs, "utf8");
    const specifiers = [];
    for (const match of text.matchAll(/import\s+(?!type\b)[^;]*?\sfrom\s+["']([^"']+)["']/g)) {
      specifiers.push(match[1]);
    }
    for (const spec of specifiers) {
      if (!spec.startsWith("@/") && !spec.startsWith(".")) continue;
      const base = spec.startsWith("@/") ? join(root, "src", spec.slice(2)) : join(root, rel, "..", spec);
      const file = [".ts", ".tsx", ""].map((ext) => base + ext).find((path) => {
        try {
          return readFileSync(path, "utf8").length >= 0;
        } catch {
          return false;
        }
      });
      if (!file || !file.startsWith(join(root, "src"))) continue;
      const relPath = file.slice(root.endsWith("/") ? root.length : root.length + 1);
      walkFile(relPath);
    }
  }
  for (const lesson of lessons) walkFile(lesson);
  const paradigmFiles = [...seen].filter((rel) => rel.includes("/paradigms/"));
  assert.ok(paradigmFiles.includes("src/components/paradigms/lesson-gate.tsx"));
  assert.equal(paradigmFiles.some((rel) => rel.endsWith("flag.ts") || rel.endsWith("catalog.ts") || rel.endsWith("data.ts")), false);
  const banned = ["talk2pastoradeolaade@yahoo.com", "adeolaa@jcdisn.com", "adeyholar@aol.com", "ADMIN_EMAILS", "strong-verb.json"];
  for (const rel of paradigmFiles) {
    const text = readFileSync(join(root, rel), "utf8");
    for (const token of banned) assert.equal(text.includes(token), false, `${rel} contains ${token}`);
  }
  assert.equal([...seen].some((rel) => rel.includes("strong-verb.json")), false);
});
