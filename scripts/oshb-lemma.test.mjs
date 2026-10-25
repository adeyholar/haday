import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { parseOshbLemma, prefixChip, prefixLabel } = await jiti.import(
  new URL("../src/lib/oshb-lemma.ts", import.meta.url).pathname,
);

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
  assert.deepEqual(parseOshbLemma("1035+"), { prefixes: [], parts: [{ strong: "H1035", aug: null }] });
  assert.deepEqual(parseOshbLemma("m/1035+"), { prefixes: ["m"], parts: [{ strong: "H1035", aug: null }] });
  assert.deepEqual(parseOshbLemma("1008+"), { prefixes: [], parts: [{ strong: "H1008", aug: null }] });
  assert.deepEqual(parseOshbLemma("884+"), { prefixes: [], parts: [{ strong: "H884", aug: null }] });
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
  assert.equal(prefixLabel("s"), "that");

  assert.equal(prefixChip("c"), "ו and");
  assert.equal(prefixChip("d"), "ה the");
  assert.equal(prefixChip("m"), "מ from");
  assert.equal(prefixChip("i"), "ה question");
  assert.equal(prefixChip("b"), "ב in");
  assert.equal(prefixChip("l"), "ל to");
  assert.equal(prefixChip("k"), "כ like");
  assert.equal(prefixChip("s"), "ש that");

  assert.ok(lemmas("Gen", 1, "Gen.1.1").includes("b/7225"));
  assert.ok(lemmas("Gen", 1, "Gen.1.1").includes("1254 a"));
  assert.ok(lemmas("Gen", 3, "Gen.3.11").includes("i/4480 a"));
  assert.ok(lemmas("Gen", 1, "Gen.1.28").includes("l"));
  assert.ok(lemmas("2Sam", 8, "2Sam.8.1").includes("310 a/3651 c"));
  assert.ok(lemmas("Num", 12, "Num.12.9").includes("c/2734/639"));
  assert.ok(lemmas("Ps", 150, "Ps.150.1").includes("1984 b/3050"));
  assert.ok(lemmas("1Chr", 11, "1Chr.11.2").includes("c/d/935"));
  assert.ok(lemmas("Ruth", 1, "Ruth.1.1").includes("m/1035+"));
  assert.deepEqual(parseOshbLemma("m/1035+").parts[0].strong, "H1035");
});

test("every WLC lemma segment is a known prefix or a Strong's part in a chunk", () => {
  const chunks = new Set();
  const dir = new URL("../public/lexicon/strongs-hebrew/", import.meta.url);
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    for (const id of Object.keys(JSON.parse(readFileSync(new URL(name, dir), "utf8")))) chunks.add(id);
  }
  const known = new Set(["b", "c", "d", "i", "k", "l", "m", "s"]);
  const leftovers = [];
  const missing = [];
  const wlc = new URL("../data/wlc/", import.meta.url);
  for (const book of readdirSync(wlc)) {
    const folder = new URL(`${book}/`, wlc);
    for (const file of readdirSync(folder)) {
      if (!file.endsWith(".json.gz")) continue;
      const data = JSON.parse(gunzipSync(readFileSync(new URL(file, folder))));
      for (const verse of data.verses) {
        for (const word of verse.words) {
          const segments = (word.lemma || "").split("/").map((segment) => segment.trim()).filter(Boolean);
          const parsed = parseOshbLemma(word.lemma || "");
          if (parsed.prefixes.length + parsed.parts.length !== segments.length && leftovers.length < 12) {
            leftovers.push(`${verse.ref} ${word.lemma}`);
          }
          for (const prefix of parsed.prefixes) {
            if (!known.has(prefix) && leftovers.length < 12) leftovers.push(`${verse.ref} prefix ${prefix}`);
          }
          for (const part of parsed.parts) {
            if (!chunks.has(part.strong) && missing.length < 12) missing.push(`${verse.ref} ${part.strong}`);
          }
        }
      }
    }
  }
  assert.deepEqual(leftovers, []);
  assert.deepEqual(missing, []);
});
