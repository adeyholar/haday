/**
 * LEMMA_RULES v0.3 rule 0.5.3.
 * A token the app would match must be the pinned data/wlc surface at the same
 * verse and index. Grammar Path words and Strong’s tags are that token list.
 * Scripture Path already reads data/wlc and skips kq_role === "qere".
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function writtenWords(verse) {
  return (verse.words ?? []).filter((word) => word.kq_role !== "qere");
}

function packedTag(lemma, morph) {
  // Same rule as scripts/build-strongs.py pack()/strong_of(). A trailing + is still that number.
  let num = "";
  for (const part of String(lemma ?? "").replaceAll(" ", "/").split("/")) {
    const digits = part.replace(/[^\d]/g, "");
    if (digits) num = String(Number(digits));
  }
  const tail = String(morph ?? "").trim();
  if (num && tail) return `H${num}|${tail}`;
  return num ? `H${num}` : tail;
}

function loadWlc(book) {
  const dir = join(root, "data/wlc", book);
  const byRef = new Map();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json.gz")) continue;
    const chapter = JSON.parse(gunzipSync(readFileSync(join(dir, name))).toString("utf8"));
    for (const verse of chapter.verses ?? []) byRef.set(verse.ref, verse);
  }
  return byRef;
}

test("Grammar Path tokens match the pinned data/wlc surface and Strong’s number", () => {
  const books = readdirSync(join(root, "public/tanakh/books")).filter((name) => name.endsWith(".json"));
  let tokens = 0;
  let verses = 0;
  const mismatches = [];
  for (const name of books) {
    const book = JSON.parse(readFileSync(join(root, "public/tanakh/books", name), "utf8"));
    const tags = JSON.parse(readFileSync(join(root, "public/tanakh/strongs", name), "utf8"));
    const wlc = loadWlc(book.id);
    for (const [ch, rows] of Object.entries(book.chapters)) {
      for (const row of rows) {
        const ref = `${book.id}.${ch}.${row.v}`;
        const verse = wlc.get(ref);
        if (!verse) {
          mismatches.push(`${ref} missing from data/wlc`);
          continue;
        }
        verses += 1;
        const words = writtenWords(verse);
        const surfaces = words.map((word) => word.surface ?? "");
        const got = row.words ?? [];
        const tagRow = tags[ch]?.[String(row.v)] ?? [];
        if (got.length !== surfaces.length || tagRow.length !== surfaces.length) {
          mismatches.push(`${ref} books ${got.length} strongs ${tagRow.length} wlc ${surfaces.length}`);
          if (mismatches.length > 12) break;
          continue;
        }
        for (let i = 0; i < surfaces.length; i++) {
          tokens += 1;
          if (got[i] !== surfaces[i]) mismatches.push(`${ref} #${i} books ${got[i]} wlc ${surfaces[i]}`);
          const tag = packedTag(words[i].lemma, words[i].morph);
          if (tagRow[i] !== tag) mismatches.push(`${ref} #${i} tag ${tagRow[i]} wlc ${tag}`);
          if (mismatches.length > 12) break;
        }
        if (mismatches.length > 12) break;
      }
      if (mismatches.length > 12) break;
    }
    if (mismatches.length > 12) break;
  }
  assert.equal(mismatches.length, 0, mismatches.join("\n"));
  assert.ok(tokens > 300000, `expected the pinned Tanakh, saw ${tokens} tokens`);
  assert.equal(verses, 23213);
  console.log(`surface alignment ${tokens} tokens in ${verses} verses`);
});

test("1 Chronicles 1:11 keeps the ketiv, and Genesis 1:1 is H7225", () => {
  const chr = JSON.parse(readFileSync(join(root, "public/tanakh/books/1Chr.json"), "utf8"));
  const chrTags = JSON.parse(readFileSync(join(root, "public/tanakh/strongs/1Chr.json"), "utf8"));
  const row = chr.chapters["1"].find((verse) => verse.v === 11);
  assert.equal(row.words[3], "לודיים");
  assert.equal(chrTags["1"]["11"][3].startsWith("H3866|"), true);
  assert.equal(row.words.some((word) => word.includes("לודייםלו")), false);
  const fifteen = chr.chapters["1"].find((verse) => verse.v === 15);
  assert.equal(fifteen.words[3], "הַֽעַרְקִ֖י");
  assert.equal(chrTags["1"]["15"][3].startsWith("H6208|"), true);

  const gen = JSON.parse(readFileSync(join(root, "public/tanakh/books/Gen.json"), "utf8"));
  const genTags = JSON.parse(readFileSync(join(root, "public/tanakh/strongs/Gen.json"), "utf8"));
  const first = gen.chapters["1"][0];
  assert.equal(first.v, 1);
  assert.equal(first.words[0], "בְּרֵאשִׁ֖ית");
  assert.equal(genTags["1"]["1"][0].startsWith("H7225|"), true);
  assert.equal(first.en.toLowerCase().includes("beginning"), true);
});
