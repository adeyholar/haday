import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { parseTanakhQuery } = await jiti.import("/workspace/src/lib/tanakh-query.ts");
const { listWordRefs, markQueryInVerse, tokenMatchesQuery, letterKey } = await jiti.import(
  "/workspace/src/lib/tanakh-word.ts",
);

test("a typed Hebrew word is a word query, not a grammar name", () => {
  const p = parseTanakhQuery("בַּיִת");
  assert.ok(p.hebrew);
  assert.equal(letterKey(p.hebrew), "בית");
});

test("prefixed Tanakh tokens still match the typed lemma", () => {
  assert.equal(tokenMatchesQuery("וַיֹּאמֶר", "אמר"), true);
  assert.equal(tokenMatchesQuery("הָאָרֶץ", "ארץ"), true);
  assert.equal(tokenMatchesQuery("בַּיִת", "בית"), true);
  assert.equal(tokenMatchesQuery("מֹשֶׁה", "בית"), false);
});

test("markQueryInVerse highlights only the asked word", () => {
  const toks = markQueryInVerse("בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", "ארץ");
  const hits = toks.filter((t) => t.hit).map((t) => t.word);
  assert.ok(hits.some((w) => /ארץ/.test(w.replace(/[\u0591-\u05C7]/g, ""))));
  assert.ok(!toks.find((t) => t.word.includes("אלה") && t.hit));
});

test("listWordRefs returns every verse for a spelling", () => {
  const index = {
    v: 1,
    tokens: 4,
    e: {
      בית: { n: 2, r: ["Gen.12.1", "Exod.1.1"] },
      והבית: { n: 1, r: ["Ps.23.6"] },
    },
  };
  const refs = listWordRefs(index, parseTanakhQuery("בית"));
  assert.ok(refs.includes("Gen.12.1"));
  assert.ok(refs.includes("Exod.1.1"));
  assert.ok(refs.includes("Ps.23.6"));
});
