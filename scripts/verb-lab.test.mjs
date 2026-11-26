import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const root = new URL("..", import.meta.url).pathname;
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });

const stems = await jiti.import(new URL("../src/lib/verb-lab/stems.ts", import.meta.url).pathname);
const hebrewRuns = await jiti.import(new URL("../src/lib/verb-lab/hebrew-runs.ts", import.meta.url).pathname);
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
  assert.equal(dirty.due["strong|Pual.imperative"], undefined);
  assert.equal(dirty.due["strong|Qal.qatal"], 2);
  assert.equal(dirty.cleared.includes("Hophal.imperative"), false);
  assert.equal(dirty.cleared.includes("strong|Hophal.imperative"), false);
  assert.equal(dirty.cleared.includes("strong|Qal.qatal"), true);
  assert.equal(dirty.boxes["Pual.imperative"], undefined);
  assert.equal(dirty.boxes["strong|Qal.qatal"], 5);
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
  assert.equal(stems.anyStemDimmed("grammar", 3), true);
  assert.equal(stems.anyStemDimmed("grammar", 7), false);
  assert.equal(stems.anyStemDimmed("scripture", 7), false);
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
  assert.ok(passed.cleared.includes("strong|Qal.qatal"));
  assert.equal(passed.due["strong|Qal.qatal"], undefined);
  const missed = session.applyExam(progress.EMPTY_VERB_LAB, [
    { squareId: "Qal.qatal", correct: false },
    { squareId: "Pual.imperative", correct: false },
  ]);
  assert.equal(missed.cleared.includes("strong|Qal.qatal"), false);
  assert.ok(missed.due["strong|Qal.qatal"] > 0);
  assert.equal(missed.due["Pual.imperative"], undefined);
  assert.equal(missed.due["strong|Pual.imperative"], undefined);
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
  assert.equal(kept.verbLab.boxes["strong|Qal.qatal"], 5);
  assert.equal(kept.verbLab.boxes["Qal.qatal"], undefined);
  assert.equal(kept.verbLab.due["strong|Qal.yiqtol"], 3);
  assert.deepEqual(kept.verbLab.cleared, ["strong|Qal.qatal"]);
  assert.equal(kept.verbLab.continueId, "strong|Qal.yiqtol");
  const again = game.hydrateGame(JSON.parse(JSON.stringify(kept)));
  assert.deepEqual(again.verbLab, kept.verbLab);
});

test("an exam clears at 90% of the forms answered", () => {
  const squares = ["Qal.qatal", "Qal.yiqtol", "Qal.wayyiqtol", "Qal.imperative"];
  const answers = squares.flatMap((squareId) =>
    [true, true, true, true].map((correct) => ({ squareId, correct })),
  );
  answers[0] = { squareId: "Qal.qatal", correct: false };
  assert.equal(session.formPercent(answers), 94);
  assert.equal(session.examPassed(answers), true);
  assert.equal(session.squarePassed(answers, "Qal.qatal"), true);
  const saved = session.applyExam(progress.EMPTY_VERB_LAB, answers);
  assert.ok(saved.cleared.includes("strong|Qal.qatal"));
  assert.equal(saved.due["strong|Qal.qatal"], undefined);

  const short = [
    { squareId: "Qal.qatal", correct: true },
    { squareId: "Qal.qatal", correct: true },
    { squareId: "Qal.qatal", correct: true },
    { squareId: "Qal.qatal", correct: false },
  ];
  assert.equal(session.formPercent(short), 75);
  assert.equal(session.examPassed(short), false);
  assert.equal(session.squarePassed(short, "Qal.qatal"), false);
  const held = session.applyExam(progress.EMPTY_VERB_LAB, short);
  assert.equal(held.cleared.includes("strong|Qal.qatal"), false);
  assert.equal(held.due["strong|Qal.qatal"], 1);

  const exact = Array.from({ length: 10 }, (_, index) => ({
    squareId: index < 4 ? "Qal.qatal" : "Qal.yiqtol",
    correct: index !== 0,
  }));
  assert.equal(session.formPercent(exact), 90);
  assert.equal(session.examPassed(exact), true);
  assert.equal(session.squarePassed(exact, "Qal.qatal"), true);
});

