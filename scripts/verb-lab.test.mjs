import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const root = new URL("..", import.meta.url).pathname;
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });

const stems = await jiti.import(new URL("../src/lib/verb-lab/stems.ts", import.meta.url).pathname);
const registry = await jiti.import(new URL("../src/lib/verb-lab/registry.ts", import.meta.url).pathname);
const progress = await jiti.import(new URL("../src/lib/verb-lab/progress.ts", import.meta.url).pathname);
const session = await jiti.import(new URL("../src/lib/verb-lab/session.ts", import.meta.url).pathname);
const redirects = await jiti.import(new URL("../src/lib/verb-lab/redirects.ts", import.meta.url).pathname);
const game = await jiti.import(new URL("../src/lib/game.ts", import.meta.url).pathname);
const data = await jiti.import(new URL("../src/lib/verb-lab/data.ts", import.meta.url).pathname);

const HUBS = [
  "src/components/path-hub.tsx",
  "src/components/term-door.tsx",
  "src/components/iibs-door.tsx",
  "src/components/nav-menu.tsx",
  "src/routes/iibs/learn.tsx",
];

test("every open square has a chart", () => {
  assert.deepEqual(registry.auditOpenSquares(), []);
  for (const classId of data.CLASS_IDS) {
    for (const square of registry.openSquares(classId)) {
      assert.ok(registry.chartRows(classId, square.id).length > 0, `${classId} ${square.id}`);
      assert.equal(square.noForm, false);
    }
  }
});

test("no-form squares stay out of exams and the due pile", () => {
  assert.deepEqual(registry.recordedNoFormIds(), ["Hophal.imperative", "Pual.imperative"]);
  for (const id of stems.NO_FORM_SQUARES) {
    assert.equal(registry.chartRows("strong", id).length, 0);
    assert.equal(registry.examsForSquare(id, "strong").length, 0);
    for (const exam of registry.EXAMS) {
      assert.equal(registry.coveredSquareIds(exam, "strong", "grammar", 7).includes(id), false);
    }
  }
  const dirty = progress.hydrateVerbLab({
    due: { "Pual.imperative": 4, "Qal.qatal": 2 },
    cleared: ["Hophal.imperative", "Qal.qatal"],
    boxes: { "Pual.imperative": 5, "Qal.qatal": 5 },
  });
  assert.equal(dirty.due["Pual.imperative"], undefined);
  assert.equal(dirty.due["Qal.qatal"], 2);
  assert.equal(dirty.cleared.includes("Hophal.imperative"), false);
  assert.equal(dirty.cleared.includes("Qal.qatal"), true);
  assert.equal(dirty.boxes["Pual.imperative"], undefined);
});

test("per-path labels and order", () => {
  assert.deepEqual(stems.stemOrder("grammar"), ["Qal", "Niphal", "Hiphil", "Hophal", "Piel", "Pual", "Hitpael"]);
  assert.deepEqual(stems.stemOrder("scripture"), ["Qal", "Niphal", "Piel", "Pual", "Hiphil", "Hophal", "Hitpael"]);
  assert.equal(stems.stemFace("grammar", "Hitpael").en, "Hithpael");
  assert.equal(stems.stemFace("grammar", "Hitpael").he, "הִתְפַּעֵל");
  assert.equal(stems.stemFace("scripture", "Qal").en, "Pa·al");
  assert.equal(stems.stemFace("scripture", "Qal").he, "פָּעַל");
  assert.equal(stems.stemFace("scripture", "Hophal").en, "Hoof·al");
  assert.equal(stems.stemFace("scripture", "Hophal").he, "הֻפְעַל");
  assert.equal(stems.stemFace("grammar", "Hophal").he, "הָפְעַל");
  assert.deepEqual(stems.PATH_GATE.grammar, { Qal: 1, Niphal: 4, Hiphil: 5, Hophal: 5, Piel: 6, Pual: 6, Hitpael: 7 });
  assert.deepEqual(stems.PATH_GATE.scripture, { Qal: 1, Niphal: 4, Piel: 5, Pual: 5, Hiphil: 6, Hophal: 6, Hitpael: 7 });
  assert.equal(stems.stemByAlias("Hifil"), "Hiphil");
  assert.equal(stems.stemByAlias("Nifal"), "Niphal");
  assert.equal(stems.stemByAlias("Hofal"), "Hophal");
  assert.equal(stems.stemByAlias("Paal"), "Qal");
  assert.ok(stems.alsoCalled("grammar", "Hitpael").includes("Hitpael"));
  assert.ok(stems.alsoCalled("scripture", "Qal").includes("Qal"));
});

test("old verb urls redirect, and the hubs register one Verb Lab card", () => {
  const paths = redirects.legacyVerbPaths();
  for (const path of paths) {
    const target = redirects.legacyVerbTarget(path);
    assert.ok(target, path);
    assert.equal(target.to, path.startsWith("/iibs/") ? "/iibs/verb-lab" : "/verb-lab");
  }
  assert.equal(redirects.legacyVerbTarget("/game/verbal-system", "#piel").search.stem, "Piel");
  assert.equal(redirects.legacyVerbTarget("/game/qal-perfect").search.exam, "qal-perfect");
  assert.equal(redirects.legacyVerbTarget("/study/verb-lab/qal-perfect").search.square, "Qal.qatal");
  assert.equal(redirects.legacyVerbTarget("/iibs/binyanim").search.view, "welcome");
  assert.equal(redirects.legacyVerbTarget("/game/lessons/verbs"), null);
  const oldLinks = [
    "/game/verbal-system",
    "/game/verb-paradigm-quest",
    "/game/qal-perfect",
    "/game/qal-imperfect",
    "/study/verb-lab/qal-perfect",
    "/study/verb-lab/qal-clocks",
    "/iibs/verbal-system",
    "/iibs/verb-paradigm-quest",
    "/iibs/qal-imperfect",
    "/iibs/binyanim",
  ];
  for (const file of HUBS) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    if (file !== "src/components/nav-menu.tsx") assert.match(text, /VerbLabCard/);
    for (const link of oldLinks) {
      const linked = text.includes(`to="${link}"`) || text.includes(`to: "${link}"`);
      assert.equal(linked, false, `${file} still links ${link}`);
    }
  }
});

