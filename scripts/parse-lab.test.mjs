import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const lab = await jiti.import(new URL("../src/lib/parse-lab.ts", import.meta.url).pathname);
const path = await jiti.import(new URL("../src/lib/path.ts", import.meta.url).pathname);

const gen1 = [
  {
    verse: 1,
    he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    en: "In the beginning, God created the heavens and the earth.",
    words: ["בְּרֵאשִׁית", "בָּרָא", "אֱלֹהִים", "אֵת", "הַשָּׁמַיִם", "וְאֵת", "הָאָרֶץ"],
    tags: ["H7225|HR/Ncfsa", "H1254|HVqp3ms", "H430|HNcmpa", "H853|HTo", "H8064|HTd/Ncmpa", "H853|HC/To", "H776|HTd/Ncbsa"],
  },
  {
    verse: 2,
    he: "וְהָאָרֶץ הָיְתָה",
    en: "The earth was…",
    words: ["וְהָאָרֶץ", "הָיְתָה", "מְרַחֶפֶת"],
    tags: ["H776|HC/Td/Ncbsa", "H1961|HVqp3fs", "H7363|HVprfsa"],
  },
];

function task(passage, surface) {
  return passage.tasks.find((item) => item.surface === surface);
}

test("Genesis 1 parses nouns and verbs and skips the object marker", () => {
  const passage = lab.buildPassage("Gen", 1, gen1);
  assert.match(passage.label, /Genesis 1:1–2/);
  assert.equal(passage.tasks.length, 8);
  const bara = task(passage, "בָּרָא");
  assert.equal(bara.role, "verb");
  assert.equal(bara.aramaic, false);
  assert.equal(bara.lines.find((row) => row.id === "stem").answer, "Qal");
  assert.equal(bara.lines.find((row) => row.id === "form").answer, "perfect");
  assert.equal(bara.lines.find((row) => row.id === "png").answer, "3rd masculine singular");
  assert.equal(bara.lines.find((row) => row.id === "lemma").answer, "H1254");
  assert.equal(bara.lines.some((row) => row.id === "gn"), false);
  const reshith = task(passage, "בְּרֵאשִׁית");
  assert.equal(reshith.role, "noun");
  assert.equal(reshith.lines.find((row) => row.id === "gender").answer, "feminine");
  assert.equal(reshith.lines.find((row) => row.id === "number").answer, "singular");
  assert.equal(reshith.lines.find((row) => row.id === "state").answer, "absolute");
  assert.equal(reshith.lines.some((row) => row.id === "article"), false);
  const shamayim = task(passage, "הַשָּׁמַיִם");
  assert.equal(shamayim.lines.find((row) => row.id === "article").answer, "definite article");
  assert.equal(shamayim.lines.find((row) => row.id === "number").answer, "plural");
  const earth = task(passage, "הָאָרֶץ");
  assert.equal(earth.lines.find((row) => row.id === "gender").answer, "masculine or feminine");
  assert.equal(lab.gradeLine(earth.lines.find((row) => row.id === "gender"), "feminine"), true);
  assert.equal(passage.verses[0].tokens.find((token) => token.surface === "אֵת").role, "other");
});

test("a participle has no person line, and a jussive still accepts imperfect", () => {
  const passage = lab.buildPassage("Gen", 1, gen1);
  const ptcp = task(passage, "מְרַחֶפֶת");
  assert.equal(ptcp.lines.find((row) => row.id === "form").answer, "participle");
  assert.equal(ptcp.lines.find((row) => row.id === "stem").answer, "Piel");
  assert.equal(ptcp.lines.find((row) => row.id === "gn").answer, "feminine singular");
  assert.equal(ptcp.lines.some((row) => row.id === "png"), false);
  const jussive = lab.buildPassage("Gen", 1, [
    { verse: 3, he: "יְהִי", en: "Let there be", words: ["יְהִי"], tags: ["H1961|HVhj3ms"] },
  ]).tasks[0];
  const form = jussive.lines.find((row) => row.id === "form");
  assert.equal(form.answer, "jussive");
  assert.equal(lab.gradeLine(form, "imperfect"), true);
  assert.equal(lab.gradeLine(form, "wayyiqtol"), false);
  const inf = lab.buildPassage("Gen", 1, [
    { verse: 5, he: "לִקְרֹא", en: "to call", words: ["לִקְרֹא"], tags: ["H7121|HR/Vqc"] },
  ]).tasks[0];
  assert.equal(inf.lines.some((row) => row.id === "png" || row.id === "gn"), false);
  assert.equal(inf.lines.find((row) => row.id === "form").answer, "infinitive construct");
});

test("a name is skipped, a suffix is asked, and Aramaic uses Peal", () => {
  const passage = lab.buildPassage("Gen", 1, [
    {
      verse: 11,
      he: "מִינוֹ אֱלֹהִים",
      en: "its kind",
      words: ["מִינוֹ", "אֱלֹהִים", "אַבְרָהָם"],
      tags: ["H4327|HR/Ncmsc/Sp3ms", "H430|HNcmpa", "H85|HNpmsa"],
    },
  ]);
  assert.equal(passage.verses[0].tokens.find((token) => token.surface === "אַבְרָהָם").role, "name");
  assert.equal(passage.names, 1);
  const kind = task(passage, "מִינוֹ");
  assert.equal(kind.lines.find((row) => row.id === "state").answer, "construct");
  assert.equal(kind.lines.find((row) => row.id === "suffix").answer, "3rd masculine singular");
  const aramaic = lab.buildPassage("Dan", 2, [
    { verse: 1, he: "אֲמַר", en: "he said", words: ["אֲמַר"], tags: ["H560|AVqp3ms"] },
  ]).tasks[0];
  assert.equal(aramaic.aramaic, true);
  assert.equal(aramaic.lines.find((row) => row.id === "stem").answer, "Peal");
  assert.match(lab.hintText(aramaic, 1), /Aramaic verb/);
  assert.match(lab.hintText(kind, 1), /suffix/);
});

test("the passage stays at five verses, and a missed particle is not a miss", () => {
  assert.equal(lab.clampParseSpan("Gen", 1, 1, 9).count, 5);
  assert.equal(lab.clampParseSpan("Gen", 1, 30, 5).to, 31);
  const passage = lab.buildPassage("Gen", 1, gen1);
  const tokens = passage.verses[0].tokens;
  const et = tokens.find((token) => token.surface === "אֵת");
  const bara = tokens.find((token) => token.surface === "בָּרָא");
  const grade = lab.gradeFind(tokens, [et.key]);
  assert.equal(grade.extras.length, 1);
  assert.equal(grade.missed.some((item) => item.key === bara.key), true);
  assert.equal(lab.gradeFind(tokens, tokens.filter((token) => token.task).map((token) => token.key)).missed.length, 0);
});

test("Parsing Lab is open on the Grammar path and on the Scripture path", () => {
  assert.equal(path.blockedDestination("/parse-lab", { path: "bbh", admin: false }), null);
  assert.equal(path.blockedDestination("/parse-lab", { path: "iibs", admin: false }), "/");
  assert.equal(path.blockedDestination("/iibs/parse-lab", { path: "iibs", admin: false }), null);
  assert.equal(path.blockedDestination("/iibs/parse-lab", { path: "bbh", admin: false }), "/");
  assert.equal(path.secondTermBlock("/parse-lab", 2), null);
  assert.equal(path.ownerDoorBlock("/parse-lab", "bbh"), null);
  assert.equal(path.ownerDoorBlock("/iibs/parse-lab", "iibs"), null);
});
