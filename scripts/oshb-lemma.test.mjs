import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { parseOshbLemma, prefixLabel } = await jiti.import(new URL("../src/lib/oshb-lemma.ts", import.meta.url).pathname);

function lemmas(book, chapter, ref) {
  const data = JSON.parse(gunzipSync(readFileSync(new URL(`../data/wlc/${book}/${chapter}.json.gz`, import.meta.url))));
  const verse = data.verses.find((row) => row.ref === ref);
  assert.ok(verse, ref);
  return verse.words.map((word) => word.lemma);
}

test("an OSHB lemma splits into prefixes and Strong's parts", () => {
  assert.deepEqual(parseOshbLemma("c/d/776"), {
    prefixes: ["c", "d"],
    parts: [{ strong: "H776", aug: null }],
  });
  assert.deepEqual(parseOshbLemma("1254 a"), { prefixes: [], parts: [{ strong: "H1254", aug: "a" }] });
  assert.deepEqual(parseOshbLemma("l"), { prefixes: ["l"], parts: [] });
  assert.deepEqual(parseOshbLemma("310 a/3651 c"), {
    prefixes: [],
    parts: [
      { strong: "H310", aug: "a" },
      { strong: "H3651", aug: "c" },
    ],
  });
  assert.deepEqual(parseOshbLemma("c/2734/639"), {
    prefixes: ["c"],
    parts: [
      { strong: "H2734", aug: null },
      { strong: "H639", aug: null },
    ],
  });
  assert.deepEqual(parseOshbLemma("1984 b/3050"), {
    prefixes: [],
    parts: [
      { strong: "H1984", aug: "b" },
      { strong: "H3050", aug: null },
    ],
  });
  assert.deepEqual(parseOshbLemma(""), { prefixes: [], parts: [] });
  assert.deepEqual(parseOshbLemma("   "), { prefixes: [], parts: [] });
  assert.deepEqual(parseOshbLemma("i/4480 a"), { prefixes: ["i"], parts: [{ strong: "H4480", aug: "a" }] });
  assert.deepEqual(parseOshbLemma("b/7225"), { prefixes: ["b"], parts: [{ strong: "H7225", aug: null }] });
  assert.deepEqual(parseOshbLemma("foo/776"), { prefixes: [], parts: [{ strong: "H776", aug: null }] });

  assert.equal(prefixLabel("c"), "and");
  assert.equal(prefixLabel("d"), "the");
  assert.equal(prefixLabel("i"), "question");
  assert.equal(prefixLabel("b"), "in");
  assert.equal(prefixLabel("k"), "like");
  assert.equal(prefixLabel("l"), "to");
  assert.equal(prefixLabel("m"), "from");
  assert.equal(prefixLabel("s"), "which");

  assert.ok(lemmas("Gen", 1, "Gen.1.1").includes("b/7225"));
  assert.ok(lemmas("Gen", 1, "Gen.1.1").includes("1254 a"));
  assert.ok(lemmas("Gen", 3, "Gen.3.11").includes("i/4480 a"));
  assert.ok(lemmas("Gen", 1, "Gen.1.28").includes("l"));
  assert.ok(lemmas("2Sam", 8, "2Sam.8.1").includes("310 a/3651 c"));
  assert.ok(lemmas("Num", 12, "Num.12.9").includes("c/2734/639"));
  assert.ok(lemmas("Ps", 150, "Ps.150.1").includes("1984 b/3050"));
  assert.ok(lemmas("1Chr", 11, "1Chr.11.2").includes("c/d/935"));
});