test("Pe-Aleph and strong progress do not share a square", () => {
  const legacy = progress.hydrateVerbLab({
    boxes: { "Qal.qatal": 4 },
    cleared: ["Qal.qatal"],
    due: { "Qal.yiqtol": 2 },
    continueId: "Qal.qatal",
  });
  assert.equal(legacy.boxes["strong|Qal.qatal"], 4);
  assert.equal(legacy.boxes["I-Aleph|Qal.qatal"], undefined);
  const aleph = session.notePractice(legacy, "I-Aleph", "Qal.qatal", true);
  assert.equal(aleph.boxes["strong|Qal.qatal"], 4);
  assert.equal(aleph.boxes["I-Aleph|Qal.qatal"], session.nextPracticeBox(undefined, true));
  assert.equal(aleph.continueId, "I-Aleph|Qal.qatal");
  const strong = session.notePractice(aleph, "strong", "Qal.qatal", false);
  assert.equal(strong.boxes["strong|Qal.qatal"], session.nextPracticeBox(4, false));
  assert.equal(strong.boxes["I-Aleph|Qal.qatal"], aleph.boxes["I-Aleph|Qal.qatal"]);
  const scoped = progress.hydrateVerbLab({
    boxes: { "I-Aleph|Qal.qatal": 5, "Qal.qatal": 1 },
    cleared: ["I-Aleph|Qal.qatal", "Qal.yiqtol"],
    continueId: "I-Aleph|Qal.qatal",
  });
  assert.equal(scoped.boxes["I-Aleph|Qal.qatal"], 5);
  assert.equal(scoped.boxes["strong|Qal.qatal"], 1);
  assert.ok(scoped.cleared.includes("I-Aleph|Qal.qatal"));
  assert.ok(scoped.cleared.includes("strong|Qal.yiqtol"));
  const again = progress.hydrateVerbLab(JSON.parse(JSON.stringify(scoped)));
  assert.deepEqual(again, scoped);
});

function consonants(value) {
  return value.normalize("NFC").replace(/[\u0591-\u05C7]/g, "");
}

