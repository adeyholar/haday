import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { translationLabFlagOn } = await jiti.import(join(root, "src/lib/translation-lab/flag.ts"));
const { LAB_CREDITS, ADONAI_NOTE } = await jiti.import(join(root, "src/lib/translation-lab/credits.ts"));
const { GEN_1_3, chunkHebrew, verseHebrew, maqafGroups, hasDivineName } = await jiti.import(
  join(root, "src/lib/translation-lab/verse.ts"),
);
const {
  gradeChunks,
  gradeSay,
  gradeAssemble,
  sayChoices,
  lookReadings,
  publishedEnglishVisible,
  glossVisible,
  sayChoicesVisible,
  lookEnglishVisible,
  assembleEnglishVisible,
  isPublishedReading,
  chunksFollowMaqaf,
  assembleTiles,
  roleFitsMorph,
} = await jiti.import(join(root, "src/lib/translation-lab/grade.ts"));

const labDir = join(root, "src/lib/translation-lab");
const labFiles = ["flag.ts", "credits.ts", "verse.ts", "grade.ts"].map((name) => readFileSync(join(labDir, name), "utf8"));
labFiles.push(readFileSync(join(root, "src/components/translation-lab.tsx"), "utf8"));
labFiles.push(readFileSync(join(root, "src/components/translation-lab-open.tsx"), "utf8"));
labFiles.push(readFileSync(join(root, "src/routes/listen/lab.tsx"), "utf8"));
labFiles.push(readFileSync(join(root, "src/routes/iibs/lab.tsx"), "utf8"));

test("the lab flag is off unless the build turns it on", () => {
  assert.equal(translationLabFlagOn(undefined), false);
  assert.equal(translationLabFlagOn(""), false);
  assert.equal(translationLabFlagOn("false"), false);
  assert.equal(translationLabFlagOn("true"), true);
  const flag = readFileSync(join(labDir, "flag.ts"), "utf8");
  assert.match(flag, /VITE_TRANSLATION_LAB === "true"/);
  const page = readFileSync(join(root, "src/components/translation-lab.tsx"), "utf8");
  assert.match(page, /translationLabEnabled\(\)/);
  assert.match(page, /import\.meta\.env\.VITE_TRANSLATION_LAB !== "true"/);
  assert.match(page, /This lab is closed/);
  assert.doesNotMatch(page, /from "@\/lib\/translation-lab\/verse"/);
  assert.doesNotMatch(page, /from "@\/lib\/translation-lab\/grade"/);
  assert.doesNotMatch(page, /gen-1-3/);
  assert.doesNotMatch(readFileSync(join(root, "src/components/listen-menu.tsx"), "utf8"), /\/listen\/lab/);
  assert.doesNotMatch(readFileSync(join(root, "src/routes/iibs/index.tsx"), "utf8"), /\/iibs\/lab/);
});

test("the manuscript desk and the Scripture reader are untouched", () => {
  const desk = readFileSync(join(root, "src/components/wlc-desk.tsx"), "utf8");
  const reader = readFileSync(join(root, "src/routes/iibs/wlc/$book/$ch.tsx"), "utf8");
  assert.doesNotMatch(desk, /translation-lab/);
  assert.doesNotMatch(reader, /translation-lab/);
});

