import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { parseTanakhQuery, runTanakhQuery, stemLetters, hatufWhy, markFormInVerse, kindLabel } = await jiti.import(
  "/workspace/src/lib/tanakh-query.ts",
);

test("parse qamets qatan with a count and Torah scope", () => {
  const p = parseTanakhQuery("give me 10 qamets qatan from Torah");
  assert.equal(p.kind, "hatuf");
  assert.equal(p.limit, 10);
  assert.equal(p.scope, "torah");
});

test("class names: qamets is long ā, qamets hatuf is short o", () => {
  assert.equal(parseTanakhQuery("give me 10 qamets").kind, "gadol");
  assert.equal(parseTanakhQuery("10 qamets hatuf").kind, "hatuf");
  assert.equal(parseTanakhQuery("10 qamat").kind, "gadol");
  assert.equal(kindLabel("gadol"), "Qamets (long ā)");
  assert.equal(kindLabel("hatuf"), "Qamets hatuf (short o)");
  assert.ok(!kindLabel("gadol").toLowerCase().includes("gadol"));
  assert.ok(!kindLabel("hatuf").toLowerCase().includes("katan"));
  assert.ok(!kindLabel("hatuf").toLowerCase().includes("qatan"));
});

test("parse endingless masculine", () => {
  const p = parseTanakhQuery("list of endingless masculine nouns");
  assert.equal(p.kind, "ms");
});

test("parse feminine nouns", () => {
  const p = parseTanakhQuery("feminine nouns from the Tanakh");
  assert.equal(p.kind, "fs");
});

test("parse vocal shewa and two shewas", () => {
  assert.equal(parseTanakhQuery("give me 10 vocal shewa").kind, "shewaVocal");
  assert.equal(parseTanakhQuery("two shewas together").kind, "shewaPair");
  assert.equal(parseTanakhQuery("silent shifa").kind, "shewaSilent");
});

test("parse verb person names", () => {
  assert.equal(parseTanakhQuery("10 3ms").kind, "v3ms");
  assert.equal(parseTanakhQuery("3fs verbs").kind, "v3fs");
  assert.equal(parseTanakhQuery("2ms").kind, "v2ms");
  assert.equal(parseTanakhQuery("give me 10 PL").kind, "pl");
  assert.equal(parseTanakhQuery("feminine verbs").kind, "femVerb");
});

test("parse qal perfect and construct", () => {
  const qal = parseTanakhQuery("give me 10 qal perfect");
  assert.equal(qal.kind, "qal");
  assert.deepEqual(qal.need, ["qatal"]);
  assert.equal(parseTanakhQuery("10 cal imperfect").kind, "qal");
  assert.deepEqual(parseTanakhQuery("10 cal imperfect").need, ["yiqtol"]);
  assert.equal(parseTanakhQuery("construct case").kind, "cst");
  assert.equal(parseTanakhQuery("10 piel").kind, "piel");
  assert.equal(parseTanakhQuery("10 pual").kind, "pual");
});

test("run filters hatuf and respects limit", () => {
  const forms = [
    { w: "כָּל", n: 100, t: ["hatuf", "ms"], r: ["Gen.1.21"] },
    { w: "דָּבָר", n: 50, t: ["gadol", "ms"], r: ["Gen.15.1"] },
    { w: "חָכְמָה", n: 20, t: ["hatuf", "fs"], r: ["Prov.1.7"] },
  ];
  const { items, total } = runTanakhQuery(forms, parseTanakhQuery("2 qamets hatuf"));
  assert.equal(total, 2);
  assert.equal(items.length, 2);
});

test("qal perfect requires both tags", () => {
  const forms = [
    { w: "בָּרָא", n: 10, t: ["qal", "qatal", "v3ms"], r: ["Gen.1.1"] },
    { w: "יִבְרָא", n: 5, t: ["qal", "yiqtol", "v3ms"], r: ["Gen.1.1"] },
    { w: "דִּבֶּר", n: 8, t: ["piel", "qatal", "v3ms"], r: ["Exod.6.2"] },
  ];
  const { items, total } = runTanakhQuery(forms, parseTanakhQuery("10 qal perfect"));
  assert.equal(total, 1);
  assert.equal(items[0].w, "בָּרָא");
});

test("stem letters drop the article", () => {
  assert.equal(stemLetters("הָאָרֶץ"), "ארץ");
});

test("finder ask swaps the count", async () => {
  const { finderAsk, parseFinderSearch, queryIndexPaths } = await jiti.import(
    "/workspace/src/lib/finder-search.ts",
  );
  assert.equal(finderAsk("give me 10 qal perfect", 20), "give me 20 qal perfect");
  assert.equal(finderAsk("construct", 10), "give me 10 construct");
  assert.equal(parseFinderSearch({ q: "piel", n: "20" }).n, 20);
  const paths = queryIndexPaths("/app");
  assert.ok(paths.some((p) => p.endsWith("public/tanakh/query-index.json")));
  assert.ok(paths.some((p) => p.includes(".output/public/tanakh")));
});

test("hatuf sorts maqqef chains first", () => {
  const forms = [
    { w: "כָּל", n: 2000, t: ["hatuf", "ms"], r: ["Gen.1.21"] },
    { w: "כָּל־נֶפֶשׁ", n: 12, t: ["hatuf", "chain"], r: ["Gen.1.21"] },
    { w: "חָכְמָה", n: 70, t: ["hatuf", "fs"], r: ["Prov.1.7"] },
  ];
  const { items } = runTanakhQuery(forms, parseTanakhQuery("10 qamets qatan"));
  assert.equal(items[0].w, "כָּל־נֶפֶשׁ");
  assert.match(hatufWhy("כָּל־נֶפֶשׁ") ?? "", /maqqef|unaccented/i);
});

test("feminine singular is nouns, not את", () => {
  const forms = [
    { w: "אֶת", n: 6671, t: ["fs"], r: ["1Chr.1.10"] },
    { w: "יְהוָה", n: 5645, t: ["fs", "gadol"], r: ["Gen.2.4"] },
    { w: "עָשָׂה", n: 357, t: ["fs", "gadol", "qal", "qatal", "v3ms", "verb"], r: ["Gen.1.7"] },
    { w: "שָׁנָה", n: 420, t: ["abs", "fs", "gadol", "noun"], r: ["Gen.5.3"] },
    { w: "אִשָּׁה", n: 147, t: ["abs", "fs", "gadol", "noun"], r: ["Gen.2.23"] },
  ];
  const { items, total } = runTanakhQuery(forms, parseTanakhQuery("10 feminine singular"));
  assert.equal(total, 2);
  assert.equal(items[0].w, "שָׁנָה");
  const marks = markFormInVerse("וְכוּשׁ יָלַד אֶת נִמְרוֹד שָׁנָה בָּאָרֶץ", "שָׁנָה");
  assert.ok(marks.some((m) => m.hit && m.word.includes("שָׁנָה")));
  assert.ok(marks.some((m) => !m.hit && m.word.includes("אֶת")));
});
