import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { parseTanakhQuery, runTanakhQuery, stemLetters } = await jiti.import("/workspace/src/lib/tanakh-query.ts");

test("parse qamets qatan with a count and Torah scope", () => {
  const p = parseTanakhQuery("give me 10 qamets qatan from Torah");
  assert.equal(p.kind, "hatuf");
  assert.equal(p.limit, 10);
  assert.equal(p.scope, "torah");
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

test("run filters hatuf and respects limit", () => {
  const forms = [
    { w: "כָּל", n: 100, t: ["hatuf", "ms"], r: ["Gen.1.21"] },
    { w: "דָּבָר", n: 50, t: ["gadol", "ms"], r: ["Gen.15.1"] },
    { w: "חָכְמָה", n: 20, t: ["hatuf", "fs"], r: ["Prov.1.7"] },
  ];
  const { items, total } = runTanakhQuery(forms, parseTanakhQuery("2 qamets hatuf"));
  assert.equal(total, 2);
  assert.equal(items.length, 2);
  assert.equal(items[0].w, "כָּל");
});

test("stem letters drop the article", () => {
  assert.equal(stemLetters("הָאָרֶץ"), "ארץ");
});