test("strong Hophal keeps both spellings and I-Nun follows its file", () => {
  const hophal = registry.chartRows("strong", "Hophal.qatal").find((row) => row.pgn === "3ms");
  assert.equal(hophal.form, "הָקְטַל");
  assert.equal(hophal.alternates.some((alt) => alt.form === "הֻקְטַל"), true);
  const nun = registry.chartRows("I-Nun", "Hophal.qatal").find((row) => row.pgn === "3ms");
  assert.equal(nun.form, "הֻגַּשׁ");
});

test("rule-built squares are marked and are not verse items", () => {
  let standard = 0;
  let verseFromStandard = 0;
  for (const classId of data.WEAK_CLASS_IDS) {
    for (const square of registry.openSquares(classId)) {
      for (const row of registry.chartRows(classId, square.id)) {
        const rows = [row, ...row.alternates];
        for (const item of rows) {
          if (item.status === "paradigm-standard") {
            standard += 1;
            assert.equal(item.displayMark, "standard form, not in the Bible");
            assert.equal(item.parseEligible, false);
          }
          if (item.parseEligible) assert.equal(item.status, "attested-example");
        }
      }
      for (const row of registry.verseRows(classId, square.id)) {
        if (row.status === "paradigm-standard") verseFromStandard += 1;
      }
    }
  }
  assert.ok(standard > 0);
  assert.equal(verseFromStandard, 0);
  assert.deepEqual(data.WEAK_CLASS_IDS, [
    "I-Nun",
    "I-Guttural",
    "I-Aleph",
    "III-Guttural",
    "III-Aleph",
    "III-He",
    "I-Waw/I-Yod",
    "Hollow",
    "Geminate",
  ]);
});

test("ready for the exam uses the paradigm practice box", () => {
  assert.equal(registry.practiceIsStrong(4), false);
  assert.equal(registry.practiceIsStrong(5), true);
  assert.equal(registry.practiceIsStrong(undefined), false);
  assert.equal(session.nextPracticeBox(undefined, true), 2);
  assert.equal(session.nextPracticeBox(4, true), 5);
  assert.equal(session.nextPracticeBox(5, false), 1);
});

test("an exam clears passed squares and sends misses to Next", () => {
  const prompts = session.drawExam("strong", "qal-perfect", "grammar", 3, () => 0);
  assert.ok(prompts.length > 0);
  assert.ok(prompts.every((item) => item.squareId === "Qal.qatal"));
  const passed = session.applyExam(progress.EMPTY_VERB_LAB, prompts.map((item) => ({ squareId: item.squareId, correct: true })));
  assert.ok(passed.cleared.includes("Qal.qatal"));
  assert.equal(passed.due["Qal.qatal"], undefined);
  const missed = session.applyExam(progress.EMPTY_VERB_LAB, [
    { squareId: "Qal.qatal", correct: false },
    { squareId: "Pual.imperative", correct: false },
  ]);
  assert.equal(missed.cleared.includes("Qal.qatal"), false);
  assert.ok(missed.due["Qal.qatal"] > 0);
  assert.equal(missed.due["Pual.imperative"], undefined);
  assert.equal(registry.examsForStem("Qal", "I-Nun").length, 0);
  const pair = registry.examsForStem("Piel", "strong").map((exam) => exam.id);
  assert.ok(pair.includes("stem-piel"));
  assert.ok(pair.includes("pair-piel-pual"));
  assert.equal(registry.examsForStem("Qal", "strong").some((exam) => exam.stems.length > 1), false);
});

test("hydrateGame keeps a save that has no Verb Lab fields", () => {
  const fresh = game.hydrateGame({ unlockedChapter: 4, verbParadigmQuest: { unlocked: 2 } });
  assert.equal(fresh.unlockedChapter, 4);
  assert.equal(fresh.verbParadigmQuest.unlocked, 2);
  assert.deepEqual(fresh.verbLab, progress.hydrateVerbLab(undefined));
  const kept = game.hydrateGame({
    verbLab: { welcomed: true, boxes: { "Qal.qatal": 5 }, due: { "Qal.yiqtol": 3 }, cleared: ["Qal.qatal"], continueId: "Qal.yiqtol" },
  });
  assert.equal(kept.verbLab.welcomed, true);
  assert.equal(kept.verbLab.boxes["Qal.qatal"], 5);
  assert.equal(kept.verbLab.due["Qal.yiqtol"], 3);
  assert.deepEqual(kept.verbLab.cleared, ["Qal.qatal"]);
  assert.equal(kept.verbLab.continueId, "Qal.yiqtol");
  const again = game.hydrateGame(JSON.parse(JSON.stringify(kept)));
  assert.deepEqual(again.verbLab, kept.verbLab);
});