test("the Pe-Aleph chart is filled and the kept Qal cells stay", () => {
  const file = data.VERB_FILES["I-Aleph"];
  assert.equal(file.cells.length, 207);
  assert.deepEqual(file.sameAsIGuttural, []);
  let rows = 0;
  for (const square of registry.openSquares("I-Aleph")) {
    const chart = registry.chartRows("I-Aleph", square.id);
    assert.ok(chart.length > 0, square.id);
    rows += chart.length;
  }
  assert.equal(rows, 207);
  assert.ok(registry.chartRows("I-Aleph", "Qal.qatal").length > 0);
  assert.ok(registry.chartRows("I-Aleph", "Niphal.qatal").length > 0);
  assert.ok(registry.chartRows("I-Aleph", "Piel.qatal").length > 0);
  assert.ok(registry.chartRows("I-Aleph", "Hiphil.qatal").length > 0);
  assert.equal(registry.chartRows("I-Aleph", "Pual.imperative").length, 0);
  assert.equal(registry.chartRows("I-Aleph", "Hophal.imperative").length, 0);
  const kept = {
    "Qal.yiqtol.3ms": "יֹאכַל",
    "Qal.yiqtol.3fs": "תֹּאכַל",
    "Qal.yiqtol.2ms": "תֹּאכַל",
    "Qal.yiqtol.2fs": "תֹּאכְלִי",
    "Qal.yiqtol.1cs": "אֹכַל",
    "Qal.yiqtol.3mp": "יֹאכְלוּ",
    "Qal.yiqtol.3fp": "תֹּאכַלְנָה",
    "Qal.yiqtol.2mp": "תֹּאכְלוּ",
    "Qal.yiqtol.2fp": "תֹּאכַלְנָה",
    "Qal.yiqtol.1cp": "נֹאכַל",
    "Qal.wayyiqtol.3ms": "וַיֹּאכַל",
    "Qal.imperative.ms": "אֱכֹל",
    "Qal.imperative.fp": "אֱכֹלְנָה",
    "Qal.infinitive-construct": "אֱכֹל",
  };
  for (const [id, form] of Object.entries(kept)) {
    const cell = file.cells.find((item) => item.id === id);
    assert.equal(cell.form.normalize("NFC"), form.normalize("NFC"), id);
  }
  const imperative = file.cells.find((item) => item.id === "Qal.imperative.ms");
  assert.match(imperative.note, /עֲמֹד/);
  const qatal = registry.chartRows("I-Aleph", "Qal.qatal").find((row) => row.pgn === "3ms");
  assert.equal(qatal.exampleRef, "Exod 34:28 #11");
  assert.ok(qatal.exampleWord);
  const way = registry.chartRows("I-Aleph", "Qal.wayyiqtol").find((row) => row.pgn === "3ms");
  assert.ok(way.alternates.some((alt) => alt.exampleRef === "Gen 1:3 #1" && alt.exampleWord));
  const chart = readFileSync(new URL("../src/components/verb-lab/verb-lab-chart.tsx", import.meta.url), "utf8");
  assert.match(chart, /row\.displayMark/);
  assert.match(chart, /alt\.exampleRef/);
  const standard = registry.chartRows("I-Aleph", "Qal.qatal").find((row) => row.displayMark);
  assert.equal(standard.displayMark, "standard form, not in the Bible");
  for (const cell of file.cells) {
    for (const item of [cell, ...(cell.alternates ?? [])]) {
      if (item.form) assert.equal(consonants(item.form).includes("קטל"), false, cell.id);
      if (item.form) assert.equal(consonants(item.form).includes("עמד"), false, cell.id);
      if (item.exampleWord) assert.equal(consonants(item.exampleWord).includes("קטל"), false, cell.id);
      if (item.exampleWord) assert.equal(consonants(item.exampleWord).includes("עמד"), false, cell.id);
    }
  }
});

test("Hebrew inside an English line is its own run", () => {
  const runs = hebrewRuns.hebrewRuns("Differs from I-Guttural עֲמֹד only in the vowel.");
  assert.deepEqual(
    runs.map((run) => run.hebrew),
    [false, true, false],
  );
  assert.equal(runs[1].text.normalize("NFC"), "עֲמֹד".normalize("NFC"));
  assert.deepEqual(hebrewRuns.hebrewRuns("אָכַל"), [{ hebrew: true, text: "אָכַל" }]);
});

test("the Semester 2 home card returns home, and the quiz waits for an answer", () => {
  assert.deepEqual(redirects.hubBackTarget("grammar", "home"), { to: "/bbh", label: "Home" });
  assert.deepEqual(redirects.hubBackTarget("grammar", "play"), { to: "/hub/play", label: "Play" });
  assert.deepEqual(redirects.hubBackTarget("grammar", "learn"), { to: "/hub/learn", label: "Learn" });
  const home = readFileSync(new URL("../src/components/term-door.tsx", import.meta.url), "utf8");
  assert.match(home, /VerbLabCard from="home"/);
  assert.equal(home.includes('from="play"'), false);
  const quiz = readFileSync(new URL("../src/components/verb-lab/verb-lab-practice.tsx", import.meta.url), "utf8");
  assert.match(quiz, /disabled=\{picked == null\}/);
  const room = readFileSync(new URL("../src/components/verb-lab/verb-lab-room.tsx", import.meta.url), "utf8");
  assert.match(room, /anyStemDimmed/);
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const rootHtml = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
  assert.match(css, /Noto Serif Hebrew/);
  assert.match(css, /\.verb-lab \.verb-lab-form/);
  assert.match(rootHtml, /Noto\+Serif\+Hebrew/);
});