test("the lab pins its snapshot and does not call Sefaria", () => {
  const sums = readFileSync(join(root, "data/translation-lab/SHA256SUMS"), "utf8")
    .trim()
    .split("\n");
  const names = [];
  for (const line of sums) {
    const [hex, name] = line.trim().split(/\s+/);
    names.push(name);
    const file = readFileSync(join(root, "data/translation-lab", name));
    assert.equal(createHash("sha256").update(file).digest("hex"), hex, name);
  }
  assert.deepEqual(names, ["gen-1-3.json", "jps1917/GEN.1.3.txt"]);
  assert.equal(GEN_1_3.oshb, "3d15126fb1ef74867fc1434be1942e837932691f");
  assert.equal(GEN_1_3.dataset, "1.2.0");
  const joined = labFiles.join("\n");
  assert.doesNotMatch(joined, /sefaria\.org/);
  assert.doesNotMatch(joined, /askHaday/);
  assert.doesNotMatch(joined, /<textarea/);
  assert.doesNotMatch(joined, /fetch\(/);
});

test("Genesis 1:3 is the pinned OSHB verse, in NFC, and the maqqef stays one chunk", () => {
  const chapter = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc/Gen/1.json.gz"))).toString("utf8"));
  const verse = chapter.verses.find((item) => item.ref === "Gen.1.3");
  assert.equal(GEN_1_3.words.length, verse.words.length);
  GEN_1_3.words.forEach((word, index) => {
    const source = verse.words[index];
    assert.equal(word.id, source.id);
    assert.equal(word.surface, source.surface);
    assert.equal(word.trailer, source.trailer);
    assert.equal(word.lemma, source.lemma);
    assert.equal(word.morph, source.morph);
    assert.equal(word.surface, source.surface);
  });
  assert.equal(GEN_1_3.text, verse.text);
  assert.equal(verseHebrew(), verse.text.normalize("NFC"));
  assert.equal(chunksFollowMaqaf(), true);
  assert.deepEqual(
    maqafGroups().map((group) => group.map((word) => word.n)),
    [[1], [2], [3], [4], [5, 6]],
  );
  assert.ok(chunkHebrew(GEN_1_3.chunks[4]).includes("־"));
  const reader = JSON.parse(readFileSync(join(root, "src/lib/genesis-1-5.json"), "utf8"));
  const dropped = reader.chapters["1"].find((item) => item.v === 3).words;
  assert.equal(dropped.some((word) => word.includes("־")), false);
  assert.equal(GEN_1_3.readings.web, reader.chapters["1"].find((item) => item.v === 3).en);
});

test("say, assemble, and look follow the lab rules for Genesis 1:3", () => {
  assert.equal(GEN_1_3.chunks.length, 5);
  assert.equal(GEN_1_3.chunks.reduce((n, chunk) => n + chunk.wrong.length, 0), 10);
  assert.deepEqual(GEN_1_3.chunks[3].roles, ["subject"]);
  assert.deepEqual(GEN_1_3.chunks[4].roles, ["verb", "subject"]);
  assert.equal(roleFitsMorph("verb", GEN_1_3.words[3].morph), false);
  assert.equal(roleFitsMorph("subject", GEN_1_3.words[3].morph), true);
  assert.equal(roleFitsMorph("subject", GEN_1_3.words[0].morph), false);
  assert.equal(roleFitsMorph("verb", GEN_1_3.words[0].morph), true);
  const literalSlots = [];
  for (const chunk of GEN_1_3.chunks) {
    assert.equal(chunk.roles.length, chunk.words.length);
    assert.equal(gradeSay(chunk.id, chunk.literal), true);
    if (chunk.smooth !== chunk.literal) assert.equal(gradeSay(chunk.id, chunk.smooth), false);
    assert.equal(gradeSay(chunk.id, chunk.wrong[0]), false);
    assert.equal(gradeSay(chunk.id, chunk.wrong[1]), false);
    const choices = sayChoices(chunk);
    assert.equal(choices.length, 3);
    assert.deepEqual(sayChoices(chunk), choices);
    assert.ok(choices.includes(chunk.literal));
    literalSlots.push(choices.indexOf(chunk.literal));
    assert.equal(isPublishedReading(chunk.wrong[0]), false);
    assert.equal(isPublishedReading(chunk.wrong[1]), false);
    assert.notEqual(chunk.wrong[0], GEN_1_3.readings.ylt);
    assert.notEqual(chunk.wrong[1], GEN_1_3.readings.web);
    assert.equal(chunk.wrongSource[0].length > 0, true);
    assert.equal(chunk.wrongSource[1].length > 0, true);
    const words = chunk.words.map((n) => GEN_1_3.words.find((word) => word.n === n));
    if (words.some((word) => word.consonants === "אלהים")) {
      assert.deepEqual(new Set(chunk.wrong), new Set(["Adonai", "gods"]));
    }
    const tags = new Set(words.map((word) => word.morph));
    for (const source of chunk.wrongSource) {
      if (!source.startsWith("misparse")) continue;
      const codes = source.match(/[HA][A-Z][A-Za-z0-9]*(?:\/[A-Za-z0-9]+)*/g) ?? [];
      assert.ok(codes.some((code) => tags.has(code)), source);
      const misread = source.match(/read as (\S+)/)?.[1];
      assert.equal(typeof misread, "string", source);
      assert.ok(codes.includes(misread), source);
      assert.equal(tags.has(misread), false, source);
    }
  }
  const c3 = GEN_1_3.chunks.find((chunk) => chunk.id === "c3");
  assert.equal(c3.wrongSource[0], "misparse: HVqj3ms read as HC/Vqw3ms (word 5)");
  assert.equal(c3.wrongSource[0].match(/read as (\S+)/)[1], "HC/Vqw3ms");
  const accepted = new Set(GEN_1_3.chunks.flatMap((chunk) => [chunk.literal, ...chunk.also]));
  for (const chunk of GEN_1_3.chunks) {
    for (const tile of chunk.wrong) assert.equal(accepted.has(tile), false, tile);
  }
  assert.equal(gradeSay("c1", "and said"), true);
  assert.equal(gradeSay("c3", "let be"), true);
  assert.equal(gradeSay("c5", "and light was"), true);
  assert.equal(new Set(literalSlots).size > 1, true);
  assert.equal(literalSlots.every((slot) => slot === 1), false);
  assert.equal(isPublishedReading(GEN_1_3.readings.ylt), true);
  assert.equal(isPublishedReading(GEN_1_3.readings.web), true);
  assert.equal(isPublishedReading(GEN_1_3.readings.jps), true);
  const literal = GEN_1_3.chunks.map((chunk) => chunk.literal);
  const smooth = GEN_1_3.chunks.map((chunk) => chunk.smooth);
  assert.equal(gradeAssemble(literal), true);
  assert.equal(gradeAssemble(smooth), false);
  assert.equal(gradeAssemble(assembleTiles().map((tile) => tile.label)), false);
  const marks = GEN_1_3.chunks.map((chunk) => ({ id: chunk.id, roles: chunk.roles, particles: chunk.particles }));
  assert.equal(gradeChunks(marks).ok, true);
  marks[0] = { ...marks[0], roles: ["object"] };
  assert.deepEqual(gradeChunks(marks).missed, ["c1"]);
  const badVerse = {
    ...GEN_1_3,
    chunks: GEN_1_3.chunks.map((chunk) => (chunk.id === "c4" ? { ...chunk, roles: ["verb"] } : chunk)),
  };
  const badMarks = badVerse.chunks.map((chunk) => ({ id: chunk.id, roles: chunk.roles, particles: chunk.particles }));
  assert.deepEqual(gradeChunks(badMarks, badVerse).missed, ["c4"]);
  const look = lookReadings();
  assert.equal(look.ylt, GEN_1_3.readings.ylt);
  assert.equal(look.web, GEN_1_3.readings.web);
  assert.equal(look.jps, GEN_1_3.readings.jps);
  assert.equal(look.note, null);
  assert.equal(lookReadings({ ...GEN_1_3, text: "בְּיוֹם עֲשׂוֹת יְהוָה" }).note, ADONAI_NOTE);
  assert.equal(hasDivineName(GEN_1_3.text), false);
  assert.equal(publishedEnglishVisible("read"), false);
  assert.equal(publishedEnglishVisible("chunk"), false);
  assert.equal(publishedEnglishVisible("say"), false);
  assert.equal(publishedEnglishVisible("assemble"), false);
  assert.equal(publishedEnglishVisible("look"), true);
  assert.equal(glossVisible("bbh", false), false);
  assert.equal(glossVisible("bbh", true), true);
  assert.equal(glossVisible("iibs", false), false);
  assert.equal(glossVisible("iibs", true), true);
  assert.equal(sayChoicesVisible("bbh", false), true);
  assert.equal(sayChoicesVisible("iibs", false), false);
  assert.equal(sayChoicesVisible("iibs", true), true);
  assert.equal(lookEnglishVisible("bbh", "look", false), true);
  assert.equal(lookEnglishVisible("iibs", "look", false), false);
  assert.equal(lookEnglishVisible("iibs", "look", true), true);
  assert.equal(lookEnglishVisible("iibs", "say", true), false);
  assert.equal(assembleEnglishVisible("bbh", false), true);
  assert.equal(assembleEnglishVisible("iibs", false), false);
  assert.equal(assembleEnglishVisible("iibs", true), true);
  assert.equal(LAB_CREDITS, "Morphology: STEP Bible, www.STEPBible.org (CC BY 4.0). Lexicon: Brown-Driver-Briggs (1906). English: YLT, WEB, JPS 1917 (public domain).");
  const page = readFileSync(join(root, "src/components/translation-lab-open.tsx"), "utf8");
  assert.match(page, /LAB_CREDITS/);
  assert.match(page, /Young's Literal Translation/);
  assert.match(page, /World English Bible/);
  assert.match(page, /JPS 1917/);
  assert.match(page, /<bdi lang="he" dir="rtl">/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /aria-expanded/);
  assert.match(page, /aria-controls/);
  assert.match(page, /aria-controls="lab-assemble"/);
  assert.match(page, /jps1917\/GEN\.1\.3\.txt\?raw/);
  const ylt = JSON.parse(readFileSync(join(root, "data/paradigms/ylt.json"), "utf8"));
  const book = JSON.parse(readFileSync(join(root, "public/tanakh/books/Gen.json"), "utf8"));
  const row = book.chapters["1"].find((item) => item.v === 3);
  assert.equal(GEN_1_3.readings.ylt, ylt.verses["Gen.1.3"]);
  assert.equal(GEN_1_3.readings.ylt, row.ylt.lines[0].text);
  assert.equal(GEN_1_3.readings.web, row.en.lines[0].text);
  const jpsVerse = readFileSync(join(root, "data/translation-lab/jps1917/GEN.1.3.txt"), "utf8").replace(/\n$/, "");
  assert.equal(GEN_1_3.readings.jps, jpsVerse);
  const sources = readFileSync(join(root, "data/translation-lab/SOURCES.md"), "utf8");
  assert.match(sources, /7c76696c0ab2a5b69258342522fdb2c5db055200/);
  assert.match(sources, /jps1917\/GEN\.1\.3\.txt/);
  assert.match(sources, /Public Domain/);
  assert.doesNotMatch(sources, /sefaria/i);
});
